const router = require("express").Router();
const crypto = require("crypto");
const express = require("express");
const db = require("../config/db");
const logger = require("../config/logger");

// Razorpay SDK — loaded lazily so the server still starts if keys are missing
let Razorpay;
try {
  Razorpay = require("razorpay");
} catch {
  console.warn("razorpay npm package not installed – payment routes will fail");
}

function getInstance() {
  if (!Razorpay) throw new Error("Razorpay SDK not installed");
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// POST /api/razorpay/order  — create an order (public)
router.post("/order", async (req, res) => {
  try {
    const { amount, currency = "INR", donorName, type, campaign } = req.body;
    if (!amount || amount < 100) return res.status(400).json({ error: "Minimum amount is ₹1 (100 paise)" });

    const rz = getInstance();
    const order = await rz.orders.create({
      amount: Math.round(Number(amount) * 100), // rupees → paise
      currency,
      notes: { donorName: donorName || "Anonymous", type: type || "one-time", campaign: campaign || "" },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay order error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/razorpay/verify  — verify signature + record donation (public)
router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, donorName, amount, type, campaign } = req.body;

    // Verify HMAC signature
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // Record donation in DB
    const [result] = await db.query(
      "INSERT INTO donations (donor_name, amount, payment_id, type, campaign) VALUES (?, ?, ?, ?, ?)",
      [donorName || "Anonymous", amount, razorpay_payment_id, type || "one-time", campaign || null]
    );

    res.json({ success: true, donationId: String(result.insertId), paymentId: razorpay_payment_id });
  } catch (err) {
    console.error("Razorpay verify error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Webhook ────────────────────────────────────────────────────────
// Razorpay sends POST with JSON body + X-Razorpay-Signature header.
// We need the raw body for HMAC verification, so this route uses
// express.raw() — the server.js mounts it with a raw-body prefix.

/**
 * Verify webhook signature using RAZORPAY_WEBHOOK_SECRET.
 * Returns true if valid, false otherwise.
 */
function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("RAZORPAY_WEBHOOK_SECRET not set – cannot verify webhook");
    return false;
  }
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// POST /api/razorpay/webhook
// Body must be raw (Buffer) — mounted with express.raw() in server.js
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];
      const rawBody = typeof req.body === "string" ? req.body : req.body.toString("utf8");

      if (!signature || !verifyWebhookSignature(rawBody, signature)) {
        logger.warn("Webhook signature verification failed");
        return res.status(400).json({ error: "Invalid signature" });
      }

      const event = JSON.parse(rawBody);
      const eventType = event.event;
      const payload = event.payload;

      logger.info("Razorpay webhook received", { event: eventType, payloadId: payload?.payment?.entity?.id });

      switch (eventType) {
        // ── Payment captured (successful) ──────────────────────────
        case "payment.captured": {
          const payment = payload.payment.entity;
          const orderId = payment.order_id;
          const paymentId = payment.id;
          const amountInRupees = payment.amount / 100;
          const notes = payment.notes || {};

          // Check if donation already recorded (from /verify flow)
          const [existing] = await db.query(
            "SELECT id FROM donations WHERE payment_id = ?",
            [paymentId]
          );

          if (existing.length === 0) {
            // Record donation that wasn't captured via frontend verify
            await db.query(
              "INSERT INTO donations (donor_name, amount, payment_id, type, campaign, webhook_verified) VALUES (?, ?, ?, ?, ?, TRUE)",
              [
                notes.donorName || "Anonymous",
                amountInRupees,
                paymentId,
                notes.type || "one-time",
                notes.campaign || null,
              ]
            );
            logger.info("Donation recorded via webhook", { paymentId, amount: amountInRupees });
          } else {
            // Mark existing donation as webhook-verified
            await db.query(
              "UPDATE donations SET webhook_verified = TRUE WHERE payment_id = ?",
              [paymentId]
            );
            logger.info("Donation webhook-verified", { paymentId });
          }
          break;
        }

        // ── Payment failed ─────────────────────────────────────────
        case "payment.failed": {
          const payment = payload.payment.entity;
          const errorDesc = payment.error_description || "Unknown error";
          const errorCode = payment.error_code || "";

          // Log failed payment for admin review
          await db.query(
            `INSERT INTO payment_events (event_type, payment_id, order_id, amount, error_code, error_description, raw_payload)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              "payment.failed",
              payment.id,
              payment.order_id || null,
              (payment.amount || 0) / 100,
              errorCode,
              errorDesc,
              rawBody,
            ]
          );
          logger.warn("Payment failed", { paymentId: payment.id, errorCode, errorDesc });
          break;
        }

        // ── Refund processed ───────────────────────────────────────
        case "refund.processed": {
          const refund = payload.refund.entity;
          const paymentId = refund.payment_id;
          const refundAmount = refund.amount / 100;

          await db.query(
            `INSERT INTO payment_events (event_type, payment_id, amount, raw_payload)
             VALUES (?, ?, ?, ?)`,
            ["refund.processed", paymentId, refundAmount, rawBody]
          );
          logger.info("Refund processed", { paymentId, refundAmount });
          break;
        }

        // ── Order paid ─────────────────────────────────────────────
        case "order.paid": {
          const order = payload.order.entity;
          logger.info("Order paid", { orderId: order.id, amount: order.amount / 100 });
          break;
        }

        default:
          logger.info("Unhandled webhook event", { event: eventType });
      }

      // Always respond 200 to acknowledge receipt
      res.json({ status: "ok" });
    } catch (err) {
      logger.error("Webhook processing error", { message: err.message, stack: err.stack });
      // Still return 200 to prevent Razorpay from retrying on our bug
      res.status(200).json({ status: "error_logged" });
    }
  }
);

module.exports = router;

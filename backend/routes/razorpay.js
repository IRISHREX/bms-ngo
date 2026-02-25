const router = require("express").Router();
const crypto = require("crypto");
const db = require("../config/db");

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

module.exports = router;

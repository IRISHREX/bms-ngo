const router = require("express").Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// GET /api/donations (admin)
router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM donations ORDER BY created_at DESC");
    res.json(rows.map(mapDonation));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/donations
router.post("/", async (req, res) => {
  try {
    const { donorName, amount, paymentId, type, campaign } = req.body;
    const [result] = await db.query(
      "INSERT INTO donations (donor_name, amount, payment_id, type, campaign) VALUES (?, ?, ?, ?, ?)",
      [donorName, amount, paymentId || "", type || "one-time", campaign || null]
    );
    res.json({ id: String(result.insertId), message: "Donation recorded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/donations/:id/receipt
router.post("/:id/receipt", verifyToken, async (req, res) => {
  try {
    await db.query("UPDATE donations SET receipt_generated = TRUE WHERE id = ?", [req.params.id]);
    res.json({ message: "Receipt generated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/donations/report (CSV)
router.get("/report", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM donations ORDER BY created_at DESC");
    const csv = ["Donor,Amount,Type,Payment ID,Campaign,Date,Receipt"]
      .concat(rows.map((r) => `"${r.donor_name}",${r.amount},"${r.type}","${r.payment_id}","${r.campaign || ""}","${r.created_at}",${r.receipt_generated}`))
      .join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=donations-report.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function mapDonation(row) {
  return {
    id: String(row.id),
    donorName: row.donor_name,
    amount: Number(row.amount),
    date: row.created_at,
    paymentId: row.payment_id,
    receiptGenerated: !!row.receipt_generated,
    type: row.type,
    campaign: row.campaign || undefined,
  };
}

module.exports = router;

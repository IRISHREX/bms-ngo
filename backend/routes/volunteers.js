const router = require("express").Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// GET /api/volunteers (admin)
router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM volunteers ORDER BY created_at DESC");
    res.json(rows.map(mapVolunteer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/volunteers (public form)
router.post("/", async (req, res) => {
  try {
    const { name, phone, email, message, type } = req.body;
    const [result] = await db.query(
      "INSERT INTO volunteers (name, phone, email, message, type) VALUES (?, ?, ?, ?, ?)",
      [name, phone || "", email || "", message || "", type || "volunteer"]
    );
    res.json({ id: String(result.insertId), message: "Application submitted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/volunteers/:id (admin update status)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    await db.query("UPDATE volunteers SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ message: "Volunteer updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/volunteers/export (CSV)
router.get("/export", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM volunteers ORDER BY created_at DESC");
    const csv = ["Name,Phone,Email,Type,Status,Date"]
      .concat(rows.map((r) => `"${r.name}","${r.phone}","${r.email}","${r.type}","${r.status}","${r.created_at}"`))
      .join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=volunteers.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function mapVolunteer(row) {
  return {
    id: String(row.id),
    name: row.name,
    phone: row.phone,
    email: row.email,
    message: row.message,
    type: row.type,
    status: row.status,
    createdAt: row.created_at,
  };
}

module.exports = router;

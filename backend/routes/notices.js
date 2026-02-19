const router = require("express").Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// GET /api/notices (public — active & not expired)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM notices WHERE status = 'active' AND (expiry_date IS NULL OR expiry_date >= CURDATE()) ORDER BY pinned DESC, publish_date DESC"
    );
    res.json(rows.map(mapNotice));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notices/admin (all)
router.get("/admin", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM notices ORDER BY pinned DESC, created_at DESC");
    res.json(rows.map(mapNotice));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notices
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, description, publishDate, expiryDate, pinned, status } = req.body;
    const [result] = await db.query(
      "INSERT INTO notices (title, description, publish_date, expiry_date, pinned, status) VALUES (?, ?, ?, ?, ?, ?)",
      [title, description, publishDate || null, expiryDate || null, pinned || false, status || "draft"]
    );
    res.json({ id: String(result.insertId), message: "Notice created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notices/:id
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { title, description, publishDate, expiryDate, pinned, status } = req.body;
    await db.query(
      "UPDATE notices SET title = ?, description = ?, publish_date = ?, expiry_date = ?, pinned = ?, status = ? WHERE id = ?",
      [title, description, publishDate || null, expiryDate || null, pinned || false, status, req.params.id]
    );
    res.json({ message: "Notice updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notices/:id
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await db.query("DELETE FROM notices WHERE id = ?", [req.params.id]);
    res.json({ message: "Notice deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function mapNotice(row) {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    attachmentUrl: row.attachment_file_id ? `/api/files/${row.attachment_file_id}` : undefined,
    publishDate: row.publish_date,
    expiryDate: row.expiry_date,
    pinned: !!row.pinned,
    status: row.status,
  };
}

module.exports = router;

const router = require("express").Router();
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { verifyToken, requireRole } = require("../middleware/auth");

// GET /api/users (super_admin only)
router.get("/", verifyToken, requireRole("super_admin"), async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC");
    res.json(rows.map((u) => ({ id: String(u.id), name: u.name, email: u.email, role: u.role, status: u.status, createdAt: u.created_at })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users
router.post("/", verifyToken, requireRole("super_admin"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, email, hash, role || "content_manager"]
    );
    res.json({ id: String(result.insertId), message: "User created" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Email already exists" });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id
router.put("/:id", verifyToken, requireRole("super_admin"), async (req, res) => {
  try {
    const { role, status } = req.body;
    await db.query("UPDATE users SET role = ?, status = ? WHERE id = ?", [role, status, req.params.id]);
    res.json({ message: "User updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id
router.delete("/:id", verifyToken, requireRole("super_admin"), async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

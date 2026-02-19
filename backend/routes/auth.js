const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query("SELECT * FROM users WHERE email = ? AND status = 'active'", [email]);
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: { id: String(user.id), name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post("/logout", verifyToken, (req, res) => {
  res.json({ message: "Logged out" });
});

// GET /api/auth/me
router.get("/me", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name, email, role, status FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    const u = rows[0];
    res.json({ id: String(u.id), name: u.name, email: u.email, role: u.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

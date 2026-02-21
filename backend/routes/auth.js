const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const logger = require("../config/logger");
const { verifyToken } = require("../middleware/auth");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query("SELECT * FROM users WHERE email = ? AND status = 'active'", [email]);
    if (rows.length === 0) {
      logger.warn("Login failed: user not found or inactive", { email });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      logger.warn("Login failed: invalid password", { email });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    logger.info("Login success", { userId: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: { id: String(user.id), name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    logger.error("Login error", { message: err.message, stack: err.stack });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post("/logout", verifyToken, (req, res) => {
  logger.info("Logout success", { userId: req.user?.id || null, email: req.user?.email || null });
  res.json({ message: "Logged out" });
});

// GET /api/auth/me
router.get("/me", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name, email, role, status FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) {
      logger.warn("Auth me failed: user not found", { userId: req.user.id });
      return res.status(404).json({ error: "User not found" });
    }
    const u = rows[0];
    logger.info("Auth me success", { userId: u.id, email: u.email, role: u.role });
    res.json({ id: String(u.id), name: u.name, email: u.email, role: u.role });
  } catch (err) {
    logger.error("Auth me error", { message: err.message, stack: err.stack, userId: req.user?.id || null });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

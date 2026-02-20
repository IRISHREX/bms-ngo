const router = require("express").Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// GET /api/theme (public)
router.get("/", async (req, res) => {
  try {
    const [themeRows] = await db.query(
      "SELECT theme_key as themeKey, label, description, sort_order as sortOrder FROM themes_catalog ORDER BY sort_order ASC"
    );
    const [settingRows] = await db.query("SELECT theme_key as themeKey FROM theme_settings WHERE id = 1 LIMIT 1");
    const fallback = themeRows[0]?.themeKey || "forest";
    const currentThemeKey = settingRows[0]?.themeKey || fallback;
    res.json({ currentThemeKey, themes: themeRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/theme (admin)
router.put("/", verifyToken, async (req, res) => {
  try {
    const { themeKey } = req.body;
    if (!themeKey || typeof themeKey !== "string") {
      return res.status(400).json({ error: "themeKey is required" });
    }

    const [existsRows] = await db.query("SELECT theme_key FROM themes_catalog WHERE theme_key = ? LIMIT 1", [themeKey]);
    if (existsRows.length === 0) {
      return res.status(400).json({ error: "Invalid themeKey" });
    }

    await db.query(
      `INSERT INTO theme_settings (id, theme_key)
       VALUES (1, ?)
       ON DUPLICATE KEY UPDATE theme_key = VALUES(theme_key)`,
      [themeKey]
    );

    res.json({ message: "Theme updated", themeKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

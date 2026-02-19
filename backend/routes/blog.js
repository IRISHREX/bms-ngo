const router = require("express").Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// GET /api/blog (public — published only)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM blog_posts WHERE status = 'published' ORDER BY created_at DESC"
    );
    res.json(rows.map(mapPost));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/blog/admin (all)
router.get("/admin", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM blog_posts ORDER BY created_at DESC");
    res.json(rows.map(mapPost));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/blog
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, content, status, tags, coverImage } = req.body;
    const [result] = await db.query(
      "INSERT INTO blog_posts (title, content, status, tags, cover_image_file_id) VALUES (?, ?, ?, ?, ?)",
      [title, content, status || "draft", JSON.stringify(tags || []), coverImage || null]
    );
    res.json({ id: String(result.insertId), message: "Post created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/blog/:id
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { title, content, status, tags } = req.body;
    await db.query(
      "UPDATE blog_posts SET title = ?, content = ?, status = ?, tags = ? WHERE id = ?",
      [title, content, status, JSON.stringify(tags || []), req.params.id]
    );
    res.json({ message: "Post updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/blog/:id
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await db.query("DELETE FROM blog_posts WHERE id = ?", [req.params.id]);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function mapPost(row) {
  let tags = [];
  try { tags = typeof row.tags === "string" ? JSON.parse(row.tags) : row.tags || []; } catch { tags = []; }
  return {
    id: String(row.id),
    title: row.title,
    content: row.content,
    coverImage: row.cover_image_file_id ? `/api/files/${row.cover_image_file_id}` : undefined,
    status: row.status,
    tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = router;

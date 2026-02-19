const router = require("express").Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");
const path = require("path");

const uploadUrl = () => process.env.UPLOAD_URL || "http://localhost:5000/uploads";

// GET /api/blog (public — published only)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, f.file_path, f.folder
       FROM blog_posts b
       LEFT JOIN files f ON b.cover_image_file_id = f.id
       WHERE b.status = 'published'
       ORDER BY b.created_at DESC`
    );
    res.json(rows.map(mapPost));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/blog/admin (all)
router.get("/admin", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, f.file_path, f.folder
       FROM blog_posts b
       LEFT JOIN files f ON b.cover_image_file_id = f.id
       ORDER BY b.created_at DESC`
    );
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
    const { title, content, status, tags, coverImage } = req.body;
    const hasCoverImage = Object.prototype.hasOwnProperty.call(req.body, "coverImage");
    if (hasCoverImage) {
      await db.query(
        "UPDATE blog_posts SET title = ?, content = ?, status = ?, tags = ?, cover_image_file_id = ? WHERE id = ?",
        [title, content, status, JSON.stringify(tags || []), coverImage || null, req.params.id]
      );
    } else {
      await db.query(
        "UPDATE blog_posts SET title = ?, content = ?, status = ?, tags = ? WHERE id = ?",
        [title, content, status, JSON.stringify(tags || []), req.params.id]
      );
    }
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
  const folder = row.file_path ? path.basename(path.dirname(row.file_path)) : row.folder;
  return {
    id: String(row.id),
    title: row.title,
    content: row.content,
    coverImage: row.file_path ? `${uploadUrl()}/${folder}/${path.basename(row.file_path)}` : undefined,
    status: row.status,
    tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = router;

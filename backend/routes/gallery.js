const router = require("express").Router();
const db = require("../config/db");
const upload = require("../middleware/upload");
const { verifyToken } = require("../middleware/auth");
const path = require("path");

const uploadUrl = () => process.env.UPLOAD_URL || "http://localhost:5000/uploads";

// GET /api/gallery (public)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT g.id, g.caption, g.category, g.created_at, f.file_path, f.folder
       FROM gallery g LEFT JOIN files f ON g.file_id = f.id ORDER BY g.created_at DESC`
    );
    const items = rows.map((r) => ({
      id: String(r.id),
      url: r.file_path ? `${uploadUrl()}/${r.folder}/${path.basename(r.file_path)}` : "",
      caption: r.caption || "",
      category: r.category,
      uploadedAt: r.created_at,
    }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gallery (admin, multi-upload)
router.post("/", verifyToken, upload.array("photos", 20), async (req, res) => {
  try {
    const { category = "events", caption = "" } = req.body;
    const folder = "gallery";
    const results = [];

    for (const file of req.files) {
      const ext = path.extname(file.originalname).replace(".", "").toLowerCase();
      const type = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? "image" : ext;

      const [fileResult] = await db.query(
        "INSERT INTO files (name, type, size, folder, uploaded_by, used_in, file_path) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [file.originalname, type, file.size, folder, req.user.name, "Gallery", file.path]
      );

      const [galleryResult] = await db.query(
        "INSERT INTO gallery (caption, category, file_id) VALUES (?, ?, ?)",
        [caption, category, fileResult.insertId]
      );

      results.push({
        id: String(galleryResult.insertId),
        url: `${uploadUrl()}/${folder}/${file.filename}`,
        caption,
        category,
        uploadedAt: new Date().toISOString(),
      });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/gallery/:id
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { caption, category } = req.body;
    await db.query("UPDATE gallery SET caption = ?, category = ? WHERE id = ?", [caption, category, req.params.id]);
    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/gallery/:id
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT file_id FROM gallery WHERE id = ?", [req.params.id]);
    await db.query("DELETE FROM gallery WHERE id = ?", [req.params.id]);
    if (rows.length > 0 && rows[0].file_id) {
      await db.query("DELETE FROM files WHERE id = ?", [rows[0].file_id]);
    }
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const router = require("express").Router();
const db = require("../config/db");
const upload = require("../middleware/upload");
const { verifyToken } = require("../middleware/auth");
const fs = require("fs");
const path = require("path");

const uploadUrl = () => process.env.UPLOAD_URL || "http://localhost:5000/uploads";

// GET /api/files
router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM files ORDER BY created_at DESC");
    const files = rows.map((f) => ({
      id: String(f.id),
      name: f.name,
      type: f.type,
      size: f.size,
      folder: f.folder,
      uploadedBy: f.uploaded_by,
      uploadedAt: f.created_at,
      usedIn: f.used_in || "",
      url: `${uploadUrl()}/${f.folder}/${path.basename(f.file_path)}`,
    }));
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/files/upload
router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const folder = req.body.folder || "general";
    const usedIn = req.body.usedIn || "";
    const ext = path.extname(file.originalname).replace(".", "").toLowerCase();
    const type = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? "image" : ext;

    const [result] = await db.query(
      "INSERT INTO files (name, type, size, folder, uploaded_by, used_in, file_path) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [file.originalname, type, file.size, folder, req.user.name, usedIn, file.path]
    );

    res.json({
      id: String(result.insertId),
      name: file.originalname,
      type,
      size: file.size,
      folder,
      uploadedBy: req.user.name,
      uploadedAt: new Date().toISOString(),
      usedIn,
      url: `${uploadUrl()}/${folder}/${file.filename}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/files/:id
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM files WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "File not found" });

    const file = rows[0];
    if (fs.existsSync(file.file_path)) fs.unlinkSync(file.file_path);

    await db.query("DELETE FROM files WHERE id = ?", [req.params.id]);
    res.json({ message: "File deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

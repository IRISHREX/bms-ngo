const router = require("express").Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// GET /api/projects (public)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects ORDER BY created_at DESC");
    res.json(rows.map(mapProject));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects
router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, description, location, budget, status } = req.body;
    const [result] = await db.query(
      "INSERT INTO projects (title, description, location, budget, status) VALUES (?, ?, ?, ?, ?)",
      [title, description, location, budget || 0, status || "planned"]
    );
    res.json({ id: String(result.insertId), message: "Project created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:id
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { title, description, location, budget, fundsUsed, status } = req.body;
    await db.query(
      "UPDATE projects SET title = ?, description = ?, location = ?, budget = ?, funds_used = ?, status = ? WHERE id = ?",
      [title, description, location, budget, fundsUsed || 0, status, req.params.id]
    );
    res.json({ message: "Project updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await db.query("DELETE FROM projects WHERE id = ?", [req.params.id]);
    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function mapProject(row) {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    location: row.location,
    budget: Number(row.budget),
    fundsUsed: Number(row.funds_used),
    status: row.status,
    photos: [],
    createdAt: row.created_at,
  };
}

module.exports = router;

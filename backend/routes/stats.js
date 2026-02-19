const router = require("express").Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// GET /api/stats
router.get("/", async (req, res) => {
  try {
    const [[donations]] = await db.query("SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM donations");
    const [[volunteers]] = await db.query("SELECT COUNT(*) as count FROM volunteers");
    const [[photos]] = await db.query("SELECT COUNT(*) as count FROM gallery");
    const [[notices]] = await db.query("SELECT COUNT(*) as count FROM notices");
    const [[blogs]] = await db.query("SELECT COUNT(*) as count FROM blog_posts");
    const [[projects]] = await db.query("SELECT COUNT(*) as count FROM projects");
    const [[impact]] = await db.query("SELECT students_helped, meals_served, villages_reached FROM impact_stats WHERE id = 1");

    res.json({
      totalDonations: donations.count,
      donationAmount: Number(donations.total),
      totalVolunteers: volunteers.count,
      totalPhotos: photos.count,
      totalNotices: notices.count,
      totalBlogPosts: blogs.count,
      totalProjects: projects.count,
      studentsHelped: impact?.students_helped || 0,
      mealsServed: impact?.meals_served || 0,
      villagesReached: impact?.villages_reached || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/stats/impact
router.put("/impact", verifyToken, async (req, res) => {
  try {
    const { studentsHelped, mealsServed, villagesReached } = req.body;
    await db.query(
      "UPDATE impact_stats SET students_helped = ?, meals_served = ?, villages_reached = ? WHERE id = 1",
      [studentsHelped, mealsServed, villagesReached]
    );
    res.json({ message: "Impact stats updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

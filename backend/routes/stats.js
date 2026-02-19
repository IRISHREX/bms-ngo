const router = require("express").Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");
const path = require("path");

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

// GET /api/stats/transparency (public)
router.get("/transparency", async (req, res) => {
  try {
    const uploadUrl = process.env.UPLOAD_URL || "http://localhost:5000/uploads";

    const [[donationTotals]] = await db.query(
      `SELECT
        COALESCE(SUM(amount), 0) AS totalRaised,
        COALESCE(SUM(CASE WHEN type = 'one-time' THEN amount ELSE 0 END), 0) AS oneTimeAmount,
        COALESCE(SUM(CASE WHEN type = 'monthly' THEN amount ELSE 0 END), 0) AS monthlyAmount,
        COALESCE(SUM(CASE WHEN type = 'campaign' THEN amount ELSE 0 END), 0) AS campaignAmount
       FROM donations`
    );

    const [[projectTotals]] = await db.query(
      `SELECT
        COALESCE(SUM(funds_used), 0) AS totalDisbursed,
        COUNT(*) AS totalProjects
       FROM projects`
    );

    const [reportRows] = await db.query(
      `SELECT id, name, folder, file_path, created_at
       FROM files
       WHERE folder = 'reports'
       ORDER BY created_at DESC
       LIMIT 20`
    );

    const totalRaised = Number(donationTotals.totalRaised || 0);
    const oneTimeAmount = Number(donationTotals.oneTimeAmount || 0);
    const monthlyAmount = Number(donationTotals.monthlyAmount || 0);
    const campaignAmount = Number(donationTotals.campaignAmount || 0);
    const totalDisbursed = Number(projectTotals.totalDisbursed || 0);
    const availableBalance = totalRaised - totalDisbursed;

    const breakdown = [
      { key: "one-time", label: "One-time Donations", amount: oneTimeAmount },
      { key: "monthly", label: "Monthly Donations", amount: monthlyAmount },
      { key: "campaign", label: "Campaign Donations", amount: campaignAmount },
    ].map((item) => ({
      ...item,
      pct: totalRaised > 0 ? Math.round((item.amount / totalRaised) * 100) : 0,
    }));

    const reports = reportRows.map((r) => ({
      id: String(r.id),
      title: r.name,
      type: "Financial Report",
      uploadedAt: r.created_at,
      url: `${uploadUrl}/${r.folder}/${path.basename(r.file_path)}`,
    }));

    res.json({
      totalRaised,
      totalDisbursed,
      availableBalance,
      totalProjects: Number(projectTotals.totalProjects || 0),
      breakdown,
      reports,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/activity (admin)
router.get("/activity", verifyToken, async (req, res) => {
  try {
    const [
      [donations],
      [volunteers],
      [blogs],
      [gallery],
      [notices],
      [projects],
    ] = await Promise.all([
      db.query("SELECT donor_name, amount, created_at FROM donations ORDER BY created_at DESC LIMIT 6"),
      db.query("SELECT name, type, created_at FROM volunteers ORDER BY created_at DESC LIMIT 6"),
      db.query("SELECT title, status, created_at FROM blog_posts ORDER BY created_at DESC LIMIT 6"),
      db.query("SELECT caption, category, created_at FROM gallery ORDER BY created_at DESC LIMIT 6"),
      db.query("SELECT title, status, created_at FROM notices ORDER BY created_at DESC LIMIT 6"),
      db.query("SELECT title, status, created_at FROM projects ORDER BY created_at DESC LIMIT 6"),
    ]);

    const items = [
      ...donations.map((d) => ({
        type: "donation",
        text: `New donation of INR ${Number(d.amount).toLocaleString("en-IN")} from ${d.donor_name || "Anonymous"}`,
        createdAt: d.created_at,
      })),
      ...volunteers.map((v) => ({
        type: "volunteer",
        text: `New ${v.type || "volunteer"} application from ${v.name}`,
        createdAt: v.created_at,
      })),
      ...blogs.map((b) => ({
        type: "blog",
        text: `Blog post "${b.title}" is ${b.status}`,
        createdAt: b.created_at,
      })),
      ...gallery.map((g) => ({
        type: "gallery",
        text: `Gallery photo added${g.caption ? `: ${g.caption}` : ""}`,
        createdAt: g.created_at,
      })),
      ...notices.map((n) => ({
        type: "notice",
        text: `Notice "${n.title}" is ${n.status}`,
        createdAt: n.created_at,
      })),
      ...projects.map((p) => ({
        type: "project",
        text: `Project "${p.title}" is ${p.status}`,
        createdAt: p.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);

    res.json(items);
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

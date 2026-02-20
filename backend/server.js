require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:8080,http://localhost:5173")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadDir));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/stats", require("./routes/stats"));
app.use("/api/files", require("./routes/files"));
app.use("/api/gallery", require("./routes/gallery"));
app.use("/api/notices", require("./routes/notices"));
app.use("/api/blog", require("./routes/blog"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/volunteers", require("./routes/volunteers"));
app.use("/api/donations", require("./routes/donations"));
app.use("/api/users", require("./routes/users"));
app.use("/api/theme", require("./routes/theme"));

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

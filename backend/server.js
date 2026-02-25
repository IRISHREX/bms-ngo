require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./config/db");
const logger = require("./config/logger");
const { ensureDatabaseAndTables } = require("./config/dbBootstrap");

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
app.use((req, res, next) => {
  // Skip JSON parsing for Razorpay webhook — it needs raw body for HMAC verification
  if (req.originalUrl === "/api/razorpay/webhook") return next();
  express.json()(req, res, next);
});
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    if (!req.originalUrl.startsWith("/api")) {
      return;
    }

    const durationMs = Date.now() - start;
    const payload = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      userId: req.user?.id || null,
    };

    if (res.statusCode >= 500) {
      logger.error("API request failed", payload);
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn("API request warning", payload);
      return;
    }

    logger.info("API request completed", payload);
  });

  next();
});

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
app.use("/api/razorpay", require("./routes/razorpay"));

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use((err, req, res, next) => {
  logger.error("Unhandled request error", {
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    stack: err.stack,
  });

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({ message: "Internal Server Error" });
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { message: error.message, stack: error.stack });
  process.exit(1);
});

async function startServer() {
  try {
    await ensureDatabaseAndTables();
    await db.query("SELECT 1");

    const dbHost = process.env.DB_HOST || "localhost";
    const dbUser = process.env.DB_USER || "root";
    const dbSchema = process.env.DB_NAME || "ngo_db";
    logger.info("DB connected", { host: dbHost, user: dbUser, schema: dbSchema });

    app.listen(PORT, () => {
      logger.info("Server started", { port: PORT, env: process.env.NODE_ENV || "development" });
    });
  } catch (error) {
    logger.error("Failed to connect to DB", { message: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();

const fs = require("fs");
const path = require("path");
const { createLogger, format, transports } = require("winston");

const logDir = path.join(__dirname, "..", "logs");
const combinedLogPath = path.join(logDir, "combined.log");
const errorLogPath = path.join(logDir, "error.log");
const LOG_RETENTION_MS = Number(process.env.LOG_RETENTION_MS || 60 * 60 * 1000);
const LOG_CLEANUP_INTERVAL_MS = Number(process.env.LOG_CLEANUP_INTERVAL_MS || 5 * 60 * 1000);

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: "ngo-backend" },
  transports: [
    new transports.File({ filename: errorLogPath, level: "error" }),
    new transports.File({ filename: combinedLogPath }),
  ],
});

logger.add(
  new transports.Console({
    format: format.combine(
      format.colorize(),
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.printf(({ timestamp, level, message, ...meta }) => {
        const metaText = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
        return `${timestamp} [${level}] ${message}${metaText}`;
      })
    ),
  })
);

function cleanupLogFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const stats = fs.statSync(filePath);
  const ageMs = Date.now() - stats.mtimeMs;
  if (ageMs < LOG_RETENTION_MS) return;

  try {
    fs.truncateSync(filePath, 0);
  } catch {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // no-op: avoid logger recursion from cleanup failures
    }
  }
}

function cleanupLogs() {
  cleanupLogFile(combinedLogPath);
  cleanupLogFile(errorLogPath);
}

const cleanupTimer = setInterval(cleanupLogs, LOG_CLEANUP_INTERVAL_MS);
cleanupTimer.unref();

module.exports = logger;

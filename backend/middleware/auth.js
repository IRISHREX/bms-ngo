const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    logger.warn("Auth failed: missing bearer token", {
      method: req.method,
      path: req.originalUrl,
    });
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    logger.warn("Auth failed: invalid or expired token", {
      method: req.method,
      path: req.originalUrl,
    });
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn("Auth failed: insufficient permissions", {
        method: req.method,
        path: req.originalUrl,
        userId: req.user?.id || null,
        role: req.user?.role || null,
        allowedRoles: roles,
      });
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };

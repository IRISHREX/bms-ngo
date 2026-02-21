const mysql = require("mysql2/promise");
const logger = require("./logger");

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "ngo_db";

const TABLE_QUERIES = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'content_manager', 'finance_admin') DEFAULT 'content_manager',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    budget DECIMAL(12,2) DEFAULT 0,
    funds_used DECIMAL(12,2) DEFAULT 0,
    status ENUM('planned', 'ongoing', 'completed') DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    size INT DEFAULT 0,
    folder VARCHAR(100),
    uploaded_by VARCHAR(100),
    used_in VARCHAR(100),
    file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS gallery (
    id INT PRIMARY KEY AUTO_INCREMENT,
    caption VARCHAR(255),
    category ENUM('events', 'beneficiaries', 'volunteers', 'field-visits') DEFAULT 'events',
    file_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS notices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    attachment_file_id INT,
    publish_date DATE,
    expiry_date DATE,
    pinned BOOLEAN DEFAULT FALSE,
    status ENUM('draft', 'active', 'expired') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attachment_file_id) REFERENCES files(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS blog_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT,
    cover_image_file_id INT,
    status ENUM('draft', 'published') DEFAULT 'draft',
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cover_image_file_id) REFERENCES files(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS volunteers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    message TEXT,
    type ENUM('volunteer', 'partner', 'intern') DEFAULT 'volunteer',
    status ENUM('new', 'contacted', 'approved', 'rejected') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS donations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    donor_name VARCHAR(100),
    amount DECIMAL(12,2) NOT NULL,
    payment_id VARCHAR(100),
    receipt_generated BOOLEAN DEFAULT FALSE,
    type ENUM('one-time', 'monthly', 'campaign') DEFAULT 'one-time',
    campaign VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS impact_stats (
    id INT PRIMARY KEY DEFAULT 1,
    students_helped INT DEFAULT 0,
    meals_served INT DEFAULT 0,
    villages_reached INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS themes_catalog (
    theme_key VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    description VARCHAR(255) DEFAULT '',
    sort_order INT DEFAULT 0
  ) ENGINE=InnoDB`,
  `CREATE TABLE IF NOT EXISTS theme_settings (
    id TINYINT PRIMARY KEY DEFAULT 1,
    theme_key VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,
];

async function ensureDatabaseAndTables() {
  const adminConn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
  });

  try {
    const safeDbName = DB_NAME.replace(/`/g, "``");
    await adminConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${safeDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    logger.info("Database schema ensured", { schema: DB_NAME, host: DB_HOST });
  } finally {
    await adminConn.end();
  }

  const dbConn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  try {
    for (const query of TABLE_QUERIES) {
      await dbConn.query(query);
    }
    logger.info("Database tables ensured", { schema: DB_NAME, tableCount: TABLE_QUERIES.length });
  } finally {
    await dbConn.end();
  }
}

module.exports = { ensureDatabaseAndTables };

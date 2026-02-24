const mysql = require("mysql2/promise");
const logger = require("./logger");

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "ngo_db";
const REMOVED_THEME_KEYS = ["cool", "glass", "rainy.green"];
const SUPPORTED_THEMES = [
  { key: "hot", label: "Hot", description: "Warm red/orange profile", sortOrder: 1 },
  { key: "cyberpunk", label: "Cyber Punk", description: "Neon cyan/magenta profile", sortOrder: 2 },
  { key: "retro", label: "Retro", description: "Vintage warm palette", sortOrder: 3 },
  { key: "golden-dark", label: "Golden Dark", description: "Dark theme with rich gold accents", sortOrder: 4 },
  { key: "golden-silver", label: "Golden Silver", description: "Light silver base with golden highlights", sortOrder: 5 },
  { key: "desart", label: "Desart", description: "Dry sand-inspired palette", sortOrder: 6 },
  { key: "forest", label: "Forest", description: "Natural green profile", sortOrder: 7 },
  { key: "snow", label: "Snow", description: "Crisp icy profile", sortOrder: 8 },
  { key: "dark", label: "Dark", description: "Dark neutral profile", sortOrder: 9 },
  { key: "blackpink", label: "Blackpink", description: "Black and pink contrast profile", sortOrder: 10 },
];

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
  `CREATE TABLE IF NOT EXISTS activity_dismissals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    activity_key VARCHAR(191) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_activity (user_id, activity_key)
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

    for (const theme of SUPPORTED_THEMES) {
      await dbConn.query(
        `INSERT INTO themes_catalog (theme_key, label, description, sort_order)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           label = VALUES(label),
           description = VALUES(description),
           sort_order = VALUES(sort_order)`,
        [theme.key, theme.label, theme.description, theme.sortOrder]
      );
    }

    if (REMOVED_THEME_KEYS.length > 0) {
      await dbConn.query(
        `DELETE FROM themes_catalog WHERE theme_key IN (${REMOVED_THEME_KEYS.map(() => "?").join(",")})`,
        REMOVED_THEME_KEYS
      );
    }

    const [settingRows] = await dbConn.query("SELECT theme_key FROM theme_settings WHERE id = 1 LIMIT 1");
    const currentTheme = settingRows[0]?.theme_key;
    const hasCurrentTheme = SUPPORTED_THEMES.some((theme) => theme.key === currentTheme);
    if (!hasCurrentTheme) {
      await dbConn.query(
        `INSERT INTO theme_settings (id, theme_key)
         VALUES (1, 'forest')
         ON DUPLICATE KEY UPDATE theme_key = VALUES(theme_key)`
      );
    }

    logger.info("Database tables ensured", { schema: DB_NAME, tableCount: TABLE_QUERIES.length });
  } finally {
    await dbConn.end();
  }
}

module.exports = { ensureDatabaseAndTables };

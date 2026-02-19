// Run: node seed.js
// Creates tables and seeds initial admin user + sample data
require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./config/db");

async function seed() {
  console.log("Creating tables...");

  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'content_manager', 'finance_admin') DEFAULT 'content_manager',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    budget DECIMAL(12,2) DEFAULT 0,
    funds_used DECIMAL(12,2) DEFAULT 0,
    status ENUM('planned', 'ongoing', 'completed') DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS files (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    size INT DEFAULT 0,
    folder VARCHAR(100),
    uploaded_by VARCHAR(100),
    used_in VARCHAR(100),
    file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS gallery (
    id INT PRIMARY KEY AUTO_INCREMENT,
    caption VARCHAR(255),
    category ENUM('events', 'beneficiaries', 'volunteers', 'field-visits') DEFAULT 'events',
    file_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS notices (
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
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS blog_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT,
    cover_image_file_id INT,
    status ENUM('draft', 'published') DEFAULT 'draft',
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cover_image_file_id) REFERENCES files(id) ON DELETE SET NULL
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS volunteers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    message TEXT,
    type ENUM('volunteer', 'partner', 'intern') DEFAULT 'volunteer',
    status ENUM('new', 'contacted', 'approved', 'rejected') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS donations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    donor_name VARCHAR(100),
    amount DECIMAL(12,2) NOT NULL,
    payment_id VARCHAR(100),
    receipt_generated BOOLEAN DEFAULT FALSE,
    type ENUM('one-time', 'monthly', 'campaign') DEFAULT 'one-time',
    campaign VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS impact_stats (
    id INT PRIMARY KEY DEFAULT 1,
    students_helped INT DEFAULT 0,
    meals_served INT DEFAULT 0,
    villages_reached INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  // Seed impact stats
  await db.query("INSERT IGNORE INTO impact_stats (id, students_helped, meals_served, villages_reached) VALUES (1, 3200, 15000, 45)");

  // Seed admin user (admin@ngo.org / admin123)
  const hash = await bcrypt.hash("admin123", 10);
  await db.query(
    "INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    ["Admin User", "admin@ngo.org", hash, "super_admin"]
  );

  console.log("✅ Database seeded! Admin: admin@ngo.org / admin123");
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });

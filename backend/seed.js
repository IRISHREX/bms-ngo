// Run: node seed.js
// Creates tables and seeds initial admin user + sample data for all modules.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const db = require("./config/db");

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
const DUMMY_JPG_BASE64 =
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBAVFRUVFRUVFRUVFRUVFRUWFxUVFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGhAQGi0mICYtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAgMBIgACEQEDEQH/xAAXAAADAQAAAAAAAAAAAAAAAAAAAQMC/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAAB6gD/xAAZEAEAAgMAAAAAAAAAAAAAAAABABEhMWH/2gAIAQEAAT8Aq8bG1//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8Aaf/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8Aaf/Z";

async function tableCount(table) {
  const [[row]] = await db.query(`SELECT COUNT(*) AS count FROM ${table}`);
  return Number(row.count || 0);
}

function ensureSampleFile(relativePath, content, encoding = "utf8", overwrite = false) {
  const fullPath = path.join(uploadDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  if (!fs.existsSync(fullPath) || overwrite) {
    fs.writeFileSync(fullPath, content, encoding);
  }
  const stats = fs.statSync(fullPath);
  return { fullPath, size: stats.size };
}

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

  // Seed users (upsert by email)
  const adminName = process.env.ADMIN_SEED_NAME || "Admin User";
  const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@ngo.org";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "admin123";
  const defaultPassword = process.env.DEFAULT_SEED_PASSWORD || "password123";

  const [adminHash, contentHash, financeHash] = await Promise.all([
    bcrypt.hash(adminPassword, 10),
    bcrypt.hash(defaultPassword, 10),
    bcrypt.hash(defaultPassword, 10),
  ]);

  await db.query(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES (?, ?, ?, 'super_admin', 'active')
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       password_hash = VALUES(password_hash),
       role = 'super_admin',
       status = 'active'`,
    [adminName, adminEmail, adminHash]
  );

  await db.query(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES ('Content Manager', 'content@ngo.org', ?, 'content_manager', 'active')
     ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       role = 'content_manager',
       status = 'active'`,
    [contentHash]
  );

  await db.query(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES ('Finance Admin', 'finance@ngo.org', ?, 'finance_admin', 'active')
     ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       role = 'finance_admin',
       status = 'active'`,
    [financeHash]
  );

  // Seed projects
  if ((await tableCount("projects")) === 0) {
    await db.query(
      `INSERT INTO projects (title, description, location, budget, funds_used, status) VALUES
      ('Rural Learning Centers', 'Free evening classes for village students.', 'West Bengal', 1200000, 780000, 'ongoing'),
      ('Mobile Medical Camps', 'Monthly health camps with free checkups and medicines.', 'Bihar', 900000, 900000, 'completed'),
      ('Nutrition Support Drive', 'Meal kits for underserved families and children.', 'Jharkhand', 600000, 260000, 'ongoing'),
      ('Women Skill Program', 'Tailoring and entrepreneurship training for women.', 'Odisha', 450000, 0, 'planned')`
    );
  }

  // Seed files + create local dummy content/images
  let reportFileId;
  let noticeFileId;
  let blogCoverFileId;
  const galleryFileIds = [];
  const report = ensureSampleFile(path.join("reports", "annual-report-2024-25.pdf"), "Sample annual report for testing.");
  const noticeDoc = ensureSampleFile(path.join("notices", "camp-notice.pdf"), "Sample notice document for testing.");
  const blogCover = ensureSampleFile(path.join("blog", "education-story-cover.jpg"), Buffer.from(DUMMY_JPG_BASE64, "base64"), "binary", true);
  const g1 = ensureSampleFile(path.join("gallery", "camp-01.jpg"), Buffer.from(DUMMY_JPG_BASE64, "base64"), "binary", true);
  const g2 = ensureSampleFile(path.join("gallery", "students-01.jpg"), Buffer.from(DUMMY_JPG_BASE64, "base64"), "binary", true);
  const g3 = ensureSampleFile(path.join("gallery", "volunteers-01.jpg"), Buffer.from(DUMMY_JPG_BASE64, "base64"), "binary", true);

  if ((await tableCount("files")) === 0) {
    const [fileInsert] = await db.query(
      `INSERT INTO files (name, type, size, folder, uploaded_by, used_in, file_path) VALUES
      ('annual-report-2024-25.pdf', 'pdf', ?, 'reports', ?, 'Financial Transparency', ?),
      ('camp-notice.pdf', 'pdf', ?, 'notices', ?, 'Notices', ?),
      ('education-story-cover.jpg', 'image', ?, 'blog', ?, 'Blog', ?),
      ('camp-01.jpg', 'image', ?, 'gallery', ?, 'Gallery', ?),
      ('students-01.jpg', 'image', ?, 'gallery', ?, 'Gallery', ?),
      ('volunteers-01.jpg', 'image', ?, 'gallery', ?, 'Gallery', ?)`,
      [
        report.size, adminName, report.fullPath,
        noticeDoc.size, adminName, noticeDoc.fullPath,
        blogCover.size, adminName, blogCover.fullPath,
        g1.size, adminName, g1.fullPath,
        g2.size, adminName, g2.fullPath,
        g3.size, adminName, g3.fullPath,
      ]
    );

    const firstId = Number(fileInsert.insertId);
    reportFileId = firstId;
    noticeFileId = firstId + 1;
    blogCoverFileId = firstId + 2;
    galleryFileIds.push(firstId + 3, firstId + 4, firstId + 5);
  } else {
    const [reportRows] = await db.query("SELECT id FROM files WHERE folder = 'reports' ORDER BY created_at DESC LIMIT 1");
    const [noticeRows] = await db.query("SELECT id FROM files WHERE folder = 'notices' ORDER BY created_at DESC LIMIT 1");
    const [blogRows] = await db.query("SELECT id FROM files WHERE folder = 'blog' ORDER BY created_at DESC LIMIT 1");
    const [galleryRows] = await db.query("SELECT id FROM files WHERE folder = 'gallery' ORDER BY created_at DESC LIMIT 3");
    reportFileId = reportRows[0] ? Number(reportRows[0].id) : null;
    noticeFileId = noticeRows[0] ? Number(noticeRows[0].id) : null;
    blogCoverFileId = blogRows[0] ? Number(blogRows[0].id) : null;
    galleryRows.forEach((r) => galleryFileIds.push(Number(r.id)));
  }

  // Seed gallery
  if ((await tableCount("gallery")) === 0 && galleryFileIds.length > 0) {
    await db.query(
      `INSERT INTO gallery (caption, category, file_id) VALUES
      ('Medical camp in Sundarbans', 'events', ?),
      ('Students receiving books', 'beneficiaries', ?),
      ('Volunteer orientation day', 'volunteers', ?)`,
      [galleryFileIds[0] || null, galleryFileIds[1] || null, galleryFileIds[2] || null]
    );
  }

  // Seed notices
  if ((await tableCount("notices")) === 0) {
    await db.query(
      `INSERT INTO notices (title, description, attachment_file_id, publish_date, expiry_date, pinned, status) VALUES
      ('Free Health Camp This Sunday', 'Join us for a free medical camp at community center.', ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 20 DAY), TRUE, 'active'),
      ('Volunteer Orientation', 'New volunteer orientation session next week.', NULL, CURDATE(), NULL, FALSE, 'active'),
      ('Scholarship Applications Open', 'Applications for merit scholarships are now open.', NULL, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), FALSE, 'draft')`,
      [noticeFileId]
    );
  }

  // Seed blog posts
  if ((await tableCount("blog_posts")) === 0) {
    await db.query(
      `INSERT INTO blog_posts (title, content, cover_image_file_id, status, tags) VALUES
      ('Meet Raju: First Graduate in His Village', 'Raju joined our learning center in 2021 and is now preparing for college.', ?, 'published', JSON_ARRAY('education','impact')),
      ('How Our Mobile Clinics Work', 'A look at how we run rural healthcare camps each month.', NULL, 'published', JSON_ARRAY('healthcare','fieldwork')),
      ('Monthly Program Update', 'Highlights from all active programs this month.', NULL, 'draft', JSON_ARRAY('report'))`,
      [blogCoverFileId]
    );
  }

  // Seed volunteers
  if ((await tableCount("volunteers")) === 0) {
    await db.query(
      `INSERT INTO volunteers (name, phone, email, message, type, status) VALUES
      ('Priya Sharma', '+91-9000000001', 'priya@example.com', 'I want to teach students on weekends.', 'volunteer', 'new'),
      ('Ankit Verma', '+91-9000000002', 'ankit@example.com', 'Interested in partnership for medical supplies.', 'partner', 'contacted'),
      ('Meera Das', '+91-9000000003', 'meera@example.com', 'Applying for social work internship.', 'intern', 'approved')`
    );
  }

  // Seed donations
  if ((await tableCount("donations")) === 0) {
    await db.query(
      `INSERT INTO donations (donor_name, amount, payment_id, receipt_generated, type, campaign) VALUES
      ('Rajesh Kumar', 5000, 'PAY-10001', TRUE, 'one-time', NULL),
      ('Ananya Sen', 1200, 'PAY-10002', TRUE, 'monthly', 'monthly-giving'),
      ('SBI CSR Fund', 250000, 'PAY-10003', FALSE, 'campaign', 'school-renovation'),
      ('Nadia Traders', 15000, 'PAY-10004', TRUE, 'one-time', NULL),
      ('Ishita Roy', 1000, 'PAY-10005', FALSE, 'monthly', 'monthly-giving')`
    );
  }

  console.log("Database seeded with sample records for all modules.");
  console.log(`Super Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`Content Manager: content@ngo.org / ${defaultPassword}`);
  console.log(`Finance Admin: finance@ngo.org / ${defaultPassword}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

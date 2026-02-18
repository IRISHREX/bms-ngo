# NGO Backend API Specification
## Node.js / Express / MySQL — For Hostinger VPS

> This document defines all API endpoints your backend should implement.
> The React frontend in `src/lib/api.ts` will call these endpoints.
> Replace mock data with `fetch(BASE_URL + endpoint)` calls.

---

## Setup Requirements

```
Node.js >= 18
MySQL 8.x
Express.js
multer (file uploads)
cors
jsonwebtoken (auth)
bcryptjs (password hashing)
```

### MySQL Database Schema

```sql
CREATE DATABASE ngo_db;

-- Users & Roles
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'content_manager', 'finance_admin') DEFAULT 'content_manager',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  budget DECIMAL(12,2) DEFAULT 0,
  funds_used DECIMAL(12,2) DEFAULT 0,
  status ENUM('planned', 'ongoing', 'completed') DEFAULT 'planned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Files
CREATE TABLE files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  size INT DEFAULT 0,
  folder VARCHAR(100),
  uploaded_by VARCHAR(100),
  used_in VARCHAR(100),
  file_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gallery
CREATE TABLE gallery (
  id INT PRIMARY KEY AUTO_INCREMENT,
  caption VARCHAR(255),
  category ENUM('events', 'beneficiaries', 'volunteers', 'field-visits') DEFAULT 'events',
  file_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL
);

-- Notices
CREATE TABLE notices (
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
);

-- Blog Posts
CREATE TABLE blog_posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT,
  cover_image_file_id INT,
  status ENUM('draft', 'published') DEFAULT 'draft',
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cover_image_file_id) REFERENCES files(id) ON DELETE SET NULL
);

-- Volunteers / Contacts
CREATE TABLE volunteers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  message TEXT,
  type ENUM('volunteer', 'partner', 'intern') DEFAULT 'volunteer',
  status ENUM('new', 'contacted', 'approved', 'rejected') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Donations
CREATE TABLE donations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  donor_name VARCHAR(100),
  amount DECIMAL(12,2) NOT NULL,
  payment_id VARCHAR(100),
  receipt_generated BOOLEAN DEFAULT FALSE,
  type ENUM('one-time', 'monthly', 'campaign') DEFAULT 'one-time',
  campaign VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Impact Stats (single row, updated by admin)
CREATE TABLE impact_stats (
  id INT PRIMARY KEY DEFAULT 1,
  students_helped INT DEFAULT 0,
  meals_served INT DEFAULT 0,
  villages_reached INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO impact_stats (id) VALUES (1);
```

---

## API Endpoints

### Base URL: `https://your-vps-domain.com/api`

### Authentication
```
POST   /api/auth/login          { email, password }     → { token, user }
POST   /api/auth/logout         (header: Bearer token)  → { message }
GET    /api/auth/me             (header: Bearer token)  → { user }
```

### Dashboard Stats
```
GET    /api/stats               → { totalDonations, totalVolunteers, totalPhotos, totalNotices, totalBlogPosts, totalProjects, donationAmount, studentsHelped, mealsServed, villagesReached }
```
> This aggregates counts from all tables + impact_stats row.

### Files
```
GET    /api/files               → FileItem[]
POST   /api/files/upload        (multipart/form-data: file, folder, usedIn) → FileItem
DELETE /api/files/:id           → { message }
PUT    /api/files/:id           (replace file or update metadata) → FileItem
```

### Image Storage (Hostinger VPS)
```
Store files in: /var/www/ngo-uploads/{folder}/{filename}
Serve via: https://your-domain.com/uploads/{folder}/{filename}
Use Nginx to serve the /uploads directory as static files.
```

**Nginx config for uploads:**
```nginx
location /uploads/ {
    alias /var/www/ngo-uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Gallery
```
GET    /api/gallery             → GalleryItem[]
POST   /api/gallery             (multipart: photos[], category, caption) → GalleryItem[]
PUT    /api/gallery/:id         { caption, category } → GalleryItem
DELETE /api/gallery/:id         → { message }
```

### Notices
```
GET    /api/notices             → Notice[]     (public: only active & not expired)
GET    /api/admin/notices       → Notice[]     (admin: all)
POST   /api/notices             { title, description, publishDate, expiryDate, pinned, attachment? }
PUT    /api/notices/:id         { ...fields }
DELETE /api/notices/:id         → { message }
```

### Blog
```
GET    /api/blog                → BlogPost[]   (public: only published)
GET    /api/admin/blog          → BlogPost[]   (admin: all)
POST   /api/blog                { title, content, tags, coverImage?, status }
PUT    /api/blog/:id            { ...fields }
DELETE /api/blog/:id            → { message }
```

### Projects
```
GET    /api/projects            → Project[]
POST   /api/projects            { title, description, location, budget, status }
PUT    /api/projects/:id        { ...fields }
DELETE /api/projects/:id        → { message }
```

### Volunteers
```
GET    /api/volunteers          → Volunteer[]  (admin only)
POST   /api/volunteers          { name, phone, email, message, type } (public form submission)
PUT    /api/volunteers/:id      { status } (admin updates status)
GET    /api/volunteers/export   → CSV download
```

### Donations
```
GET    /api/donations           → Donation[]   (admin only)
POST   /api/donations           { donorName, amount, paymentId, type, campaign? }
GET    /api/donations/report    → CSV/PDF download
POST   /api/donations/:id/receipt → generate & send receipt email
```

### Impact Stats (admin)
```
PUT    /api/stats/impact        { studentsHelped, mealsServed, villagesReached }
```

### Users & Roles (super_admin only)
```
GET    /api/users               → User[]
POST   /api/users               { name, email, password, role }
PUT    /api/users/:id           { role, status }
DELETE /api/users/:id           → { message }
```

---

## Express App Structure

```
backend/
├── server.js              # Entry point
├── config/
│   └── db.js              # MySQL connection pool
├── middleware/
│   ├── auth.js            # JWT verification
│   └── upload.js          # Multer config
├── routes/
│   ├── auth.js
│   ├── stats.js
│   ├── files.js
│   ├── gallery.js
│   ├── notices.js
│   ├── blog.js
│   ├── projects.js
│   ├── volunteers.js
│   ├── donations.js
│   └── users.js
├── .env
└── package.json
```

### .env
```
DB_HOST=localhost
DB_USER=ngo_user
DB_PASSWORD=your_password
DB_NAME=ngo_db
JWT_SECRET=your_jwt_secret
UPLOAD_DIR=/var/www/ngo-uploads
PORT=5000
```

---

## Connecting Frontend

In `src/lib/api.ts`, change:
```typescript
const BASE_URL = "https://your-vps-domain.com/api";
```

Then replace mock functions with real fetch calls:
```typescript
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${BASE_URL}/stats`);
  return res.json();
}
```

---

## CORS Configuration

```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.com', 'http://localhost:5173'],
  credentials: true
}));
```

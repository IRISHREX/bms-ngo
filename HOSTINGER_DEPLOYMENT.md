# Hostinger Deployment Guide (VPS)

Date reference: February 19, 2026

## 1. Production placeholders you must replace

Use these values as a checklist:

- `<YOUR_DOMAIN>`: example `ngo.example.com`
- `<YOUR_FRONTEND_DOMAIN>`: example `https://ngo.example.com`
- `<YOUR_API_DOMAIN>`: example `https://api.ngo.example.com`
- `<MYSQL_HOST>`
- `<MYSQL_USER>`
- `<MYSQL_PASSWORD>`
- `<MYSQL_DATABASE>`
- `<STRONG_RANDOM_JWT_SECRET>`
- `<DEPLOY_PATH>`: example `/var/www/bms-ngo`
- `<UPLOADS_PATH>`: example `/var/www/ngo-uploads`

## 2. Backend production env (`backend/.env`)

```env
DB_HOST=<MYSQL_HOST>
DB_USER=<MYSQL_USER>
DB_PASSWORD=<MYSQL_PASSWORD>
DB_NAME=<MYSQL_DATABASE>
JWT_SECRET=<STRONG_RANDOM_JWT_SECRET>
UPLOAD_DIR=<UPLOADS_PATH>
UPLOAD_URL=https://<YOUR_API_DOMAIN>/uploads
PORT=5000
FRONTEND_URL=https://<YOUR_FRONTEND_DOMAIN>

# Keep seed vars only for first-time setup, then remove/rotate
ADMIN_SEED_NAME=Sohel Islam
ADMIN_SEED_EMAIL=Sohel.Islam@Ibm.com
ADMIN_SEED_PASSWORD=Sohel@34892
```

## 3. Frontend production env (`.env.production`)

```env
VITE_API_URL=https://<YOUR_API_DOMAIN>/api
```

## 4. First-time server setup (Ubuntu VPS)

```bash
sudo apt update
sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Create uploads directory:

```bash
sudo mkdir -p <UPLOADS_PATH>
sudo chown -R $USER:$USER <UPLOADS_PATH>
```

## 5. Deploy backend

```bash
cd <DEPLOY_PATH>/backend
npm ci
node seed.js
pm2 start server.js --name bms-ngo-api
pm2 save
pm2 startup
```

## 6. Build/deploy frontend

```bash
cd <DEPLOY_PATH>
npm ci
npm run build
```

Serve built frontend (`dist/`) through Nginx.

## 7. Nginx example

```nginx
server {
    listen 80;
    server_name <YOUR_FRONTEND_DOMAIN>;

    root <DEPLOY_PATH>/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}

server {
    listen 80;
    server_name <YOUR_API_DOMAIN>;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        alias <UPLOADS_PATH>/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable config:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 8. SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d <YOUR_FRONTEND_DOMAIN> -d <YOUR_API_DOMAIN>
```

## 9. Post-deploy checks

- `https://<YOUR_API_DOMAIN>/api/health` returns `{ "status": "ok" }`
- Frontend loads and can call login endpoint.
- Uploads are accessible via `https://<YOUR_API_DOMAIN>/uploads/...`

## 10. Security notes

- Rotate `ADMIN_SEED_PASSWORD` after first login.
- Remove or change `ADMIN_SEED_*` in production env after seeding.
- Use a long random `JWT_SECRET` (at least 32 chars).
- Keep `.env` out of git.

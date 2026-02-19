# BMS NGO App

Frontend: Vite + React
Backend: Express + MySQL

## Local development

### 1. Create local database

```sql
CREATE DATABASE ngo_db_local;
```

### 2. Configure backend env

`backend/.env` is already created for local dev with:

- `DB_HOST=127.0.0.1`
- `DB_USER=root`
- `DB_PASSWORD=`
- `DB_NAME=ngo_db_local`
- `PORT=5000`
- `FRONTEND_URL=http://localhost:8080`
- Seed admin:
  - `ADMIN_SEED_EMAIL=Sohel.Islam@Ibm.com`
  - `ADMIN_SEED_PASSWORD=Sohel@34892`

If your local MySQL uses a password, update `backend/.env`.

### 3. Configure frontend env

`/.env.local` is already created:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Install dependencies

```bash
npm install
cd backend && npm install
```

### 5. Seed database

```bash
cd backend
node seed.js
```

### 6. Run app

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
npm run dev
```

Frontend: `http://localhost:8080`
Backend health: `http://localhost:5000/api/health`

## Hostinger deployment

See `HOSTINGER_DEPLOYMENT.md` for step-by-step production setup and placeholders.

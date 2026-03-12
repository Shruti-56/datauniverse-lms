# Pre-Deploy Checklist — ZIP for Hostinger

Before creating the ZIP and deploying, use this checklist.

---

## ✅ Project Status (Checked)

| Item | Status |
|------|--------|
| **Prisma connection fix** | ✅ Single shared PrismaClient (fixes 500 on login/signup) |
| **Graceful shutdown** | ✅ SIGTERM/SIGINT handled, DB disconnected on exit |
| **Build script** | ✅ Full build: frontend + backend + Prisma generate |
| **Deploy ZIP script** | ✅ `create-deploy-zip.sh` pre-builds and creates ZIP |
| **bootstrap.js** | ✅ Hostinger entry point starts backend |
| **.htaccess** | ✅ MIME types for .js/.css (fixes blank screen) |
| **API base URL** | ✅ Frontend uses `window.location.origin + /api` (same origin, no VITE_API_URL needed) |
| **Start command** | ✅ `npm start` runs `cd backend && node dist/app.js` |

---

## 🔧 Fixes Already Done (No Action Needed)

1. **Production 500 error** — Shared PrismaClient + `connection_limit=5` in DATABASE_URL
2. **DEPLOY_ZIP_HOSTINGER.md** — Updated with `?connection_limit=5` in DATABASE_URL

---

## ⚠️ Before Creating ZIP

1. **Run full build locally** (optional but recommended):
   ```bash
   npm run build
   ```
   If it fails, fix errors before creating the ZIP.

2. **Create the ZIP:**
   ```bash
   chmod +x create-deploy-zip.sh
   ./create-deploy-zip.sh
   ```
   This runs the build first, then creates `datauniverse-lms-deploy.zip`.

3. **Verify the ZIP** (optional):
   - Unzip in a temp folder and confirm:
     - `package.json` and `bootstrap.js` at root
     - `backend/` with `src/`, `prisma/`, `package.json`
     - `backend/public/` with built frontend (index.html, assets/)

---

## 📋 Hostinger Setup (After Upload)

1. **Create MySQL database** and user on Hostinger
2. **Upload** `datauniverse-lms-deploy.zip` and extract
3. **Set environment variables** (before first build):
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `mysql://USER:PASS@HOST/DB?connection_limit=5` ← **include `?connection_limit=5`**
   - `JWT_SECRET` = 32+ char random string
   - `JWT_EXPIRES_IN` = `7d`
   - `FRONTEND_URL` = your domain (e.g. `https://datauniverse.in`)
   - `CORS_ORIGINS` = same as FRONTEND_URL
   - Optional: AWS, Razorpay, SMTP, TZ

4. **Build command:**
   ```bash
   npm install && cd backend && npm install && cd .. && npm run build
   ```

5. **Start command:** `npm start` (or Entry file: `bootstrap.js`)

6. **Run database setup** (once):
   ```bash
   cd backend && npx prisma db push && npx prisma db seed
   ```

---

## 📚 Full Instructions

See **DEPLOY_ZIP_HOSTINGER.md** for detailed steps, troubleshooting, and env vars.

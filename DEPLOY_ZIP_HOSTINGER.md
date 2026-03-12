# Deploy DataUniverse LMS via ZIP to Hostinger

This guide explains how to deploy the full DataUniverse LMS (frontend + backend) to Hostinger using a **ZIP file upload**.

---

## Prerequisites

- **Hostinger plan:** Business Web Hosting or Cloud (Node.js support required)
- **MySQL database** on Hostinger
- **Domain** (optional; you can use the temporary Hostinger URL first)

---

## Step 1: Create the deployment ZIP

On your Mac/Linux, run from the project root:

```bash
chmod +x create-deploy-zip.sh
./create-deploy-zip.sh
```

This creates `datauniverse-lms-deploy.zip` (~2–5 MB) containing:
- **Pre-built frontend** (`index.html`, `assets/`, `backend/public/`) – built locally before zipping to avoid MIME/blank screen
- Frontend source (`src/`) and backend – for Hostinger’s build (Prisma, backend compile)
- `.htaccess` – correct MIME types for `.js`/`.css` when Hostinger’s Apache serves static files
- Backend source (`backend/src/`, `backend/prisma/`)
- Root and backend `package.json` and `package-lock.json`
- No `node_modules`, `.env`, or `.git` (Hostinger will run `npm install` and you’ll add env vars there)

---

## Step 2: Create MySQL database on Hostinger

1. In hPanel go to **Databases** → **MySQL Databases**
2. Create a database (e.g. `u123456789_datauniverse`)
3. Create a user with a strong password and assign it to this database (all privileges)
4. Note:
   - Database name
   - Username
   - Password
   - Host (e.g. `localhost` or `mysqlXX.hostinger.com`)

Your connection string format:

```
mysql://USERNAME:PASSWORD@HOST/DATABASE_NAME
```

Example: `mysql://u123_user:MyPass123@localhost/u123_datauniverse`

---

## Step 3: Upload and configure the Node.js app

1. In hPanel go to **Websites** → your website → **Node.js** (or **Node.js Apps**)
2. Click **Create Node.js app** or **Add application**
3. Choose **Upload your website files** or **Upload ZIP** (instead of GitHub)
4. Upload `datauniverse-lms-deploy.zip`
5. Set **Application root** to the root (where `package.json` and `backend/` are)
6. Set **Node.js version** to **20.x** (or 18.x)

---

## Step 4: Build and start commands

The root `package.json` now has `build` (full deploy build) and `start` (runs backend). Hostinger will auto-detect these. If you can set commands manually:

| Setting | Value |
|---------|-------|
| **Build command** | `npm install && cd backend && npm install && cd .. && npm run build` |
| **Start command** | `npm start` (or Entry file: `bootstrap.js`) |

Explanation:
- **Build:** Installs root and backend dependencies, builds React frontend, copies it into `backend/public`, generates Prisma client, and builds the backend
- **Start:** Runs the Express server, which serves `/api` and the frontend from `backend/public`

**Hostinger Build & Output settings:**
- **Root directory:** `/` (or leave empty)
- **Entry file:** `bootstrap.js` – this starts the Express backend
- **Output directory:** `dist` (if the field exists)

---

## Step 5: Environment variables

In the Node.js app settings, add these **before** the first deploy:

### Required

| Name | Value |
|------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `mysql://USER:PASSWORD@HOST/DATABASE?connection_limit=5&pool_timeout=10&connect_timeout=10` — keeps connections low and prevents hangs that exhaust Hostinger's process limit |
| `JWT_SECRET` | Long random string (32+ characters) |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | `https://your-domain.com` or `https://yoursite.hostingersite.com` |
| `CORS_ORIGINS` | Same as FRONTEND_URL |
| `VITE_API_URL` | `/api` |

`VITE_API_URL` is used at **build time** so the frontend calls the same origin (`/api`).

### Optional (for full functionality)

| Name | Description |
|------|-------------|
| `PORT` | Usually set by Hostinger |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` | Video uploads to S3 |
| `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_ENV` | Payments (Cashfree) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Emails (welcome, password reset, etc.) |
| `TZ` | `Asia/Kolkata` for live lecture reminders |

---

## Step 6: Deploy

1. Click **Deploy** or **Build**
2. Wait for the build to finish
3. Check the build log for errors

---

## Step 7: Database setup (one time)

After a successful build, create the schema and seed data.

### Option A: Hostinger SSH/Terminal

```bash
cd backend
npx prisma db push
npx prisma db seed
```

### Option B: Run locally against Hostinger MySQL

If Hostinger allows remote MySQL access:

1. On your computer, in the `backend/` folder, create `.env` with:

   ```
   DATABASE_URL="mysql://USER:PASSWORD@HOST/DATABASE"
   ```

   Use the same Hostinger MySQL connection details.

2. Run:

   ```bash
   cd backend
   npx prisma db push
   npx prisma db seed
   ```

### Option C: Post-deploy / run-command

If Hostinger offers a “Run command” or post-deploy script, you can run:

```bash
cd backend && npx prisma db push && npx prisma db seed
```

---

## Step 8: Verify

1. Open your site URL (e.g. `https://yoursite.hostingersite.com` or `https://datauniverse.in`)
2. You should see the DataUniverse landing/login page
3. Try health check: `https://your-domain.com/health` (or `/api` if you expose it)
4. Log in:
   - **Admin:** `admin@datauniverse.in` / `Data@12345`
   - **Student:** `student@datauniverse.com` / `Student123!`

---

## Fix MIME type / blank screen (if .htaccess doesn’t apply)

If you still see a blank screen and “Expected a JavaScript module but server responded with MIME type text/plain”:

1. **Recreate the ZIP and redeploy** — the script now copies built `index.html` + `assets/` to root
   ```bash
   ./create-deploy-zip.sh
   ```
   Redeploy with the new ZIP. Root must have the built files (not dev `/src/main.tsx`).

2. **Add MIME types in Hostinger File Manager**
   - In hPanel open **Files** → **File Manager**
   - Go to your app root (e.g. `domains/yourdomain.com/nodejs-app/`)
   - Create or edit `.htaccess` in that folder.
   - Add:
   ```
   AddType application/javascript js mjs
   AddType text/css css
   ```

3. **Check where Hostinger serves files from**
   - In Node.js app settings, see which folder is the application/root.
   - `.htaccess` must be in the folder Hostinger uses to serve static files (often the app root).

---

## Fixing 503 (Server Unavailable)

A **503** error means the reverse proxy cannot reach your Node.js app. Do the following:

### 1. Check Hostinger Node.js app logs

- In hPanel go to **Websites** → your site → **Node.js** → your app
- Open **Logs** or **Application logs**
- Look for errors during startup (e.g. missing `backend/dist/app.js`, `DATABASE_URL`, Prisma errors)
- Check for **`startup-debug.log`** in the app root or `backend/` folder (File Manager). It logs: dotenv status, bind host, listen success/error, and any uncaught errors

### 2. Verify Start command

Use one of these:

- **Start command:** `npm start`
- **Entry file:** `bootstrap.js` or `node backend/dist/app.js`

Root `package.json` has `"start": "cd backend && node dist/app.js"`. Ensure Hostinger uses this. The app binds to `0.0.0.0` when `NODE_ENV` is not `development`, so the reverse proxy can reach it even if `NODE_ENV` is unset.

### 3. Ensure build completes

The backend must be built before start. Build command:

```bash
npm install && cd backend && npm install && cd .. && npm run build
```

This produces `backend/dist/app.js`. If the build fails, that file will be missing and the app will not start.

### 4. Check environment variables

Add before deploy:

- `NODE_ENV` = `production`
- `DATABASE_URL` = your MySQL connection string
- `PORT` = leave empty (Hostinger sets it) or use the value Hostinger shows

Without `DATABASE_URL`, Prisma routes may fail; the app should still start. Check logs for DB errors.

### 5. Restart the app

After changing env vars or Build/Start commands:

- Click **Redeploy** or **Restart**
- Wait 1–2 minutes for the app to start

### 6. Test the health endpoint

After deploy, open:

```
https://datauniverse.in/health
```

or

```
https://datauniverse.in/api/health
```

If you see `{"status":"ok",...}`, the Node app is running. If you get 503 or 404, the app is still not reachable.

---

## Troubleshooting

| Problem | What to check |
|---------|----------------|
| **503** | Build logs (did `deploy:build` succeed?), app logs (did server start?), `PORT` matches Hostinger’s expectation |
| **Build fails** | Env vars set (especially `VITE_API_URL`), Node.js 18+ or 20, correct build command |
| **DB connection error** | `DATABASE_URL` (host, user, password, DB name) and MySQL user access |
| **Blank page** | `VITE_API_URL` set to `/api` so frontend calls the same origin |
| **Blank page + "MIME type text/plain"** | (1) Recreate the ZIP: `./create-deploy-zip.sh` – it now pre-builds and includes correct files + `.htaccess`. (2) In Hostinger hPanel → **Advanced** → **MIME Types**, add `application/javascript` for `.js` and `.mjs` if `.htaccess` doesn’t apply. (3) Ensure all traffic goes to the Node app (no separate static root). |
| **CORS errors** | `CORS_ORIGINS` includes your frontend URL (or `FRONTEND_URL`) |

---

## Checklist

- [ ] `datauniverse-lms-deploy.zip` created with `./create-deploy-zip.sh`
- [ ] MySQL database and user created on Hostinger
- [ ] Node.js app created and ZIP uploaded
- [ ] Application root = repo root (contains `package.json` and `backend/`)
- [ ] Build and start commands set as in Step 4
- [ ] All required env vars set (including `VITE_API_URL=/api`)
- [ ] Build completed successfully
- [ ] `prisma db push` and `prisma db seed` run once
- [ ] Site loads and login works

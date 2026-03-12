# Deploy DataUniverse LMS on Hostinger (datauniverse.in)

This guide is for deploying this project on Hostinger and connecting the domain **datauniverse.in** (registered on GoDaddy). It also covers **starting from a clean slate** after a failed attempt and working as a **collaborator** (hired person) on the Hostinger account.

---

## Important: Collaborator Limits

As a **collaborator** (not the account owner), you can:
- Create and manage **websites**, **databases**, and **Node.js apps**
- Edit files, change hosting settings, deploy code
- Use the domain **already added** to the account

You **cannot**:
- **Change the main domain** of a website
- Transfer or manage domain registration (that stays with the owner)
- Add payment methods or invite other users

So: **If datauniverse.in already exists on Hostinger**, do **not** try to “add” it again. Use the **existing** website that has this domain and deploy your app there. If the owner previously created a website for datauniverse.in and it gave 503, we will **replace the app** on that same website, not create a new domain entry.

---

## Part 1: Clean Slate (Remove Old Failed Setup)

Goal: Remove the old app/website that gave 503 so we can deploy the new one correctly. You have two paths.

### Option A: Reuse the Existing Website (Recommended)

If there is already a **website** in Hostinger for **datauniverse.in**:

1. Log in to **hPanel** (hostinger.com) with your collaborator email.
2. Go to **Websites** → select the website that uses **datauniverse.in**.
3. **Do not delete the website or domain.** We will only replace how it runs:
   - If it’s a **Node.js app**: delete or replace the **Node.js application** (see Part 2) and redeploy.
   - If it’s a **regular website**: you can add a **Node.js app** to this site (if your plan supports it) and point the domain to that app.

So “clean slate” here means: **remove the old Node.js app / wrong deployment**, not necessarily the whole website/domain.

### Option B: Owner Removes the Website (If You Need a Full Reset)

If the owner wants to completely remove the old site and domain from Hostinger:

1. **Only the account owner** can do this.
2. In hPanel: **Websites** → select the site → **Manage** → look for **Delete website** or **Remove domain** (wording may vary). Follow Hostinger’s steps to delete the website.
3. After that, the owner (or you, if allowed) can **add a new website** and attach **datauniverse.in** again when Hostinger allows it.

If you see **“domain already exists”** when trying to add datauniverse.in, it means the domain is still tied to an existing website. In that case use **Option A**: reuse that website and replace the app.

---

## Part 2: What You Need on Hostinger

- **Plan:** **Business Web Hosting** or **Cloud** (Startup or higher). Node.js apps are **not** available on the cheapest shared plans.
- **One Node.js app** that runs both:
  - **Backend:** Express API at `/api`
  - **Frontend:** React (Vite) build served from the same domain
- **MySQL database** (create in hPanel).
- **Domain:** datauniverse.in already connected to the website you’re using (from Part 1).

---

## Part 3: Domain and DNS (datauniverse.in on GoDaddy)

The “Welcome to datauniverse.in / This domain is registered, but may still be available” message usually means the domain is **not pointing to any hosting** yet (or DNS is still propagating).

To point **datauniverse.in** (GoDaddy) to Hostinger:

1. **Get Hostinger nameservers**  
   In hPanel: **Websites** → your site → **Domain** (or **Nameservers**). Note the nameservers (e.g. `ns1.dns-parking.com`, `ns2.dns-parking.com` — Hostinger’s exact values may differ).

2. **In GoDaddy (owner can do this, or you with their credentials)**  
   - Go to **Domain Control Center** → **datauniverse.in** → **Manage DNS** (or **Manage** → **Nameservers**).  
   - Change from “Default” or “GoDaddy” nameservers to **Custom** and paste the **Hostinger nameservers** from step 1.  
   - Save. DNS can take from a few minutes up to 24–48 hours to propagate.

3. **Do not** try to “add” datauniverse.in again in Hostinger if it says **“domain already exists”**. That means it’s already attached to a website; keep using that website.

---

## Part 4: Database (MySQL) on Hostinger

1. In hPanel go to **Databases** → **MySQL Databases**.
2. **Create a database** (e.g. `u123456789_datauniverse`).
3. **Create a user** with a strong password and **assign it to this database** (All privileges).
4. Note:
   - **Database name**
   - **Username**
   - **Password**
   - **Host** (often `localhost` or something like `mysqlXX.hostinger.com` – hPanel will show it).

**Connection string format:**

```text
mysql://USERNAME:PASSWORD@HOST/DATABASE_NAME
```

Example:

```text
mysql://u123_user:YourPassword@localhost/u123_datauniverse
```

Use this as `DATABASE_URL` in the Node.js app (Part 6).

---

## Part 5: Deploy the App (One Node.js App = API + Frontend)

This project is set up so **one** Node.js app serves both the React frontend and the Express API. That way you only create **one** Node.js app on Hostinger and use **one** domain (datauniverse.in).

### 5.1 Push Code to GitHub (Recommended for Hostinger)

1. Create a **new repository** on GitHub (e.g. `datauniverse-lms`).
2. Push this project (only the LMS-platform folder or the whole repo – keep the same structure as in this guide).
3. In Hostinger you will connect this repo and set **Build** and **Start** commands (below).

### 5.2 In Hostinger: Add or Use the Node.js App

1. **Websites** → open the **website** that uses **datauniverse.in** (from Part 1).
2. Find **Node.js** or **Node.js Apps** (under “Advanced” or similar).
3. Either:
   - **Create a new Node.js app** and attach it to this website/domain, or  
   - **Use the existing Node.js app** that was giving 503 and we will fix its settings.

### 5.3 Repository / Source

- **Connect GitHub:**  
  - **Import from Git** → authorize Hostinger with GitHub → select the repo and branch (e.g. `main`).
- **Application root:**  
  Set to the **root of the repo** (where `package.json` and `backend/` folder are). Do **not** set root to `backend` only, because the build must run from repo root.

### 5.4 Build and Start Commands

Use these **exactly** (adjust if your repo structure is different):

| Setting        | Value |
|----------------|--------|
| **Build command** | `npm install && cd backend && npm install && cd .. && npm run deploy:build` |
| **Start command** | `cd backend && npm start` |
| **Node.js version** | **20.x** (or 18.x if 20 is not available) |

What this does:

- **Build:** Installs root and backend deps, runs `deploy:build`: builds the React app, copies it into `backend/public`, runs Prisma generate and backend build.
- **Start:** Runs `node backend/dist/app.js`, which serves `/api` and the frontend from `backend/public`.

### 5.5 Environment Variables (Critical – Prevents 503)

In the Node.js app settings in hPanel, add **Environment variables** (name = value). Set these **before** the first deploy or redeploy:

**Backend (required):**

| Name | Example / description |
|------|------------------------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` (or the port Hostinger assigns – check their doc; sometimes they set PORT for you) |
| `DATABASE_URL` | `mysql://USER:PASSWORD@HOST/DATABASE` (from Part 4) |
| `JWT_SECRET` | Long random string (e.g. 32+ characters) |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | `https://datauniverse.in` |
| `CORS_ORIGINS` | `https://datauniverse.in` |

**Frontend (used at build time):**

| Name | Value |
|------|--------|
| `VITE_API_URL` | `/api` |

So the browser will call `https://datauniverse.in/api` (same origin). **Do not** set `VITE_API_URL` to `https://datauniverse.in/api` unless you want that explicitly; `/api` is enough.

**Optional but recommended later:**  
AWS keys (S3), Razorpay keys, SMTP (email) – see README / .env.example. You can add them in the same Environment variables section.

### 5.6 Why You Got 503 Before (And How to Avoid It Now)

503 usually means:

- The app **did not start** (wrong start command or missing `node` in path).
- **Build failed** (missing env vars, wrong Node version, or wrong build command).
- **Database not reachable** (wrong `DATABASE_URL` or MySQL not created).

So for this fresh deploy:

1. Use the **exact** build and start commands above.
2. Set **all** required env vars **before** building, especially `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, and `VITE_API_URL=/api`.
3. After the first build, check the **build logs** in hPanel. If the build fails, fix the error (often env or path) and redeploy.
4. After a successful build, check **application logs** (if available). If the app still doesn’t respond, the start command or PORT might be wrong – Hostinger sometimes injects `PORT`; if so, don’t override it unless their docs say so.

---

## Part 6: Run Migrations and Seed (First Time)

Hostinger may give you **SSH** or a **terminal** in hPanel. If you have it:

1. Go to the **application directory** (repo root).
2. Run:

```bash
cd backend
npx prisma db push
npx prisma db seed
```

If there is **no SSH**, check if Hostinger has a **“Run command”** or **post-build script** for the Node.js app. Some panels let you run `npx prisma db push` and `npx prisma db seed` once. Otherwise, you may need to run these **locally** against the **Hostinger MySQL** (if remote MySQL access is allowed and you have the host/user/password):

- In your local project: set `DATABASE_URL` in `backend/.env` to the Hostinger MySQL URL.
- Run `cd backend && npx prisma db push && npx prisma db seed`.

After that, the app should work with the seeded admin/student accounts (see README for test logins).

---

## Part 7: Checklist (Quick Reference)

- [ ] Plan is **Business** or **Cloud** (Node.js supported).
- [ ] Reused the **existing** website for datauniverse.in (or owner removed old site and you added a new one).
- [ ] **MySQL** database and user created; `DATABASE_URL` set in Node.js app env.
- [ ] **Build command** and **Start command** set exactly as in 5.4.
- [ ] **Node.js version** 20.x (or 18.x).
- [ ] Env vars set: `NODE_ENV=production`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, `CORS_ORIGINS`, `VITE_API_URL=/api`.
- [ ] **Prisma:** `db push` and `db seed` run once (via SSH or locally against Hostinger DB).
- [ ] **GoDaddy:** nameservers for datauniverse.in pointed to Hostinger (if domain wasn’t already working).
- [ ] After deploy, open `https://datauniverse.in` and `https://datauniverse.in/health` (or `/api` health) to confirm.

---

## If Something Still Fails

- **503:** Check build logs (did `deploy:build` succeed?) and app logs (did `npm start` start?). Check that `PORT` matches what Hostinger expects.
- **“Domain already exists”:** Use the existing website; don’t add the domain again.
- **Database connection error:** Double-check `DATABASE_URL` (user, password, host, database name) and that the MySQL user has access to the database.
- **Collaborator can’t change domain:** Owner must change nameservers in GoDaddy or change/remove domain in Hostinger; you then deploy the app on the existing site.

If you tell me the exact error (503, build log line, or “domain already exists” screen), I can narrow down the next step.

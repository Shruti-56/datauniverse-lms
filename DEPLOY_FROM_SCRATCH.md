# Deploy DataUniverse from Scratch (Step by Step)

Start from zero. Do these steps **in order**. We deploy the website on Hostinger first; the domain (datauniverse.in) comes after.

---

## What you need before starting

- Your Hostinger login (collaborator access is enough).
- The Hostinger plan must be **Business** or **Cloud** (so Node.js is available). If you’re on a cheaper plan, you’ll need to upgrade.
- This project on your computer (and pushed to **GitHub** — we’ll do that in the steps).

---

## STEP 1: Push the project to GitHub

1. Create a **new repository** on GitHub (e.g. name: `datauniverse-lms`).
2. On your computer, open terminal in the **LMS-platform** folder (the one that has `package.json` and a `backend` folder).
3. Run (replace with your repo URL):

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/datauniverse-lms.git
git push -u origin main
```

4. Confirm on GitHub that all files are there (including `backend` folder and root `package.json`).

---

## STEP 2: Create a website on Hostinger

1. Log in to **Hostinger** → open **hPanel**.
2. Click **Websites** (or **Hosting**).
3. Click **Create website** / **Add new website**.
4. When asked for a domain:
   - If you see an option like **“I’ll use a domain later”** or **“Skip / Add domain later”**, choose that. Hostinger will give you a temporary URL (e.g. `yoursite.hostingersite.com`). Use that to test; we’ll add datauniverse.in later.
   - If Hostinger **forces** you to enter a domain, enter **datauniverse.in** (if it’s already on the account it may say “already exists” — then just pick that existing site and continue).
5. Finish the wizard. You should now see **one website** in the list.

---

## STEP 3: Create a MySQL database on Hostinger

1. In hPanel, go to **Databases** → **MySQL Databases** (or **Create database**).
2. Create a **new database** (e.g. name: `datauniverse`).
3. Create a **new user** with a strong password.
4. **Assign the user to the database** with full privileges.
5. Note down somewhere safe:
   - Database name (e.g. `u123456789_datauniverse`)
   - Username (e.g. `u123456789_user`)
   - Password
   - Host (often `localhost` or something like `mysql123.hostinger.com` — the panel shows it).

Your connection string will look like:

```text
mysql://USERNAME:PASSWORD@HOST/DATABASE_NAME
```

Example: `mysql://u123_user:MyPass123@localhost/u123_datauniverse`

---

## STEP 4: Add a Node.js app to this website

1. In hPanel go to **Websites** → click the website you created (or the one you’re using).
2. Find a section like **Advanced** or **Node.js** or **Node.js Apps**.
3. Click **Create Node.js app** / **Add Node.js application** (wording may vary).
4. When asked for **source** or **how to deploy**:
   - Choose **Git** or **GitHub**.
   - Connect your GitHub account (authorize Hostinger).
   - Select the repo you pushed in Step 1 (e.g. `datauniverse-lms`).
   - Branch: **main** (or whatever you use).
5. Set the **application root** to the **root of the repo** (the folder that contains `package.json` and `backend`). Do **not** set it to `backend` only.
6. **Node.js version:** choose **20** (or 18 if 20 isn’t available).

---

## STEP 5: Set build and start commands

In the same Node.js app settings, set:

| Field | Value |
|-------|--------|
| **Build command** | `npm install && cd backend && npm install && cd .. && npm run deploy:build` |
| **Start command** | `cd backend && npm start` |

Save.

---

## STEP 6: Add environment variables

In the Node.js app, find **Environment variables** (or **Env** / **.env**) and add these **before** you run the first build:

| Name | Value |
|------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your full MySQL URL from Step 3 (e.g. `mysql://u123_user:MyPass123@localhost/u123_datauniverse`) |
| `JWT_SECRET` | Any long random string (e.g. 32+ characters) |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | For now use the temporary URL Hostinger gave you (e.g. `https://yoursite.hostingersite.com`) or `https://datauniverse.in` if you already use that |
| `CORS_ORIGINS` | Same as FRONTEND_URL (e.g. `https://yoursite.hostingersite.com` or `https://datauniverse.in`) |
| `VITE_API_URL` | `/api` |

If Hostinger shows a **PORT**, leave it or set it as they tell you. Don’t remove it.

Save the variables.

---

## STEP 7: Deploy (first build and start)

1. Click **Deploy** / **Build** / **Redeploy** for the Node.js app.
2. Wait for the build to finish. If it fails, open the **build log** and fix the error (often a wrong path or missing env var).
3. When the build succeeds, the app should **start** automatically. Check the **app log** or **status** to see if it’s running.

---

## STEP 8: Run database setup (one time)

You need to create tables and seed data. Either:

**A) If Hostinger gives you SSH or a terminal**

1. Open the terminal for your account / website.
2. Go to the app folder (repo root), then run:

```bash
cd backend
npx prisma db push
npx prisma db seed
```

**B) If there’s no terminal**

1. On your **local** computer, open the **LMS-platform** project.
2. Go to the `backend` folder and create or edit `.env` with **only** this line (use the same database as on Hostinger):

```text
DATABASE_URL="mysql://USER:PASSWORD@HOST/DATABASE"
```

Use the **same** USER, PASSWORD, HOST, DATABASE as in Step 3. (If Hostinger MySQL is only reachable from their servers, this might not work — then you need to ask Hostinger how to run commands, or use their “Run command” / post-deploy script if they have one.)

3. In terminal, from the **backend** folder, run:

```bash
npx prisma db push
npx prisma db seed
```

After this, the app will have tables and a default admin/student user (see README for logins).

---

## STEP 9: Open your site

1. Use the **temporary URL** Hostinger gave you (e.g. `https://yoursite.hostingersite.com`) or the main domain if you already attached it.
2. Open it in the browser. You should see the DataUniverse site (login page or home).
3. Try **Admin:** `admin@datauniverse.com` / `Admin123!` and **Student:** `student@datauniverse.com` / `Student123!` (if you ran the seed).

If you see 503 or a blank page, check the **app log** in Hostinger and that the **start command** and **env vars** are exactly as in Steps 5 and 6.

---

## STEP 10: Connect datauniverse.in (only after the site works)

Do this **only when** the site is working on the temporary URL.

1. In Hostinger: for this website, add or attach the domain **datauniverse.in** (if it says “already exists”, the domain is already there — just make sure this website is the one using it).
2. In **GoDaddy**: point the domain to Hostinger (either change nameservers to Hostinger’s or add an A record to Hostinger’s IP). Full steps are in **GODADDY_DNS_TO_HOSTINGER.md**.
3. After DNS updates (15 min to 48 hours), open **https://datauniverse.in** — it should show the same site.

---

## Quick checklist (in order)

- [ ] Step 1: Project pushed to GitHub  
- [ ] Step 2: One website created on Hostinger  
- [ ] Step 3: MySQL database and user created, URL noted  
- [ ] Step 4: Node.js app added, connected to GitHub, root = repo root  
- [ ] Step 5: Build command and start command set  
- [ ] Step 6: All env vars set (especially DATABASE_URL, JWT_SECRET, VITE_API_URL)  
- [ ] Step 7: First deploy run, build succeeds, app starts  
- [ ] Step 8: `prisma db push` and `prisma db seed` run once  
- [ ] Step 9: Site opens on the Hostinger URL and login works  
- [ ] Step 10: Domain datauniverse.in connected and DNS set in GoDaddy  

Start at Step 1 and go in order. If something fails, say which step and what you see (error message or screenshot), and we can fix that step only.

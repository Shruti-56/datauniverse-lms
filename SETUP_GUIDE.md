# DataUniverse LMS - Complete Setup Guide

This guide will help you set up the DataUniverse Learning Management System on a new machine from scratch.

---

## Prerequisites

Before starting, ensure you have the following installed:

| Software | Version | Download Link |
|----------|---------|---------------|
| Node.js | 18.x or higher | https://nodejs.org/ |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/ |
| Git | Latest | https://git-scm.com/ |
| VS Code (recommended) | Latest | https://code.visualstudio.com/ |

---

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone <your-repo-url> DataUniverse
cd DataUniverse/learnflow-demo
```

---

## Step 2: Set Up MySQL Database

### 2.1 Start MySQL Server
```bash
# macOS (if installed via Homebrew)
brew services start mysql

# Windows
# Start MySQL from Services or MySQL Workbench

# Linux
sudo systemctl start mysql
```

### 2.2 Create Database
```bash
# Login to MySQL
mysql -u root -p

# Create the database
CREATE DATABASE DataUniverse;

# Create a dedicated user (optional but recommended)
CREATE USER 'datauniverse_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON DataUniverse.* TO 'datauniverse_user'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

---

## Step 3: Backend Setup

### 3.1 Navigate to Backend
```bash
cd backend
```

### 3.2 Install Dependencies
```bash
npm install
```

### 3.3 Create Environment File
Create a `.env` file in the `backend` folder:

```bash
touch .env
```

Add the following content (replace with your values):

```env
# =========================
# Database
# =========================
DATABASE_URL="mysql://root:your_mysql_password@localhost:3306/DataUniverse"

# =========================
# JWT Authentication
# =========================
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_EXPIRES_IN=7d

# =========================
# Server
# =========================
PORT=3001
NODE_ENV=development

# =========================
# AWS S3 (for video storage)
# =========================
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your-bucket-name

# =========================
# Razorpay Payment Gateway
# =========================
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# =========================
# Email (SMTP - Gmail example)
# =========================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=DataUniverse <your_email@gmail.com>

# =========================
# Frontend URL
# =========================
FRONTEND_URL=http://localhost:8080
CORS_ORIGINS=http://localhost:8080,http://localhost:5173,http://localhost:3000
```

### 3.4 Prisma Setup (Database ORM)

Prisma is used to interact with the MySQL database. Follow these steps carefully:

#### Step 1: Generate Prisma Client
```bash
npx prisma generate
```
**What it does:** Creates TypeScript code that lets your app talk to the database.

**Expected output:**
```
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

#### Step 2: Push Schema to Database
```bash
npx prisma db push
```
**What it does:** Creates all tables in your MySQL database based on `prisma/schema.prisma`.

**Expected output:**
```
🚀 Your database is now in sync with your Prisma schema.
```

**⚠️ If you see errors:**
- Make sure MySQL is running
- Verify `DATABASE_URL` in `.env` is correct
- Make sure the database exists

#### Step 3: Seed the Database
```bash
npx prisma db seed
```
**What it does:** Populates database with initial data:
- Admin user: `admin@datauniverse.com` / `Admin123!`
- Student user: `student@datauniverse.com` / `Student123!`

**Expected output:**
```
🌱 Seeding complete!
```

### 3.5 Prisma Commands Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npx prisma generate` | Generate client code | After cloning, after schema changes |
| `npx prisma db push` | Sync schema to DB | First setup, schema changes (dev) |
| `npx prisma db seed` | Add initial data | First setup, after reset |
| `npx prisma studio` | Visual DB editor | View/edit data in browser |
| `npx prisma db push --force-reset` | Reset entire DB | Start fresh (⚠️ deletes all data) |
| `npx prisma migrate dev` | Create migration | Production-ready schema changes |

### 3.6 Verify Database Setup

Open Prisma Studio to verify tables were created:
```bash
npx prisma studio
```
Opens at `http://localhost:5555`. You should see tables like:
- User
- Profile
- Course
- Module
- Video
- Enrollment
- etc.

### 3.7 Troubleshooting Prisma

#### Error: "Can't reach database server"
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1"

# macOS
brew services start mysql

# Windows - Open Services, start MySQL

# Linux
sudo systemctl start mysql
```

#### Error: "Access denied for user"
Check your `DATABASE_URL` format:
```env
DATABASE_URL="mysql://USERNAME:PASSWORD@localhost:3306/DataUniverse"
```
- Replace `USERNAME` with your MySQL username (usually `root`)
- Replace `PASSWORD` with your MySQL password
- If password has special characters, URL-encode them

#### Error: "Unknown database 'DataUniverse'"
Create the database first:
```bash
mysql -u root -p -e "CREATE DATABASE DataUniverse;"
```

#### Error: "Prisma Client not generated"
Run generate before starting the server:
```bash
npx prisma generate
```

#### Error: "Migration failed" or schema sync issues
Reset and start fresh:
```bash
npx prisma db push --force-reset
npx prisma db seed
```
⚠️ This deletes all data!

### 3.8 Start Backend Server
```bash
npm run dev
```

You should see:
```
[INFO] ts-node-dev ver. 2.0.0
✅ Server running on http://localhost:3001
✅ Email service ready (if SMTP configured)
```

**If you see errors**, check:
1. MySQL is running
2. `.env` file exists with correct values
3. Prisma client was generated (`npx prisma generate`)
4. Database tables exist (`npx prisma db push`)

---

## Step 4: Frontend Setup

### 4.1 Open New Terminal & Navigate to Frontend
```bash
cd /path/to/DataUniverse/learnflow-demo
```

### 4.2 Install Dependencies
```bash
npm install
```

### 4.3 Create Environment File
Create a `.env` file in the `learnflow-demo` root folder:

```bash
touch .env
```

Add:
```env
VITE_API_URL=http://localhost:3001/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

### 4.4 Start Frontend
```bash
npm run dev
```

Frontend will run on: `http://localhost:8080`

---

## Step 5: Verify Installation

### 5.1 Test Login
Open browser and go to: `http://localhost:8080`

**Default Admin Credentials:**
- Email: `admin@datauniverse.com`
- Password: `Admin123!`

**Default Student Credentials:**
- Email: `student@datauniverse.com`
- Password: `Student123!`

### 5.2 Check All Features
- [ ] Login/Logout works
- [ ] Course marketplace loads
- [ ] Admin can create courses
- [ ] Video upload works (requires AWS S3)
- [ ] Payment works (requires Razorpay)
- [ ] Emails send (requires SMTP)

---

## Step 6: Third-Party Account Setup

### 6.1 AWS S3 Setup (for video storage)

1. **Create AWS Account**: https://aws.amazon.com/
2. **Create S3 Bucket**:
   - Go to S3 Console
   - Create bucket (e.g., `datauniverse-videos`)
   - Region: Choose nearest (e.g., `ap-south-1` for India)
   - Uncheck "Block all public access" (we use signed URLs)

3. **Create IAM User**:
   - Go to IAM Console
   - Create user with programmatic access
   - Attach policy: `AmazonS3FullAccess`
   - Save Access Key ID and Secret

4. **Update CORS on Bucket**:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["http://localhost:8080", "https://yourdomain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

### 6.2 Razorpay Setup (for payments)

1. **Create Account**: https://dashboard.razorpay.com/signup
2. **Get Test Keys**:
   - Go to Settings → API Keys
   - Generate Test Keys
   - Copy Key ID and Key Secret

3. **For Production**:
   - Complete KYC verification
   - Activate live mode
   - Generate Live Keys

### 6.3 Gmail SMTP Setup (for emails)

1. **Enable 2-Factor Authentication** on your Gmail
2. **Generate App Password**:
   - Go to Google Account → Security
   - Under "2-Step Verification", click "App passwords"
   - Generate password for "Mail"
   - Use this as `SMTP_PASS`

---

## Step 7: Database Management

### View Database (Optional - Prisma Studio)
```bash
cd backend
npx prisma studio
```
Opens at: `http://localhost:5555`

### Reset Database
```bash
cd backend
npx prisma db push --force-reset
npx prisma db seed
```

### Create Migration (for schema changes)
```bash
npx prisma migrate dev --name your_migration_name
```

---

## Step 8: Project Structure

```
DataUniverse/
└── learnflow-demo/
    ├── backend/                 # Express + Prisma backend
    │   ├── prisma/
    │   │   ├── schema.prisma   # Database schema
    │   │   └── seed.ts         # Seed data
    │   ├── src/
    │   │   ├── controllers/    # API logic
    │   │   ├── routes/         # API routes
    │   │   ├── middleware/     # Auth, etc.
    │   │   └── services/       # S3, Email services
    │   └── .env                # Backend environment
    │
    ├── src/                    # React frontend
    │   ├── components/         # Reusable components
    │   ├── pages/              # Page components
    │   │   ├── admin/          # Admin pages
    │   │   ├── student/        # Student pages
    │   │   └── instructor/     # Instructor pages
    │   ├── contexts/           # React contexts
    │   ├── hooks/              # Custom hooks
    │   └── lib/                # Utilities, API
    │
    └── .env                    # Frontend environment
```

---

## Step 9: Common Issues & Solutions

### Issue: "Cannot connect to database"
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1"

# Verify DATABASE_URL in .env
```

### Issue: "CORS error"
- Ensure `CORS_ORIGINS` in backend `.env` includes your frontend URL
- Restart backend after changes

### Issue: "JWT error"
- Ensure `JWT_SECRET` is set and at least 32 characters
- Clear localStorage in browser and re-login

### Issue: "S3 upload fails"
- Verify AWS credentials
- Check bucket CORS settings
- Ensure IAM user has S3 permissions

### Issue: "Emails not sending"
- Verify SMTP credentials
- For Gmail, use App Password (not regular password)
- Check spam folder

### Issue: "Payment fails"
- Verify Razorpay keys match (test vs live)
- Check browser console for errors
- Ensure `VITE_RAZORPAY_KEY_ID` in frontend matches backend

---

## Step 10: Production Deployment Checklist

Before deploying to production:

- [ ] Change `NODE_ENV` to `production`
- [ ] Use strong `JWT_SECRET` (generate with `openssl rand -base64 64`)
- [ ] Switch to Razorpay Live keys
- [ ] Use production database (not localhost)
- [ ] Enable HTTPS
- [ ] Set proper CORS origins
- [ ] Remove seed data / change default passwords
- [ ] Set up database backups
- [ ] Configure proper logging
- [ ] Set up monitoring (e.g., PM2, health checks)

---

## Quick Commands Reference

```bash
# Backend
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npx prisma studio    # Open database GUI
npx prisma db push   # Sync schema to DB
npx prisma db seed   # Seed database

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## Support

For issues:
1. Check console logs (browser + terminal)
2. Verify all environment variables
3. Ensure all services are running (MySQL, backend, frontend)
4. Check database has been seeded

---

**Happy Learning with DataUniverse! 🎓**

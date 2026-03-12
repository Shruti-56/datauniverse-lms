# DataUniverse - E-Learning Platform

A full-featured Learning Management System (LMS) built with React, TypeScript, Node.js, Express, and MySQL.

![DataUniverse](https://img.shields.io/badge/DataUniverse-LMS-6366f1?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8-4479a1?style=flat-square&logo=mysql)

---

## ✨ Features

### 👨‍🎓 Student Features
- ✅ User registration and login
- ✅ Browse course marketplace
- ✅ Razorpay payment integration (INR)
- ✅ Sequential video playback (complete one to unlock next)
- ✅ Track learning progress
- ✅ Submit assignments after each lecture
- ✅ Submit projects after each module
- ✅ View submission feedback & grades
- ✅ Email notifications (welcome, enrollment, completion)
- ✅ Password reset via email
- ✅ Payment history

### 👨‍💼 Admin Features
- ✅ Dashboard with real-time statistics
- ✅ Course management (CRUD)
- ✅ Module & video management
- ✅ AWS S3 video upload
- ✅ Assignment & project creation
- ✅ Instructor management
- ✅ Student management (view, block/unblock)
- ✅ Student progress tracking
- ✅ Screen time analytics
- ✅ Revenue analytics

### 👨‍🏫 Instructor Features
- ✅ Review student submissions
- ✅ Grade assignments & projects
- ✅ Provide feedback
- ✅ Email notifications on new submissions

### 🔒 Security Features
- ✅ JWT authentication
- ✅ Video content protection (no download/right-click)
- ✅ Screen recording detection
- ✅ User email watermark on videos
- ✅ Signed S3 URLs with expiry

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | MySQL 8 with Prisma ORM |
| Auth | JWT with bcrypt |
| Storage | AWS S3 (videos) |
| Payments | Razorpay |
| Email | Nodemailer (SMTP) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- AWS Account (for video storage)
- Razorpay Account (for payments)
- Gmail Account (for emails)

### Option 1: Automated Setup

```bash
# macOS/Linux
./setup.sh

# Windows
setup.bat
```

### Option 2: Manual Setup

#### 1. Clone & Install

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install
```

#### 2. Configure Environment

Copy example files:
```bash
cp backend/.env.example backend/.env
cp .env.example .env
```

Edit `backend/.env` with your credentials.

#### 3. Setup Database

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE DataUniverse;"

# Push schema
cd backend
npx prisma db push

# Seed initial data
npx prisma db seed
```

#### 4. Start Servers

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
npm run dev
```

#### 5. Access Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000

---

## 🔑 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@datauniverse.com` | `Admin123!` |
| Student | `student@datauniverse.com` | `Student123!` |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Complete setup instructions |
| [DEPLOY.md](./DEPLOY.md) | Production deployment guide |
| [DEPLOY_ZIP_HOSTINGER.md](./DEPLOY_ZIP_HOSTINGER.md) | Deploy via ZIP to Hostinger |

---

## 📁 Project Structure

```
learnflow-demo/
├── src/                      # React frontend
│   ├── components/           # Reusable UI components
│   ├── contexts/             # Auth context
│   ├── hooks/                # Custom hooks (Razorpay, etc.)
│   ├── lib/                  # API client, utilities
│   └── pages/
│       ├── admin/            # Admin pages
│       ├── student/          # Student pages
│       └── instructor/       # Instructor pages
│
├── backend/
│   ├── src/
│   │   ├── controllers/      # API logic
│   │   ├── middleware/       # Auth, roles
│   │   ├── routes/           # API routes
│   │   └── services/         # S3, Email services
│   └── prisma/
│       ├── schema.prisma     # Database schema
│       └── seed.ts           # Seed data
│
├── .env.example              # Frontend env template
├── setup.sh                  # Setup script (macOS/Linux)
├── setup.bat                 # Setup script (Windows)
└── SETUP_GUIDE.md            # Detailed setup guide
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List courses |
| GET | `/api/courses/:id` | Course details |
| GET | `/api/courses/:id/content` | Course content (enrolled) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment |
| GET | `/api/payments/history` | Payment history |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/submissions/assignment/:id` | Submit assignment |
| POST | `/api/submissions/project/:id` | Submit project |
| GET | `/api/submissions/my` | My submissions |
| GET | `/api/submissions/review` | Submissions to review (instructor) |
| PUT | `/api/submissions/:id/review` | Grade submission |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/students` | All students |
| GET | `/api/admin/students/:id` | Student details + progress |
| GET | `/api/admin/screentime` | Screen time analytics |
| GET | `/api/admin/instructors` | All instructors |
| POST | `/api/admin/instructors` | Create instructor |
| POST | `/api/admin/assignments` | Create assignment |
| POST | `/api/admin/projects` | Create project |

---

## 💳 Payment Flow

1. Student clicks "Buy Now" on a course
2. Backend creates Razorpay order
3. Razorpay checkout popup opens
4. Student completes payment
5. Backend verifies payment signature
6. Enrollment is created
7. Confirmation emails sent

**Test Cards (Razorpay Test Mode):**
- Success: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

---

## 🎥 Video Upload Flow

1. Admin creates course/module/video structure
2. Clicks "Upload Video" on a video entry
3. Selects file → Gets presigned S3 URL
4. File uploads directly to S3
5. S3 key stored in database
6. Students get time-limited signed URLs for playback

---

## 📧 Email Templates

- Welcome email (on registration)
- Password reset link
- Enrollment confirmation
- Course completion (congratulations email)
- Payment receipt
- Submission review notification

---

## 🔧 Common Commands

```bash
# Backend
cd backend
npm run dev              # Start dev server
npx prisma studio        # Open DB GUI
npx prisma db push       # Sync schema
npx prisma db seed       # Seed data

# Frontend
npm run dev              # Start dev server
npm run build            # Production build
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection failed | Check MySQL is running & credentials correct |
| CORS errors | Verify `CORS_ORIGINS` in backend `.env` |
| Video upload fails | Check AWS credentials & bucket CORS |
| Payment fails | Verify Razorpay keys (test vs live) |
| Emails not sending | Check SMTP credentials, use App Password for Gmail |

---

## 📝 License

MIT License - feel free to use for personal or commercial projects.

---


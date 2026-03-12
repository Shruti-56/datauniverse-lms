# DataUniverse – Complete Project Features

This document lists **all features** of the DataUniverse e-learning platform (LMS) as implemented across the codebase.

---

## Project Overview

**DataUniverse** is a full-featured Learning Management System (LMS) built with:

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Query
- **Backend:** Node.js, Express, TypeScript
- **Database:** MySQL 8 with Prisma ORM
- **Auth:** JWT with bcrypt
- **Storage:** AWS S3 (videos, PDFs)
- **Payments:** Razorpay (INR)
- **Email:** Nodemailer (SMTP)

---

## 1. Authentication & User Management

| Feature | Description |
|--------|-------------|
| **User registration** | Students register with email and password; profile (full name, etc.) created |
| **Login** | JWT-based login; role-based redirect (student / instructor / admin) |
| **Get current user** | `/api/auth/me` returns profile and role |
| **Forgot password** | Request password reset; email with reset link |
| **Reset password** | Reset password using token from email |
| **Change password** | Authenticated users can change password (user routes) |
| **Role-based access** | Three roles: **STUDENT**, **INSTRUCTOR**, **ADMIN**; routes and UI guarded by role |
| **Profile** | User profile (full name, avatar, bio, phone); student/instructor/admin profile pages |
| **Block / unblock students** | Admin can block/unblock students via profile `isBlocked` |

---

## 2. Student Features

### 2.1 Course Discovery & Enrollment

| Feature | Description |
|--------|-------------|
| **Course marketplace** | Browse all visible courses (category, level, price, thumbnail) |
| **Course detail** | View course description, modules, videos, assignments, projects, price |
| **Purchase with Razorpay** | Create order → Razorpay checkout → verify payment → create enrollment + purchase record |
| **Payment history** | View list of past payments (course, amount, date, status) |
| **Admin-granted enrollment** | Admin can enroll a student in a course for free (no payment) |
| **Enrollment source** | Tracks PURCHASE, FREE, or ADMIN_GRANTED |

### 2.2 Learning Experience

| Feature | Description |
|--------|-------------|
| **My courses** | List of enrolled courses with progress |
| **Course content** | Modules, videos (with optional legacy module grouping) |
| **Sequential video unlock** | Complete one video to unlock the next |
| **Video progress** | Mark video complete; track watch time and last watched |
| **Secure video player** | No right-click/download; screen recording detection; institute name watermark; signed S3 URLs with expiry |
| **Overall progress** | Progress per course and overall (e.g. % completed) |
| **Assignments** | Submit assignment after each lecture (text or file upload to S3) |
| **Projects** | Submit project after each module |
| **My submissions** | View own assignment/project submissions, status, score, feedback |

### 2.3 Live Lectures

| Feature | Description |
|--------|-------------|
| **Live lectures list** | See batches and scheduled live lectures (student is in a batch) |
| **Join live lecture** | Open meeting link (Zoom/Google Meet); view recording after lecture |
| **Attendance** | Admin/instructor marks attendance; student can see attendance status |

### 2.4 Mock Interviews

| Feature | Description |
|--------|-------------|
| **My interviews** | List of scheduled interviews (time, meeting link, status) |
| **Interview status** | SCHEDULED, COMPLETED, CANCELLED, MISSED |
| **Join interview** | Use meeting link at scheduled time |
| **View feedback** | After instructor submits, view ratings (communication, theory, practical, coding, problem solving, overall) and comments |
| **Email notifications** | Scheduled, reminder (e.g. 10 min before), feedback available, cancelled |

### 2.5 Fees (Cash-Only)

| Feature | Description |
|--------|-------------|
| **My fees** | Student sees total fees set by admin and list of cash payments recorded |
| **Fees payments** | Admin records cash payments (no gateway); student sees history |

### 2.6 Other Student Features

| Feature | Description |
|--------|-------------|
| **Alumni videos** | Watch alumni testimonial/feedback videos (title, description, video, name, role, company, rating) |
| **Policies** | View Privacy Policy, Refund Policy, Terms & Conditions (PDFs from S3) |
| **Notices** | Dashboard notices from admin (title, body); dismiss or remind later |
| **Screen time** | Automatic tracking of time spent in app (ping-based); visible in admin analytics |
| **Student dashboard** | Overview: enrolled courses, progress, promo banners carousel, notices, quick links |
| **Promo banners** | Carousel of admin-managed banners (new course launch, offers); click goes to CTA link |
| **Email notifications** | Welcome, enrollment, course completion, payment receipt, submission reviewed, interview-related |

---

## 3. Instructor Features

| Feature | Description |
|--------|-------------|
| **Assigned students** | View list of students assigned by admin (student–instructor mapping) |
| **Submissions to review** | List of assignment/project submissions from assigned students |
| **Grade submissions** | Score and feedback for assignments and projects; status PENDING → UNDER_REVIEW / APPROVED / REJECTED / RESUBMIT |
| **Email on new submission** | Notified when a student submits |
| **Interviews** | List of scheduled interviews (student, time, meeting link) |
| **Mark attendance** | Mark whether student attended the interview |
| **Submit interview feedback** | Rate communication, theory, practical, coding, problem solving, overall; add strengths, areas for improvement, comments |
| **Upload interview recording** | Upload recording to S3; link stored with interview |
| **Cancel interview** | Cancel scheduled interview; student notified by email |

---

## 4. Admin Features

### 4.1 Dashboard & Analytics

| Feature | Description |
|--------|-------------|
| **Admin dashboard** | Real-time stats: total students, courses, enrollments, revenue (from Razorpay), etc. |
| **Analytics** | Revenue analytics, enrollment trends, platform usage |
| **Screen time analytics** | Per-student, per-day screen time (total seconds) |
| **Student progress** | View any student’s course progress, video completion, submissions |

### 4.2 Course & Content Management

| Feature | Description |
|--------|-------------|
| **Course CRUD** | Create, read, update courses (title, description, category, level, price, thumbnail, visibility, duration) |
| **Course categories** | DATA_ANALYTICS, DATA_ENGINEERING, DATA_SCIENCE |
| **Course levels** | BEGINNER, INTERMEDIATE, ADVANCED |
| **Module management** | Add/edit/delete modules within a course (title, description, sort order) |
| **Video management** | Add/edit/delete videos (title, description, duration, sort order); optional module |
| **AWS S3 video upload** | Presigned URL for direct upload; store S3 key; students get signed playback URLs |
| **Assignment creation** | Create assignments linked to a video (title, description, instructions, max score, due days, required) |
| **Project creation** | Create project per module (title, description, instructions, max score, due days, required) |

### 4.3 User Management

| Feature | Description |
|--------|-------------|
| **Student management** | List all students; view profile, enrollments, progress; block/unblock |
| **Instructor management** | List instructors; create instructor (register); assign/remove instructors to/from students |
| **Student–instructor assignment** | Many-to-many: a student can have multiple instructors; submissions go to assigned instructor(s) |
| **Grant course access** | Enroll a student in a course for free (admin-granted enrollment) |

### 4.4 Live Lectures (Admin)

| Feature | Description |
|--------|-------------|
| **Live lecture batches** | Create batches (e.g. REGULAR); assign students to batches |
| **Live lecture modules** | Per-batch modules (e.g. MySQL, Python) with instructor, date range, lecture time, meeting link |
| **Schedule live lectures** | Create live lecture slots (batch, instructor, title, meeting link, time, duration) |
| **Recordings** | Store recording URL (S3) for a lecture; students in batch can watch later |
| **Attendance** | Mark attendance for students per lecture |

### 4.5 Fees (Admin)

| Feature | Description |
|--------|-------------|
| **Set student fees** | Set total fees amount per student (cash-only model) |
| **Record fee payments** | Record cash payments (amount, optional note); no payment gateway |

### 4.6 Alumni & Policies

| Feature | Description |
|--------|-------------|
| **Alumni videos** | CRUD for alumni testimonial videos; S3 upload; title, description, student name, role, company, rating, visibility, order |
| **Policy documents** | Upload and manage PDFs for PRIVACY, REFUND, TERMS; S3; version and active flag |
| **Policy upload** | Presigned URL for PDF upload to S3 |

### 4.7 Interviews (Admin)

| Feature | Description |
|--------|-------------|
| **Schedule interview** | Pick student, instructor, date/time, duration, meeting link |
| **View/cancel interviews** | List all interviews; cancel if needed |
| **Reminders** | Backend can send reminder emails (e.g. 10 min before) |

### 4.8 Promo Banners

| Feature | Description |
|--------|-------------|
| **Manage banners** | Admin CRUD for promo banner slides (title, subtitle, badge, CTA text/link, gradient style, sort order, active) |
| **Student carousel** | Students see active banners on dashboard as a carousel; click goes to CTA link (e.g. marketplace) |
| **Public API** | GET `/api/promo-banners` returns active banners (no auth); admin uses `/api/admin/promo-banners` for CRUD |

### 4.9 Notices

| Feature | Description |
|--------|-------------|
| **Create notices** | Create notice (title, body); optional target student or “all”; optional expiry |
| **Student view** | Students see notices on dashboard; can dismiss or “remind later” (ack stored) |

### 4.10 Admin Profile

| Feature | Description |
|--------|-------------|
| **Admin profile** | View/edit admin profile (same profile model as other users) |

---

## 5. Security & Protection

| Feature | Description |
|--------|-------------|
| **JWT authentication** | Access and refresh (if implemented) tokens; sent in `Authorization` header |
| **Role guard** | Middleware and frontend routes restrict by STUDENT / INSTRUCTOR / ADMIN |
| **Video protection** | No download/right-click; institute name watermark on video |
| **Screen recording detection** | Attempts to detect/prevent screen capture (e.g. visibility, keyboard shortcuts) |
| **Signed S3 URLs** | Time-limited signed URLs for video and policy PDFs; no public direct access |
| **Password hashing** | bcrypt for passwords |
| **Input validation** | express-validator on backend; Zod on frontend where used |

---

## 6. Email & Notifications

| Flow | When |
|------|------|
| Welcome | On registration |
| Password reset | Link in email for reset |
| Enrollment confirmation | After payment or admin-granted enrollment |
| Course completion | When student completes course |
| Payment receipt | After successful Razorpay payment |
| Submission reviewed | When instructor grades assignment/project |
| Interview scheduled | When admin schedules interview |
| Interview reminder | e.g. 10 min before (if job/cron set up) |
| Interview feedback available | When instructor submits feedback |
| Interview cancelled | When interview is cancelled |

---

## 7. API Surface (Summary)

- **Auth:** register, login, me, forgot-password, reset-password, change password
- **Courses:** list, get by id, get content (enrolled)
- **Enrollments:** my enrollments, create (payment flow), admin grant
- **Progress:** course progress, mark video complete, overall progress
- **Payments:** create order, verify, history
- **Assignments / Projects:** get by course; create (admin)
- **Submissions:** submit (assignment/project), my submissions, review list (instructor), grade (instructor)
- **Student–instructors:** assign/remove (admin), get instructors for student, get students for instructor
- **Admin:** dashboard, students, courses, modules, videos, assignments, projects, instructors, screentime, analytics, alumni, policies, interviews, live lectures, notices, fees
- **Alumni:** list (public), CRUD + upload (admin)
- **Policies:** list, get by type (public); create/upload (admin)
- **Interviews:** CRUD, attendance, feedback, recording upload, cancel
- **Live lectures:** batches, modules, lectures, attendance, recordings
- **Fees:** student fees summary + payments (student); set fees, record payment (admin)
- **Notices:** create (admin); list, acknowledge (student)

---

## 8. Frontend Pages (by Role)

### Student

- Dashboard, Marketplace, My Learning, Course detail (with player and submissions)
- Live Lectures, Join live lecture
- Submissions, Interviews, Alumni, Policies, Profile
- (Payment history and My fees pages exist; can be linked from dashboard or nav if needed)

### Instructor

- Submissions (review and grade), Interviews (list, attendance, feedback, recording)

### Admin

- Dashboard, Courses, Course edit, Video upload
- Students, Analytics, Screen time, Instructors
- Alumni, Policies, Interviews, Live lectures, Notices, Fees, Profile

### Shared

- Login, Register, Forgot password, Reset password, 404

---

## 9. Database Entities (Prisma)

- **User**, **Profile**
- **Course**, **Module**, **Video**
- **Enrollment**, **Purchase**, **VideoProgress**
- **ScreenTime**, **PasswordReset**
- **Assignment**, **Project**, **Submission**
- **StudentInstructor**
- **AlumniVideo**, **PolicyDocument**
- **Interview**, **InterviewFeedback**
- **LiveLectureBatch**, **LiveLectureBatchStudent**, **LiveLectureModule**, **LiveLecture**, **LiveLectureAttendance**
- **StudentFees**, **FeesPayment**
- **StudentNotice**, **StudentNoticeAck**
- **PromoBanner**

---

This file is the single source of truth for **all features** of the DataUniverse project as implemented in the repo.

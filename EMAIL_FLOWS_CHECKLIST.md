# Email Flows Checklist

All emails require SMTP to be configured in `backend/.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`. Optionally: `SMTP_FROM`, `SMTP_SECURE`, `FRONTEND_URL`, `INSTITUTE_NAME`.

---

## 1. Student registration

| Trigger | Recipient | Email | Status |
|--------|-----------|--------|--------|
| Public sign-up (`POST /api/auth/register`) | Student | Welcome email with login link | ✅ `auth.controller.ts` → `sendWelcomeEmail` |
| Admin creates student (`POST /api/admin/students`) | Student | Welcome email with login link | ✅ `admin.controller.ts` → `sendWelcomeEmail` |

---

## 2. Course purchase

| Trigger | Recipient | Email | Status |
|--------|-----------|--------|--------|
| Payment verified (`POST /api/payments/verify`) | Student | Payment receipt + enrollment confirmation | ✅ `payment.controller.ts` → `sendPaymentReceiptEmail` + `sendEnrollmentEmail` |

(Free enrollment via `POST /api/enrollments` or admin also sends enrollment email via `enrollment.controller.ts`.)

---

## 3. Added to regular (live lecture) batch

| Trigger | Recipient | Email | Status |
|--------|-----------|--------|--------|
| Admin adds student to batch (`POST /api/admin/live-lecture-batches/:batchId/students/:studentId`) | Student | “Added to batch” with batch name and link to Live Lectures | ✅ `live-lecture.controller.ts` → `sendAddedToBatchEmail` |

---

## 4. Live lecture – 10 minutes before

| Trigger | Recipient | Email | Status |
|--------|-----------|--------|--------|
| Cron every 1 min (`runModuleReminders`) | Each student in that batch | “Live in 10 min” with **direct meeting link** (Teams/Meet only; opens in new tab; no localhost) | ✅ `live-lecture.controller.ts` → `sendLiveLectureModuleReminderEmail` |

The email contains only the direct Teams/Meet URL (opens in new tab). Platform join URL is not in the email; still available from the app for marking attendance.

---

## 5. Live lecture – recording available

| Trigger | Recipient | Email | Status |
|--------|-----------|--------|--------|
| Admin uploads recording for a lecture | All students in that batch | “Recording available” with watch link | ✅ `live-lecture.controller.ts` → `sendLiveLectureRecordingEmail` |

---

## 6. Assignment submission & review

| Trigger | Recipient | Email | Status |
|--------|-----------|--------|--------|
| Student submits assignment | Assigned instructor | “Student X submitted [assignment] – review” with link to `/instructor/submissions?submissionId=...` | ✅ `submission.controller.ts` → `notifyInstructor` |
| Instructor reviews submission | Student | “Your submission for [title] has been reviewed” (status, score, feedback) | ✅ `submission.controller.ts` → `notifyStudentReview` |

**Note:** Instructor only gets submission emails if the student has an assigned instructor (Admin → Students → assign instructor).

---

## 7. Mock interview

| Trigger | Recipient | Email | Status |
|--------|-----------|--------|--------|
| Admin schedules interview | Student | “Mock interview scheduled” (time, instructor, duration, meeting link) | ✅ `interview.controller.ts` → `sendInterviewScheduledEmail` (student) |
| Admin schedules interview | Instructor | “Mock interview scheduled” (time, student, duration, meeting link) | ✅ `interview.controller.ts` → `sendInterviewScheduledEmail` (instructor) |
| 10 minutes before interview | Student | “Your mock interview starts in 10 minutes!” | ✅ `scheduleReminderEmail` → `sendReminderEmail` (student) |
| 10 minutes before interview | Instructor | “Your mock interview with a student starts in 10 minutes!” | ✅ `scheduleReminderEmail` → `sendReminderEmail` (instructor) |
| Interview cancelled | Student | “Your mock interview has been cancelled” | ✅ `sendCancellationEmail` (student) |

---

## 8. Other emails

| Trigger | Recipient | Email | Status |
|--------|-----------|--------|--------|
| Forgot password | User | Password reset link (1 hour expiry) | ✅ `auth.controller.ts` → `sendPasswordResetEmail` |
| Course completed | Student | Congratulations email | ✅ `progress.controller.ts` → `sendCourseCompletionEmail` |

---

## Quick verification

- **Registration:** Register a student (public or admin) → student gets welcome email.
- **Purchase:** Complete a payment → student gets receipt + enrollment email.
- **Batch:** Add student to a live-lecture batch → student gets “added to batch” email.
- **Live lecture:** Wait for cron (or set a lecture 10+ min ahead) → students get “Live in 10 min” with direct meeting link (Teams/Meet); after upload recording → students get “Recording available”.
- **Assignment:** Student submits → instructor gets “submission to review”; instructor reviews → student gets “submission reviewed”.
- **Mock interview:** Schedule interview → student and instructor get “scheduled”; 10 min before → both get reminder; cancel → student gets cancellation.

If emails don’t send, check: `SMTP_*` in `.env`, backend logs for “Email NOT sent” / “Failed to send email”, and (for submission) that the student has an assigned instructor.

import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { assignmentController } from '../controllers/assignment.controller';
import { projectController } from '../controllers/project.controller';
import { enrollmentController } from '../controllers/enrollment.controller';
import { studentInstructorController } from '../controllers/student-instructor.controller';
import { alumniController } from '../controllers/alumni.controller';
import { policyController } from '../controllers/policy.controller';
import { interviewController } from '../controllers/interview.controller';
import { liveLectureController } from '../controllers/live-lecture.controller';
import { feesController } from '../controllers/fees.controller';
import { noticeController } from '../controllers/notice.controller';
import { promoBannerController } from '../controllers/promoBanner.controller';
import { certificateController } from '../controllers/certificate.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleGuard';

const router = Router();
const adminController = new AdminController();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Course management
router.get('/courses', adminController.getAllCourses);
router.get('/courses/:id', adminController.getCourseDetails);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);
router.patch('/courses/:id/visibility', adminController.toggleCourseVisibility);

// Module management
router.post('/courses/:courseId/modules', adminController.createModule);
router.put('/modules/:id', adminController.updateModule);
router.delete('/modules/:id', adminController.deleteModule);

// Video management (videos directly on course)
router.post('/courses/:courseId/videos', adminController.createVideoUnderCourse);
router.get('/videos/:id', adminController.getVideoDetails);
router.put('/videos/:id', adminController.updateVideo);
router.delete('/videos/:id', adminController.deleteVideo);

// Video upload (S3)
router.post('/videos/:id/upload-url', adminController.getVideoUploadUrl);
router.put('/videos/:id/confirm-upload', adminController.confirmVideoUpload);

// Student management
router.get('/students', adminController.getAllStudents);
router.get('/students/export', adminController.getStudentsExport);
router.post('/students', adminController.createStudent);
router.get('/students/:id', adminController.getStudentDetails);
router.patch('/students/:id/block', adminController.toggleStudentBlock);

// Analytics
router.get('/analytics', adminController.getAnalytics);
router.get('/analytics/courses/:courseId', adminController.getCourseAnalytics);

// Screen time
router.get('/screentime', adminController.getAllScreenTime);
router.get('/screentime/export', adminController.exportScreenTime);
router.get('/screentime/:userId', adminController.getStudentScreenTime);

// Assignment management
router.post('/assignments', assignmentController.createAssignment);
router.put('/assignments/:id', assignmentController.updateAssignment);
router.delete('/assignments/:id', assignmentController.deleteAssignment);

// Project management
router.post('/projects', projectController.createProject);
router.put('/projects/:id', projectController.updateProject);
router.delete('/projects/:id', projectController.deleteProject);

// Instructor management
router.get('/instructors', adminController.getAllInstructors);
router.post('/instructors', adminController.createInstructor);

// Student-Instructor assignment
router.post('/students/:studentId/instructor', studentInstructorController.assignInstructor);
router.delete('/students/:studentId/instructor/:instructorId', studentInstructorController.removeInstructor);

// Enrollment management
router.post('/enrollments', enrollmentController.grantEnrollment);

// Alumni videos
router.get('/alumni/videos', alumniController.getAllAlumniVideos);
router.post('/alumni/videos', alumniController.createAlumniVideo);
router.put('/alumni/videos/:id', alumniController.updateAlumniVideo);
router.delete('/alumni/videos/:id', alumniController.deleteAlumniVideo);
router.post('/alumni/videos/upload-url', alumniController.getUploadUrl);

// Policy documents
router.get('/policies', policyController.getPolicies);
router.post('/policies', policyController.createPolicy);
router.post('/policies/upload-url', policyController.getUploadUrl);

// Mock interviews
router.get('/interviews/export', adminController.exportInterviews);
router.post('/interviews', interviewController.scheduleInterview);

// Student feedback (admin view)
router.get('/feedback', adminController.getAllStudentFeedback);

// Certificates (approve/reject)
router.get('/certificates', certificateController.listForAdmin);
router.post('/certificates/:id/approve', certificateController.approve);
router.post('/certificates/:id/reject', certificateController.reject);

// Live lecture batches
router.get('/live-lecture-batches', liveLectureController.listBatches);
router.post('/live-lecture-batches', liveLectureController.createBatch);
router.put('/live-lecture-batches/:id', liveLectureController.updateBatch);
router.delete('/live-lecture-batches/:id', liveLectureController.deleteBatch);
router.get('/live-lecture-batches/:batchId/students', liveLectureController.listBatchStudents);
router.post('/live-lecture-batches/:batchId/students/:studentId', liveLectureController.addStudentToBatch);
router.delete('/live-lecture-batches/:batchId/students/:studentId', liveLectureController.removeStudentFromBatch);
router.get('/live-lecture-batches/:batchId/modules', liveLectureController.listModules);
router.post('/live-lecture-batches/:batchId/modules', liveLectureController.createModule);
router.put('/live-lecture-batches/:batchId/modules/:moduleId', liveLectureController.updateModule);
router.delete('/live-lecture-batches/:batchId/modules/:moduleId', liveLectureController.deleteModule);

// Live lectures
router.post('/live-lectures/send-daily-notifications', liveLectureController.sendDailyNotifications);
router.get('/live-lectures', liveLectureController.listLecturesAdmin);
router.post('/live-lectures', liveLectureController.createLecture);
router.put('/live-lectures/:id', liveLectureController.updateLecture);
router.delete('/live-lectures/:id', liveLectureController.deleteLecture);
router.get('/live-lectures/:lectureId/attendance', liveLectureController.getLectureAttendance);
router.put('/live-lectures/:lectureId/attendance', liveLectureController.markAttendance);
router.put('/live-lectures/:lectureId/attendance/bulk', liveLectureController.markAttendanceBulk);
router.post('/live-lectures/:lectureId/recording/upload-url', liveLectureController.getRecordingUploadUrl);
router.put('/live-lectures/:lectureId/recording', liveLectureController.uploadRecording);

// Fees management (cash only)
router.get('/fees', feesController.listFees);
router.put('/fees/students/:studentId/total', feesController.setTotalFees);
router.post('/fees/students/:studentId/payments', feesController.addPayment);
router.get('/fees/students/:studentId/payments', feesController.listPayments);

// Notices (show on student dashboard)
router.get('/notices', noticeController.list);
router.post('/notices', noticeController.create);
router.put('/notices/:id', noticeController.update);
router.delete('/notices/:id', noticeController.delete);
router.get('/notices/:id/acknowledgements', noticeController.getAcknowledgements);

// Promo banners (student dashboard carousel)
router.get('/promo-banners', promoBannerController.list);
router.post('/promo-banners', promoBannerController.create);
router.put('/promo-banners/:id', promoBannerController.update);
router.delete('/promo-banners/:id', promoBannerController.delete);

export default router;

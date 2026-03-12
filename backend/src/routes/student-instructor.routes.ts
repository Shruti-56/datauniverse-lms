import { Router } from 'express';
import { studentInstructorController } from '../controllers/student-instructor.controller';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/roleGuard';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/students/:studentId/instructors', studentInstructorController.getStudentInstructors);
router.get('/instructors/:instructorId/students', studentInstructorController.getInstructorStudents);

// Instructor only: my assigned students (list + export data)
router.get('/my-students', requireRoles(UserRole.INSTRUCTOR), studentInstructorController.getMyAssignedStudents);

export default router;

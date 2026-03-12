import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Ban,
  CheckCircle,
  Mail,
  Calendar,
  BookOpen,
  Eye,
  Clock,
  Award,
  UserCheck,
  UserPlus,
  Download,
  UserX,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';

type Student = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  isBlocked: boolean;
  enrolledCourses: number;
  createdAt: string;
};

type CourseProgress = {
  completedVideos: number;
  totalVideos: number;
  percent: number;
};

type EnrollmentWithProgress = {
  id: string;
  enrolledAt: string;
  completedAt: string | null;
  course: {
    id: string;
    title: string;
    category: string;
    level: string;
  };
  progress: CourseProgress;
};

type StudentDetails = {
  id: string;
  email: string;
  createdAt: string;
  profile: {
    fullName: string | null;
    avatarUrl: string | null;
    isBlocked: boolean;
  } | null;
  enrollments: EnrollmentWithProgress[];
  screenTime: {
    weeklySeconds: number;
    lastActive: string | null;
  };
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

type StudentExportRow = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  isBlocked: boolean;
  enrolledCourses: number;
  courseNames: string;
  progressText: string;
};

async function downloadStudentListExcel() {
  const res = await api.get('/admin/students/export');
  if (!res.ok) throw new Error('Export failed');
  const rows: StudentExportRow[] = await res.json();
  const headers = ['Name', 'Email', 'Phone', 'Joined', 'Status', 'Courses Enrolled', 'Course Names', 'Progress'];
  const csvRows = rows.map((s) => [
    escapeCsvCell(s.fullName || ''),
    escapeCsvCell(s.email),
    escapeCsvCell(s.phoneNumber || ''),
    escapeCsvCell(new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })),
    s.isBlocked ? 'Blocked' : 'Active',
    String(s.enrolledCourses),
    escapeCsvCell(s.courseNames || ''),
    escapeCsvCell(s.progressText || ''),
  ]);
  const csvContent = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `students-list-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return rows.length;
}

const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [instructors, setInstructors] = useState<Array<{id: string; email: string; fullName: string}>>([]);
  const [showInstructorDialog, setShowInstructorDialog] = useState(false);
  const [selectedStudentForInstructor, setSelectedStudentForInstructor] = useState<string | null>(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');
  const [currentInstructors, setCurrentInstructors] = useState<Array<{id: string; email: string; fullName: string | null}>>([]);
  const [showGrantCourseDialog, setShowGrantCourseDialog] = useState(false);
  const [courses, setCourses] = useState<Array<{id: string; title: string}>>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerBatchIds, setRegisterBatchIds] = useState<string[]>([]);
  const [batches, setBatches] = useState<Array<{id: string; name: string}>>([]);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get('/admin/students');
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load students',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        toast({
          title: 'Error',
          description: 'Failed to load students',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchInstructors = async () => {
      try {
        const response = await api.get('/admin/instructors');
        if (response.ok) {
          const data = await response.json();
          setInstructors(data.map((i: { id: string; email: string; fullName?: string }) => ({ id: i.id, email: i.email, fullName: i.fullName })));
        }
      } catch (error) {
        console.error('Error fetching instructors:', error);
      }
    };

    const fetchCourses = async () => {
      try {
        const response = await api.get('/admin/courses');
        if (response.ok) {
          const data = await response.json();
          setCourses(data.map((c: { id: string; title: string }) => ({ id: c.id, title: c.title })));
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    const fetchBatches = async () => {
      try {
        const res = await api.get('/admin/live-lecture-batches');
        if (res.ok) {
          const data = await res.json();
          setBatches(data.map((b: { id: string; name: string }) => ({ id: b.id, name: b.name })));
        }
      } catch (e) {
        console.error('Fetch batches error', e);
      }
    };
    fetchStudents();
    fetchInstructors();
    fetchCourses();
    fetchBatches();
  }, []);

  const fetchStudentDetails = async (studentId: string) => {
    setLoadingDetails(true);
    try {
      const response = await api.get(`/admin/students/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedStudent(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load student details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load student details',
        variant: 'destructive',
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredStudents = students.filter(student =>
    (student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openInstructorDialog = async (studentId: string) => {
    setSelectedStudentForInstructor(studentId);
    setSelectedInstructorId('');
    setCurrentInstructors([]);
    setShowInstructorDialog(true);
    try {
      const res = await api.get(`/student-instructors/students/${studentId}/instructors`);
      if (res.ok) {
        const data = await res.json();
        setCurrentInstructors(data.map((i: { id: string; email: string; profile?: { fullName?: string } }) => ({
          id: i.id,
          email: i.email,
          fullName: i.profile?.fullName ?? null,
        })));
      }
    } catch {
      // non-fatal
    }
  };

  const removeInstructor = async (instructorId: string) => {
    if (!selectedStudentForInstructor) return;
    try {
      const res = await api.delete(`/admin/students/${selectedStudentForInstructor}/instructor/${instructorId}`);
      if (res.ok) {
        setCurrentInstructors(prev => prev.filter(i => i.id !== instructorId));
        toast({ title: 'Instructor removed', description: 'Instructor has been unassigned from this student.' });
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to remove instructor', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to remove instructor', variant: 'destructive' });
    }
  };

  const assignInstructor = async () => {
    if (!selectedStudentForInstructor || !selectedInstructorId) {
      toast({
        title: 'Error',
        description: 'Please select an instructor',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await api.post(`/admin/students/${selectedStudentForInstructor}/instructor`, {
        instructorId: selectedInstructorId,
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Instructor assigned successfully' });
        // Refresh current instructors list inside dialog
        const refreshRes = await api.get(`/student-instructors/students/${selectedStudentForInstructor}/instructors`);
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setCurrentInstructors(data.map((i: { id: string; email: string; profile?: { fullName?: string } }) => ({
            id: i.id, email: i.email, fullName: i.profile?.fullName ?? null,
          })));
        }
        setSelectedInstructorId('');
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to assign instructor',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error assigning instructor:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign instructor',
        variant: 'destructive',
      });
    }
  };

  const openGrantCourseDialog = (studentId: string) => {
    setSelectedStudentForInstructor(studentId);
    setSelectedCourseId('');
    setShowGrantCourseDialog(true);
  };

  const grantCourseAccess = async () => {
    if (!selectedStudentForInstructor || !selectedCourseId) {
      toast({
        title: 'Error',
        description: 'Please select a course',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await api.post('/admin/enrollments', {
        studentId: selectedStudentForInstructor,
        courseId: selectedCourseId,
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Course access granted successfully',
        });
        setShowGrantCourseDialog(false);
        fetchStudentDetails(selectedStudentForInstructor);
        // Refresh students list
        const studentsResponse = await api.get('/admin/students');
        if (studentsResponse.ok) {
          setStudents(await studentsResponse.json());
        }
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to grant course access',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error granting course access:', error);
      toast({
        title: 'Error',
        description: 'Failed to grant course access',
        variant: 'destructive',
      });
    }
  };

  const toggleBlockStatus = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    const newBlockStatus = !student?.isBlocked;

    try {
      const response = await api.patch(`/admin/students/${studentId}/block`, {
        isBlocked: newBlockStatus,
      });

      if (response.ok) {
        setStudents(prev =>
          prev.map(s =>
            s.id === studentId ? { ...s, isBlocked: newBlockStatus } : s
          )
        );
        toast({
          title: newBlockStatus ? "Student Blocked" : "Student Unblocked",
          description: `${student?.fullName || student?.email} has been ${newBlockStatus ? 'blocked' : 'unblocked'}.`
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update student status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling block status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update student status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-12 text-muted-foreground">Loading students...</div>
      </div>
    );
  }

  const handleRegisterStudent = async () => {
    if (!registerEmail.trim() || !registerPassword.trim() || !registerFullName.trim()) {
      toast({ title: 'Error', description: 'Email, password and full name are required', variant: 'destructive' });
      return;
    }
    setRegistering(true);
    try {
      const res = await api.post('/admin/students', {
        email: registerEmail.trim(),
        password: registerPassword,
        fullName: registerFullName.trim(),
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to register', variant: 'destructive' });
        return;
      }
      const data = await res.json();
      const studentId = data.student?.id;
      if (studentId && registerBatchIds.length > 0) {
        for (const batchId of registerBatchIds) {
          await api.post(`/admin/live-lecture-batches/${batchId}/students/${studentId}`);
        }
      }
      toast({ title: 'Success', description: 'Student registered' + (registerBatchIds.length ? ' and added to selected batch(es)' : '') });
      setShowRegisterDialog(false);
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterFullName('');
      setRegisterBatchIds([]);
      const studentsResponse = await api.get('/admin/students');
      if (studentsResponse.ok) setStudents(await studentsResponse.json());
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to register student', variant: 'destructive' });
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Student Management</h1>
          <p className="text-muted-foreground">View and manage enrolled students. Register new students and add them to live-lecture batches.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const count = await downloadStudentListExcel();
                toast({ title: 'Downloaded', description: `${count} student(s) exported with phone, courses and progress. Open in Excel or Sheets.` });
              } catch {
                toast({ title: 'Export failed', description: 'Could not download student list. Try again.', variant: 'destructive' });
              }
            }}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </Button>
          <Button onClick={() => setShowRegisterDialog(true)} className="gap-2">
            <UserPlus className="w-4 h-4" /> Register New Student
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search students by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Students Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {searchQuery ? 'No students found matching your search' : 'No students found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Courses</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map((student) => {
                  return (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-primary">
                              {(student.fullName || student.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{student.fullName || 'No name'}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(student.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{student.enrolledCourses}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={student.isBlocked 
                          ? 'bg-destructive/10 text-destructive' 
                          : 'bg-success/10 text-success'
                        }>
                          {student.isBlocked ? 'Blocked' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => fetchStudentDetails(student.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Progress
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openInstructorDialog(student.id)}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Assign Instructor
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openGrantCourseDialog(student.id)}
                          >
                            <BookOpen className="w-4 h-4 mr-1" />
                            Grant Course
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className={student.isBlocked ? 'text-success' : 'text-destructive'}
                            onClick={() => toggleBlockStatus(student.id)}
                          >
                            {student.isBlocked ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Progress Details</DialogTitle>
          </DialogHeader>
          {loadingDetails ? (
            <div className="py-8 text-center text-muted-foreground">Loading details...</div>
          ) : selectedStudent ? (
            <div className="space-y-6 mt-4">
              {/* Student Info */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {(selectedStudent.profile?.fullName || selectedStudent.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground">
                    {selectedStudent.profile?.fullName || 'No name'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {selectedStudent.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(selectedStudent.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Screen Time */}
              <div className="p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Weekly Screen Time</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatTime(selectedStudent.screenTime?.weeklySeconds || 0)}
                    </p>
                  </div>
                  {selectedStudent.screenTime?.lastActive && (
                    <div className="ml-auto text-right">
                      <p className="text-sm text-muted-foreground">Last Active</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(selectedStudent.screenTime.lastActive).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Course Progress */}
              <div>
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Course Progress
                </h4>
                {selectedStudent.enrollments.length === 0 ? (
                  <p className="text-muted-foreground text-sm p-4 bg-muted/30 rounded-lg">
                    No courses enrolled yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {selectedStudent.enrollments.map(enrollment => (
                      <div key={enrollment.id} className="p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-foreground">{enrollment.course.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {enrollment.course.category.replace('_', ' ')}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {enrollment.course.level}
                              </Badge>
                            </div>
                          </div>
                          {enrollment.completedAt ? (
                            <Badge className="bg-success/10 text-success">
                              <Award className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="outline">In Progress</Badge>
                          )}
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {enrollment.progress.completedVideos} / {enrollment.progress.totalVideos} videos
                            </span>
                            <span className="font-medium text-foreground">
                              {enrollment.progress.percent}%
                            </span>
                          </div>
                          <Progress 
                            value={enrollment.progress.percent} 
                            className="h-2"
                          />
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          Enrolled on {new Date(enrollment.enrolledAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Assign / Deassign Instructor Dialog */}
      <Dialog open={showInstructorDialog} onOpenChange={setShowInstructorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Instructor Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            {/* Currently assigned instructors */}
            <div>
              <p className="text-sm font-medium mb-2">Currently Assigned</p>
              {currentInstructors.length === 0 ? (
                <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/40 rounded-lg">No instructor assigned yet</p>
              ) : (
                <div className="space-y-2">
                  {currentInstructors.map(ins => (
                    <div key={ins.id} className="flex items-center justify-between px-3 py-2 bg-muted/40 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">{ins.fullName || ins.email}</p>
                        {ins.fullName && <p className="text-xs text-muted-foreground">{ins.email}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeInstructor(ins.id)}
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <label className="block text-sm font-medium mb-2">Assign New Instructor</label>
              <select
                value={selectedInstructorId}
                onChange={(e) => setSelectedInstructorId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
              >
                <option value="">-- Select Instructor --</option>
                {instructors
                  .filter(i => !currentInstructors.some(c => c.id === i.id))
                  .map(instructor => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.fullName} ({instructor.email})
                    </option>
                  ))}
              </select>
              {instructors.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">No instructors available. Create instructors first.</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowInstructorDialog(false)}>
                Close
              </Button>
              <Button onClick={assignInstructor} disabled={!selectedInstructorId}>
                <UserCheck className="w-4 h-4 mr-2" />
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grant Course Access Dialog */}
      <Dialog open={showGrantCourseDialog} onOpenChange={setShowGrantCourseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Course Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
              >
                <option value="">-- Select Course --</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              {courses.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No courses available. Create courses first.
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              This will enroll the student in the selected course for free.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowGrantCourseDialog(false)}>
                Cancel
              </Button>
              <Button onClick={grantCourseAccess} disabled={!selectedCourseId}>
                <BookOpen className="w-4 h-4 mr-2" />
                Grant Access
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register New Student Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register New Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="student@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password *</label>
              <input
                type="password"
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Full name *</label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                value={registerFullName}
                onChange={(e) => setRegisterFullName(e.target.value)}
                placeholder="Student name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Add to live-lecture batch(es)</label>
              <p className="text-xs text-muted-foreground mb-2">Select batches (e.g. Regular Batch) so this student gets the join link 10 min before each lecture.</p>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                {batches.map((b) => (
                  <label key={b.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={registerBatchIds.includes(b.id)}
                      onChange={(e) =>
                        setRegisterBatchIds((prev) =>
                          e.target.checked ? [...prev, b.id] : prev.filter((id) => id !== b.id)
                        )
                      }
                    />
                    <span className="text-sm">{b.name}</span>
                  </label>
                ))}
                {batches.length === 0 && <p className="text-sm text-muted-foreground">No batches. Create batches in Live Lectures.</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>Cancel</Button>
              <Button onClick={handleRegisterStudent} disabled={registering}>
                {registering ? 'Registering…' : 'Register & add to batch(es)'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStudents;

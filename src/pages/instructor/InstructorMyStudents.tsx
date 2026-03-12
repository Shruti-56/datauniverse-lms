import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Users, Download, Loader2, Mail, Phone, BookOpen, RefreshCw, Calendar, Award, CheckCircle2 } from 'lucide-react';

type AssignedStudentRow = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  isBlocked: boolean;
  enrolledCourses: number;
  courseNames: string;
  progressText: string;
  enrollments?: Array<{ title: string; percent: number; enrolledAt: string; completedAt: string | null }>;
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function downloadAssignedStudentsExcel(): Promise<number> {
  const res = await api.get('/student-instructors/my-students');
  if (!res.ok) throw new Error('Export failed');
  const rows: AssignedStudentRow[] = await res.json();
  const headers = [
    'S.No',
    'Name',
    'Email',
    'Phone',
    'Joined',
    'Status',
    'Courses Enrolled',
    'Course Names',
    'Progress',
  ];
  const csvRows = rows.map((s, idx) => [
    String(idx + 1),
    escapeCsvCell(s.fullName || ''),
    escapeCsvCell(s.email),
    escapeCsvCell(s.phoneNumber || ''),
    escapeCsvCell(
      new Date(s.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    ),
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
  a.download = `my-students-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return rows.length;
}

const InstructorMyStudents: React.FC = () => {
  const [list, setList] = useState<AssignedStudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AssignedStudentRow | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student-instructors/my-students');
      if (res.ok) {
        const data = await res.json();
        setList(Array.isArray(data) ? data : []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load assigned students',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load assigned students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleExport = async () => {
    try {
      setDownloading(true);
      const count = await downloadAssignedStudentsExcel();
      toast({
        title: 'Downloaded',
        description: `${count} student(s) exported. Open in Excel or Sheets.`,
      });
    } catch {
      toast({
        title: 'Export failed',
        description: 'Could not download list. Try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">My Assigned Students</h1>
          <p className="text-muted-foreground">
            Students assigned to you. View contact details, enrolled courses, and progress. Download as Excel.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchStudents}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={downloading || list.length === 0}>
            {downloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download Excel
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No students assigned yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              When an admin assigns students to you, they will appear here.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row, idx) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => setSelectedStudent(row)}
                  title="Click to view full details"
                >
                  <TableCell className="font-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{row.fullName || '—'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                      {row.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                      {row.phoneNumber || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                      {row.enrolledCourses}
                      {row.courseNames ? (
                        <span className="text-muted-foreground truncate max-w-[180px]" title={row.courseNames}>
                          — {row.courseNames}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm max-w-[220px]">
                    <span className="text-muted-foreground whitespace-pre-wrap line-clamp-2" title={row.progressText}>
                      {row.progressText || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(row.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    {row.isBlocked ? (
                      <Badge variant="destructive">Blocked</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-success/10 text-success">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-5 mt-2">
              {/* Identity */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-primary">
                    {(selectedStudent.fullName || selectedStudent.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-foreground truncate">
                    {selectedStudent.fullName || 'No name'}
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />{selectedStudent.email}
                    </span>
                    {selectedStudent.phoneNumber && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />{selectedStudent.phoneNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      Joined {new Date(selectedStudent.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    {selectedStudent.isBlocked ? (
                      <Badge variant="destructive" className="text-xs">Blocked</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-success/10 text-success text-xs">Active</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Course Progress */}
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Course Progress
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    ({selectedStudent.enrolledCourses} course{selectedStudent.enrolledCourses !== 1 ? 's' : ''})
                  </span>
                </h4>
                {!selectedStudent.enrollments || selectedStudent.enrollments.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                    No courses enrolled yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedStudent.enrollments.map((enr, i) => (
                      <div key={i} className="p-3 bg-muted/30 rounded-xl">
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <p className="font-medium text-sm text-foreground leading-snug">{enr.title}</p>
                          {enr.completedAt ? (
                            <Badge className="bg-success/10 text-success shrink-0 text-xs">
                              <Award className="w-3 h-3 mr-1" />Completed
                            </Badge>
                          ) : enr.percent === 100 ? (
                            <Badge className="bg-success/10 text-success shrink-0 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />Done
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="shrink-0 text-xs">In Progress</Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span className="font-medium text-foreground">{enr.percent}%</span>
                          </div>
                          <Progress value={enr.percent} className="h-1.5" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Enrolled {new Date(enr.enrolledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorMyStudents;

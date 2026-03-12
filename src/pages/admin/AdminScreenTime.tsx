import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Clock, User, Calendar, TrendingUp, Eye, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type StudentScreenTime = {
  userId: string;
  email: string;
  fullName: string;
  enrolledAt: string;
  overallSeconds: number;
  weeklySeconds: number;
  lastActive: string | null;
};

type StudentDetail = {
  student: {
    id: string;
    email: string;
    fullName: string;
  };
  totalSeconds: number;
  averageDaily: number;
  dailyBreakdown: {
    date: string;
    seconds: number;
  }[];
};

const formatTime = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const AdminScreenTime: React.FC = () => {
  const [screenTimeData, setScreenTimeData] = useState<StudentScreenTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchScreenTime = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await api.get('/admin/screentime');
      
      if (response.ok) {
        const data = await response.json();
        setScreenTimeData(Array.isArray(data) ? data : []);
      } else {
        let errorMsg = 'Failed to fetch screen time data';
        try {
          const errorData = await response.json();
          errorMsg = errorData.details || errorData.error || errorMsg;
        } catch {
          errorMsg = `Server error: ${response.status}`;
        }
        setError(errorMsg);
      }
    } catch (error: unknown) {
      console.error('Error fetching screen time:', error);
      setError(`Network error: ${error instanceof Error ? error.message : 'Please check if the server is running.'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenTime();
  }, []);

  const downloadExcel = async () => {
    try {
      const res = await api.get('/admin/screentime/export');
      if (!res.ok) throw new Error('Export failed');
      const csv = await res.text();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screen-time-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Downloaded', description: 'Screen time exported. Open in Excel or Sheets.' });
    } catch (e) {
      toast({ title: 'Export failed', description: 'Could not download screen time. Try again.', variant: 'destructive' });
    }
  };

  const viewStudentDetail = async (userId: string) => {
    setDetailLoading(true);
    setDialogOpen(true);
    setSelectedStudent(null);
    
    try {
      const response = await api.get(`/admin/screentime/${userId}`);
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
      console.error('Error fetching student detail:', error);
      toast({
        title: 'Error',
        description: 'Failed to load student details',
        variant: 'destructive',
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const totalStudents = screenTimeData.length;
  const totalTimeOverall = screenTimeData.reduce((sum, s) => sum + (s.overallSeconds ?? 0), 0);
  const totalTimeWeekly = screenTimeData.reduce((sum, s) => sum + (s.weeklySeconds ?? 0), 0);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-12 text-muted-foreground">Loading screen time data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Screen Time Analytics</h1>
          <p className="text-muted-foreground">Monitor how much time students spend on the platform</p>
        </div>
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
          <p className="text-destructive font-medium mb-2">Error Loading Screen Time</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchScreenTime} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Screen Time Analytics</h1>
          <p className="text-muted-foreground">Overall since enrollment and this week. Export to Excel.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadExcel} variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Download Excel
          </Button>
          <Button onClick={fetchScreenTime} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Students</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
          <p className="text-xs text-muted-foreground">total students</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Overall (since enrollment)</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatTime(totalTimeOverall)}</p>
          <p className="text-xs text-muted-foreground">combined all-time</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">This Week</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatTime(totalTimeWeekly)}</p>
          <p className="text-xs text-muted-foreground">last 7 days</p>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Student Screen Time</h2>
          <p className="text-sm text-muted-foreground">
            Overall since first enrollment and this week (last 7 days). Screen time is tracked when students are active.
          </p>
        </div>
        
        {screenTimeData.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No screen time data yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Data will appear when students use the platform. Screen time is recorded every 30 seconds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Enrolled</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Overall</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">This Week</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Last Active</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {screenTimeData.map((student) => (
                  <tr key={student.userId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-sm font-medium text-secondary-foreground">
                            {(student.fullName || student.email || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{student.fullName || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {student.enrolledAt ? formatDate(student.enrolledAt) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{formatTime(student.overallSeconds ?? 0)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{formatTime(student.weeklySeconds)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {student.lastActive ? formatDateTime(student.lastActive) : 'Never'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewStudentDetail(student.userId)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Screen Time Details</DialogTitle>
          </DialogHeader>
          
          {detailLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : selectedStudent ? (
            <div className="space-y-6 mt-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-lg font-medium text-secondary-foreground">
                    {(selectedStudent.student.fullName || selectedStudent.student.email || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedStudent.student.fullName || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{selectedStudent.student.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Total (30 days)</p>
                  <p className="text-xl font-bold">{formatTime(selectedStudent.totalSeconds)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Daily Average</p>
                  <p className="text-xl font-bold">{formatTime(selectedStudent.averageDaily)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Daily Breakdown (Last 30 days)</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedStudent.dailyBreakdown && selectedStudent.dailyBreakdown.length > 0 ? (
                    selectedStudent.dailyBreakdown.map((day, index) => (
                      <div
                        key={`${day.date}-${index}`}
                        className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded"
                      >
                        <span className="text-sm">{formatDate(day.date)}</span>
                        <span className="font-medium">{formatTime(day.seconds)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No daily data available</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No data available</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminScreenTime;

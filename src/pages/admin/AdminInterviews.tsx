import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Plus, Clock, User, Video, Loader2, X, Download } from 'lucide-react';

type Student = {
  id: string;
  email: string;
  fullName: string;
};

type Instructor = {
  id: string;
  email: string;
  fullName: string;
};

type Interview = {
  id: string;
  student: Student;
  instructor: Instructor;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'MISSED';
  attended: boolean;
  recordingUrl: string | null;
};

const AdminInterviews: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [interviewForRecording, setInterviewForRecording] = useState<Interview | null>(null);
  const [uploadingRecording, setUploadingRecording] = useState(false);

  // Form state
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<string>('60');
  const [meetingLink, setMeetingLink] = useState<string>('');

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/interviews');
      if (response.ok) {
        const data = await response.json();
        setInterviews(data);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to load interviews',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
    
    // Fetch students and instructors
    const fetchData = async () => {
      try {
        const [studentsRes, instructorsRes] = await Promise.all([
          api.get('/admin/students'),
          api.get('/admin/instructors'),
        ]);

        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData.map((s: { id: string; email: string; fullName?: string }) => ({
            id: s.id,
            email: s.email,
            fullName: s.fullName || 'Unknown',
          })));
        }

        if (instructorsRes.ok) {
          const instructorsData = await instructorsRes.json();
          setInstructors(instructorsData.map((i: { id: string; email: string; fullName?: string }) => ({
            id: i.id,
            email: i.email,
            fullName: i.fullName || 'Unknown',
          })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const openDialog = () => {
    setSelectedStudentId('');
    setSelectedInstructorId('');
    setScheduledAt('');
    setDurationMinutes('60');
    setMeetingLink('');
    setShowDialog(true);
  };

  const downloadExcel = async () => {
    try {
      const res = await api.get('/admin/interviews/export');
      if (!res.ok) throw new Error('Export failed');
      const csv = await res.text();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-schedule-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Downloaded', description: 'Interview schedule exported. Open in Excel or Sheets.' });
    } catch (e) {
      toast({ title: 'Export failed', description: 'Could not download interview schedule. Try again.', variant: 'destructive' });
    }
  };

  const scheduleInterview = async () => {
    if (!selectedStudentId || !selectedInstructorId || !scheduledAt) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await api.post('/admin/interviews', {
        studentId: selectedStudentId,
        instructorId: selectedInstructorId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: parseInt(durationMinutes),
        meetingLink: meetingLink || null,
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Interview scheduled successfully',
        });
        setShowDialog(false);
        fetchInterviews();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to schedule interview',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule interview',
        variant: 'destructive',
      });
    }
  };

  const cancelInterview = async (id: string) => {
    if (!confirm('Cancel this interview?')) return;

    try {
      const response = await api.put(`/interviews/${id}/cancel`);
      if (response.ok) {
        toast({ title: 'Interview cancelled' });
        fetchInterviews();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel interview',
        variant: 'destructive',
      });
    }
  };

  const handleRecordingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !interviewForRecording) return;

    setUploadingRecording(true);
    try {
      const uploadResponse = await api.post(`/interviews/${interviewForRecording.id}/recording/upload-url`, {
        fileName: file.name,
        fileType: file.type,
      });

      if (!uploadResponse.ok) throw new Error('Failed to get upload URL');

      const { uploadUrl, fileUrl } = await uploadResponse.json();

      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResult.ok) throw new Error('Failed to upload recording');

      await api.put(`/interviews/${interviewForRecording.id}/recording`, { recordingUrl: fileUrl });

      toast({ title: 'Success', description: 'Recording uploaded successfully' });
      setInterviewForRecording(null);
      fetchInterviews();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload recording',
        variant: 'destructive',
      });
    } finally {
      setUploadingRecording(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-success/10 text-success">Completed</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-muted text-muted-foreground">Cancelled</Badge>;
      case 'MISSED':
        return <Badge className="bg-destructive/10 text-destructive">Missed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Mock Interviews</h1>
          <p className="text-muted-foreground">Schedule and manage student interviews</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadExcel} className="gap-2">
            <Download className="w-4 h-4" />
            Download Excel
          </Button>
          <Button onClick={openDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Interview
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-card overflow-hidden">
        {interviews.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No interviews scheduled</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Instructor</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Scheduled</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Recording</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {interviews.map((interview) => (
                  <tr key={interview.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{interview.student.fullName}</p>
                          <p className="text-xs text-muted-foreground">{interview.student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{interview.instructor.fullName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(interview.scheduledAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{interview.durationMinutes} mins</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(interview.status)}
                    </td>
                    <td className="px-6 py-4">
                      {interview.recordingUrl ? (
                        <span className="text-sm text-success flex items-center gap-1">
                          <Video className="w-4 h-4" /> Uploaded
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => setInterviewForRecording(interview)}
                      >
                        <Video className="w-4 h-4" />
                        {interview.recordingUrl ? 'Replace' : 'Upload'} Recording
                      </Button>
                      {interview.status === 'SCHEDULED' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => cancelInterview(interview.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Mock Interview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Student *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
              >
                <option value="">-- Select Student --</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.fullName} ({student.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Instructor *</label>
              <select
                value={selectedInstructorId}
                onChange={(e) => setSelectedInstructorId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
              >
                <option value="">-- Select Instructor --</option>
                {instructors.map(instructor => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.fullName} ({instructor.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date & Time *</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                min="15"
                max="180"
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Meeting Link</label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={scheduleInterview}>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Interview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Recording Dialog */}
      <Dialog open={!!interviewForRecording} onOpenChange={(open) => !open && setInterviewForRecording(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Mock Interview Recording</DialogTitle>
          </DialogHeader>
          {interviewForRecording && (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                {interviewForRecording.recordingUrl
                  ? 'Choose a video file to replace the existing recording.'
                  : 'Choose a video file to attach as the mock interview recording.'}
              </p>
              <div>
                <label className="block text-sm font-medium mb-2">Video file</label>
                <input
                  type="file"
                  accept="video/*"
                  className="w-full text-sm file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground"
                  onChange={handleRecordingUpload}
                  disabled={uploadingRecording}
                />
                {uploadingRecording && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                  </p>
                )}
                {interviewForRecording.recordingUrl && !uploadingRecording && (
                  <p className="text-sm text-success mt-2">✓ Recording on file</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInterviews;

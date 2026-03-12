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
import { Calendar, Clock, User, Video, Loader2, CheckCircle, X, Upload, MessageSquare } from 'lucide-react';
import VideoWithWatermark from '@/components/VideoWithWatermark';
import { toAbsoluteMeetingUrl } from '@/lib/utils';

type Interview = {
  id: string;
  student: {
    id: string;
    email: string;
    profile: { fullName: string } | null;
  };
  scheduledAt: string;
  durationMinutes: number;
  meetingLink: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'MISSED';
  attended: boolean;
  attendedAt: string | null;
  recordingUrl: string | null;
  feedback: {
    communicationSkills: number;
    theoryKnowledge: number;
    practicalKnowledge: number;
    codingKnowledge: number;
    problemSolving: number;
    overallRating: number;
    strengths: string | null;
    areasForImprovement: string | null;
    additionalComments: string | null;
  } | null;
};

const InstructorInterviews: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [recordingWatchUrl, setRecordingWatchUrl] = useState<string | null>(null);
  const [loadingRecordingUrl, setLoadingRecordingUrl] = useState<string | null>(null);
  
  // Feedback form state
  const [communicationSkills, setCommunicationSkills] = useState<string>('');
  const [theoryKnowledge, setTheoryKnowledge] = useState<string>('');
  const [practicalKnowledge, setPracticalKnowledge] = useState<string>('');
  const [codingKnowledge, setCodingKnowledge] = useState<string>('');
  const [problemSolving, setProblemSolving] = useState<string>('');
  const [overallRating, setOverallRating] = useState<string>('');
  const [strengths, setStrengths] = useState<string>('');
  const [areasForImprovement, setAreasForImprovement] = useState<string>('');
  const [additionalComments, setAdditionalComments] = useState<string>('');

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/interviews');
      if (response.ok) {
        const data = await response.json();
        // Sort by scheduled time (earliest first) so lists display in chronological order
        const sorted = Array.isArray(data)
          ? [...data].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
          : [];
        setInterviews(sorted);
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
  }, []);

  // Check for interviewId in URL query params to auto-open feedback dialog
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const interviewId = urlParams.get('interviewId');
    
    if (interviewId && interviews.length > 0) {
      const interview = interviews.find(i => i.id === interviewId);
      if (interview && (interview.status === 'COMPLETED' || interview.attended)) {
        openFeedbackDialog(interview);
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [interviews]);

  const openFeedbackDialog = (interview: Interview) => {
    setSelectedInterview(interview);
    if (interview.feedback) {
      setCommunicationSkills(interview.feedback.communicationSkills.toString());
      setTheoryKnowledge(interview.feedback.theoryKnowledge.toString());
      setPracticalKnowledge(interview.feedback.practicalKnowledge.toString());
      setCodingKnowledge(interview.feedback.codingKnowledge.toString());
      setProblemSolving(interview.feedback.problemSolving.toString());
      setOverallRating(interview.feedback.overallRating.toString());
      setStrengths(interview.feedback.strengths || '');
      setAreasForImprovement(interview.feedback.areasForImprovement || '');
      setAdditionalComments(interview.feedback.additionalComments || '');
    } else {
      setCommunicationSkills('');
      setTheoryKnowledge('');
      setPracticalKnowledge('');
      setCodingKnowledge('');
      setProblemSolving('');
      setOverallRating('');
      setStrengths('');
      setAreasForImprovement('');
      setAdditionalComments('');
    }
    setShowFeedbackDialog(true);
  };

  const markAttendance = async (id: string, attended: boolean) => {
    try {
      const response = await api.put(`/interviews/${id}/attendance`, { attended });
      if (response.ok) {
        toast({
          title: 'Success',
          description: `Attendance marked as ${attended ? 'attended' : 'not attended'}`,
        });
        await fetchInterviews();
        return true;
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to mark attendance',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive',
      });
      return false;
    }
  };

  const submitFeedback = async () => {
    if (!selectedInterview) return;

    if (!communicationSkills || !theoryKnowledge || !practicalKnowledge || 
        !codingKnowledge || !problemSolving || !overallRating) {
      toast({
        title: 'Error',
        description: 'Please fill all rating fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await api.post(`/interviews/${selectedInterview.id}/feedback`, {
        communicationSkills: parseInt(communicationSkills),
        theoryKnowledge: parseInt(theoryKnowledge),
        practicalKnowledge: parseInt(practicalKnowledge),
        codingKnowledge: parseInt(codingKnowledge),
        problemSolving: parseInt(problemSolving),
        overallRating: parseInt(overallRating),
        strengths: strengths || undefined,
        areasForImprovement: areasForImprovement || undefined,
        additionalComments: additionalComments || undefined,
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Feedback submitted successfully. Student has been notified.',
        });
        setShowFeedbackDialog(false);
        setSelectedInterview(null);
        await fetchInterviews();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to submit feedback',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback',
        variant: 'destructive',
      });
    }
  };

  const handleRecordingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedInterview) return;

    setUploadingRecording(true);

    try {
      // Get upload URL
      const uploadResponse = await api.post(`/interviews/${selectedInterview.id}/recording/upload-url`, {
        fileName: file.name,
        fileType: file.type,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, fileUrl } = await uploadResponse.json();

      // Upload to S3
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error('Failed to upload recording');
      }

      // Update interview with recording URL
      await api.put(`/interviews/${selectedInterview.id}/recording`, {
        recordingUrl: fileUrl,
      });

      toast({
        title: 'Success',
        description: 'Recording uploaded successfully',
      });
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

  const openRecording = async (interview: Interview) => {
    setLoadingRecordingUrl(interview.id);
    setRecordingWatchUrl(null);
    try {
      const res = await api.get(`/interviews/${interview.id}/recording-url`);
      if (res.ok) {
        const { url } = await res.json();
        setRecordingWatchUrl(url);
      } else {
        const data = await res.json().catch(() => ({}));
        toast({
          title: 'Cannot play recording',
          description: data.error || 'Recording is not available',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching recording URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recording',
        variant: 'destructive',
      });
    } finally {
      setLoadingRecordingUrl(null);
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

  // Upcoming: soonest first (asc by time). Past: most recent first (desc by time).
  const upcoming = interviews.filter(i => {
    const scheduled = new Date(i.scheduledAt);
    return scheduled > new Date() && i.status === 'SCHEDULED';
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const past = interviews.filter(i => {
    const scheduled = new Date(i.scheduledAt);
    return scheduled <= new Date() || i.status !== 'SCHEDULED';
  }).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Mock Interviews</h1>
        <p className="text-muted-foreground">View scheduled interviews with students and provide detailed feedback</p>
      </div>

      {/* Upcoming Interviews */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Upcoming Interviews</h2>
          <div className="space-y-4">
            {upcoming.map((interview) => (
              <div key={interview.id} className="bg-card rounded-xl border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusBadge(interview.status)}
                      <span className="text-sm text-muted-foreground">
                        with {interview.student.profile?.fullName || interview.student.email}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(interview.scheduledAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Duration: {interview.durationMinutes} minutes</span>
                      </div>
                      {toAbsoluteMeetingUrl(interview.meetingLink) && (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={toAbsoluteMeetingUrl(interview.meetingLink)!} target="_blank" rel="noopener noreferrer">
                              Join Meeting
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Interviews */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Past Interviews</h2>
        {past.length === 0 ? (
          <div className="bg-card rounded-xl border p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No past interviews</p>
          </div>
        ) : (
          <div className="space-y-4">
            {past.map((interview) => (
              <div key={interview.id} className="bg-card rounded-xl border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusBadge(interview.status)}
                      <span className="text-sm text-muted-foreground">
                        {interview.student.profile?.fullName || interview.student.email}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{new Date(interview.scheduledAt).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Attended:</span>
                        <span className={interview.attended ? 'text-success' : 'text-destructive'}>
                          {interview.attended ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>

                    {interview.feedback && (
                      <div className="p-4 bg-muted/50 rounded-lg mb-3">
                        <p className="text-sm font-medium mb-2">Feedback Submitted</p>
                        <p className="text-sm text-muted-foreground">
                          Overall Rating: {interview.feedback.overallRating}/10
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {!interview.attended && interview.status === 'SCHEDULED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const success = await markAttendance(interview.id, true);
                          if (success) {
                            // Wait a bit for state to update, then open feedback dialog
                            setTimeout(async () => {
                              await fetchInterviews();
                              const updatedInterviews = await api.get('/interviews');
                              if (updatedInterviews.ok) {
                                const data = await updatedInterviews.json();
                                const updatedInterview = data.find((i: Interview) => i.id === interview.id);
                                if (updatedInterview && (updatedInterview.status === 'COMPLETED' || updatedInterview.attended)) {
                                  openFeedbackDialog(updatedInterview);
                                }
                              }
                            }, 500);
                          }
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Attended & Provide Feedback
                      </Button>
                    )}
                    {(interview.status === 'COMPLETED' || interview.attended) && !interview.feedback && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openFeedbackDialog(interview)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Provide Feedback
                      </Button>
                    )}
                    {interview.feedback && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openFeedbackDialog(interview)}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        View/Edit Feedback
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interview Feedback</DialogTitle>
          </DialogHeader>
          {selectedInterview && (
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">
                  Student: {selectedInterview.student.profile?.fullName || selectedInterview.student.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  Scheduled: {new Date(selectedInterview.scheduledAt).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Communication Skills (1-10) *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={communicationSkills}
                    onChange={(e) => setCommunicationSkills(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Theory Knowledge (1-10) *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={theoryKnowledge}
                    onChange={(e) => setTheoryKnowledge(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Practical Knowledge (1-10) *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={practicalKnowledge}
                    onChange={(e) => setPracticalKnowledge(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Coding Knowledge (1-10) *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={codingKnowledge}
                    onChange={(e) => setCodingKnowledge(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Problem Solving (1-10) *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={problemSolving}
                    onChange={(e) => setProblemSolving(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Overall Rating (1-10) *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={overallRating}
                    onChange={(e) => setOverallRating(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Strengths</label>
                <textarea
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background resize-none"
                  placeholder="What did the student do well?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Areas for Improvement</label>
                <textarea
                  value={areasForImprovement}
                  onChange={(e) => setAreasForImprovement(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background resize-none"
                  placeholder="What can the student improve on?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional Comments</label>
                <textarea
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background resize-none"
                  placeholder="Any additional feedback..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Upload Interview Recording</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleRecordingUpload}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                  disabled={uploadingRecording}
                />
                {uploadingRecording && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  </div>
                )}
                {selectedInterview.recordingUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-sm text-success">✓ Recording uploaded</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRecording(selectedInterview)}
                      disabled={loadingRecordingUrl === selectedInterview.id}
                      className="gap-1"
                    >
                      {loadingRecordingUrl === selectedInterview.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                      View Recording
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={submitFeedback}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Submit Feedback
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recording playback dialog (with logo watermark) */}
      <Dialog open={!!recordingWatchUrl} onOpenChange={(open) => !open && setRecordingWatchUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Mock Interview Recording</DialogTitle>
          </DialogHeader>
          {recordingWatchUrl && (
            <VideoWithWatermark
              videoUrl={recordingWatchUrl}
              title="Interview Recording"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorInterviews;

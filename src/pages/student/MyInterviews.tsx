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
import { Calendar, Clock, User, Video, Loader2, ExternalLink, Star } from 'lucide-react';
import VideoWithWatermark from '@/components/VideoWithWatermark';
import { toAbsoluteMeetingUrl } from '@/lib/utils';

type Interview = {
  id: string;
  instructor: {
    id: string;
    email: string;
    profile: { fullName: string } | null;
  };
  scheduledAt: string;
  durationMinutes: number;
  meetingLink: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'MISSED';
  attended: boolean;
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

const MyInterviews: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [recordingWatchUrl, setRecordingWatchUrl] = useState<string | null>(null);
  const [loadingRecordingUrl, setLoadingRecordingUrl] = useState<string | null>(null);

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
  }, []);

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

  const getUpcomingInterviews = () => {
    const now = new Date();
    return interviews.filter(i => {
      const scheduled = new Date(i.scheduledAt);
      return scheduled > now && i.status === 'SCHEDULED';
    }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const upcoming = getUpcomingInterviews();
  const past = interviews.filter(i => {
    const scheduled = new Date(i.scheduledAt);
    return scheduled <= new Date() || i.status !== 'SCHEDULED';
  }).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">My Interviews</h1>
        <p className="text-muted-foreground">View your scheduled mock interviews and feedback</p>
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
                        with {interview.instructor.profile?.fullName || 'Instructor'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(interview.scheduledAt).toLocaleString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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
                              <ExternalLink className="w-4 h-4 mr-2" />
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
                        with {interview.instructor.profile?.fullName || 'Instructor'}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {new Date(interview.scheduledAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {interview.feedback && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          Interview Feedback
                        </h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Overall Rating</p>
                            <p className="text-2xl font-bold">{interview.feedback.overallRating}/10</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Communication:</span>
                              <span className="font-medium">{interview.feedback.communicationSkills}/10</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Theory:</span>
                              <span className="font-medium">{interview.feedback.theoryKnowledge}/10</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Practical:</span>
                              <span className="font-medium">{interview.feedback.practicalKnowledge}/10</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Coding:</span>
                              <span className="font-medium">{interview.feedback.codingKnowledge}/10</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Problem Solving:</span>
                              <span className="font-medium">{interview.feedback.problemSolving}/10</span>
                            </div>
                          </div>
                        </div>
                        {interview.feedback.strengths && (
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">Strengths:</p>
                            <p className="text-sm text-muted-foreground">{interview.feedback.strengths}</p>
                          </div>
                        )}
                        {interview.feedback.areasForImprovement && (
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">Areas for Improvement:</p>
                            <p className="text-sm text-muted-foreground">{interview.feedback.areasForImprovement}</p>
                          </div>
                        )}
                        {interview.feedback.additionalComments && (
                          <div>
                            <p className="text-sm font-medium mb-1">Additional Comments:</p>
                            <p className="text-sm text-muted-foreground">{interview.feedback.additionalComments}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {interview.recordingUrl && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRecording(interview)}
                          disabled={loadingRecordingUrl === interview.id}
                        >
                          {loadingRecordingUrl === interview.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Video className="w-4 h-4 mr-2" />
                          )}
                          View Recording
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedInterview(interview)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedInterview} onOpenChange={() => setSelectedInterview(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interview Details</DialogTitle>
          </DialogHeader>
          {selectedInterview && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedInterview.status)}
                <span className="text-sm text-muted-foreground">
                  with {selectedInterview.instructor.profile?.fullName || 'Instructor'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="font-medium">
                    {new Date(selectedInterview.scheduledAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{selectedInterview.durationMinutes} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attended</p>
                  <p className="font-medium">{selectedInterview.attended ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {toAbsoluteMeetingUrl(selectedInterview.meetingLink) && (
                <div>
                  <p className="text-sm font-medium mb-2">Meeting Link</p>
                  <a
                    href={toAbsoluteMeetingUrl(selectedInterview.meetingLink)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2"
                  >
                    {selectedInterview.meetingLink}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {selectedInterview.feedback && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-3">Feedback</h4>
                  {/* Same feedback display as above */}
                </div>
              )}

              {selectedInterview.recordingUrl && (
                <div>
                  <Button
                    variant="outline"
                    onClick={() => openRecording(selectedInterview)}
                    disabled={loadingRecordingUrl === selectedInterview.id}
                    className="gap-2"
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

export default MyInterviews;

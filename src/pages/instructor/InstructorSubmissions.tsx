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
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Eye,
  MessageSquare,
  Loader2,
  Clock,
  User
} from 'lucide-react';

type Submission = {
  id: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESUBMIT';
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  student: {
    id: string;
    email: string;
    profile: { fullName: string } | null;
  };
  assignment: {
    id: string;
    title: string;
    maxScore: number;
    video: { title: string };
  } | null;
  project: {
    id: string;
    title: string;
    maxScore: number;
  } | null;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return <Badge className="bg-success/10 text-success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    case 'PENDING':
      return <Badge className="bg-warning/10 text-warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case 'UNDER_REVIEW':
      return <Badge className="bg-primary/10 text-primary"><Eye className="w-3 h-3 mr-1" />Under Review</Badge>;
    case 'REJECTED':
      return <Badge className="bg-destructive/10 text-destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    case 'RESUBMIT':
      return <Badge className="bg-orange-100 text-orange-600"><RefreshCw className="w-3 h-3 mr-1" />Resubmit</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const InstructorSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  
  // Review form state
  const [reviewStatus, setReviewStatus] = useState<string>('');
  const [reviewScore, setReviewScore] = useState<string>('');
  const [reviewFeedback, setReviewFeedback] = useState<string>('');

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/submissions/review');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load submissions',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Check for submissionId in URL query params to auto-open review dialog
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const submissionId = urlParams.get('submissionId');
    
    if (submissionId) {
      if (submissions.length > 0) {
        // Submissions loaded, try to find and open
        const submission = submissions.find(s => s.id === submissionId);
        if (submission) {
          openReviewDialog(submission);
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          // Submission not found in list - might be already reviewed or doesn't exist
          toast({
            title: 'Submission Not Found',
            description: 'This submission may have already been reviewed or does not exist.',
            variant: 'destructive',
          });
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname);
        }
      } else if (!loading) {
        // Submissions finished loading but submission not found
        // This means the submissionId doesn't exist or user doesn't have access
        toast({
          title: 'Submission Not Found',
          description: 'Unable to find the requested submission.',
          variant: 'destructive',
        });
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
      // If still loading, wait for submissions to load
    }
  }, [submissions, loading]);

  const openReviewDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setReviewStatus(submission.status === 'PENDING' ? '' : submission.status);
    setReviewScore(submission.score?.toString() || '');
    setReviewFeedback(submission.feedback || '');
  };

  const handleReview = async () => {
    if (!selectedSubmission || !reviewStatus) {
      toast({
        title: 'Error',
        description: 'Please select a status',
        variant: 'destructive',
      });
      return;
    }

    setIsReviewing(true);
    try {
      const response = await api.put(`/submissions/${selectedSubmission.id}/review`, {
        status: reviewStatus,
        score: reviewScore ? parseInt(reviewScore) : undefined,
        feedback: reviewFeedback || undefined,
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Submission reviewed successfully',
        });
        setSelectedSubmission(null);
        fetchSubmissions();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to review',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Review error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive',
      });
    } finally {
      setIsReviewing(false);
    }
  };

  // Stats
  const pendingCount = submissions.filter(s => s.status === 'PENDING').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Submissions to Review</h1>
          <p className="text-muted-foreground">Review student assignments and projects</p>
        </div>
        <Button variant="outline" onClick={fetchSubmissions}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-5">
          <p className="text-sm text-muted-foreground mb-1">Total Submissions</p>
          <p className="text-2xl font-bold">{submissions.length}</p>
        </div>
        <div className="bg-card rounded-xl border p-5">
          <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
          <p className="text-2xl font-bold text-warning">{pendingCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-5">
          <p className="text-sm text-muted-foreground mb-1">Reviewed</p>
          <p className="text-2xl font-bold text-success">{submissions.length - pendingCount}</p>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-card rounded-xl border shadow-card overflow-hidden">
        {submissions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No submissions to review</p>
            <p className="text-sm text-muted-foreground mt-1">
              Submissions for your assigned modules will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Submission</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Score</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Submitted</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.map((submission) => {
                  const isAssignment = !!submission.assignment;
                  const title = isAssignment ? submission.assignment?.title : submission.project?.title;
                  const maxScore = isAssignment ? submission.assignment?.maxScore : submission.project?.maxScore;
                  
                  return (
                    <tr key={submission.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {submission.student.profile?.fullName || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">{submission.student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <Badge variant="outline" className="mb-1 text-xs">
                            {isAssignment ? 'Assignment' : 'Project'}
                          </Badge>
                          <p className="font-medium text-sm">{title}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="px-6 py-4">
                        {submission.score !== null ? (
                          <span className="font-medium">{submission.score}/{maxScore}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(submission.submittedAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReviewDialog(submission)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6 mt-4">
              {/* Student Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {selectedSubmission.student.profile?.fullName || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedSubmission.student.email}</p>
                </div>
              </div>

              {/* Submission Info */}
              <div>
                <h4 className="font-medium mb-2">
                  {selectedSubmission.assignment?.title || selectedSubmission.project?.title}
                </h4>
                <Badge variant="outline">
                  {selectedSubmission.assignment ? 'Assignment' : 'Project'}
                </Badge>
              </div>

              {/* Submission Content */}
              <div>
                <label className="block text-sm font-medium mb-2">Student's Submission</label>
                <div className="p-4 bg-muted/50 rounded-lg max-h-60 overflow-y-auto">
                  {selectedSubmission.content ? (
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {selectedSubmission.content}
                    </pre>
                  ) : selectedSubmission.fileName ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="font-medium">{selectedSubmission.fileName}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await api.get(`/submissions/${selectedSubmission.id}/download-url`);
                            if (response.ok) {
                              const data = await response.json();
                              window.open(data.downloadUrl, '_blank');
                            } else {
                              toast({
                                title: 'Error',
                                description: 'Failed to get download URL',
                                variant: 'destructive',
                              });
                            }
                          } catch (error) {
                            console.error('Error downloading file:', error);
                            toast({
                              title: 'Error',
                              description: 'Failed to download file',
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Download File
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No content provided</p>
                  )}
                </div>
              </div>

              {/* Review Form */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Your Review</h4>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Status *</label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                  >
                    <option value="">Select Status</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="RESUBMIT">Request Resubmission</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Score (out of {selectedSubmission.assignment?.maxScore || selectedSubmission.project?.maxScore || 100})
                  </label>
                  <input
                    type="number"
                    value={reviewScore}
                    onChange={(e) => setReviewScore(e.target.value)}
                    min="0"
                    max={selectedSubmission.assignment?.maxScore || selectedSubmission.project?.maxScore || 100}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                    placeholder="Enter score"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Feedback</label>
                  <textarea
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background resize-none"
                    placeholder="Provide feedback for the student..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                  Cancel
                </Button>
                <Button onClick={handleReview} disabled={isReviewing}>
                  {isReviewing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorSubmissions;

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  RefreshCw,
  Eye,
  MessageSquare,
  Loader2
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
  reviewedAt: string | null;
  assignment: {
    id: string;
    title: string;
    video: {
      title: string;
      course?: { title: string };
      module?: { title: string };
    };
  } | null;
  project: {
    id: string;
    title: string;
    module: {
      title: string;
      course: { title: string };
    };
  } | null;
  reviewer: {
    profile: { fullName: string } | null;
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

const MySubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/submissions/my');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Stats
  const pendingCount = submissions.filter(s => s.status === 'PENDING' || s.status === 'UNDER_REVIEW').length;
  const approvedCount = submissions.filter(s => s.status === 'APPROVED').length;
  const needsWorkCount = submissions.filter(s => s.status === 'REJECTED' || s.status === 'RESUBMIT').length;

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
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">My Submissions</h1>
          <p className="text-muted-foreground">Track your assignments and project submissions</p>
        </div>
        <Button variant="outline" onClick={fetchSubmissions}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-5">
          <p className="text-sm text-muted-foreground mb-1">Total Submissions</p>
          <p className="text-2xl font-bold">{submissions.length}</p>
        </div>
        <div className="bg-card rounded-xl border p-5">
          <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
          <p className="text-2xl font-bold text-warning">{pendingCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-5">
          <p className="text-sm text-muted-foreground mb-1">Approved</p>
          <p className="text-2xl font-bold text-success">{approvedCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-5">
          <p className="text-sm text-muted-foreground mb-1">Needs Improvement</p>
          <p className="text-2xl font-bold text-destructive">{needsWorkCount}</p>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-card rounded-xl border shadow-card overflow-hidden">
        {submissions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No submissions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete assignments and projects from your courses
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {submissions.map((submission) => {
              const isAssignment = !!submission.assignment;
              const title = isAssignment ? submission.assignment?.title : submission.project?.title;
              const courseName = isAssignment
                ? (submission.assignment?.video?.course?.title ?? submission.assignment?.video?.module?.course?.title ?? 'Course')
                : (submission.project?.module?.course?.title ?? 'Course');
              const moduleName = isAssignment
                ? (submission.assignment?.video?.module?.title ?? 'Assignment')
                : (submission.project?.module?.title ?? 'Project');

              return (
                <div
                  key={submission.id}
                  className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {isAssignment ? 'Assignment' : 'Project'}
                        </Badge>
                        {getStatusBadge(submission.status)}
                      </div>
                      <h3 className="font-medium text-foreground">{title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {courseName} • {moduleName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Submitted: {new Date(submission.submittedAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      {submission.score !== null && (
                        <p className="text-lg font-bold text-foreground">
                          {submission.score}/100
                        </p>
                      )}
                      {submission.feedback && (
                        <p className="text-xs text-muted-foreground flex items-center justify-end gap-1 mt-1">
                          <MessageSquare className="w-3 h-3" />
                          Has feedback
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submission Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {selectedSubmission.assignment ? 'Assignment' : 'Project'}
                </Badge>
                {getStatusBadge(selectedSubmission.status)}
              </div>

              <div>
                <h3 className="font-semibold text-lg">
                  {selectedSubmission.assignment?.title || selectedSubmission.project?.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedSubmission.assignment?.video?.course?.title ||
                   selectedSubmission.assignment?.video?.module?.course?.title ||
                   selectedSubmission.project?.module?.course?.title ||
                   'Course'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-medium">
                    {new Date(selectedSubmission.submittedAt).toLocaleString('en-IN')}
                  </p>
                </div>
                {selectedSubmission.reviewedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reviewed</p>
                    <p className="font-medium">
                      {new Date(selectedSubmission.reviewedAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
                {selectedSubmission.score !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="font-medium text-lg">{selectedSubmission.score}/100</p>
                  </div>
                )}
                {selectedSubmission.reviewer?.profile?.fullName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reviewed by</p>
                    <p className="font-medium">{selectedSubmission.reviewer.profile.fullName}</p>
                  </div>
                )}
              </div>

              {selectedSubmission.content && (
                <div>
                  <p className="text-sm font-medium mb-2">Your Submission</p>
                  <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap text-sm">
                    {selectedSubmission.content}
                  </div>
                </div>
              )}

              {selectedSubmission.fileName && (
                <div>
                  <p className="text-sm font-medium mb-2">Attached File</p>
                  <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span>{selectedSubmission.fileName}</span>
                  </div>
                </div>
              )}

              {selectedSubmission.feedback && (
                <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Instructor Feedback
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{selectedSubmission.feedback}</p>
                </div>
              )}

              {selectedSubmission.status === 'RESUBMIT' && (
                <Button className="w-full">
                  Resubmit Assignment
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MySubmissions;

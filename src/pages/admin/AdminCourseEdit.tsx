import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Video,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Assignment = {
  id: string;
  title: string;
  description: string;
  instructions?: string | null;
};

type VideoType = {
  id: string;
  title: string;
  videoUrl: string | null;
  durationMinutes: number;
  sortOrder: number;
  assignments?: Assignment[];
};

type Course = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  level: string;
  price: number;
  durationHours: number;
  videos?: VideoType[];
};

const AdminCourseEdit: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoType | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDuration, setVideoDuration] = useState(10);

  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [assignmentInstructions, setAssignmentInstructions] = useState('');

  useEffect(() => {
    fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when courseId changes only
  }, [courseId]);

  const fetchCourse = async () => {
    if (!courseId) {
      toast({
        title: 'Error',
        description: 'Course ID is missing',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/admin/courses/${courseId}`);

      if (!response.ok) {
        let errorMessage = 'Failed to load course';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        navigate('/admin/courses');
        return;
      }

      const data = await response.json();
      if (!data || !data.id) {
        toast({
          title: 'Error',
          description: 'Invalid course data received',
          variant: 'destructive',
        });
        navigate('/admin/courses');
        return;
      }

      setCourse({
        ...data,
        videos: Array.isArray(data.videos) ? data.videos : [],
      });
    } catch (error: unknown) {
      console.error('Error fetching course:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load course. Please check if backend is running.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openVideoDialog = (video?: VideoType) => {
    if (video) {
      setEditingVideo(video);
      setVideoTitle(video.title);
      setVideoDuration(video.durationMinutes);
    } else {
      setEditingVideo(null);
      setVideoTitle('');
      setVideoDuration(10);
    }
    setVideoDialogOpen(true);
  };

  const saveVideo = async () => {
    if (!videoTitle.trim() || !courseId) return;

    try {
      if (editingVideo) {
        await api.put(`/admin/videos/${editingVideo.id}`, {
          title: videoTitle,
          durationMinutes: videoDuration,
        });
        toast({ title: 'Video updated' });
      } else {
        await api.post(`/admin/courses/${courseId}/videos`, {
          title: videoTitle,
          durationMinutes: videoDuration,
        });
        toast({ title: 'Video created' });
      }
      setVideoDialogOpen(false);
      fetchCourse();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save video',
        variant: 'destructive',
      });
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Delete this video?')) return;
    try {
      await api.delete(`/admin/videos/${videoId}`);
      toast({ title: 'Video deleted' });
      fetchCourse();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete video',
        variant: 'destructive',
      });
    }
  };

  const openAssignmentDialog = (videoId: string, assignment?: Assignment | null) => {
    setSelectedVideoId(videoId);
    setEditingAssignmentId(assignment?.id ?? null);
    setAssignmentTitle(assignment?.title ?? '');
    setAssignmentDescription(assignment?.description ?? '');
    setAssignmentInstructions(assignment?.instructions ?? '');
    setAssignmentDialogOpen(true);
  };

  const saveAssignment = async () => {
    if (!assignmentTitle.trim() || !assignmentDescription.trim() || !selectedVideoId) return;
    try {
      if (editingAssignmentId) {
        await api.put(`/admin/assignments/${editingAssignmentId}`, {
          title: assignmentTitle,
          description: assignmentDescription,
          instructions: assignmentInstructions,
        });
        toast({ title: 'Assignment updated' });
      } else {
        await api.post('/admin/assignments', {
          videoId: selectedVideoId,
          title: assignmentTitle,
          description: assignmentDescription,
          instructions: assignmentInstructions,
        });
        toast({ title: 'Assignment created' });
      }
      setAssignmentDialogOpen(false);
      setEditingAssignmentId(null);
      fetchCourse();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save assignment',
        variant: 'destructive',
      });
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await api.delete(`/admin/assignments/${assignmentId}`);
      toast({ title: 'Assignment deleted' });
      fetchCourse();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete assignment',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-muted-foreground">Loading course...</div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Course not found</h2>
          <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist or couldn't be loaded.</p>
          <Button onClick={() => navigate('/admin/courses')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  const videos = course.videos || [];
  const totalVideos = videos.length;
  const uploadedVideos = videos.filter(v => v && v.videoUrl).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Link
          to="/admin/courses"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">{course.title}</h1>
            <div className="flex items-center gap-3">
              <Badge>{course.category.replace('_', ' ')}</Badge>
              <Badge variant="outline">{course.level}</Badge>
              <span className="text-sm text-muted-foreground">
                {uploadedVideos}/{totalVideos} videos uploaded
              </span>
            </div>
          </div>
          <Button onClick={() => openVideoDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Video
          </Button>
        </div>
      </div>

      {totalVideos > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Video Upload Progress</span>
            <span className="text-sm text-muted-foreground">
              {Math.round((uploadedVideos / totalVideos) * 100)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${(uploadedVideos / totalVideos) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {totalVideos === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <p className="text-muted-foreground mb-4">No videos yet. Add your first video to get started.</p>
            <Button onClick={() => openVideoDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Video
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="divide-y divide-border">
              {videos.filter(v => v && v.id).map(video => (
                <div key={video.id} className="p-4 hover:bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Video className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{video.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {video.durationMinutes} minutes
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {video.videoUrl ? (
                        <span className="inline-flex items-center gap-1 text-sm text-success">
                          <CheckCircle className="w-4 h-4" />
                          Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm text-warning">
                          <AlertCircle className="w-4 h-4" />
                          No video
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/videos/${video.id}/upload`)}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        {video.videoUrl ? 'Replace' : 'Upload'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openVideoDialog(video)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteVideo(video.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="ml-14 mt-2 flex flex-wrap items-center gap-2">
                    {(video.assignments || []).map((a) => (
                      <div key={a.id} className="flex items-center gap-1">
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          <FileText className="w-3 h-3 mr-1" />
                          {a.title || 'Untitled'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => openAssignmentDialog(video.id, a)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => deleteAssignment(a.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      onClick={() => openAssignmentDialog(video.id)}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Add Assignment
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={assignmentDialogOpen}
        onOpenChange={(open) => {
          setAssignmentDialogOpen(open);
          if (!open) setEditingAssignmentId(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAssignmentId ? 'Edit Assignment' : 'Add Assignment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Assignment Title *</label>
              <input
                type="text"
                value={assignmentTitle}
                onChange={e => setAssignmentTitle(e.target.value)}
                placeholder="e.g., Practice Exercise 1"
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea
                value={assignmentDescription}
                onChange={e => setAssignmentDescription(e.target.value)}
                placeholder="Describe what students need to do..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Instructions (Optional)</label>
              <textarea
                value={assignmentInstructions}
                onChange={e => setAssignmentInstructions(e.target.value)}
                placeholder="Step-by-step instructions..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAssignmentDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveAssignment}>{editingAssignmentId ? 'Update Assignment' : 'Create Assignment'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVideo ? 'Edit Video' : 'Add Video'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Video Title</label>
              <input
                type="text"
                value={videoTitle}
                onChange={e => setVideoTitle(e.target.value)}
                placeholder="e.g., Introduction to Variables"
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={videoDuration}
                onChange={e => setVideoDuration(parseInt(e.target.value, 10) || 0)}
                min={1}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveVideo}>{editingVideo ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourseEdit;

import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import SecureVideoPlayer from '@/components/SecureVideoPlayer';
import {
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronRight,
  Clock,
  ArrowLeft,
  Lock,
  AlertCircle,
  FileText,
  Send,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ================= TYPES ================= */

type Assignment = {
  id: string;
  title: string;
  description: string;
  instructions?: string;
};

type Project = {
  id: string;
  title: string;
  description: string;
  instructions?: string;
};

type Video = {
  id: string;
  title: string;
  durationMinutes: number;
  videoUrl?: string | null;
  isCompleted?: boolean;
  isLocked?: boolean;
  assignments?: Assignment[];
};

type Module = {
  id: string;
  title: string;
  videos: Video[];
};

type Course = {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  isEnrolled?: boolean;
};

/* ================= COMPONENT ================= */

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { isAuthenticated } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [currentVideo, setCurrentVideo] = useState<{
    moduleId: string;
    videoId: string;
  } | null>(null);

  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [submissionType, setSubmissionType] = useState<'assignment' | 'project'>('assignment');
  const [submissionId, setSubmissionId] = useState<string>('');
  const [submissionTitle, setSubmissionTitle] = useState<string>('');
  const [submissionDescription, setSubmissionDescription] = useState<string>('');
  const [submissionInstructions, setSubmissionInstructions] = useState<string>('');
  const [submissionContent, setSubmissionContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ================= FETCH COURSE PREVIEW ================= */

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        // First, fetch course preview (public endpoint)
        const previewResponse = await api.get(`/courses/${courseId}`);
        
        if (!previewResponse.ok) {
          if (previewResponse.status === 404) {
            toast({
              title: 'Course Not Found',
              description: 'This course does not exist',
              variant: 'destructive',
            });
          }
          setLoading(false);
          return;
        }

        const previewData = await previewResponse.json();
        setIsEnrolled(previewData.isEnrolled || false);

        // If enrolled, fetch full content with progress
        if (previewData.isEnrolled && isAuthenticated) {
          try {
            const contentResponse = await api.get(`/courses/${courseId}/content`);
            if (contentResponse.ok) {
              const contentData = await contentResponse.json();
              const mods = Array.isArray(contentData.modules) ? contentData.modules : [];
              setCourse({
                ...contentData,
                modules: mods,
                isEnrolled: true,
              });
            } else if (contentResponse.status !== 401) {
              // 401: session expired, auth:session-expired will redirect
              setCourse({
                ...previewData,
                modules: Array.isArray(previewData.modules) ? previewData.modules : [],
                isEnrolled: false,
              });
            }
          } catch (error) {
            setCourse({
              ...previewData,
              modules: Array.isArray(previewData.modules) ? previewData.modules : [],
              isEnrolled: false,
            });
          }
        } else {
          // Not enrolled - show preview with locked videos
          const rawModules = Array.isArray(previewData.modules) ? previewData.modules : [];
          const modulesWithLockedVideos = rawModules.map((module: Module) => ({
            ...module,
            videos: Array.isArray(module.videos) ? module.videos.map((video: Video) => ({
              ...video,
              isLocked: true,
            })) : [],
          }));

          setCourse({
            ...previewData,
            modules: modulesWithLockedVideos,
            isEnrolled: false,
          });
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error fetching course:', error);
        toast({
          title: 'Error',
          description: 'Failed to load course',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, isAuthenticated]);

  /* ================= INIT FIRST VIDEO ================= */

  useEffect(() => {
    if (!course || currentVideo) return;
    const mods = Array.isArray(course.modules) ? course.modules : [];
    if (mods.length === 0) return;

    // Find first unlocked video
    for (const module of mods) {
      const vids = Array.isArray(module.videos) ? module.videos : [];
      const firstUnlockedVideo = vids.find(v => !v.isLocked);
      if (firstUnlockedVideo) {
        setCurrentVideo({
          moduleId: module.id,
          videoId: firstUnlockedVideo.id,
        });
        setExpandedModules([module.id]);
        return;
      }
    }

    // If no unlocked videos, show first video (locked)
    const firstMod = mods[0];
    const firstVids = Array.isArray(firstMod.videos) ? firstMod.videos : [];
    if (firstVids.length) {
      setCurrentVideo({
        moduleId: firstMod.id,
        videoId: firstVids[0].id,
      });
      setExpandedModules([firstMod.id]);
    }
  }, [course, currentVideo]);

  /* ================= LOADING / ERROR ================= */

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading course...</div>;
  }

  if (!course) {
    return <Navigate to="/student/marketplace" />;
  }

  /* ================= PROGRESS ================= */

  const modules = Array.isArray(course.modules) ? course.modules : [];
  const totalVideos = modules.reduce(
    (sum, m) => sum + (Array.isArray(m.videos) ? m.videos.length : 0),
    0
  );

  const completedVideos = modules.flatMap(m =>
    (Array.isArray(m.videos) ? m.videos : []).filter(v => v.isCompleted === true)
  ).length;

  const progress = totalVideos
    ? Math.round((completedVideos / totalVideos) * 100)
    : 0;

  /* ================= HELPERS ================= */

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getCurrentVideo = () => {
    if (!currentVideo) return null;
    const module = modules.find(m => m.id === currentVideo.moduleId);
    const video = module?.videos?.find(v => v.id === currentVideo.videoId);
    return { module, video };
  };

  const current = getCurrentVideo();

  /**
   * Check if a video can be played (previous video must be completed)
   * First video is always playable if enrolled
   */
  const canPlayVideo = (moduleId: string, videoId: string): boolean => {
    if (!course.isEnrolled) return false;

    // Flatten all videos in order
    const allVideos: { moduleId: string; videoId: string; isCompleted: boolean }[] = [];
    for (const module of modules) {
      const vids = Array.isArray(module.videos) ? module.videos : [];
      for (const video of vids) {
        allVideos.push({
          moduleId: module.id,
          videoId: video.id,
          isCompleted: video.isCompleted || false,
        });
      }
    }

    // Find the index of the current video
    const currentIndex = allVideos.findIndex(v => v.videoId === videoId);
    
    // First video is always playable
    if (currentIndex === 0) return true;
    
    // Check if previous video is completed
    if (currentIndex > 0) {
      return allVideos[currentIndex - 1].isCompleted;
    }

    return true;
  };

  const openSubmissionDialog = (
    type: 'assignment' | 'project',
    item: Assignment | Project
  ) => {
    setSubmissionType(type);
    setSubmissionId(item.id);
    setSubmissionTitle(item.title);
    setSubmissionDescription(item.description);
    setSubmissionInstructions(item.instructions || '');
    setSubmissionContent('');
    setSubmissionDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!submissionContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your submission content',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const endpoint = submissionType === 'assignment'
        ? `/submissions/assignment/${submissionId}`
        : `/submissions/project/${submissionId}`;
      const response = await api.post(endpoint, { content: submissionContent });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: 'Success!',
          description: `${submissionType === 'assignment' ? 'Assignment' : 'Project'} submitted successfully`,
        });
        setSubmissionDialogOpen(false);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to submit',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: 'Failed to submit',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle video selection with completion check
   */
  const handleVideoSelect = (moduleId: string, videoId: string, isLocked: boolean) => {
    if (isLocked) {
      toast({
        title: 'Video Locked',
        description: 'Please enroll in this course to access videos',
        variant: 'destructive',
      });
      return;
    }

    if (!canPlayVideo(moduleId, videoId)) {
      toast({
        title: 'Complete Previous Video',
        description: 'You must complete the previous video before accessing this one.',
        variant: 'destructive',
      });
      return;
    }

    setCurrentVideo({
      moduleId: moduleId,
      videoId: videoId,
    });
  };

  /**
   * Auto-advance to next video after completion
   */
  const handleVideoComplete = () => {
    // Find next video BEFORE updating state
    const allVideos: { moduleId: string; video: Video }[] = [];
    for (const module of modules) {
      const vids = Array.isArray(module.videos) ? module.videos : [];
      for (const video of vids) {
        allVideos.push({ moduleId: module.id, video });
      }
    }
    const currentIndex = allVideos.findIndex(v => v.video.id === current?.video?.id);
    const nextVideo = currentIndex >= 0 && currentIndex < allVideos.length - 1 
      ? allVideos[currentIndex + 1] 
      : null;

    // Update local state to show completion
    setCourse(prev => {
      if (!prev) return prev;
      const prevMods = Array.isArray(prev.modules) ? prev.modules : [];
      return {
        ...prev,
        modules: prevMods.map(m => ({
          ...m,
          videos: (Array.isArray(m.videos) ? m.videos : []).map(v =>
            v.id === current?.video?.id ? { ...v, isCompleted: true } : v
          ),
        })),
      };
    });

    // Auto-advance to next video after a short delay
    if (nextVideo) {
      setTimeout(() => {
        setCurrentVideo({
          moduleId: nextVideo.moduleId,
          videoId: nextVideo.video.id,
        });
        // Expand the module if different
        if (!expandedModules.includes(nextVideo.moduleId)) {
          setExpandedModules(prev => [...prev, nextVideo.moduleId]);
        }
        toast({
          title: 'Next Video Unlocked! 🎉',
          description: `Now playing: ${nextVideo.video.title}`,
        });
      }, 1000);
    } else {
      toast({
        title: 'Course Completed! 🎉',
        description: 'Congratulations! You have finished all videos.',
      });
    }
  };

  /* ================= UI ================= */

  return (
    <div className="animate-fade-in">
      <Link
        to="/student/my-courses"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Courses
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* VIDEO PLAYER */}
        <div className="lg:col-span-2 space-y-4">
          {current?.video && (
            <SecureVideoPlayer
              videoId={current.video.id}
              videoUrl={current.video.videoUrl || null}
              title={current.video.title}
              isLocked={current.video.isLocked || !course.isEnrolled}
              isCompleted={current.video.isCompleted}
              canPlay={canPlayVideo(currentVideo?.moduleId || '', current.video.id)}
              onComplete={handleVideoComplete}
            />
          )}

          {current?.video && (
            <div className="bg-card rounded-xl border p-6">
              <p className="text-sm text-primary font-medium mb-1">
                {current.module?.title}
              </p>
              <h2 className="text-xl font-semibold mb-2">
                {current.video.title}
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {current.video.durationMinutes} mins
              </div>
            </div>
          )}

          {/* Security notice */}
          {course.isEnrolled && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-600">Content Protection Active</p>
                <p className="text-amber-600/80">
                  Videos are protected. Screen recording and downloads are disabled.
                  You must watch at least 80% to mark a video as complete.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CURRICULUM */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border p-4">
            <h1 className="text-lg font-semibold mb-2">{course.title}</h1>
            <Progress value={progress} className="h-2" />
            <p className="text-sm mt-2 text-muted-foreground">
              {progress}% completed • {completedVideos}/{totalVideos} videos
            </p>
          </div>

          <div className="bg-card rounded-xl border overflow-hidden">
            {modules.map((module, moduleIndex) => {
              const moduleVideos = Array.isArray(module.videos) ? module.videos : [];
              const isExpanded = expandedModules.includes(module.id);
              const moduleCompleted = moduleVideos.every(v => v.isCompleted);
              const moduleProgress = moduleVideos.filter(v => v.isCompleted).length;

              return (
                <div key={module.id} className="border-b last:border-b-0">
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full px-4 py-4 flex items-center gap-3 text-left hover:bg-muted/50"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium flex items-center gap-2">
                        {module.title}
                        {moduleCompleted && (
                          <CheckCircle className="w-4 h-4 text-success" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {moduleProgress}/{moduleVideos.length} videos completed
                      </p>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="bg-muted/30">
                      {moduleVideos.map((video, videoIndex) => {
                        const isLocked = video.isLocked || (!course.isEnrolled && !isAuthenticated);
                        const isSelected = currentVideo?.videoId === video.id;
                        const canPlay = canPlayVideo(module.id, video.id);

                        // Determine if this video requires previous completion
                        const needsPreviousCompletion = course.isEnrolled && !isLocked && !canPlay;

                        return (
                          <React.Fragment key={video.id}>
                            <button
                              onClick={() => handleVideoSelect(module.id, video.id, isLocked)}
                              disabled={isLocked}
                              className={cn(
                                'w-full px-4 py-3 flex items-center gap-3 text-left transition-colors',
                                isLocked
                                  ? 'opacity-60 cursor-not-allowed'
                                  : needsPreviousCompletion
                                  ? 'opacity-70 cursor-pointer'
                                  : 'hover:bg-muted/50 cursor-pointer',
                                isSelected &&
                                  !isLocked &&
                                  'bg-primary/5 border-l-2 border-primary'
                              )}
                            >
                              {isLocked ? (
                                <Lock className="w-4 h-4 text-muted-foreground" />
                              ) : video.isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-success" />
                              ) : needsPreviousCompletion ? (
                                <Lock className="w-4 h-4 text-amber-500" />
                              ) : (
                                <Circle className="w-4 h-4 text-muted-foreground" />
                              )}
                              <div className="flex-1">
                                <p className={cn(
                                  "text-sm",
                                  needsPreviousCompletion && "text-muted-foreground"
                                )}>
                                  {video.title}
                                </p>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-muted-foreground">
                                    {video.durationMinutes} mins
                                    {needsPreviousCompletion && (
                                      <span className="text-amber-500 ml-2">• Complete previous first</span>
                                    )}
                                  </p>
                                  {(video.assignments?.length ?? 0) > 0 && (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1">
                                      <FileText className="w-2 h-2 mr-0.5" />
                                      {video.assignments.length} Assignment{video.assignments.length !== 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </button>
                            {course.isEnrolled && video.isCompleted && (video.assignments || []).map((a) => (
                              <div key={a.id} className="ml-8 mb-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openSubmissionDialog('assignment', a);
                                  }}
                                >
                                  <Send className="w-3 h-3 mr-1" />
                                  Submit: {a.title || 'Assignment'}
                                </Button>
                              </div>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={submissionDialogOpen} onOpenChange={setSubmissionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Submit {submissionType === 'assignment' ? 'Assignment' : 'Project'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{submissionTitle}</h3>
                <Badge variant="outline" className="text-xs">
                  {submissionType === 'assignment' ? 'Assignment' : 'Project'}
                </Badge>
              </div>
              {submissionDescription && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 text-foreground">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {submissionDescription}
                  </p>
                </div>
              )}
              {submissionInstructions && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-medium mb-2 text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Instructions
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {submissionInstructions}
                  </p>
                </div>
              )}
            </div>
            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-2">Your Submission *</label>
              <textarea
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Write your answer, paste your code, or describe your solution here..."
                rows={8}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Your submission will be sent to the instructor for review.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setSubmissionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetail;

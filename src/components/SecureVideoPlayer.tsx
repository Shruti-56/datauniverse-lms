import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, Lock, CheckCircle, AlertTriangle, Shield, Upload, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SecureVideoPlayerProps {
  videoId: string;
  videoUrl: string | null;
  title: string;
  isLocked: boolean;
  isCompleted?: boolean;
  canPlay: boolean;
  onComplete?: () => void;
}

/**
 * Check if URL is a direct video file (S3 signed URL)
 */
const isDirectVideoUrl = (url: string): boolean => {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url.includes('s3.') || url.includes('amazonaws.com');
};

const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({
  videoId,
  videoUrl,
  title,
  isLocked,
  isCompleted = false,
  canPlay = true,
  onComplete,
}) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWatched, setHasWatched] = useState(isCompleted);
  const [isMarking, setIsMarking] = useState(false);
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 1.75, 2];

  // Reset state when video changes
  useEffect(() => {
    setHasWatched(isCompleted);
    setWatchProgress(0);
    setVideoDuration(0);
    setIsMarking(false);
    setPlaybackSpeed(1);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = 1;
    }
  }, [videoId, isCompleted]);

  // Apply speed to video element whenever it changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Detect screen recording
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (videoRef.current) {
          videoRef.current.pause();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Prevent keyboard shortcuts for screen recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) ||
        (e.key === 'PrintScreen') ||
        (e.metaKey && e.shiftKey && e.key === 'r') ||
        (e.ctrlKey && e.shiftKey && e.key === 'r')
      ) {
        e.preventDefault();
        toast({
          title: 'Screen Recording Blocked',
          description: 'Screen recording is not allowed during video playback.',
          variant: 'destructive',
        });
        setIsScreenRecording(true);
        if (videoRef.current) {
          videoRef.current.pause();
        }
        setTimeout(() => setIsScreenRecording(false), 3000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Disable right-click on video
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast({
        title: 'Action Blocked',
        description: 'Right-click is disabled for video content.',
        variant: 'destructive',
      });
    };

    container.addEventListener('contextmenu', handleContextMenu);
    return () => container.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Track watch progress
  const handleTimeUpdate = () => {
    if (videoRef.current && videoDuration > 0) {
      const progress = (videoRef.current.currentTime / videoDuration) * 100;
      setWatchProgress(progress);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  // Auto-mark complete when video ends
  const handleVideoEnd = async () => {
    if (!hasWatched) {
      await handleMarkComplete();
    }
  };

  const handleMarkComplete = async () => {
    if (hasWatched || isMarking) return;
    
    // Must watch at least 80% to mark complete (only if video has duration)
    if (videoDuration > 0 && watchProgress < 80) {
      toast({
        title: 'Cannot Mark Complete',
        description: 'Please watch at least 80% of the video to mark it as complete.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsMarking(true);
    try {
      const response = await api.post(`/progress/video/${videoId}/complete`);
      if (response.ok) {
        setHasWatched(true);
        toast({
          title: 'Video Completed! ✓',
          description: 'Your progress has been saved.',
        });
        onComplete?.();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to save progress.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error marking video complete:', error);
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsMarking(false);
    }
  };

  // Screen recording warning overlay
  if (isScreenRecording) {
    return (
      <div className="aspect-video bg-red-900 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4 animate-pulse" />
          <p className="text-red-100 font-bold text-xl mb-2">Screen Recording Detected!</p>
          <p className="text-red-200 text-sm">
            Video playback has been paused for security reasons.
          </p>
        </div>
      </div>
    );
  }

  // Locked state (not enrolled)
  if (isLocked) {
    return (
      <div className="aspect-video bg-gradient-to-br from-primary/80 to-primary rounded-xl flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 text-primary-foreground mx-auto mb-4" />
          <p className="text-primary-foreground font-medium mb-2">Video Locked</p>
          <p className="text-primary-foreground/60 text-sm">
            Enroll in this course to unlock all videos
          </p>
        </div>
      </div>
    );
  }

  // Must complete previous video first
  if (!canPlay) {
    return (
      <div className="aspect-video bg-gradient-to-br from-amber-500/20 to-amber-600/20 border-2 border-amber-500/50 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <p className="text-amber-500 font-medium mb-2">Complete Previous Video First</p>
          <p className="text-amber-400/80 text-sm max-w-xs">
            You must finish watching the previous video before accessing this one.
          </p>
        </div>
      </div>
    );
  }

  // No video URL - waiting for admin to upload
  if (!videoUrl) {
    return (
      <div className="space-y-4">
        <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
          <div className="text-center">
            <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">{title}</p>
            <p className="text-muted-foreground text-sm">Video pending upload by admin</p>
          </div>
        </div>
      </div>
    );
  }

  // Direct video file (S3, MP4, etc.) with security features
  if (isDirectVideoUrl(videoUrl)) {
    return (
      <div className="space-y-4">
        <div 
          ref={containerRef}
          className="aspect-video rounded-xl overflow-hidden bg-black relative select-none"
          style={{ userSelect: 'none' }}
        >
          {/* Institute logo watermark */}
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            <img
              src={import.meta.env.VITE_INSTITUTE_LOGO_URL || '/institute-logo.png'}
              alt=""
              className="max-w-[20%] max-h-[20%] w-auto h-auto object-contain opacity-25 rotate-[-15deg]"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
            <div className="text-white text-lg font-bold rotate-[-30deg] transform opacity-20 hidden" style={{ display: 'none' }}>
              {import.meta.env.VITE_INSTITUTE_NAME || 'DataUniverse'}
            </div>
          </div>
          
          {/* Security badge */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
            <Shield className="w-3 h-3" />
            Protected
          </div>

          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            controlsList="nodownload"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleVideoEnd}
            controls
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Speed:</span>
          <div className="flex gap-1">
            {SPEED_OPTIONS.map(speed => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {speed === 1 ? '1×' : `${speed}×`}
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        {videoDuration > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Watch Progress</span>
              <span>{Math.round(watchProgress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  watchProgress >= 80 ? 'bg-success' : 'bg-primary'
                }`}
                style={{ width: `${watchProgress}%` }}
              />
            </div>
            {watchProgress < 80 && !hasWatched && (
              <p className="text-xs text-muted-foreground">
                Watch at least 80% to mark as complete
              </p>
            )}
          </div>
        )}

        {/* Mark Complete Button */}
        {!hasWatched && (
          <Button
            onClick={handleMarkComplete}
            disabled={isMarking || (videoDuration > 0 && watchProgress < 80)}
            className="w-full"
            variant={watchProgress >= 80 ? 'default' : 'outline'}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {isMarking ? 'Saving...' : watchProgress < 80 && videoDuration > 0 
              ? `Watch ${Math.ceil(80 - watchProgress)}% more` 
              : 'Mark as Complete'}
          </Button>
        )}
        
        {/* Completed State */}
        {hasWatched && (
          <div className="flex items-center justify-center gap-2 text-success py-2 bg-success/10 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Video Completed</span>
          </div>
        )}
      </div>
    );
  }

  // Fallback for unknown URL format
  return (
    <div className="space-y-4">
      <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center">
        <div className="text-center p-6">
          <PlayCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-medium mb-2">{title}</p>
          <p className="text-muted-foreground text-sm">Unsupported video format</p>
        </div>
      </div>
    </div>
  );
};

export default SecureVideoPlayer;

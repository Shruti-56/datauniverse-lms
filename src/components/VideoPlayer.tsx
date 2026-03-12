import React, { useState } from 'react';
import { PlayCircle, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  videoId: string;
  videoUrl: string | null;
  title: string;
  isLocked: boolean;
  isCompleted?: boolean;
  onComplete?: () => void;
}

/**
 * Extract YouTube video ID from various URL formats
 */
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

/**
 * Check if URL is a Vimeo video
 */
const getVimeoVideoId = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
};

/**
 * Check if URL is a direct video file
 */
const isDirectVideoUrl = (url: string): boolean => {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  videoUrl,
  title,
  isLocked,
  isCompleted = false,
  onComplete,
}) => {
  const [hasWatched, setHasWatched] = useState(isCompleted);
  const [isMarking, setIsMarking] = useState(false);

  const logoWatermark = (
    <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
      <img
        src={import.meta.env.VITE_INSTITUTE_LOGO_URL || '/institute-logo.png'}
        alt=""
        className="max-w-[20%] max-h-[20%] w-auto h-auto object-contain opacity-25 rotate-[-15deg]"
      />
    </div>
  );

  const handleMarkComplete = async () => {
    if (hasWatched || isMarking) return;
    
    setIsMarking(true);
    try {
      const response = await api.post(`/progress/video/${videoId}/complete`);
      if (response.ok) {
        setHasWatched(true);
        toast({
          title: 'Video Completed!',
          description: 'Your progress has been saved.',
        });
        onComplete?.();
      }
    } catch (error) {
      console.error('Error marking video complete:', error);
    } finally {
      setIsMarking(false);
    }
  };

  // Locked state
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

  // No video URL - show placeholder
  if (!videoUrl) {
    return (
      <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <PlayCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-medium mb-2">{title}</p>
          <p className="text-muted-foreground text-sm">Video coming soon</p>
        </div>
      </div>
    );
  }

  // YouTube embed
  const youtubeId = getYouTubeVideoId(videoUrl);
  if (youtubeId) {
    return (
      <div className="space-y-4">
        <div className="aspect-video rounded-xl overflow-hidden bg-black relative">
          {logoWatermark}
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        {!hasWatched && (
          <Button
            onClick={handleMarkComplete}
            disabled={isMarking}
            className="w-full"
            variant="outline"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {isMarking ? 'Marking...' : 'Mark as Complete'}
          </Button>
        )}
        {hasWatched && (
          <div className="flex items-center justify-center gap-2 text-success">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Completed</span>
          </div>
        )}
      </div>
    );
  }

  // Vimeo embed
  const vimeoId = getVimeoVideoId(videoUrl);
  if (vimeoId) {
    return (
      <div className="space-y-4">
        <div className="aspect-video rounded-xl overflow-hidden bg-black relative">
          {logoWatermark}
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}`}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        {!hasWatched && (
          <Button
            onClick={handleMarkComplete}
            disabled={isMarking}
            className="w-full"
            variant="outline"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {isMarking ? 'Marking...' : 'Mark as Complete'}
          </Button>
        )}
        {hasWatched && (
          <div className="flex items-center justify-center gap-2 text-success">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Completed</span>
          </div>
        )}
      </div>
    );
  }

  // Direct video file (MP4, WebM, etc.)
  if (isDirectVideoUrl(videoUrl)) {
    return (
      <div className="space-y-4">
        <div className="aspect-video rounded-xl overflow-hidden bg-black relative">
          {logoWatermark}
          <video
            src={videoUrl}
            controls
            className="w-full h-full relative z-0"
            onEnded={handleMarkComplete}
          >
            Your browser does not support the video tag.
          </video>
        </div>
        {!hasWatched && (
          <Button
            onClick={handleMarkComplete}
            disabled={isMarking}
            className="w-full"
            variant="outline"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {isMarking ? 'Marking...' : 'Mark as Complete'}
          </Button>
        )}
        {hasWatched && (
          <div className="flex items-center justify-center gap-2 text-success">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Completed</span>
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
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm"
          >
            Open video in new tab
          </a>
        </div>
      </div>
      {!hasWatched && (
        <Button
          onClick={handleMarkComplete}
          disabled={isMarking}
          className="w-full"
          variant="outline"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {isMarking ? 'Marking...' : 'Mark as Complete'}
        </Button>
      )}
    </div>
  );
};

export default VideoPlayer;

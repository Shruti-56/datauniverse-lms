import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Video, CheckCircle, AlertCircle } from 'lucide-react';

type VideoInfo = {
  id: string;
  title: string;
  videoUrl: string | null;
  durationMinutes: number;
  course?: { id: string; title: string };
  module?: {
    title: string;
    course: { title: string };
  };
};

const AdminVideoUpload: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when videoId changes only
  }, [videoId]);

  const fetchVideo = async () => {
    if (!videoId) {
      toast({
        title: 'Error',
        description: 'Video ID is missing',
        variant: 'destructive',
      });
      setLoading(false);
      navigate('/admin/courses');
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/admin/videos/${videoId}`);
      if (response.ok) {
        const data = await response.json();
        setVideo(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load video' }));
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to load video details',
          variant: 'destructive',
        });
        navigate('/admin/courses');
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      toast({
        title: 'Error',
        description: 'Failed to load video. Please try again.',
        variant: 'destructive',
      });
      navigate('/admin/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a valid video file (MP4, WebM, MOV, AVI)',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file size (max 2GB)
      if (file.size > 2 * 1024 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Maximum file size is 2GB',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !videoId) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned upload URL from backend
      const urlResponse = await api.post(`/admin/videos/${videoId}/upload-url`, {
        filename: selectedFile.name,
        contentType: selectedFile.type,
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, key } = await urlResponse.json();

      // Step 2: Upload file directly to S3
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', selectedFile.type);
        xhr.send(selectedFile);
      });

      // Step 3: Confirm upload to backend
      const confirmResponse = await api.put(`/admin/videos/${videoId}/confirm-upload`, {
        key,
      });

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload');
      }

      toast({
        title: 'Upload Successful! 🎉',
        description: 'Video has been uploaded to AWS S3',
      });

      // Refresh video data
      fetchVideo();
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload video',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Loading video details...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Video not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          to="/admin/courses"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Link>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Upload Video</h1>
        <p className="text-muted-foreground">Upload video content to AWS S3</p>
      </div>

      {/* Video Info Card */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <Video className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground">{video.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {video.course?.title ?? video.module?.course?.title} → {video.module?.title ?? 'Content'}
            </p>
            <p className="text-sm text-muted-foreground">
              Duration: {video.durationMinutes} minutes
            </p>
            <div className="mt-2">
              {video.videoUrl ? (
                <span className="inline-flex items-center gap-1 text-sm text-success">
                  <CheckCircle className="w-4 h-4" />
                  Video uploaded
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm text-warning">
                  <AlertCircle className="w-4 h-4" />
                  No video uploaded
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {video.videoUrl ? 'Replace Video' : 'Upload Video'}
        </h3>

        <div className="space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id="video-upload"
            />
            <label
              htmlFor="video-upload"
              className="cursor-pointer block"
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-medium">
                {selectedFile ? selectedFile.name : 'Click to select a video file'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                MP4, WebM, MOV, or AVI • Max 2GB
              </p>
              {selectedFile && (
                <p className="text-sm text-primary mt-2">
                  Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}
            </label>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uploading to S3...</span>
                <span className="text-foreground font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>Uploading... {uploadProgress}%</>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload to AWS S3
              </>
            )}
          </Button>

          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Select a video file from your computer</li>
              <li>Click "Upload to AWS S3"</li>
              <li>Video is uploaded directly to your S3 bucket</li>
              <li>Students will be able to stream the video</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminVideoUpload;

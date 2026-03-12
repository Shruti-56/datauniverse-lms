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
import { Video, Plus, Edit2, Trash2, Upload, Star, Loader2, Eye } from 'lucide-react';

type AlumniVideo = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  studentName: string | null;
  studentRole: string | null;
  company: string | null;
  rating: number | null;
  isVisible: boolean;
  sortOrder: number;
  createdAt: string;
};

const AdminAlumniVideos: React.FC = () => {
  const [videos, setVideos] = useState<AlumniVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingVideo, setEditingVideo] = useState<AlumniVideo | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentRole, setStudentRole] = useState('');
  const [company, setCompany] = useState('');
  const [rating, setRating] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('0');
  const [isVisible, setIsVisible] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/alumni/videos');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load videos' }));
        throw new Error(errorData.error || 'Failed to load alumni videos');
      }

      const data = await response.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      console.error('Error fetching videos:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load alumni videos',
        variant: 'destructive',
      });
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const openDialog = (video?: AlumniVideo) => {
    if (video) {
      setEditingVideo(video);
      setTitle(video.title);
      setDescription(video.description || '');
      setStudentName(video.studentName || '');
      setStudentRole(video.studentRole || '');
      setCompany(video.company || '');
      setRating(video.rating?.toString() || '');
      setSortOrder(video.sortOrder.toString());
      setIsVisible(video.isVisible);
      setVideoUrl(video.videoUrl);
    } else {
      setEditingVideo(null);
      setTitle('');
      setDescription('');
      setStudentName('');
      setStudentRole('');
      setCompany('');
      setRating('');
      setSortOrder('0');
      setIsVisible(true);
      setVideoFile(null);
      setVideoUrl('');
    }
    setShowDialog(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    setUploading(true);

    try {
      // Get upload URL
      const uploadResponse = await api.post('/admin/alumni/videos/upload-url', {
        fileName: file.name,
        fileType: file.type,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, fileUrl } = await uploadResponse.json();

      if (!uploadUrl || !fileUrl) {
        throw new Error('Invalid upload URL response');
      }

      // Upload to S3
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResult.ok) {
        const errorText = await uploadResult.text().catch(() => 'Unknown error');
        console.error('S3 upload error:', errorText);
        throw new Error(`Failed to upload video: ${uploadResult.status} ${uploadResult.statusText}`);
      }

      setVideoUrl(fileUrl);
      toast({
        title: 'Success',
        description: 'Video uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload video',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const saveVideo = async () => {
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    if (!editingVideo && !videoUrl) {
      toast({
        title: 'Error',
        description: 'Please upload a video',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (!videoUrl) {
        toast({
          title: 'Error',
          description: 'Please upload a video first',
          variant: 'destructive',
        });
        return;
      }

      const data = {
        title,
        description: description || null,
        studentName: studentName || null,
        studentRole: studentRole || null,
        company: company || null,
        rating: rating ? parseInt(rating) : null,
        sortOrder: parseInt(sortOrder) || 0,
        isVisible,
        videoUrl,
      };

      let response;
      if (editingVideo) {
        response = await api.put(`/admin/alumni/videos/${editingVideo.id}`, data);
      } else {
        response = await api.post('/admin/alumni/videos', data);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save video' }));
        throw new Error(errorData.error || 'Failed to save video');
      }

      toast({ 
        title: editingVideo ? 'Video updated' : 'Video created',
        description: 'Alumni video saved successfully',
      });
      setShowDialog(false);
      fetchVideos();
    } catch (error: unknown) {
      console.error('Error saving video:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save video',
        variant: 'destructive',
      });
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm('Delete this alumni video?')) return;

    try {
      await api.delete(`/admin/alumni/videos/${id}`);
      toast({ title: 'Video deleted' });
      fetchVideos();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete video',
        variant: 'destructive',
      });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Alumni Videos</h1>
          <p className="text-muted-foreground">Manage alumni feedback and testimonial videos</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Video
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-card rounded-xl border">
            <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No alumni videos yet</p>
          </div>
        ) : (
          videos.map((video) => (
            <div key={video.id} className="bg-card rounded-xl border overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {video.videoUrl ? (
                  <video
                    src={video.videoUrl}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                {!video.isVisible && (
                  <Badge className="absolute top-2 right-2 bg-muted">Hidden</Badge>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">{video.title}</h3>
                {video.studentName && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {video.studentName}
                    {video.company && ` • ${video.company}`}
                  </p>
                )}
                {video.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < video.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDialog(video)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
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
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVideo ? 'Edit Alumni Video' : 'Add Alumni Video'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                placeholder="Alumni Success Story"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background resize-none"
                placeholder="Video description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Student Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <input
                  type="text"
                  value={studentRole}
                  onChange={(e) => setStudentRole(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                  placeholder="Data Scientist"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                placeholder="Google"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                />
              </div>
            </div>

            {!editingVideo && (
              <div>
                <label className="block text-sm font-medium mb-2">Video File *</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                />
                {uploading && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  </div>
                )}
                {videoUrl && !uploading && (
                  <p className="text-sm text-success mt-2">✓ Video uploaded</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isVisible"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isVisible" className="text-sm">Visible to students</label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveVideo}>
                {editingVideo ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAlumniVideos;

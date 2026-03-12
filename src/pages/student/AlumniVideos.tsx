import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Video, Star, Loader2, Play } from 'lucide-react';
import VideoWithWatermark from '@/components/VideoWithWatermark';

type AlumniVideo = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  studentName: string | null;
  studentRole: string | null;
  company: string | null;
  rating: number | null;
};

const AlumniVideos: React.FC = () => {
  const [videos, setVideos] = useState<AlumniVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<AlumniVideo | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const response = await api.get('/alumni/videos');
        if (response.ok) {
          const data = await response.json();
          setVideos(data);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Alumni Success Stories</h1>
        <p className="text-muted-foreground">Hear from our successful graduates</p>
      </div>

      {videos.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 text-center">
          <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No alumni videos available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-card rounded-xl border overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedVideo(video)}
            >
              <div className="aspect-video bg-muted relative">
                {video.videoUrl ? (
                  <video
                    src={video.videoUrl}
                    className="w-full h-full object-cover"
                    controls={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="w-16 h-16 text-white" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-2">{video.title}</h3>
                {video.studentName && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {video.studentName}
                    {video.company && ` • ${video.company}`}
                  </p>
                )}
                {video.rating && (
                  <div className="flex items-center gap-1">
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div className="bg-card rounded-xl max-w-4xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <VideoWithWatermark
                videoUrl={selectedVideo.videoUrl}
                title={selectedVideo.title}
              />
            </div>
            <h2 className="text-2xl font-bold mb-2">{selectedVideo.title}</h2>
            {selectedVideo.studentName && (
              <p className="text-muted-foreground mb-4">
                {selectedVideo.studentName}
                {selectedVideo.studentRole && ` • ${selectedVideo.studentRole}`}
                {selectedVideo.company && ` at ${selectedVideo.company}`}
              </p>
            )}
            {selectedVideo.description && (
              <p className="text-muted-foreground">{selectedVideo.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniVideos;

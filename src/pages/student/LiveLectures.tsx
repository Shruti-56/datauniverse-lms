import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Radio, Link2, Video, Loader2, User } from 'lucide-react';
import VideoWithWatermark from '@/components/VideoWithWatermark';

type Lecture = {
  id: string;
  title: string;
  meetingLink: string | null;
  scheduledAt: string;
  durationMinutes: number;
  recordingUrl: string | null;
  batch: { id: string; name: string };
  instructor: { id: string; profile: { fullName: string } | null };
  attendances: { attended: boolean }[];
};

const LiveLectures: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [upcoming, setUpcoming] = useState<Lecture[]>([]);
  const [past, setPast] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [loadingRecordingId, setLoadingRecordingId] = useState<string | null>(null);

  // Open recording from email link: ?recording=lectureId
  useEffect(() => {
    const lectureId = searchParams.get('recording');
    if (!lectureId) return;
    (async () => {
      try {
        const res = await api.get(`/live-lectures/${lectureId}/recording-url`);
        if (res.ok) {
          const { url } = await res.json();
          setRecordingUrl(url);
        } else {
          toast({ title: 'Recording not available', description: 'You may not have access or the link has expired.', variant: 'destructive' });
        }
      } catch (e) {
        toast({ title: 'Error', description: 'Failed to load recording', variant: 'destructive' });
      }
      // Remove query from URL so closing modal doesn't re-open
      setSearchParams({}, { replace: true });
    })();
  }, [searchParams, setSearchParams]);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const res = await api.get('/live-lectures');
      if (res.ok) {
        const data = await res.json();
        setUpcoming(data.upcoming || []);
        setPast(data.past || []);
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load live lectures', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLectures(); }, []);

  const openRecording = async (lecture: Lecture) => {
    if (!lecture.recordingUrl) return;
    setLoadingRecordingId(lecture.id);
    setRecordingUrl(null);
    try {
      const res = await api.get(`/live-lectures/${lecture.id}/recording-url`);
      if (res.ok) {
        const { url } = await res.json();
        setRecordingUrl(url);
      } else {
        toast({ title: 'Error', description: (await res.json()).error || 'Recording not available', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load recording', variant: 'destructive' });
    } finally {
      setLoadingRecordingId(null);
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
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Live Lectures</h1>
        <p className="text-muted-foreground">Only for students in a regular batch (registered by admin). Here you see your batch&apos;s live lectures: daily join-link emails (10 min before) and recordings of those lectures once uploaded. Course videos in My Learning are separate—those are uploaded video lectures for enrolled courses, not live lecture recordings.</p>
      </div>

      {upcoming.length > 0 && (() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        const todayLectures = upcoming.filter((l) => {
          const d = new Date(l.scheduledAt);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === todayStart.getTime();
        });
        const tomorrowLectures = upcoming.filter((l) => {
          const d = new Date(l.scheduledAt);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === tomorrowStart.getTime();
        });
        const renderLecture = (l: Lecture) => (
          <div key={l.id} className="bg-card rounded-xl border p-4">
            <p className="font-medium">{l.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{l.batch.name}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <User className="w-4 h-4" /> {l.instructor.profile?.fullName || 'Instructor'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(l.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {l.durationMinutes} min
            </p>
            <Button className="mt-3 gap-2" asChild>
              <a href={`/student/live-lectures/join?lectureId=${l.id}`} target="_blank" rel="noopener noreferrer">
                <Link2 className="w-4 h-4" /> Join Live
              </a>
            </Button>
          </div>
        );
        return (
          <div className="space-y-6">
            {todayLectures.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Today&apos;s lecture{todayLectures.length > 1 ? 's' : ''}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {todayLectures.map(renderLecture)}
                </div>
              </div>
            )}
            {tomorrowLectures.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Tomorrow&apos;s lecture{tomorrowLectures.length > 1 ? 's' : ''}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {tomorrowLectures.map(renderLecture)}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {past.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Recorded lectures</h2>
          <p className="text-sm text-muted-foreground">All past live lectures. Watch recordings when available.</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {past.map((l) => (
              <div key={l.id} className="bg-card rounded-xl border p-4">
                <p className="font-medium">{l.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{l.batch.name} · {new Date(l.scheduledAt).toLocaleDateString()}</p>
                {l.recordingUrl ? (
                  <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => openRecording(l)} disabled={loadingRecordingId === l.id}>
                    {loadingRecordingId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                    View Recording
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground mt-3">Recording not yet available.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 && (
        <div className="bg-card rounded-xl border p-12 text-center">
          <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">You are not registered in any live lecture batch yet. Ask your admin to add you to a batch to receive daily links and access recordings.</p>
        </div>
      )}

      <Dialog open={!!recordingUrl} onOpenChange={(open) => !open && setRecordingUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Lecture Recording</DialogTitle>
          </DialogHeader>
          {recordingUrl && <VideoWithWatermark videoUrl={recordingUrl} title="Lecture Recording" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveLectures;

import React, { useEffect, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

/**
 * Student clicks the join link from the email (e.g. /student/live-lectures/join?lectureId=xxx).
 * We mark attendance and redirect to the meeting link.
 */
const LiveLectureJoin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const lectureId = searchParams.get('lectureId');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lectureId || !isAuthenticated) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/live-lectures/${lectureId}/join`);
        if (cancelled) return;
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Could not join');
          return;
        }
        const data = await res.json();
        if (data.redirectUrl) {
          setRedirectUrl(data.redirectUrl);
          window.location.href = data.redirectUrl;
        } else {
          setError('No meeting link');
        }
      } catch (e) {
        if (!cancelled) {
          setError('Failed to join');
          toast({ title: 'Error', description: 'Failed to join lecture', variant: 'destructive' });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [lectureId, isAuthenticated]);

  if (!lectureId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Invalid link. Use the link from your email.</p>
      </div>
    );
  }

  if (!authLoading && !isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(`/student/live-lectures/join?lectureId=${lectureId}`)}`}
        replace
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive font-medium">{error}</p>
          <a href="/student/live-lectures" className="text-primary text-sm mt-2 inline-block underline">
            Back to Live Lectures
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground">Marking attendance and joining...</p>
      {redirectUrl && <p className="text-sm text-muted-foreground">Redirecting to meeting...</p>}
    </div>
  );
};

export default LiveLectureJoin;

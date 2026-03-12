import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { MessageSquare, User, Star, RefreshCw, Loader2 } from 'lucide-react';

type FeedbackItem = {
  id: string;
  userId: string;
  category: string | null;
  message: string;
  rating: number | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    profile: { fullName: string | null } | null;
  };
};

const AdminFeedback: React.FC = () => {
  const [list, setList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/feedback');
      if (res.ok) {
        const data = await res.json();
        setList(Array.isArray(data) ? data : []);
      } else {
        toast({ title: 'Error', description: 'Failed to load feedback', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load feedback', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Student Feedback</h1>
          <p className="text-muted-foreground">Feedback submitted by students about the platform and courses</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFeedback}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No feedback yet</p>
            <p className="text-sm text-muted-foreground mt-1">Student feedback will appear here when they submit from the Feedback page.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((item) => (
              <li key={item.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">
                          {item.user.profile?.fullName || 'Student'}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">{item.user.email}</span>
                      {item.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {item.category}
                        </span>
                      )}
                      {item.rating != null && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium">{item.rating}/5</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{item.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;

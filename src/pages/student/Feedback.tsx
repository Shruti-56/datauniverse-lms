import React, { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Star, Loader2 } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'Select category (optional)' },
  { value: 'General', label: 'General' },
  { value: 'Course', label: 'Course content' },
  { value: 'Platform', label: 'Platform / Website' },
  { value: 'Support', label: 'Support' },
  { value: 'Other', label: 'Other' },
];

const Feedback: React.FC = () => {
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({ title: 'Message required', description: 'Please enter your feedback.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/feedback', {
        message: message.trim(),
        category: category.trim() || undefined,
        rating: rating ?? undefined,
      });
      if (res.ok) {
        toast({ title: 'Thank you!', description: 'Your feedback has been submitted.' });
        setMessage('');
        setCategory('');
        setRating(null);
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Error', description: data.error || 'Failed to submit feedback', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to submit feedback', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Feedback</h1>
        <p className="text-muted-foreground">
          Share your feedback about the platform, courses, or experience. We read every message.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Category (optional)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value || 'none'} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Your feedback *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you think..."
              rows={5}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground resize-y min-h-[120px]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Rating (optional)</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(rating === n ? null : n)}
                  className="p-2 rounded-lg border border-input bg-background hover:bg-muted transition-colors"
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-6 h-6 ${rating != null && n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">1 = Poor, 5 = Excellent</p>
          </div>

          <Button type="submit" disabled={submitting} className="gap-2">
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit feedback
          </Button>
        </form>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
        <MessageSquare className="w-10 h-10 text-primary shrink-0" />
        <div>
          <p className="font-medium text-foreground">Your voice matters</p>
          <p className="text-sm text-muted-foreground">
            We use your feedback to improve courses and the learning experience for everyone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Feedback;

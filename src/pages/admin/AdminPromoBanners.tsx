import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImagePlus, Plus, Loader2, Pencil, Trash2 } from 'lucide-react';

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  ctaText: string;
  ctaLink: string;
  gradient: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

const GRADIENT_PRESETS = [
  { value: 'from-violet-600 via-purple-600 to-indigo-700', label: 'Violet / Purple / Indigo' },
  { value: 'from-amber-500 via-orange-500 to-rose-500', label: 'Amber / Orange / Rose' },
  { value: 'from-emerald-600 via-teal-600 to-cyan-600', label: 'Emerald / Teal / Cyan' },
  { value: 'from-blue-600 via-indigo-600 to-violet-600', label: 'Blue / Indigo / Violet' },
  { value: 'from-rose-500 via-pink-500 to-fuchsia-500', label: 'Rose / Pink / Fuchsia' },
  { value: 'from-slate-700 via-slate-800 to-slate-900', label: 'Dark Slate' },
];

const AdminPromoBanners: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('');
  const [ctaText, setCtaText] = useState('Explore');
  const [ctaLink, setCtaLink] = useState('/student/marketplace');
  const [gradient, setGradient] = useState(GRADIENT_PRESETS[0].value);
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const fetchBanners = async () => {
    try {
      const res = await api.get('/admin/promo-banners');
      if (res.ok) setBanners(await res.json());
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load banners', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setBadge('');
    setCtaText('Explore');
    setCtaLink('/student/marketplace');
    setGradient(GRADIENT_PRESETS[0].value);
    setSortOrder(banners.length);
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditingId(b.id);
    setTitle(b.title);
    setSubtitle(b.subtitle || '');
    setBadge(b.badge || '');
    setCtaText(b.ctaText);
    setCtaLink(b.ctaLink);
    setGradient(b.gradient);
    setSortOrder(b.sortOrder);
    setIsActive(b.isActive);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        badge: badge.trim() || null,
        ctaText: ctaText.trim() || 'Explore',
        ctaLink: ctaLink.trim() || '/student/marketplace',
        gradient: gradient.trim(),
        sortOrder,
        isActive,
      };
      if (editingId) {
        const res = await api.put(`/admin/promo-banners/${editingId}`, payload);
        if (res.ok) {
          toast({ title: 'Banner updated' });
          setDialogOpen(false);
          fetchBanners();
        } else {
          const data = await res.json().catch(() => ({}));
          toast({ title: 'Error', description: data.error || 'Update failed', variant: 'destructive' });
        }
      } else {
        const res = await api.post('/admin/promo-banners', payload);
        if (res.ok) {
          toast({ title: 'Banner created' });
          setDialogOpen(false);
          fetchBanners();
        } else {
          const data = await res.json().catch(() => ({}));
          const description = data.details || data.error || 'Create failed';
          toast({ title: 'Error', description, variant: 'destructive' });
        }
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Request failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this banner? Students will no longer see it.')) return;
    try {
      const res = await api.delete(`/admin/promo-banners/${id}`);
      if (res.ok) {
        toast({ title: 'Banner deleted' });
        fetchBanners();
      } else {
        toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' });
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Promo Banners</h1>
          <p className="text-muted-foreground mt-1">
            Manage the promotional carousel on the student dashboard. Add new course launches, offers, and announcements.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add banner
        </Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {banners.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <ImagePlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No banners yet. Add one to show on the student dashboard carousel.</p>
            <Button onClick={openCreate} className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Add your first banner
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {banners.map((b) => (
              <li key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div
                  className="flex-1 min-w-0 rounded-lg overflow-hidden border"
                  style={{ minHeight: 60 }}
                >
                  <div
                    className={`h-full min-h-[60px] bg-gradient-to-r ${b.gradient} p-3 flex items-center gap-3`}
                  >
                    <span className="text-white font-semibold line-clamp-1">{b.title}</span>
                    {b.badge && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">
                        {b.badge}
                      </span>
                    )}
                    {!b.isActive && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-black/30 text-white text-xs">
                        Hidden
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap items-center">
                  <span className="text-xs text-muted-foreground">Order: {b.sortOrder}</span>
                  <Button variant="outline" size="sm" onClick={() => openEdit(b)} className="gap-1">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(b.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit banner' : 'New banner'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Course Launching Soon!"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Subtitle / description</Label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Short description or tagline"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Badge (optional)</Label>
              <Input
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Coming Soon, Limited Time"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Button text</Label>
                <Input
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Explore"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Button link</Label>
                <Input
                  value={ctaLink}
                  onChange={(e) => setCtaLink(e.target.value)}
                  placeholder="/student/marketplace"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Gradient style</Label>
              <select
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                value={gradient}
                onChange={(e) => setGradient(e.target.value)}
              >
                {GRADIENT_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="sort-order" className="cursor-pointer">Sort order</Label>
                <Input
                  id="sort-order"
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                  className="w-20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="is-active" className="cursor-pointer">Visible on student dashboard</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPromoBanners;

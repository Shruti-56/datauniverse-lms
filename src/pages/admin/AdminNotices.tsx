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
import { Megaphone, Plus, Loader2, Pencil, Trash2, Users } from 'lucide-react';

type Ack = {
  id: string;
  action: string;
  remindLaterUntil: string | null;
  createdAt: string;
  student: { id: string; email: string; profile: { fullName: string } | null };
};

type Recipient = {
  id: string;
  studentId: string;
  student: { id: string; email: string; profile: { fullName: string } | null };
};

type Notice = {
  id: string;
  title: string;
  body: string;
  studentId: string | null;
  createdAt: string;
  expiresAt: string | null;
  creator: { id: string; email: string; profile: { fullName: string } | null };
  student: { id: string; email: string; profile: { fullName: string } | null } | null;
  recipients?: Recipient[];
  acks?: Ack[];
  _count?: { acks: number; recipients?: number };
};

type StudentOption = { id: string; email: string; fullName: string };

type BatchOption = { id: string; name: string; description: string | null; _count?: { students: number } };

const AdminNotices: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [ackDialogOpen, setAckDialogOpen] = useState(false);
  const [ackList, setAckList] = useState<Ack[]>([]);
  const [ackNoticeTitle, setAckNoticeTitle] = useState('');
  const [loadingAcks, setLoadingAcks] = useState(false);

  const fetchNotices = async () => {
    try {
      const res = await api.get('/admin/notices');
      if (res.ok) setNotices(await res.json());
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load notices', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students');
      if (res.ok) {
        const list = await res.json();
        setStudents(list.map((s: { id: string; email: string; fullName?: string }) => ({
          id: s.id,
          email: s.email,
          fullName: s.fullName || s.email,
        })));
      }
    } catch (e) {
      console.error('Failed to load students', e);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await api.get('/admin/live-lecture-batches');
      if (res.ok) {
        const list = await res.json();
        setBatches(list.map((b: { id: string; name: string; description?: string | null; _count?: { students: number } }) => ({
          id: b.id,
          name: b.name,
          description: b.description ?? null,
          _count: b._count,
        })));
      }
    } catch (e) {
      console.error('Failed to load batches', e);
    }
  };

  useEffect(() => {
    fetchNotices();
    fetchStudents();
    fetchBatches();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setSelectedStudentIds([]);
    setSelectedBatchIds([]);
    setDialogOpen(true);
  };

  const openEdit = (n: Notice) => {
    setEditingId(n.id);
    setTitle(n.title);
    setBody(n.body);
    setSelectedStudentIds((n.recipients ?? []).map((r) => r.studentId));
    setSelectedBatchIds([]);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        studentIds: selectedStudentIds,
        batchIds: selectedBatchIds,
      };
      if (editingId) {
        const res = await api.put(`/admin/notices/${editingId}`, payload);
        if (res.ok) {
          toast({ title: 'Notice updated' });
          setDialogOpen(false);
          fetchNotices();
        } else {
          const data = await res.json().catch(() => ({}));
          toast({ title: 'Error', description: data.error || 'Update failed', variant: 'destructive' });
        }
      } else {
        const res = await api.post('/admin/notices', payload);
        if (res.ok) {
          toast({ title: 'Notice created' });
          setDialogOpen(false);
          fetchNotices();
        } else {
          const data = await res.json().catch(() => ({}));
          toast({ title: 'Error', description: data.error || 'Create failed', variant: 'destructive' });
        }
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Request failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this notice?')) return;
    try {
      const res = await api.delete(`/admin/notices/${id}`);
      if (res.ok) {
        toast({ title: 'Notice deleted' });
        fetchNotices();
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' });
    }
  };

  const targetLabel = (n: Notice) => {
    const count = n._count?.recipients ?? n.recipients?.length ?? 0;
    if (n.studentId) return n.student?.profile?.fullName || n.student?.email || 'One student';
    if (count === 0) return 'All students';
    return `${count} student${count === 1 ? '' : 's'}`;
  };

  const openAcknowledgements = async (n: Notice) => {
    setAckNoticeTitle(n.title);
    setAckDialogOpen(true);
    setLoadingAcks(true);
    try {
      const res = await api.get(`/admin/notices/${n.id}/acknowledgements`);
      if (res.ok) setAckList(await res.json());
      else setAckList([]);
    } catch (e) {
      setAckList([]);
    } finally {
      setLoadingAcks(false);
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
          <h1 className="text-3xl font-display font-bold text-foreground">Notices</h1>
          <p className="text-muted-foreground mt-1">
            Create notices that appear on student dashboards. Target all students, specific students, or entire live batches.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add notice
        </Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {notices.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No notices yet. Add one to show on student dashboards.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notices.map((n) => (
              <li key={n.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{n.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{n.body || '—'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Shown to: {targetLabel(n)} · {new Date(n.createdAt).toLocaleString()}
                    {(n._count?.acks ?? n.acks?.length ?? 0) > 0 && (
                      <span className="ml-2 text-primary font-medium">
                        · {(n._count?.acks ?? n.acks?.length)} acknowledged
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => openAcknowledgements(n)} className="gap-1">
                    <Users className="w-3.5 h-3.5" /> View acknowledgements
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(n)} className="gap-1">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(n.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit notice' : 'New notice'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                className="w-full px-3 py-2 rounded-lg border bg-background"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Holiday tomorrow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border bg-background min-h-[100px]"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Notice or news content..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Students (optional)</label>
              <p className="text-xs text-muted-foreground mb-2">Select specific students. Leave empty with no batches = all students.</p>
              <div className="max-h-40 overflow-y-auto rounded-lg border bg-muted/30 p-2 space-y-1">
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No students found.</p>
                ) : (
                  students.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(s.id)}
                        onChange={(e) =>
                          setSelectedStudentIds((prev) =>
                            e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                          )
                        }
                        className="rounded border-input"
                      />
                      <span className="text-sm truncate">{s.fullName}</span>
                      <span className="text-xs text-muted-foreground truncate">({s.email})</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Live batches (optional)</label>
              <p className="text-xs text-muted-foreground mb-2">Everyone in these batches will receive the notice.</p>
              <div className="max-h-40 overflow-y-auto rounded-lg border bg-muted/30 p-2 space-y-1">
                {batches.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No batches found.</p>
                ) : (
                  batches.map((b) => (
                    <label key={b.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBatchIds.includes(b.id)}
                        onChange={(e) =>
                          setSelectedBatchIds((prev) =>
                            e.target.checked ? [...prev, b.id] : prev.filter((id) => id !== b.id)
                          )
                        }
                        className="rounded border-input"
                      />
                      <span className="text-sm font-medium">{b.name}</span>
                      {b._count?.students != null && (
                        <span className="text-xs text-muted-foreground">({b._count.students} students)</span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={ackDialogOpen} onOpenChange={setAckDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> Acknowledgements — {ackNoticeTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-2 pt-2">
            {loadingAcks ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : ackList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No acknowledgements yet.</p>
            ) : (
              ackList.map((a) => (
                <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                  <span className="font-medium">{a.student.profile?.fullName || a.student.email}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={a.action === 'DISMISSED' ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400 font-medium'}>
                      {a.action === 'DISMISSED' ? 'Got it' : 'Remind later'}
                    </span>
                    <span className="text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotices;

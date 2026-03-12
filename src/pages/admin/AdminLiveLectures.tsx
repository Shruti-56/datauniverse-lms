import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Radio,
  Plus,
  Loader2,
  Users,
  Calendar,
  CalendarDays,
  Video,
  X,
  Link2,
  CheckCircle,
  Upload,
  BookOpen,
  User,
  ChevronDown,
  ChevronRight,
  Search,
  Layers,
} from 'lucide-react';
import { toAbsoluteMeetingUrl } from '@/lib/utils';

type Batch = {
  id: string;
  name: string;
  description: string | null;
  type?: string;
  _count: { students: number; lectures: number; modules?: number };
};

type BatchStudent = {
  id: string;
  studentId: string;
  student: { id: string; email: string; profile: { fullName: string } | null };
};

type Module = {
  id: string;
  name: string;
  instructorId: string;
  meetingLink: string | null;
  startDate: string;
  endDate: string;
  lectureTime: string;
  instructor: { id: string; email: string; profile: { fullName: string } | null };
};

type Lecture = {
  id: string;
  batchId: string;
  instructorId: string;
  title: string;
  meetingLink: string | null;
  scheduledAt: string;
  durationMinutes: number;
  recordingUrl: string | null;
  batch: { id: string; name: string };
  instructor: { id: string; email: string; profile: { fullName: string } | null };
  module?: { id: string; name: string } | null;
  _count: { attendances: number };
};

type StudentOption = { id: string; email: string; fullName: string };
type InstructorOption = { id: string; email: string; fullName: string };

const AdminLiveLectures: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('batches');
  // Schedule: view mode — by date or by batch & module
  const [scheduleView, setScheduleView] = useState<'batch-module' | 'date'>('batch-module');
  const [scheduleDate, setScheduleDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [otherDatesExpanded, setOtherDatesExpanded] = useState(false);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  // Filter batches by name when many batches (e.g. parallel batches)
  const [moduleBatchFilter, setModuleBatchFilter] = useState('');

  // Batch dialog
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batchDescription, setBatchDescription] = useState('');
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [savingBatch, setSavingBatch] = useState(false);

  // Batch students dialog
  const [batchStudentsOpen, setBatchStudentsOpen] = useState(false);
  const [batchStudents, setBatchStudents] = useState<BatchStudent[]>([]);
  const [selectedBatchForStudents, setSelectedBatchForStudents] = useState<Batch | null>(null);
  const [allStudents, setAllStudents] = useState<StudentOption[]>([]);
  const [addingStudentId, setAddingStudentId] = useState<string | null>(null);

  const [instructors, setInstructors] = useState<InstructorOption[]>([]);

  // Attendance dialog
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceLecture, setAttendanceLecture] = useState<Lecture | null>(null);
  const [attendanceList, setAttendanceList] = useState<{ studentId: string; fullName: string | null; email: string; attended: boolean }[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Recording upload
  const [recordingLecture, setRecordingLecture] = useState<Lecture | null>(null);
  const [uploadingRecording, setUploadingRecording] = useState(false);

  // Modules (MySQL, Python, PySpark, AWS, PowerBI) per batch
  const [modulesDialogOpen, setModulesDialogOpen] = useState(false);
  const [modulesBatch, setModulesBatch] = useState<Batch | null>(null);
  const [modulesList, setModulesList] = useState<Module[]>([]);
  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [moduleInstructorId, setModuleInstructorId] = useState('');
  const [moduleLink, setModuleLink] = useState('');
  const [moduleStartDate, setModuleStartDate] = useState('');
  const [moduleEndDate, setModuleEndDate] = useState('');
  const [moduleDurationPreset, setModuleDurationPreset] = useState<'1month' | '1.5months' | 'custom'>('custom');
  const [moduleLectureTime, setModuleLectureTime] = useState('10:00');
  const [savingModule, setSavingModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  const applyDurationPreset = (start: string, preset: '1month' | '1.5months' | 'custom') => {
    if (!start || preset === 'custom') return;
    const d = new Date(start);
    const days = preset === '1month' ? 30 : 45; // 1 month ≈ 30 days, 1.5 months ≈ 45 days
    d.setDate(d.getDate() + days);
    setModuleEndDate(d.toISOString().slice(0, 10));
  };

  const fetchBatches = async () => {
    const res = await api.get('/admin/live-lecture-batches');
    if (res.ok) setBatches(await res.json());
  };

  const fetchLectures = async () => {
    const res = await api.get('/admin/live-lectures');
    if (res.ok) setLectures(await res.json());
  };

  const load = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchBatches(), fetchLectures()]);
      const [studentsRes, instructorsRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/instructors'),
      ]);
      if (studentsRes.ok) {
        const d = await studentsRes.json();
        setAllStudents(d.map((s: { id: string; email: string; fullName?: string }) => ({ id: s.id, email: s.email, fullName: s.fullName || s.email })));
      }
      if (instructorsRes.ok) {
        const d = await instructorsRes.json();
        setInstructors(d.map((i: { id: string; email: string; fullName?: string }) => ({ id: i.id, email: i.email, fullName: i.fullName || i.email })));
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on mount only
  }, []);

  const openBatchStudents = async (batch: Batch) => {
    setSelectedBatchForStudents(batch);
    setBatchStudentsOpen(true);
    const res = await api.get(`/admin/live-lecture-batches/${batch.id}/students`);
    if (res.ok) setBatchStudents(await res.json());
  };

  const openModulesDialog = async (batch: Batch) => {
    setModulesBatch(batch);
    setModulesDialogOpen(true);
    setModuleFormOpen(false);
    setEditingModuleId(null);
    const res = await api.get(`/admin/live-lecture-batches/${batch.id}/modules`);
    if (res.ok) setModulesList(await res.json());
  };

  const openModuleForm = (mod?: Module) => {
    if (mod) {
      setEditingModuleId(mod.id);
      setModuleName(mod.name);
      setModuleInstructorId(mod.instructorId);
      setModuleLink(mod.meetingLink || '');
      setModuleStartDate(mod.startDate.slice(0, 10));
      setModuleEndDate(mod.endDate.slice(0, 10));
      setModuleDurationPreset('custom');
      setModuleLectureTime(mod.lectureTime || '10:00');
    } else {
      setEditingModuleId(null);
      setModuleName('');
      setModuleInstructorId(instructors[0]?.id || '');
      setModuleLink('');
      setModuleStartDate('');
      setModuleEndDate('');
      setModuleDurationPreset('custom');
      setModuleLectureTime('10:00');
    }
    setModuleFormOpen(true);
  };

  const saveModule = async () => {
    if (!modulesBatch || !moduleName.trim() || !moduleInstructorId || !moduleStartDate || !moduleEndDate || !moduleLectureTime) {
      toast({ title: 'Error', description: 'Name, instructor, start/end date and time required', variant: 'destructive' });
      return;
    }
    setSavingModule(true);
    try {
      if (editingModuleId) {
        const res = await api.put(`/admin/live-lecture-batches/${modulesBatch.id}/modules/${editingModuleId}`, {
          name: moduleName.trim(),
          instructorId: moduleInstructorId,
          meetingLink: moduleLink.trim() || null,
          startDate: moduleStartDate,
          endDate: moduleEndDate,
          lectureTime: moduleLectureTime,
        });
        if (res.ok) {
          const listRes = await api.get(`/admin/live-lecture-batches/${modulesBatch.id}/modules`);
          if (listRes.ok) setModulesList(await listRes.json());
          setModuleFormOpen(false);
          fetchBatches();
          toast({ title: 'Module updated' });
        } else {
          const d = await res.json();
          toast({ title: 'Error', description: d.error || 'Failed to update module', variant: 'destructive' });
        }
      } else {
        const res = await api.post(`/admin/live-lecture-batches/${modulesBatch.id}/modules`, {
          name: moduleName.trim(),
          instructorId: moduleInstructorId,
          meetingLink: moduleLink.trim() || null,
          startDate: moduleStartDate,
          endDate: moduleEndDate,
          lectureTime: moduleLectureTime,
        });
        if (res.ok) {
          const listRes = await api.get(`/admin/live-lecture-batches/${modulesBatch.id}/modules`);
          if (listRes.ok) setModulesList(await listRes.json());
          setModuleFormOpen(false);
          fetchBatches();
          toast({ title: 'Module added. Link will be sent 10 min before lecture every day.' });
        } else {
          const d = await res.json();
          toast({ title: 'Error', description: d.error || 'Failed to create module', variant: 'destructive' });
        }
      }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to save module', variant: 'destructive' });
    } finally {
      setSavingModule(false);
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!modulesBatch) return;
    if (!confirm('Delete this module? Reminders will stop.')) return;
    try {
      const res = await api.delete(`/admin/live-lecture-batches/${modulesBatch.id}/modules/${moduleId}`);
      if (res.ok) {
        setModulesList((prev) => prev.filter((m) => m.id !== moduleId));
        fetchBatches();
        toast({ title: 'Module deleted' });
      } else {
        const d = await res.json();
        toast({ title: 'Error', description: d.error || 'Failed to delete module', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to delete module', variant: 'destructive' });
    }
  };

  const addStudentToBatch = async (studentId: string) => {
    if (!selectedBatchForStudents) return;
    setAddingStudentId(studentId);
    try {
      const res = await api.post(`/admin/live-lecture-batches/${selectedBatchForStudents.id}/students/${studentId}`);
      if (res.ok) {
        const list = await res.json();
        setBatchStudents(list);
        toast({ title: 'Added', description: 'Student added to batch' });
      } else toast({ title: 'Error', description: (await res.json()).error, variant: 'destructive' });
    } finally {
      setAddingStudentId(null);
    }
  };

  const removeStudentFromBatch = async (studentId: string) => {
    if (!selectedBatchForStudents) return;
    try {
      const res = await api.delete(`/admin/live-lecture-batches/${selectedBatchForStudents.id}/students/${studentId}`);
      if (res.ok) {
        setBatchStudents((prev) => prev.filter((s) => s.studentId !== studentId));
        toast({ title: 'Removed', description: 'Student removed from batch' });
      } else {
        const d = await res.json();
        toast({ title: 'Error', description: d.error || 'Failed to remove student', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to remove student', variant: 'destructive' });
    }
  };

  const saveBatch = async () => {
    if (!batchName.trim()) {
      toast({ title: 'Error', description: 'Name required', variant: 'destructive' });
      return;
    }
    setSavingBatch(true);
    try {
      if (editingBatchId) {
        const res = await api.put(`/admin/live-lecture-batches/${editingBatchId}`, { name: batchName.trim(), description: batchDescription.trim() || null, type: 'REGULAR' });
        if (res.ok) { setBatchDialogOpen(false); setEditingBatchId(null); fetchBatches(); toast({ title: 'Updated' }); }
        else { const d = await res.json(); toast({ title: 'Error', description: d.error || 'Failed to update batch', variant: 'destructive' }); }
      } else {
        const res = await api.post('/admin/live-lecture-batches', { name: batchName.trim(), description: batchDescription.trim() || null, type: 'REGULAR' });
        if (res.ok) { setBatchDialogOpen(false); setBatchName(''); setBatchDescription(''); fetchBatches(); toast({ title: 'Created' }); }
        else { const d = await res.json(); toast({ title: 'Error', description: d.error || 'Failed to create batch', variant: 'destructive' }); }
      }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to save batch', variant: 'destructive' });
    } finally {
      setSavingBatch(false);
    }
  };

  const deleteBatch = async (id: string) => {
    if (!confirm('Delete this batch? All lectures and registrations will be removed.')) return;
    try {
      const res = await api.delete(`/admin/live-lecture-batches/${id}`);
      if (res.ok) { fetchBatches(); fetchLectures(); toast({ title: 'Deleted' }); }
      else { const d = await res.json(); toast({ title: 'Error', description: d.error || 'Failed to delete batch', variant: 'destructive' }); }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to delete batch', variant: 'destructive' });
    }
  };

  const openBatchForm = (batch?: Batch) => {
    if (batch) {
      setEditingBatchId(batch.id);
      setBatchName(batch.name);
      setBatchDescription(batch.description || '');
    } else {
      setEditingBatchId(null);
      setBatchName('');
      setBatchDescription('');
    }
    setBatchDialogOpen(true);
  };

  const openAttendance = async (lecture: Lecture) => {
    setAttendanceLecture(lecture);
    setAttendanceDialogOpen(true);
    const res = await api.get(`/admin/live-lectures/${lecture.id}/attendance`);
    if (res.ok) {
      const data = await res.json();
      setAttendanceList(data.students || []);
    }
  };

  const saveAttendanceBulk = async () => {
    if (!attendanceLecture) return;
    setSavingAttendance(true);
    try {
      const attendances = attendanceList.map((s) => ({ studentId: s.studentId, attended: s.attended }));
      const res = await api.put(`/admin/live-lectures/${attendanceLecture.id}/attendance/bulk`, { attendances });
      if (res.ok) { toast({ title: 'Attendance saved' }); setAttendanceDialogOpen(false); }
    } finally {
      setSavingAttendance(false);
    }
  };

  // Group lectures by batch → module for recordings separated by module per batch
  type BatchModuleGroup = { batchName: string; modules: Record<string, { moduleName: string; lectures: Lecture[] }> };
  const lecturesByBatchAndModule = lectures.reduce<Record<string, BatchModuleGroup>>((acc, l) => {
    const bid = l.batchId;
    if (!acc[bid]) acc[bid] = { batchName: l.batch.name, modules: {} };
    const mid = l.module?.id ?? '_none_';
    const mname = l.module?.name ?? 'Other';
    if (!acc[bid].modules[mid]) acc[bid].modules[mid] = { moduleName: mname, lectures: [] };
    acc[bid].modules[mid].lectures.push(l);
    return acc;
  }, {});
  // Sort lectures by date within each module
  Object.values(lecturesByBatchAndModule).forEach((g) => {
    Object.values(g.modules).forEach((m) => {
      m.lectures.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    });
  });
  const toggleBatchExpanded = (batchId: string) => {
    setExpandedBatches((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  };

  // Group lectures by calendar date for daily workflow
  const getLecturesForDate = (dateStr: string): Lecture[] => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0);
    const end = new Date(y, m - 1, d, 23, 59, 59);
    return lectures.filter((l) => {
      const t = new Date(l.scheduledAt).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  };

  const lecturesForSelectedDate = getLecturesForDate(scheduleDate);
  const otherLecturesByDate = lectures
    .filter((l) => {
      const d = new Date(l.scheduledAt).toISOString().slice(0, 10);
      return d !== scheduleDate;
    })
    .reduce<Record<string, Lecture[]>>((acc, l) => {
      const d = new Date(l.scheduledAt).toISOString().slice(0, 10);
      if (!acc[d]) acc[d] = [];
      acc[d].push(l);
      return acc;
    }, {});
  const otherDates = Object.keys(otherLecturesByDate).sort((a, b) => b.localeCompare(a));

  const handleRecordingUpload = async (e: React.ChangeEvent<HTMLInputElement>, lecture: Lecture) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRecordingLecture(lecture);
    setUploadingRecording(true);
    try {
      const urlRes = await api.post(`/admin/live-lectures/${lecture.id}/recording/upload-url`, { fileName: file.name, fileType: file.type });
      if (!urlRes.ok) throw new Error('Upload URL failed');
      const { uploadUrl, fileUrl } = await urlRes.json();
      const putRes = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!putRes.ok) throw new Error('Upload failed');
      const saveRes = await api.put(`/admin/live-lectures/${lecture.id}/recording`, { recordingUrl: fileUrl });
      const putData = saveRes.ok ? await saveRes.json().catch(() => ({})) : {};
      const count = putData.emailsSent ?? 0;
      toast({
        title: 'Recording uploaded',
        description: count > 0 ? `Recording link emailed to ${count} student(s) in this batch.` : 'Recording saved. (No students in this batch or email failed.)',
      });
      fetchLectures();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to upload recording', variant: 'destructive' });
    } finally {
      setUploadingRecording(false);
      setRecordingLecture(null);
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
        <p className="text-muted-foreground max-w-2xl">
          <strong>Regular batch</strong> — students registered by admin or self attend live lectures and get the recording after each daily lecture. <strong>Rest of the students</strong> use the videos uploaded from Courses (My Learning). Set up recurring modules and upload recordings here.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Tab 1: Batches — create batches, manage students */}
        <TabsContent value="batches" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => openBatchForm()} className="gap-2">
              <Plus className="w-4 h-4" /> New batch
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Students in a batch get join link by email 10 min before each lecture and recording link after you upload.
          </p>
          <div className="bg-card rounded-xl border overflow-hidden">
            {batches.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No batches yet. Click &quot;New batch&quot; to create one, then add students.</div>
            ) : (
              <div className="divide-y">
                {batches.map((b) => (
                  <div key={b.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{b.name}</p>
                        <Badge variant="default" className="text-xs">Live batch</Badge>
                      </div>
                      {b.description && <p className="text-sm text-muted-foreground mt-0.5">{b.description}</p>}
                      <p className="text-sm text-muted-foreground mt-1">{b._count.students} students · {b._count.modules ?? 0} modules</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openBatchStudents(b)} className="gap-1">
                        <Users className="w-4 h-4" /> Students
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openBatchForm(b)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteBatch(b.id)}><X className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Schedule — daily attendance + recordings */}
        <TabsContent value="schedule" className="space-y-6 mt-6">
          {/* Modules per batch — grid of batch cards for many/parallel batches */}
          <div className="bg-card rounded-xl border p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> Modules per batch
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Add modules per batch (e.g. MySQL, Python). One lecture per day is created; join link is sent by email 10 min before.
                </p>
                {batches.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    {batches.length} batches running in parallel
                  </p>
                )}
              </div>
              {batches.length > 3 && (
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filter by batch name..."
                    value={moduleBatchFilter}
                    onChange={(e) => setModuleBatchFilter(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </div>
            {batches.length === 0 ? (
              <p className="text-sm text-muted-foreground">Create a batch in the Batches tab first.</p>
            ) : (
              (() => {
                const filterLower = moduleBatchFilter.trim().toLowerCase();
                const filtered = filterLower
                  ? batches.filter((b) => b.name.toLowerCase().includes(filterLower))
                  : batches;
                return (
                  <>
                    {filterLower && (
                      <p className="text-sm text-muted-foreground mb-3">
                        Showing {filtered.length} of {batches.length} batches
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filtered.map((b) => (
                        <div
                          key={b.id}
                          className="rounded-xl border border-border bg-muted/20 hover:bg-muted/30 p-4 flex flex-col gap-3 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-foreground truncate flex-1" title={b.name}>
                              {b.name}
                            </h3>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {b._count.modules ?? 0} modules
                            </Badge>
                          </div>
                          {b.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{b.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {b._count.students} students
                          </p>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openModulesDialog(b)}
                            className="w-full gap-2 mt-auto"
                          >
                            <BookOpen className="w-4 h-4" />
                            Manage modules
                          </Button>
                        </div>
                      ))}
                    </div>
                    {filtered.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No batches match &quot;{moduleBatchFilter}&quot;. Try a different search.
                      </p>
                    )}
                  </>
                );
              })()
            )}
          </div>

          {/* Recordings & attendance — view by batch & module or by date */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Video className="w-5 h-5" /> Recordings & attendance
              </h2>
              <div className="flex rounded-lg border border-border p-0.5 bg-muted/30">
                <button
                  type="button"
                  onClick={() => setScheduleView('batch-module')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${scheduleView === 'batch-module' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  By batch & module
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleView('date')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${scheduleView === 'date' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  By date
                </button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload recordings and mark attendance per lecture. Recordings are grouped by batch and module so you can manage each module separately.
            </p>

            {lectures.length === 0 ? (
              <div className="bg-card rounded-xl border p-12 text-center text-muted-foreground">
                No lectures yet. Add modules above to create one lecture per day.
              </div>
            ) : scheduleView === 'batch-module' ? (
              /* ——— By batch & module ——— */
              <div className="space-y-4">
                {Object.entries(lecturesByBatchAndModule).map(([batchId, group]) => {
                  const isExpanded = expandedBatches.has(batchId);
                  return (
                    <div key={batchId} className="bg-card rounded-xl border overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => toggleBatchExpanded(batchId)}
                        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-muted/30 hover:bg-muted/50 text-left font-medium"
                      >
                        <span className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          {group.batchName}
                        </span>
                        <span className="text-sm text-muted-foreground font-normal">
                          {Object.keys(group.modules).length} module{Object.keys(group.modules).length !== 1 ? 's' : ''}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="divide-y">
                          {Object.entries(group.modules).map(([moduleId, mod]) => (
                            <div key={moduleId} className="p-4">
                              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                {mod.moduleName}
                              </h3>
                              <div className="rounded-lg border border-border overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Time</th>
                                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Recording</th>
                                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border">
                                    {mod.lectures.map((l) => (
                                      <tr key={l.id} className="hover:bg-muted/20">
                                        <td className="px-3 py-2">{new Date(l.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                                        <td className="px-3 py-2">{new Date(l.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="px-3 py-2">
                                          {l.recordingUrl ? (
                                            <Badge className="bg-success/10 text-success text-xs">Uploaded</Badge>
                                          ) : (
                                            <span className="text-muted-foreground">—</span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          <div className="flex items-center justify-end gap-2 flex-wrap">
                                            {toAbsoluteMeetingUrl(l.meetingLink) && (
                                              <Button variant="outline" size="sm" className="gap-1 h-8" asChild>
                                                <a href={toAbsoluteMeetingUrl(l.meetingLink)!} target="_blank" rel="noopener noreferrer">
                                                  <Link2 className="w-3.5 h-3.5" /> Open meeting
                                                </a>
                                              </Button>
                                            )}
                                            <Button variant="outline" size="sm" onClick={() => openAttendance(l)} className="gap-1 h-8">
                                              <CheckCircle className="w-3.5 h-3.5" />
                                              Attendance{l._count?.attendances != null && l._count.attendances > 0 ? ` (${l._count.attendances})` : ''}
                                            </Button>
                                            <label className="cursor-pointer">
                                              <input type="file" accept="video/*" className="hidden" onChange={(e) => handleRecordingUpload(e, l)} disabled={uploadingRecording} />
                                              <span className="inline-flex items-center justify-center gap-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50 cursor-pointer h-8">
                                                {uploadingRecording && recordingLecture?.id === l.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                                {l.recordingUrl ? 'Replace' : 'Upload'}
                                              </span>
                                            </label>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ——— By date ——— */
              <>
                <div className="flex items-center gap-2">
                  <Button
                    variant={scheduleDate === new Date().toISOString().slice(0, 10) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setScheduleDate(new Date().toISOString().slice(0, 10))}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      setScheduleDate(d.toISOString().slice(0, 10));
                    }}
                  >
                    Yesterday
                  </Button>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                  />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  {scheduleDate === new Date().toISOString().slice(0, 10)
                    ? 'Today'
                    : (() => {
                        const y = new Date();
                        y.setDate(y.getDate() - 1);
                        return scheduleDate === y.toISOString().slice(0, 10)
                          ? 'Yesterday'
                          : new Date(scheduleDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
                      })()}
                </h3>
                {lecturesForSelectedDate.length === 0 ? (
                  <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">
                    No lectures on this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lecturesForSelectedDate.map((l) => (
                      <div key={l.id} className="bg-card rounded-xl border p-4 shadow-sm flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-foreground truncate">{l.title}</p>
                          {l.recordingUrl ? <Badge className="bg-success/10 text-success shrink-0">Recording</Badge> : <Badge variant="outline" className="shrink-0 text-muted-foreground">No recording</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {l.batch.name}{l.module ? ` · ${l.module.name}` : ''} · {new Date(l.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-border">
                          {toAbsoluteMeetingUrl(l.meetingLink) && (
                            <Button variant="outline" size="sm" className="gap-1 flex-1 min-w-0" asChild>
                              <a href={toAbsoluteMeetingUrl(l.meetingLink)!} target="_blank" rel="noopener noreferrer">
                                <Link2 className="w-4 h-4 shrink-0" /> Open meeting
                              </a>
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => openAttendance(l)} className="gap-1 flex-1 min-w-0">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            Attendance{l._count?.attendances != null && l._count.attendances > 0 ? ` (${l._count.attendances})` : ''}
                          </Button>
                          <label className="cursor-pointer flex-1 min-w-0 inline-flex">
                            <input type="file" accept="video/*" className="hidden" onChange={(e) => handleRecordingUpload(e, l)} disabled={uploadingRecording} />
                            <span className="inline-flex items-center justify-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50 cursor-pointer w-full">
                              {uploadingRecording && recordingLecture?.id === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                              {l.recordingUrl ? 'Replace' : 'Upload'}
                            </span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {otherDates.length > 0 && (
                  <div className="border rounded-xl overflow-hidden">
                    <button type="button" onClick={() => setOtherDatesExpanded((x) => !x)} className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-muted/30 hover:bg-muted/50 text-left text-sm font-medium">
                      <span className="flex items-center gap-2">
                        {otherDatesExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        Other dates ({otherDates.length})
                      </span>
                    </button>
                    {otherDatesExpanded && (
                      <div className="divide-y bg-card p-2 max-h-80 overflow-y-auto">
                        {otherDates.map((dateStr) => (
                          <div key={dateStr} className="p-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              {new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {(otherLecturesByDate[dateStr] || []).map((l) => (
                                <div key={l.id} className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm flex-wrap">
                                  <span className="font-medium truncate max-w-[120px]">{l.title}</span>
                                  {l.module && <Badge variant="secondary" className="text-xs">{l.module.name}</Badge>}
                                  {toAbsoluteMeetingUrl(l.meetingLink) && (
                                    <a href={toAbsoluteMeetingUrl(l.meetingLink)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs">
                                      <Link2 className="w-3.5 h-3.5" /> Meeting
                                    </a>
                                  )}
                                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openAttendance(l)}><CheckCircle className="w-3.5 h-3.5" /></Button>
                                  <label className="cursor-pointer">
                                    <input type="file" accept="video/*" className="hidden" onChange={(e) => handleRecordingUpload(e, l)} disabled={uploadingRecording} />
                                    <span className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"><Upload className="w-3.5 h-3.5" />{l.recordingUrl ? 'Replace' : 'Upload'}</span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Batch create/edit dialog */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBatchId ? 'Edit Batch' : 'New Batch'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input className="w-full px-3 py-2 rounded-lg border bg-background" value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="e.g. Data Science Morning" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea className="w-full px-3 py-2 rounded-lg border bg-background" value={batchDescription} onChange={(e) => setBatchDescription(e.target.value)} rows={2} />
            </div>
            <p className="text-sm text-muted-foreground">Live batch: students get join link by email 10 min before each lecture and recording link after you upload.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveBatch} disabled={savingBatch}>{savingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch students dialog */}
      <Dialog open={batchStudentsOpen} onOpenChange={setBatchStudentsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Students — {selectedBatchForStudents?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">Registered: {batchStudents.length}. Add more below.</p>
            <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
              {batchStudents.map((bs) => (
                <div key={bs.id} className="flex items-center justify-between py-1">
                  <span className="text-sm">{bs.student.profile?.fullName || bs.student.email}</span>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeStudentFromBatch(bs.studentId)}><X className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Add student</label>
              <select
                className="w-full px-3 py-2 rounded-lg border bg-background"
                value=""
                onChange={(e) => { const v = e.target.value; if (v) addStudentToBatch(v); e.target.value = ''; }}
              >
                <option value="">Select student…</option>
                {allStudents.filter((s) => !batchStudents.some((bs) => bs.studentId === s.id)).map((s) => (
                  <option key={s.id} value={s.id} disabled={addingStudentId === s.id}>{s.fullName} ({s.email})</option>
                ))}
              </select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attendance dialog */}
      <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Attendance — {attendanceLecture?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4 max-h-80 overflow-y-auto">
            {attendanceList.map((s) => (
              <div key={s.studentId} className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-sm">{s.fullName || s.email}</p>
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={s.attended} onChange={(e) => setAttendanceList((prev) => prev.map((x) => x.studentId === s.studentId ? { ...x, attended: e.target.checked } : x))} />
                  <span className="text-sm">Attended</span>
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setAttendanceDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveAttendanceBulk} disabled={savingAttendance}>{savingAttendance ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Attendance'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modules dialog */}
      <Dialog open={modulesDialogOpen} onOpenChange={setModulesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modules — {modulesBatch?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Add modules (e.g. MySQL, Python, PySpark). Set duration (start–end or 1 / 1.5 months), instructor, meeting link, and daily time. Students in this Regular batch get the join link by email 10 min before that time each day.</p>
          <div className="space-y-4 mt-4">
            <Button onClick={() => openModuleForm()} disabled={!instructors.length} className="gap-2">
              <Plus className="w-4 h-4" /> Add Module
            </Button>
            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
              {modulesList.length === 0 && !moduleFormOpen && (
                <div className="p-4 text-sm text-muted-foreground">No modules. Add MySQL, Python, PySpark, AWS, PowerBI etc.</div>
              )}
              {modulesList.map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-muted-foreground">{m.instructor.profile?.fullName || m.instructor.email} · {m.lectureTime} · {new Date(m.startDate).toLocaleDateString()} – {new Date(m.endDate).toLocaleDateString()}</p>
                    {m.meetingLink && <p className="text-xs text-muted-foreground truncate max-w-xs">Link set</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openModuleForm(m)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteModule(m.id)}><X className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
            {moduleFormOpen && (
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium">{editingModuleId ? 'Edit module' : 'Schedule lectures for this module'}</h4>
                <p className="text-sm text-muted-foreground">Set duration, instructor, meeting link, and daily time. The same link and time apply every day for the duration.</p>
                <div>
                  <label className="block text-sm font-medium mb-1">Module name (e.g. MySQL, Python, PySpark, AWS, PowerBI) *</label>
                  <input className="w-full px-3 py-2 rounded-lg border bg-background" value={moduleName} onChange={(e) => setModuleName(e.target.value)} placeholder="MySQL" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Instructor *</label>
                  <select className="w-full px-3 py-2 rounded-lg border bg-background" value={moduleInstructorId} onChange={(e) => setModuleInstructorId(e.target.value)}>
                    {instructors.map((i) => <option key={i.id} value={i.id}>{i.fullName} ({i.email})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Meeting link *</label>
                  <input className="w-full px-3 py-2 rounded-lg border bg-background" value={moduleLink} onChange={(e) => setModuleLink(e.target.value)} placeholder="https://meet.google.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border bg-background mb-2"
                    value={moduleDurationPreset}
                    onChange={(e) => {
                      const v = e.target.value as '1month' | '1.5months' | 'custom';
                      setModuleDurationPreset(v);
                      if (moduleStartDate && v !== 'custom') applyDurationPreset(moduleStartDate, v);
                    }}
                  >
                    <option value="custom">Custom (set start & end dates manually)</option>
                    <option value="1month">1 month (from start date)</option>
                    <option value="1.5months">1.5 months (from start date)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start date *</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-lg border bg-background"
                      value={moduleStartDate}
                      onChange={(e) => {
                        const v = e.target.value;
                        setModuleStartDate(v);
                        if (v && moduleDurationPreset !== 'custom') applyDurationPreset(v, moduleDurationPreset);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End date *</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-lg border bg-background"
                      value={moduleEndDate}
                      onChange={(e) => {
                        setModuleEndDate(e.target.value);
                        setModuleDurationPreset('custom');
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lecture time (same every day) *</label>
                  <input type="time" className="w-full px-3 py-2 rounded-lg border bg-background" value={moduleLectureTime} onChange={(e) => setModuleLectureTime(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setModuleFormOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={saveModule} disabled={savingModule}>{savingModule ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLiveLectures;

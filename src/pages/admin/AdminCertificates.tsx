import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, RefreshCw, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

type CertificateItem = {
  id: string;
  userId: string;
  courseId: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  certificateNumber: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    profile: { fullName: string | null } | null;
  };
  course: { id: string; title: string };
  approvedBy: { id: string; email: string; profile: { fullName: string | null } | null } | null;
};

const statusFilters = [
  { value: '', label: 'All' },
  { value: 'PENDING_APPROVAL', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const AdminCertificates: React.FC = () => {
  const [list, setList] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_APPROVAL');
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/admin/certificates?status=${statusFilter}` : '/admin/certificates';
      const res = await api.get(url);
      if (res.ok) {
        const data = await res.json();
        setList(Array.isArray(data) ? data : []);
      } else {
        toast({ title: 'Error', description: 'Failed to load certificates', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load certificates', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    try {
      setActingId(id);
      const res = await api.post(`/admin/certificates/${id}/approve`);
      if (res.ok) {
        toast({ title: 'Approved', description: 'Certificate approved. Student can now download it.' });
        fetchCertificates();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Error', description: data.error || 'Failed to approve', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to approve certificate', variant: 'destructive' });
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActingId(id);
      const res = await api.post(`/admin/certificates/${id}/reject`);
      if (res.ok) {
        toast({ title: 'Rejected', description: 'Certificate rejected.' });
        fetchCertificates();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Error', description: data.error || 'Failed to reject', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to reject certificate', variant: 'destructive' });
    } finally {
      setActingId(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading && list.length === 0) {
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
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Course Certificates</h1>
          <p className="text-muted-foreground">
            Approve or reject certificates when students complete a course. Approved certificates can be downloaded by students.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCertificates}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <Button
            key={f.value || 'all'}
            variant={statusFilter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              {statusFilter ? `No ${statusFilter === 'PENDING_APPROVAL' ? 'pending' : statusFilter.toLowerCase()} certificates` : 'No certificates yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Certificates are created when a student completes all videos in a course. Check back after completions.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((item) => (
              <li key={item.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-foreground">
                        {item.user.profile?.fullName || 'Student'}
                      </span>
                      <span className="text-sm text-muted-foreground">{item.user.email}</span>
                    </div>
                    <p className="text-sm text-foreground font-medium">{item.course.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cert. No. {item.certificateNumber} · Requested {formatDate(item.createdAt)}
                    </p>
                    {item.status === 'APPROVED' && item.approvedAt && (
                      <p className="text-xs text-success mt-0.5">Approved {formatDate(item.approvedAt)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'PENDING_APPROVAL' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(item.id)}
                          disabled={actingId === item.id}
                        >
                          {actingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(item.id)}
                          disabled={actingId === item.id}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {item.status === 'APPROVED' && (
                      <Badge className="bg-success/10 text-success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
                    )}
                    {item.status === 'REJECTED' && (
                      <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
                    )}
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

export default AdminCertificates;

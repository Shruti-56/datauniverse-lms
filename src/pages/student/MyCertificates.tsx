import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Award, Download, Loader2, RefreshCw } from 'lucide-react';

type CertificateItem = {
  id: string;
  certificateNumber: string;
  approvedAt: string | null;
  course: { id: string; title: string };
};

const MyCertificates: React.FC = () => {
  const [list, setList] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/certificates/my');
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
  }, []);

  const handleDownload = async (cert: CertificateItem) => {
    try {
      setDownloadingId(cert.id);
      const res = await api.get(`/certificates/${cert.id}/pdf`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: 'Download failed', description: err.error || 'Could not download certificate', variant: 'destructive' });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${cert.certificateNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Downloaded', description: 'Certificate saved as PDF.' });
    } catch {
      toast({ title: 'Download failed', description: 'Could not download certificate', variant: 'destructive' });
    } finally {
      setDownloadingId(null);
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
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">My Certificates</h1>
          <p className="text-muted-foreground">
            Download your course completion certificates (PDF). Certificates appear here after admin approval.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCertificates}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No certificates yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete a course to request a certificate. After admin approval, you can download it here as PDF.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((item) => (
              <li key={item.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{item.course.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Certificate No. {item.certificateNumber}
                      {item.approvedAt && (
                        <> · Approved {new Date(item.approvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                      )}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(item)}
                    disabled={downloadingId === item.id}
                  >
                    {downloadingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download PDF
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MyCertificates;

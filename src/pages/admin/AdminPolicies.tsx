import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Plus, Upload, Loader2, Download, Eye } from 'lucide-react';

type Policy = {
  id: string;
  type: string;
  title: string;
  pdfUrl: string;
  version: string;
  isActive: boolean;
  createdAt: string;
};

const AdminPolicies: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [policyType, setPolicyType] = useState<string>('PRIVACY');
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('1.0');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/policies');
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load policies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const openDialog = () => {
    setPolicyType('PRIVACY');
    setTitle('');
    setVersion('1.0');
    setPdfFile(null);
    setPdfUrl('');
    setShowDialog(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Error',
        description: 'Please upload a PDF file',
        variant: 'destructive',
      });
      return;
    }

    setPdfFile(file);
    setUploading(true);

    try {
      // Get upload URL
      const uploadResponse = await api.post('/admin/policies/upload-url', {
        fileName: file.name,
        fileType: file.type,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, fileUrl } = await uploadResponse.json();

      // Upload to S3
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error('Failed to upload PDF');
      }

      setPdfUrl(fileUrl);
      toast({
        title: 'Success',
        description: 'PDF uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload PDF',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const savePolicy = async () => {
    if (!title.trim() || !pdfUrl) {
      toast({
        title: 'Error',
        description: 'Title and PDF are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.post('/admin/policies', {
        type: policyType,
        title,
        pdfUrl,
        version,
      });

      toast({ title: 'Policy created successfully' });
      setShowDialog(false);
      fetchPolicies();
    } catch (error) {
      console.error('Error saving policy:', error);
      toast({
        title: 'Error',
        description: 'Failed to save policy',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const policyTypes = [
    { value: 'PRIVACY', label: 'Privacy Policy' },
    { value: 'REFUND', label: 'Refund Policy' },
    { value: 'TERMS', label: 'Terms & Conditions' },
  ];

  const groupedPolicies = {
    PRIVACY: policies.filter(p => p.type === 'PRIVACY'),
    REFUND: policies.filter(p => p.type === 'REFUND'),
    TERMS: policies.filter(p => p.type === 'TERMS'),
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Policy Documents</h1>
          <p className="text-muted-foreground">Manage Privacy Policy, Refund Policy, and Terms & Conditions</p>
        </div>
        <Button onClick={openDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Policy
        </Button>
      </div>

      <div className="space-y-6">
        {policyTypes.map((type) => {
          const typePolicies = groupedPolicies[type.value as keyof typeof groupedPolicies];
          const activePolicy = typePolicies.find(p => p.isActive);

          return (
            <div key={type.value} className="bg-card rounded-xl border p-6">
              <h3 className="text-lg font-semibold mb-4">{type.label}</h3>
              {activePolicy ? (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">{activePolicy.title}</p>
                      <p className="text-sm text-muted-foreground">Version {activePolicy.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-success/10 text-success">Active</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(activePolicy.pdfUrl, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground bg-muted/30 rounded-lg">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No {type.label.toLowerCase()} uploaded yet</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Policy Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Policy Type *</label>
              <select
                value={policyType}
                onChange={(e) => setPolicyType(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
              >
                {policyTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                placeholder="Privacy Policy 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Version</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                placeholder="1.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">PDF File *</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
              />
              {uploading && (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Uploading...</span>
                </div>
              )}
              {pdfUrl && !uploading && (
                <p className="text-sm text-success mt-2">✓ PDF uploaded</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Note: Uploading a new policy will deactivate the previous version of the same type.
            </p>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={savePolicy} disabled={!pdfUrl}>
                Upload Policy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPolicies;

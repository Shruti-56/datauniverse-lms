import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { FileText, Download, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Policy = {
  id: string;
  type: string;
  title: string;
  pdfUrl: string;
  version: string;
};

const Policies: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        const response = await api.get('/policies');
        if (response.ok) {
          const data = await response.json();
          setPolicies(data);
        }
      } catch (error) {
        console.error('Error fetching policies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const policyTypes = [
    { value: 'PRIVACY', label: 'Privacy Policy', icon: FileText },
    { value: 'REFUND', label: 'Refund Policy', icon: FileText },
    { value: 'TERMS', label: 'Terms & Conditions', icon: FileText },
  ];

  const getPolicyByType = (type: string) => {
    return policies.find(p => p.type === type);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Policies & Terms</h1>
        <p className="text-muted-foreground">Review our policies and terms of service</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {policyTypes.map((type) => {
          const policy = getPolicyByType(type.value);
          const Icon = type.icon;

          return (
            <div key={type.value} className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{type.label}</h3>
                  {policy && (
                    <p className="text-sm text-muted-foreground">Version {policy.version}</p>
                  )}
                </div>
              </div>

              {policy ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{policy.title}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(policy.pdfUrl, '_blank')}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = policy.pdfUrl;
                        link.download = `${policy.type}_${policy.version}.pdf`;
                        link.click();
                      }}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not available</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Policies;

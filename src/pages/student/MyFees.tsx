import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { IndianRupee, Loader2, History } from 'lucide-react';

type MyFeesData = {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  payments: { id: string; amount: number; note: string | null; paidAt: string }[];
};

const MyFees: React.FC = () => {
  const [data, setData] = useState<MyFeesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        setLoading(true);
        const res = await api.get('/fees/me');
        if (res.ok) setData(await res.json());
      } catch (e) {
        toast({ title: 'Error', description: 'Failed to load fees', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchFees();
  }, []);

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
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">My Fees</h1>
        <p className="text-muted-foreground">View your total fees, amount paid, and remaining balance. Payments are recorded by admin (cash).</p>
      </div>

      {data && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-card rounded-xl border p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Fees</p>
            <p className="text-2xl font-bold flex items-center gap-2">
              <IndianRupee className="w-6 h-6" /> {data.totalAmount.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-card rounded-xl border p-6">
            <p className="text-sm text-muted-foreground mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-600 flex items-center gap-2">
              <IndianRupee className="w-6 h-6" /> {data.paidAmount.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-card rounded-xl border p-6">
            <p className="text-sm text-muted-foreground mb-1">Remaining</p>
            <p className="text-2xl font-bold flex items-center gap-2">
              <IndianRupee className="w-6 h-6" /> {data.remainingAmount.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      )}

      {data && data.payments.length > 0 && (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="p-4 border-b flex items-center gap-2">
            <History className="w-5 h-5" />
            <h2 className="font-semibold">Payment History</h2>
          </div>
          <div className="divide-y">
            {data.payments.map((p) => (
              <div key={p.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">₹{Number(p.amount).toLocaleString('en-IN')}</p>
                  {p.note && <p className="text-sm text-muted-foreground">{p.note}</p>}
                </div>
                <p className="text-sm text-muted-foreground">{new Date(p.paidAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && data.totalAmount === 0 && data.payments.length === 0 && (
        <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">
          No fees record yet. Your admin can set your total fees and record cash payments.
        </div>
      )}
    </div>
  );
};

export default MyFees;

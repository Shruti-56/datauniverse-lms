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
import { IndianRupee, Plus, Loader2, History, Wallet, CheckCircle, Clock } from 'lucide-react';

type FeeRow = {
  id: string;
  email: string;
  fullName: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
};

type Payment = {
  id: string;
  amount: number;
  method: string;
  note: string | null;
  paidAt: string;
};

const AdminFees: React.FC = () => {
  const [list, setList] = useState<FeeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [setTotalOpen, setSetTotalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<FeeRow | null>(null);
  const [totalAmount, setTotalAmount] = useState('');
  const [savingTotal, setSavingTotal] = useState(false);

  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<FeeRow | null>(null);
  const [historyData, setHistoryData] = useState<{ student: FeeRow; payments: Payment[] } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/fees');
      if (res.ok) setList(await res.json());
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load fees', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const openSetTotal = (row: FeeRow) => {
    setSelectedStudent(row);
    setTotalAmount(String(row.totalAmount || ''));
    setSetTotalOpen(true);
  };

  const saveTotal = async () => {
    if (!selectedStudent) return;
    const num = parseFloat(totalAmount);
    if (isNaN(num) || num < 0) {
      toast({ title: 'Error', description: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    setSavingTotal(true);
    try {
      const res = await api.put(`/admin/fees/students/${selectedStudent.id}/total`, { totalAmount: num });
      if (res.ok) {
        toast({ title: 'Total fees updated' });
        setSetTotalOpen(false);
        fetchList();
      } else toast({ title: 'Error', description: (await res.json()).error, variant: 'destructive' });
    } finally {
      setSavingTotal(false);
    }
  };

  const openAddPayment = (row: FeeRow) => {
    setSelectedStudent(row);
    setPaymentAmount('');
    setPaymentNote('');
    setAddPaymentOpen(true);
  };

  const savePayment = async () => {
    if (!selectedStudent) return;
    const num = parseFloat(paymentAmount);
    if (isNaN(num) || num <= 0) {
      toast({ title: 'Error', description: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    setSavingPayment(true);
    try {
      const res = await api.post(`/admin/fees/students/${selectedStudent.id}/payments`, { amount: num, note: paymentNote.trim() || null });
      if (res.ok) {
        toast({ title: 'Payment recorded (cash)' });
        setAddPaymentOpen(false);
        fetchList();
      } else toast({ title: 'Error', description: (await res.json()).error, variant: 'destructive' });
    } finally {
      setSavingPayment(false);
    }
  };

  const openHistory = async (row: FeeRow) => {
    setHistoryStudent(row);
    setHistoryOpen(true);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/admin/fees/students/${row.id}/payments`);
      if (res.ok) setHistoryData(await res.json());
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalToReceive = list.reduce((s, r) => s + r.totalAmount, 0);
  const totalReceived = list.reduce((s, r) => s + r.paidAmount, 0);
  const totalBalance = list.reduce((s, r) => s + r.remainingAmount, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Fees Management</h1>
        <p className="text-muted-foreground">Manage cash payments: set total fees per student, record payments, and track balance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total to Receive</p>
            <p className="text-xl font-bold text-foreground">₹{totalToReceive.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Received</p>
            <p className="text-xl font-bold text-green-600">₹{totalReceived.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Balance</p>
            <p className="text-xl font-bold text-foreground">₹{totalBalance.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Student</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Total (₹)</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Paid (₹)</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Remaining (₹)</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.fullName || row.email}</p>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                  </td>
                  <td className="px-4 py-3 text-right">{row.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-green-600">{row.paidAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">{row.remainingAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => openSetTotal(row)}>Set Total</Button>
                      <Button variant="outline" size="sm" onClick={() => openAddPayment(row)} className="gap-1">
                        <Plus className="w-4 h-4" /> Add Payment
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openHistory(row)} className="gap-1">
                        <History className="w-4 h-4" /> History
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">No students. Students appear here once they have an account.</div>
        )}
      </div>

      <Dialog open={setTotalOpen} onOpenChange={setSetTotalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Total Fees</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">{selectedStudent.fullName || selectedStudent.email}</p>
              <div>
                <label className="block text-sm font-medium mb-1">Total amount (₹) *</label>
                <input type="number" step="0.01" min="0" className="w-full px-3 py-2 rounded-lg border bg-background" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSetTotalOpen(false)}>Cancel</Button>
                <Button onClick={saveTotal} disabled={savingTotal}>{savingTotal ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Cash Payment</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">{selectedStudent.fullName || selectedStudent.email}</p>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                <input type="number" step="0.01" min="0.01" className="w-full px-3 py-2 rounded-lg border bg-background" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Amount received" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Note (optional)</label>
                <input type="text" className="w-full px-3 py-2 rounded-lg border bg-background" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="e.g. Cash received" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddPaymentOpen(false)}>Cancel</Button>
                <Button onClick={savePayment} disabled={savingPayment}>{savingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Payment'}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment History — {historyStudent?.fullName || historyStudent?.email}</DialogTitle>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : historyData && (
            <div className="space-y-4 mt-4">
              <div className="flex justify-between text-sm p-3 bg-muted/50 rounded-lg">
                <span>Total fees</span>
                <span>₹{historyData.student.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm p-3 bg-muted/50 rounded-lg">
                <span>Paid</span>
                <span className="text-green-600">₹{historyData.student.paidAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm p-3 bg-muted/50 rounded-lg font-medium">
                <span>Remaining</span>
                <span>₹{historyData.student.remainingAmount.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Payments</p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {historyData.payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payments yet.</p>
                  ) : (
                    historyData.payments.map((p) => (
                      <div key={p.id} className="flex justify-between text-sm py-2 border-b">
                        <div>
                          <span>₹{Number(p.amount).toLocaleString('en-IN')}</span>
                          {p.note && <span className="text-muted-foreground ml-2">— {p.note}</span>}
                        </div>
                        <span className="text-muted-foreground">{new Date(p.paidAt).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFees;

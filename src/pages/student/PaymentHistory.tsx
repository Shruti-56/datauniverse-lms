import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type Purchase = {
  id: string;
  amount: string;
  status: 'PENDING' | 'COMPLETED' | 'REFUNDED';
  paymentProvider: string | null;
  paymentId: string | null;
  purchasedAt: string;
  course: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
  };
};

const PaymentHistory: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments/history');
      if (response.ok) {
        const data = await response.json();
        setPurchases(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load payment history',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-success/10 text-success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-warning/10 text-warning">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'REFUNDED':
        return (
          <Badge className="bg-destructive/10 text-destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-12 text-muted-foreground">
          Loading payment history...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Payment History
          </h1>
          <p className="text-muted-foreground">
            View all your course purchases and transactions
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPurchases}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total Purchases</span>
          </div>
          <p className="text-2xl font-bold">{purchases.length}</p>
        </div>

        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Successful</span>
          </div>
          <p className="text-2xl font-bold">
            {purchases.filter(p => p.status === 'COMPLETED').length}
          </p>
        </div>

        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <span className="text-lg font-bold text-accent">₹</span>
            </div>
            <span className="text-sm text-muted-foreground">Total Spent</span>
          </div>
          <p className="text-2xl font-bold">
            ₹{purchases
              .filter(p => p.status === 'COMPLETED')
              .reduce((sum, p) => sum + parseFloat(p.amount), 0)
              .toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-card rounded-xl border shadow-card overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Transactions</h2>
        </div>

        {purchases.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No purchases yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Browse the marketplace and purchase your first course!
            </p>
            <Link to="/student/marketplace">
              <Button className="mt-4">Browse Courses</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {purchases.map(purchase => (
              <div
                key={purchase.id}
                className="p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      {purchase.course.thumbnailUrl ? (
                        <img
                          src={purchase.course.thumbnailUrl}
                          alt={purchase.course.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <CreditCard className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {purchase.course.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(purchase.purchasedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        ₹{parseFloat(purchase.amount).toLocaleString('en-IN')}
                      </p>
                      {purchase.paymentId && (
                        <p className="text-xs text-muted-foreground">
                          ID: {purchase.paymentId.slice(0, 12)}...
                        </p>
                      )}
                    </div>
                    {getStatusBadge(purchase.status)}
                  </div>
                </div>

                {purchase.status === 'COMPLETED' && (
                  <div className="mt-3 pt-3 border-t border-dashed">
                    <Link to={`/student/course/${purchase.course.id}`}>
                      <Button variant="outline" size="sm">
                        Go to Course
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;

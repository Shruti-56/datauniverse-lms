import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  BookOpen, 
  ShoppingCart, 
  TrendingUp,
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

type DashboardStats = {
  totalStudents: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  completionRate: number;
  recentEnrollments: Array<{
    studentName: string;
    courseTitle: string;
    enrolledAt: string;
  }>;
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load dashboard statistics',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard statistics',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-12 text-muted-foreground">Failed to load dashboard data</div>
      </div>
    );
  }

  const displayStats = [
    {
      label: 'Total Students',
      value: stats.totalStudents.toLocaleString(),
      change: '+12%', // TODO: Calculate from previous period
      isPositive: true,
      icon: Users,
      color: 'bg-primary/10 text-primary'
    },
    {
      label: 'Total Courses',
      value: stats.totalCourses.toString(),
      change: '+3', // TODO: Calculate from previous period
      isPositive: true,
      icon: BookOpen,
      color: 'bg-success/10 text-success'
    },
    {
      label: 'Total Enrollments',
      value: stats.totalEnrollments.toLocaleString(),
      change: '+8%', // TODO: Calculate from previous period
      isPositive: true,
      icon: ShoppingCart,
      color: 'bg-accent/10 text-accent'
    },
    {
      label: 'Avg. Completion',
      value: `${stats.completionRate}%`,
      change: '-2%', // TODO: Calculate from previous period
      isPositive: false,
      icon: TrendingUp,
      color: 'bg-warning/10 text-warning'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat, index) => (
          <div key={index} className="bg-card rounded-xl border border-border p-6 shadow-card">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stat.isPositive ? 'text-success' : 'text-destructive'}`}>
                {stat.isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Card */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Monthly Revenue</h2>
            <div className="flex items-center gap-2 text-sm text-success">
              <ArrowUp className="w-4 h-4" />
              +23% from last month
            </div>
          </div>
          <div className="flex items-end gap-4">
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold text-foreground">
                ₹{stats.totalRevenue.toLocaleString()}
              </span>
            </div>
          </div>
          {/* Chart Placeholder */}
          <div className="mt-6 h-40 bg-muted/50 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              {/* TODO: Add chart library (recharts) for real visualization */}
              Revenue chart placeholder
            </p>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Active Users</h2>
            <div className="flex items-center gap-2 text-sm text-success">
              <Activity className="w-4 h-4" />
              Real-time
            </div>
          </div>
          <div className="flex items-end gap-4">
            <span className="text-4xl font-bold text-foreground">
              {stats.totalStudents.toLocaleString()}
            </span>
            <span className="text-muted-foreground text-sm mb-1">total students</span>
          </div>
          {/* Chart Placeholder */}
          <div className="mt-6 h-40 bg-muted/50 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              {/* TODO: Add real-time activity chart */}
              Activity chart placeholder
            </p>
          </div>
        </div>
      </div>

      {/* Recent Purchases */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Recent Purchases</h2>
        </div>
        <div className="divide-y divide-border">
          {stats.recentEnrollments.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground">
              No recent enrollments
            </div>
          ) : (
            stats.recentEnrollments.map((enrollment, index) => (
              <div key={index} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {enrollment.studentName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{enrollment.studentName}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    Enrolled in {enrollment.courseTitle}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(enrollment.enrolledAt).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

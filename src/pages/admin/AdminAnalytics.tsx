import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  TrendingUp, 
  Users,
  BookOpen,
} from 'lucide-react';

type CoursePopularity = {
  id: string;
  title: string;
  enrollments: number;
};

type Analytics = {
  enrollmentsByMonth: Array<{ month: string; count: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  coursePopularity: CoursePopularity[];
};

type DashboardStats = {
  totalStudents: number;
  totalCourses: number;
  totalEnrollments: number;
  completionRate: number;
};

const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const [analyticsRes, statsRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/dashboard'),
      ]);

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      } else {
        console.error('Analytics API error:', analyticsRes.status);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        console.error('Stats API error:', statsRes.status);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics. Please check if the server is running.');
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
          <p className="text-destructive font-medium mb-2">Error Loading Analytics</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Analytics</h1>
        <p className="text-muted-foreground">Track course performance and student engagement</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold text-foreground">{stats?.totalStudents || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Courses</p>
              <p className="text-2xl font-bold text-foreground">{stats?.totalCourses || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Completion</p>
              <p className="text-2xl font-bold text-foreground">{stats?.completionRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Popularity */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Course Popularity</h2>
          <p className="text-sm text-muted-foreground">Courses ranked by enrollment count</p>
        </div>
        <div className="p-6">
          {analytics?.coursePopularity && analytics.coursePopularity.length > 0 ? (
            <div className="space-y-4">
              {analytics.coursePopularity.map((course, index) => {
                const maxEnrollments = Math.max(...analytics.coursePopularity.map(c => c.enrollments));
                const percentage = maxEnrollments > 0 ? (course.enrollments / maxEnrollments) * 100 : 0;
                
                return (
                  <div key={course.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-6">#{index + 1}</span>
                        <span className="text-sm text-foreground">{course.title}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{course.enrollments} students</span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
                      indicatorClassName={
                        index === 0 
                          ? 'bg-success' 
                          : index < 3 
                          ? 'bg-primary' 
                          : 'bg-muted-foreground'
                      }
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No course data available yet
            </div>
          )}
        </div>
      </div>

      {/* Enrollment Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollments by Month */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Monthly Enrollments</h2>
            <p className="text-sm text-muted-foreground">New enrollments over time</p>
          </div>
          <div className="p-6">
            {analytics?.enrollmentsByMonth && analytics.enrollmentsByMonth.length > 0 ? (
              <div className="space-y-3">
                {analytics.enrollmentsByMonth.slice(0, 6).map((item: { month: string; count: number | bigint }) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.month}</span>
                    <span className="text-sm font-medium text-foreground">{Number(item.count)} enrollments</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 bg-muted/50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No enrollment data yet</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Revenue by Month */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Monthly Revenue</h2>
            <p className="text-sm text-muted-foreground">Revenue trends over time</p>
          </div>
          <div className="p-6">
            {analytics?.revenueByMonth && analytics.revenueByMonth.length > 0 ? (
              <div className="space-y-3">
                {analytics.revenueByMonth.slice(0, 6).map((item: { month: string; revenue: number | null }) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.month}</span>
                    <span className="text-sm font-medium text-foreground">₹{Number(item.revenue).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 bg-muted/50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No revenue data yet</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">Platform Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-3xl font-bold text-foreground">{stats?.totalStudents || 0}</p>
            <p className="text-sm text-muted-foreground">Total Students</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-3xl font-bold text-foreground">{stats?.totalCourses || 0}</p>
            <p className="text-sm text-muted-foreground">Total Courses</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-3xl font-bold text-foreground">{stats?.totalEnrollments || 0}</p>
            <p className="text-sm text-muted-foreground">Total Enrollments</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-3xl font-bold text-foreground">{stats?.completionRate || 0}%</p>
            <p className="text-sm text-muted-foreground">Completion Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;

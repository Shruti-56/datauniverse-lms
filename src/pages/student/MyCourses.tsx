import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Clock, 
  PlayCircle, 
  ArrowRight,
  Trophy,
  CheckCircle,
  Radio,
  Video
} from 'lucide-react';

type Enrollment = {
  id: string;
  enrolledAt: string;
  completedAt: string | null;
  course: {
    id: string;
    title: string;
    category: string;
    level: string;
    thumbnailUrl: string | null;
    durationHours: number;
  };
  progress: number;
  totalVideos: number;
  completedVideos: number;
};

type LiveBatchSummary = {
  batchId: string;
  batchName: string;
  currentModuleName: string | null;
  totalPastLectures: number;
  recordedCount: number;
  attendedCount: number;
};

const MyCourses: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [liveBatches, setLiveBatches] = useState<LiveBatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [enrollmentsRes, batchesRes] = await Promise.all([
          api.get('/enrollments'),
          api.get('/live-lectures/my-batches'),
        ]);
        if (enrollmentsRes.ok) {
          const data = await enrollmentsRes.json();
          setEnrollments(data);
        } else if (enrollmentsRes.status !== 401) {
          console.error('Failed to fetch enrollments');
          toast({ title: 'Error', description: 'Failed to load your courses', variant: 'destructive' });
        }
        if (batchesRes.ok) {
          const { batches } = await batchesRes.json();
          setLiveBatches(batches ?? []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({ title: 'Error', description: 'Failed to load your courses', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">My Learning</h1>
          <p className="text-muted-foreground">Track your progress and continue where you left off</p>
        </div>
        <div className="text-center py-12 text-muted-foreground">Loading your courses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">My Learning</h1>
        <p className="text-muted-foreground">Course video lectures (uploaded content). Track your progress and continue where you left off. If you are in a regular batch, live lecture recordings are under Live Lectures.</p>
      </div>

      {enrollments.length === 0 && liveBatches.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You haven't purchased any courses yet. Browse our marketplace to find courses that match your learning goals.
          </p>
          <Link to="/student/marketplace">
            <Button size="lg">Browse Courses</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {enrollments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Course video lectures</h2>
              {enrollments.map((enrollment) => {
            const progress = enrollment.progress;
            const isCompleted = enrollment.completedAt !== null || progress === 100;

            return (
              <div
                key={enrollment.id}
                className="bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Course Image */}
                  <div className="w-full md:w-72 aspect-video md:aspect-auto relative">
                    <div className="absolute inset-0 gradient-hero opacity-90" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle className="w-12 h-12 text-primary-foreground opacity-80" />
                    </div>
                    {isCompleted && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-success text-success-foreground gap-1">
                          <Trophy className="w-3 h-3" /> Completed
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <p className="text-sm text-primary font-medium mb-1">{enrollment.course.category}</p>
                        <h3 className="text-xl font-semibold text-foreground mb-2">{enrollment.course.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {enrollment.course.durationHours} hrs
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" />
                            {enrollment.completedVideos} / {enrollment.totalVideos} Videos
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold text-foreground">{progress}%</span>
                        </div>
                        <Progress 
                          value={progress} 
                          className="h-2.5" 
                          indicatorClassName={isCompleted ? "gradient-success" : "gradient-primary"}
                        />
                        <div className="flex justify-end pt-2">
                          <Link to={`/student/course/${enrollment.course.id}`}>
                            <Button className="gap-2">
                              {isCompleted ? 'Review Course' : progress > 0 ? 'Continue Learning' : 'Start Learning'}
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
            </div>
          )}

          {liveBatches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Radio className="w-5 h-5 text-primary" /> Live lecture batches
              </h2>
              <p className="text-sm text-muted-foreground">
                Batches you're enrolled in. Join live sessions and watch recordings when available.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {liveBatches.map((b) => {
                  const pending = b.totalPastLectures - b.attendedCount;
                  const progressPct = b.totalPastLectures > 0
                    ? Math.round((b.attendedCount / b.totalPastLectures) * 100)
                    : 0;
                  return (
                    <div
                      key={b.batchId}
                      className="bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-48 aspect-video md:aspect-auto min-h-[100px] bg-muted relative flex-shrink-0">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Radio className="w-10 h-10 text-primary opacity-80" />
                          </div>
                        </div>
                        <div className="flex-1 p-5 flex flex-col">
                          <h3 className="font-semibold text-foreground text-lg mb-1">{b.batchName}</h3>
                          {b.currentModuleName && (
                            <p className="text-sm text-primary font-medium mb-2">Current module: {b.currentModuleName}</p>
                          )}
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Video className="w-4 h-4" />
                              {b.recordedCount} recording{b.recordedCount !== 1 ? 's' : ''} available
                            </span>
                            {pending > 0 && (
                              <Badge variant="secondary">{(b.totalPastLectures - b.attendedCount)} lecture{pending !== 1 ? 's' : ''} pending</Badge>
                            )}
                          </div>
                          <div className="mt-auto space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium text-foreground">
                                {b.attendedCount} of {b.totalPastLectures} lecture{b.totalPastLectures !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <Progress value={progressPct} className="h-2" indicatorClassName="gradient-primary" />
                            <Link to="/student/live-lectures" className="block pt-2">
                              <Button variant="outline" className="w-full gap-2">
                                <Video className="w-4 h-4" /> Go to recorded lectures
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyCourses;

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useCashfree } from '@/hooks/useCashfree';
import {
  Clock,
  Users,
  BarChart,
  ShoppingCart,
  Search,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';

/* 🔹 API COURSE TYPE */
type ApiCourse = {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: string;
  durationHours: number;
  videoCount?: number;
  studentCount: number;
  isEnrolled: boolean;
};

const CourseMarketplace: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { initiatePayment, isLoading: paymentLoading } = useCashfree();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingCourseId, setPurchasingCourseId] = useState<string | null>(null);

  const refreshCourses = async () => {
    const coursesResponse = await api.get('/courses');
    if (coursesResponse.ok) {
      const coursesData = await coursesResponse.json();
      setCourses(coursesData);
    }
  };

  /* 🔹 Handle Cashfree return after payment - verify and show success */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentVerify = params.get('payment_verify');
    const orderId = params.get('order_id');
    if (paymentVerify === '1' && orderId) {
      (async () => {
        try {
          const res = await api.post('/payments/verify', { orderId });
          if (res.ok) {
            const data = await res.json();
            toast({
              title: 'Payment Successful! 🎉',
              description: data.message || 'You are now enrolled.',
            });
            await refreshCourses();
          } else {
            const err = await res.json();
            toast({
              title: 'Payment Verification Failed',
              description: err.error || 'Please contact support if amount was deducted.',
              variant: 'destructive',
            });
          }
        } catch {
          toast({
            title: 'Payment Verification Failed',
            description: 'Please contact support if amount was deducted.',
            variant: 'destructive',
          });
        } finally {
          window.history.replaceState({}, '', window.location.pathname);
        }
      })();
    }
  }, []);

  /* 🔹 FETCH COURSES FROM BACKEND (with optional auth for enrollment status) */
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses');
        if (response.ok) {
          const data = await response.json();
          setCourses(data);
        } else if (response.status !== 401) {
          if (import.meta.env.DEV) console.error('Failed to fetch courses');
          toast({
            title: 'Error',
            description: 'Failed to load courses',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load courses',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const categories = ['all', ...new Set(courses.map(c => c.category))];

  const filteredCourses = courses.filter(course => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || course.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handlePurchase = async (course: ApiCourse) => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please log in to purchase courses',
      });
      navigate('/login');
      return;
    }

    // For free courses, directly enroll
    if (parseFloat(course.price) === 0) {
      try {
        setPurchasingCourseId(course.id);
        const response = await api.post('/enrollments', {
          courseId: course.id,
        });

        if (response.ok) {
          toast({
            title: 'Enrolled Successfully! 🎉',
            description: `You now have access to "${course.title}"`,
          });
          await refreshCourses();
        } else {
          const errorData = await response.json();
          toast({
            title: 'Enrollment Failed',
            description: errorData.error || 'Failed to enroll in course',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Enrollment error:', error);
        toast({
          title: 'Error',
          description: 'Failed to enroll in course. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setPurchasingCourseId(null);
      }
      return;
    }

    // For paid courses, use Cashfree
    setPurchasingCourseId(course.id);
    initiatePayment(
      {
        id: course.id,
        title: course.title,
        price: course.price,
      },
      async (courseId) => {
        // On success, refresh course list
        await refreshCourses();
        setPurchasingCourseId(null);
        // Optionally navigate to course
        // navigate(`/student/course/${courseId}`);
      },
      () => {
        // On cancel
        setPurchasingCourseId(null);
      }
    );
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return 'bg-success/10 text-success';
      case 'INTERMEDIATE':
        return 'bg-warning/10 text-warning';
      case 'ADVANCED':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading courses...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Course Marketplace</h1>
        <p className="text-muted-foreground">
          Discover courses to accelerate your data career
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap',
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              {category === 'all'
                ? 'All Courses'
                : category.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Courses */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No courses found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => {
            const isPurchasing = purchasingCourseId === course.id;
            const isFree = parseFloat(course.price) === 0;
            
            return (
              <div key={course.id} className="bg-card rounded-xl border p-5 flex flex-col">
                <Badge className={getLevelColor(course.level)}>
                  {course.level}
                </Badge>

                <h3 className="text-lg font-semibold mt-3">{course.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 flex-grow">
                  {course.description}
                </p>

                <div className="grid grid-cols-2 gap-3 my-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {course.durationHours} hrs
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {course.studentCount}
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart className="w-4 h-4" />
                    {course.videoCount ?? 0} Videos
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-xl font-bold">
                    {isFree ? (
                      <span className="text-success">FREE</span>
                    ) : (
                      <>₹{course.price}</>
                    )}
                  </span>

                  {course.isEnrolled ? (
                    <Link to={`/student/course/${course.id}`}>
                      <Button variant="secondary">Go to Course</Button>
                    </Link>
                  ) : (
                    <Button 
                      onClick={() => handlePurchase(course)}
                      disabled={isPurchasing || (paymentLoading && purchasingCourseId === course.id)}
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {isFree ? 'Enroll Free' : 'Buy Now'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseMarketplace;

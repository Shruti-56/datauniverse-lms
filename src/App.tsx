import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentLayout from "./components/layout/StudentLayout";
import InstructorLayout from "./components/layout/InstructorLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import CourseMarketplace from "./pages/student/CourseMarketplace";
import MyCourses from "./pages/student/MyCourses";
import CourseDetail from "./pages/student/CourseDetail";
import StudentProfile from "./pages/student/StudentProfile";
import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminFees from "./pages/admin/AdminFees";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminLandingAnalytics from "./pages/admin/AdminLandingAnalytics";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminVideoUpload from "./pages/admin/AdminVideoUpload";
import AdminCourseEdit from "./pages/admin/AdminCourseEdit";
import AdminScreenTime from "./pages/admin/AdminScreenTime";
import AdminInstructors from "./pages/admin/AdminInstructors";
import AdminAlumniVideos from "./pages/admin/AdminAlumniVideos";
import AdminPolicies from "./pages/admin/AdminPolicies";
import AdminInterviews from "./pages/admin/AdminInterviews";
import AdminLiveLectures from "./pages/admin/AdminLiveLectures";
import AdminNotices from "./pages/admin/AdminNotices";
import AdminPromoBanners from "./pages/admin/AdminPromoBanners";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminCertificates from "./pages/admin/AdminCertificates";
import LiveLectures from "./pages/student/LiveLectures";
import LiveLectureJoin from "./pages/student/LiveLectureJoin";
import NotFound from "./pages/NotFound";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import MySubmissions from "./pages/student/MySubmissions";
import MyInterviews from "./pages/student/MyInterviews";
import AlumniVideos from "./pages/student/AlumniVideos";
import Policies from "./pages/student/Policies";
import PaymentHistory from "./pages/student/PaymentHistory";
import MyFees from "./pages/student/MyFees";
import Feedback from "./pages/student/Feedback";
import MyCertificates from "./pages/student/MyCertificates";
import InstructorSubmissions from "./pages/instructor/InstructorSubmissions";
import InstructorMyStudents from "./pages/instructor/InstructorMyStudents";
import InstructorInterviews from "./pages/instructor/InstructorInterviews";
import MarketingLanding from "./pages/MarketingLanding";
import AdsCampaignLanding from "./pages/AdsCampaignLanding";
import AdsReservePage from "./pages/AdsReservePage";
import AdsCheckoutPage from "./pages/AdsCheckoutPage";

const queryClient = new QueryClient();

// Login redirect component - handles when authenticated user visits /login
const LoginRedirect = ({ userRole }: { userRole: 'student' | 'admin' | 'instructor' | null }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const redirectUrl = urlParams.get('redirect');

  useEffect(() => {
    if (redirectUrl) {
      const decodedUrl = decodeURIComponent(redirectUrl);
      // Only allow relative paths to prevent open redirect attacks
      const safeUrl = decodedUrl.startsWith('/') && !decodedUrl.startsWith('//') ? decodedUrl : '/';
      window.location.href = safeUrl;
    }
  }, [redirectUrl]);
  
  if (redirectUrl) {
    // Show loading while redirecting
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm text-muted-foreground">Redirecting...</div>
        </div>
      </div>
    );
  }
  
  // Otherwise navigate based on role
  if (userRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (userRole === 'instructor') {
    return <Navigate to="/instructor/submissions" replace />;
  } else {
    return <Navigate to="/student/dashboard" replace />;
  }
};

// Protected Route Components
const StudentRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    const returnUrl = location.pathname + location.search;
    return <Navigate to={returnUrl ? `/login?redirect=${encodeURIComponent(returnUrl)}` : '/login'} replace />;
  }
  // Only allow students - instructors have their own routes
  if (userRole === 'instructor') return <Navigate to="/instructor/submissions" />;
  if (userRole === 'admin') return <Navigate to="/admin/dashboard" />;
  return <StudentLayout>{children}</StudentLayout>;
};

const InstructorRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';

  if (!isAuthenticated) {
    return <Navigate to={currentPath ? `/login?redirect=${encodeURIComponent(currentPath)}` : '/login'} replace />;
  }

  // Require instructor role; if logged in as student/admin, send to login with redirect so they can sign in as instructor (e.g. review link from email)
  if (userRole !== 'instructor') {
    return <Navigate to={`/login?redirect=${encodeURIComponent(currentPath || '/instructor/submissions')}`} replace />;
  }

  return <InstructorLayout>{children}</InstructorLayout>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (userRole !== 'admin') {
    if (userRole === 'instructor') return <Navigate to="/instructor/submissions" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }
  return <AdminLayout>{children}</AdminLayout>;
};

const AppRoutes = () => {
  const { isAuthenticated, userRole, isLoading } = useAuth();

  // Show loading state while restoring session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        isAuthenticated 
          ? <Navigate to={userRole === 'admin' ? '/admin/dashboard' : userRole === 'instructor' ? '/instructor/submissions' : '/student/dashboard'} replace />
          : <MarketingLanding />
      } />
      <Route path="/login" element={
        isAuthenticated 
          ? <LoginRedirect userRole={userRole} />
          : <LoginPage />
      } />
      <Route path="/register" element={
        isAuthenticated 
          ? <Navigate to={userRole === 'admin' ? '/admin/dashboard' : userRole === 'instructor' ? '/instructor/submissions' : '/student/dashboard'} />
          : <RegisterPage />
      } />
      <Route path="/forgot-password" element={
        isAuthenticated 
          ? <Navigate to={userRole === 'admin' ? '/admin/dashboard' : userRole === 'instructor' ? '/instructor/submissions' : '/student/dashboard'} />
          : <ForgotPasswordPage />
      } />
      {/* Ads campaign landing - direct URL only, no nav links */}
      <Route path="/lp/working-professionals" element={<AdsCampaignLanding />} />
      <Route path="/lp/working-professionals/reserve" element={<AdsReservePage />} />
      <Route path="/lp/working-professionals/checkout" element={<AdsCheckoutPage />} />

      <Route path="/reset-password" element={
        isAuthenticated 
          ? <Navigate to={userRole === 'admin' ? '/admin/dashboard' : userRole === 'instructor' ? '/instructor/submissions' : '/student/dashboard'} />
          : <ResetPasswordPage />
      } />
      
      {/* Student Routes (also accessible by instructors) */}
      <Route path="/student/dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
      <Route path="/student/marketplace" element={<StudentRoute><CourseMarketplace /></StudentRoute>} />
      <Route path="/student/my-courses" element={<StudentRoute><MyCourses /></StudentRoute>} />
      <Route path="/student/course/:courseId" element={<StudentRoute><CourseDetail /></StudentRoute>} />
      <Route path="/student/profile" element={<StudentRoute><StudentProfile /></StudentRoute>} />
      <Route path="/student/submissions" element={<StudentRoute><MySubmissions /></StudentRoute>} />
      <Route path="/student/interviews" element={<StudentRoute><MyInterviews /></StudentRoute>} />
      <Route path="/student/live-lectures" element={<StudentRoute><LiveLectures /></StudentRoute>} />
      <Route path="/student/live-lectures/join" element={<LiveLectureJoin />} />
      <Route path="/student/alumni" element={<StudentRoute><AlumniVideos /></StudentRoute>} />
      <Route path="/student/feedback" element={<StudentRoute><Feedback /></StudentRoute>} />
      <Route path="/student/certificates" element={<StudentRoute><MyCertificates /></StudentRoute>} />
      <Route path="/student/policies" element={<StudentRoute><Policies /></StudentRoute>} />
      <Route path="/student/payment-history" element={<StudentRoute><PaymentHistory /></StudentRoute>} />
      <Route path="/student/fees" element={<StudentRoute><MyFees /></StudentRoute>} />
      
      {/* Instructor Routes */}
      <Route path="/instructor/submissions" element={<InstructorRoute><InstructorSubmissions /></InstructorRoute>} />
      <Route path="/instructor/students" element={<InstructorRoute><InstructorMyStudents /></InstructorRoute>} />
      <Route path="/instructor/interviews" element={<InstructorRoute><InstructorInterviews /></InstructorRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
      <Route path="/admin/courses/:courseId/edit" element={<AdminRoute><AdminCourseEdit /></AdminRoute>} />
      <Route path="/admin/videos/:videoId/upload" element={<AdminRoute><AdminVideoUpload /></AdminRoute>} />
      <Route path="/admin/students" element={<AdminRoute><AdminStudents /></AdminRoute>} />
      <Route path="/admin/fees" element={<AdminRoute><AdminFees /></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
      <Route path="/admin/landing-analytics" element={<AdminRoute><AdminLandingAnalytics /></AdminRoute>} />
      <Route path="/admin/screentime" element={<AdminRoute><AdminScreenTime /></AdminRoute>} />
      <Route path="/admin/instructors" element={<AdminRoute><AdminInstructors /></AdminRoute>} />
      <Route path="/admin/alumni" element={<AdminRoute><AdminAlumniVideos /></AdminRoute>} />
      <Route path="/admin/policies" element={<AdminRoute><AdminPolicies /></AdminRoute>} />
      <Route path="/admin/interviews" element={<AdminRoute><AdminInterviews /></AdminRoute>} />
      <Route path="/admin/live-lectures" element={<AdminRoute><AdminLiveLectures /></AdminRoute>} />
      <Route path="/admin/notices" element={<AdminRoute><AdminNotices /></AdminRoute>} />
      <Route path="/admin/banners" element={<AdminRoute><AdminPromoBanners /></AdminRoute>} />
      <Route path="/admin/feedback" element={<AdminRoute><AdminFeedback /></AdminRoute>} />
      <Route path="/admin/certificates" element={<AdminRoute><AdminCertificates /></AdminRoute>} />
      <Route path="/admin/profile" element={<AdminRoute><AdminProfile /></AdminRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

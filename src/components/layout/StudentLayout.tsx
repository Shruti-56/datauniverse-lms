import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useScreenTime } from '@/hooks/useScreenTime';
import { 
  GraduationCap, 
  LayoutDashboard, 
  ShoppingBag, 
  BookOpen, 
  LogOut,
  FileText,
  Calendar,
  Radio,
  Shield,
  User,
  Video,
  MessageSquare,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import InstituteFooter from '@/components/InstituteFooter';

interface StudentLayoutProps {
  children: React.ReactNode;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  
  // Track screen time for students
  useScreenTime();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    // Use replace to prevent back navigation
    navigate('/login', { replace: true });
  };

  const navItems = [
    { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/student/marketplace', label: 'Courses', icon: ShoppingBag },
    { path: '/student/my-courses', label: 'My Learning', icon: BookOpen },
    { path: '/student/live-lectures', label: 'Live Lectures', icon: Radio },
    { path: '/student/submissions', label: 'Submissions', icon: FileText },
    { path: '/student/interviews', label: 'Interviews', icon: Calendar },
    { path: '/student/alumni', label: 'Alumni', icon: Video },
    { path: '/student/feedback', label: 'Feedback', icon: MessageSquare },
    { path: '/student/certificates', label: 'Certificates', icon: Award },
    { path: '/student/profile', label: 'Profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/student/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-bold text-foreground hidden sm:block">DataUniverse</span>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-1">
            <Link
              to="/student/policies"
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Policies"
            >
              <Shield className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            </Link>
            <Link
              to="/student/profile"
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Profile"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                <span className="text-sm font-semibold text-primary">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'S'}
                </span>
              </div>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[60px]",
                isActive(item.path)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>

      {/* Institute details – at bottom of page, visible when students scroll down */}
      <InstituteFooter />
    </div>
  );
};

export default StudentLayout;

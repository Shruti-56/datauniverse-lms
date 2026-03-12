import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  Clock,
  UserCheck,
  Video,
  Shield,
  Calendar,
  Radio,
  Megaphone,
  Globe,
  ImagePlus,
  MessageSquare,
  Award,
  IndianRupee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    // Use replace to prevent back navigation
    navigate('/login', { replace: true });
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/courses', label: 'Courses', icon: BookOpen },
    { path: '/admin/students', label: 'Students', icon: Users },
    { path: '/admin/fees', label: 'Fees', icon: IndianRupee },
    { path: '/admin/notices', label: 'Notices', icon: Megaphone },
    { path: '/admin/banners', label: 'Banners', icon: ImagePlus },
    { path: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
    { path: '/admin/certificates', label: 'Certificates', icon: Award },
    { path: '/admin/instructors', label: 'Instructors', icon: UserCheck },
    { path: '/admin/interviews', label: 'Interviews', icon: Calendar },
    { path: '/admin/live-lectures', label: 'Live Lectures', icon: Radio },
    { path: '/admin/alumni', label: 'Alumni', icon: Video },
    { path: '/admin/screentime', label: 'Screen Time', icon: Clock },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/landing-analytics', label: 'Landing Analytics', icon: Globe },
    { path: '/admin/profile', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-accent rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <span className="text-lg font-display font-bold text-sidebar-foreground">DataUniverse</span>
            <p className="text-xs text-sidebar-foreground/60">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative",
              isActive(item.path)
                ? "bg-gradient-to-r from-sidebar-primary to-sidebar-primary/90 text-sidebar-primary-foreground shadow-md"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-transform",
              isActive(item.path) && "scale-110"
            )} />
            <span className="flex-1">{item.label}</span>
            {isActive(item.path) && (
              <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-sidebar-primary-foreground" />
            )}
            <ChevronRight className={cn(
              "w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity",
              isActive(item.path) && "opacity-100"
            )} />
          </Link>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 mb-2">
          <Link
            to="/admin/policies"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <Shield className="w-4 h-4" />
            <span>Policies</span>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
        <Link
          to="/admin/profile"
          className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-primary-foreground">
              {user?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email || 'admin@datauniverse.com'}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar - z-30 so it stays on top when main content scrolls */}
      <aside className="hidden lg:block w-64 shrink-0 bg-sidebar fixed left-0 top-0 bottom-0 z-30 border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-sidebar border-b border-sidebar-border flex items-center px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 ml-4">
          <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-foreground" />
          </div>
          <span className="text-lg font-display font-bold text-sidebar-foreground">DataUniverse</span>
        </div>
      </header>

      {/* Main Content - z-0 so it scrolls behind the sidebar */}
      <main className="flex-1 min-w-0 lg:ml-64 pt-16 lg:pt-0 z-0 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

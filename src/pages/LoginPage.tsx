import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { GraduationCap, Shield, BookOpen, Users, TrendingUp, Award, UserCheck } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, userRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loginType, setLoginType] = useState<'student' | 'admin' | 'instructor' | null>(null);
  const redirectUrlRef = useRef<string | null>(null);

  const handleLoginTypeSelect = (type: 'student' | 'admin' | 'instructor') => {
    setLoginType(type);
    setShowForm(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      // Preserve redirect from URL so useEffect can send user to the right page after auth state updates
      redirectUrlRef.current = searchParams.get('redirect');
      // Don't navigate here - let useEffect handle it after auth state updates
    } else {
      toast({
        title: 'Login Failed',
        description: result.error || 'Invalid credentials',
        variant: 'destructive',
      });
    }
  };

  // Handle navigation after successful login and auth state update
  useEffect(() => {
    if (isAuthenticated && redirectUrlRef.current) {
      const decodedUrl = decodeURIComponent(redirectUrlRef.current);
      redirectUrlRef.current = null;
      // Full navigation so query params (e.g. submissionId) are preserved
      window.location.href = decodedUrl;
    } else if (isAuthenticated && !redirectUrlRef.current && userRole) {
      if (userRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'instructor') {
        navigate('/instructor/submissions', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, userRole, navigate]);

  const handleBack = () => {
    setShowForm(false);
    setLoginType(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero p-12 flex-col justify-between relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-accent rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-foreground" />
            </div>
            <span className="text-2xl font-display font-bold text-primary-foreground">DataUniverse</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-primary-foreground leading-tight">
            Unlock Your
            <br />
            <span className="text-accent">Data Career</span>
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            Master Data Analytics, Engineering, and Science with industry-leading courses designed by experts.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 text-primary-foreground/90">
              <BookOpen className="w-5 h-5 text-accent" />
              <span className="text-sm">50+ Hours Content</span>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/90">
              <Users className="w-5 h-5 text-accent" />
              <span className="text-sm">45,000+ Students</span>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/90">
              <TrendingUp className="w-5 h-5 text-accent" />
              <span className="text-sm">Career Growth</span>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/90">
              <Award className="w-5 h-5 text-accent" />
              <span className="text-sm">Track Progress</span>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-primary-foreground/60">
            © 2026 DataUniverse. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Options */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Back to marketing home */}
          <div className="flex justify-start">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              ← Back to home
            </Link>
          </div>
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">DataUniverse</span>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-display font-bold text-foreground">Welcome Back</h2>
            <p className="text-muted-foreground">Choose how you'd like to access the platform</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>

          {!showForm ? (
            <>
              <div className="space-y-4">
                {/* Student Login */}
                <button
                  onClick={() => handleLoginTypeSelect('student')}
                  className="w-full p-6 rounded-xl border-2 border-border bg-card hover:border-primary hover:shadow-card-hover transition-all duration-300 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center group-hover:gradient-primary transition-all duration-300">
                      <GraduationCap className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">Student Login</h3>
                      <p className="text-sm text-muted-foreground">
                        Access your courses, track progress, and continue learning
                      </p>
                    </div>
                  </div>
                </button>

                {/* Instructor Login */}
                <button
                  onClick={() => handleLoginTypeSelect('instructor')}
                  className="w-full p-6 rounded-xl border-2 border-border bg-card hover:border-primary hover:shadow-card-hover transition-all duration-300 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center group-hover:gradient-primary transition-all duration-300">
                      <UserCheck className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">Instructor Login</h3>
                      <p className="text-sm text-muted-foreground">
                        Review student submissions and provide feedback
                      </p>
                    </div>
                  </div>
                </button>

                {/* Admin Login */}
                <button
                  onClick={() => handleLoginTypeSelect('admin')}
                  className="w-full p-6 rounded-xl border-2 border-border bg-card hover:border-accent hover:shadow-card-hover transition-all duration-300 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center group-hover:gradient-accent transition-all duration-300">
                      <Shield className="w-7 h-7 text-primary group-hover:text-accent-foreground transition-colors" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">Admin Login</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage courses, students, and platform settings
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="gap-2"
                >
                  ← Back
                </Button>
                <h3 className="text-lg font-semibold">
                  {loginType === 'admin' ? 'Admin' : loginType === 'instructor' ? 'Instructor' : 'Student'} Login
                </h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Sign In'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

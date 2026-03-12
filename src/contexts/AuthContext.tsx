import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setToken, removeToken, getToken } from '@/lib/api';

/**
 * User type matching backend response from /api/auth/me
 */
export interface User {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  roles: ('STUDENT' | 'ADMIN' | 'INSTRUCTOR')[];
  createdAt: string;
}

type UserRole = 'student' | 'admin' | 'instructor' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Determine user role from backend roles array
   */
  const determineRole = (roles: ('STUDENT' | 'ADMIN' | 'INSTRUCTOR')[] | string[]): UserRole => {
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      if (import.meta.env.DEV) console.warn('No roles provided or roles is not an array:', roles);
      return null;
    }
    
    // Handle both string arrays and enum arrays
    const roleStrings = roles.map(r => String(r).toUpperCase());
    
    if (roleStrings.includes('ADMIN')) return 'admin';
    if (roleStrings.includes('INSTRUCTOR')) return 'instructor';
    if (roleStrings.includes('STUDENT')) return 'student';
    
    if (import.meta.env.DEV) console.warn('Unknown role values:', roles);
    return null;
  };

  /**
   * When any API request returns 401 (e.g. in another part of the app), clear auth state
   * so this tab redirects to login instead of showing "failed to load"
   */
  useEffect(() => {
    const handleSessionExpired = () => {
      setIsAuthenticated(false);
      setUserRole(null);
      setUser(null);
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  /**
   * Restore session on app load by checking for existing token
   */
  useEffect(() => {
    const restoreSession = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        setIsAuthenticated(false);
        setUserRole(null);
        setUser(null);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (!data || typeof data !== 'object') {
            removeToken();
            setIsAuthenticated(false);
            setUserRole(null);
            setUser(null);
            return;
          }
          const userData: User = {
            id: String(data.id ?? ''),
            email: String(data.email ?? ''),
            fullName: data.fullName ?? null,
            avatarUrl: data.avatarUrl ?? null,
            bio: data.bio ?? null,
            roles: Array.isArray(data.roles) ? data.roles : [],
            createdAt: data.createdAt ?? new Date().toISOString(),
          };
          const role = determineRole(userData.roles);
          setUser(userData);
          setUserRole(role);
          setIsAuthenticated(true);
        } else {
          removeToken();
          setIsAuthenticated(false);
          setUserRole(null);
          setUser(null);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to restore session:', error);
        }
        try {
          removeToken();
        } catch {
          // ignore
        }
        setIsAuthenticated(false);
        setUserRole(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    try {
      const apiBase = typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api';
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: (data && data.error) || 'Login failed' };
      }

      if (!data || !data.token) {
        return { success: false, error: 'Invalid login response' };
      }

      const u = data.user ?? {};
      const userData: User = {
        id: String(u.id ?? ''),
        email: String(u.email ?? ''),
        fullName: u.fullName ?? null,
        avatarUrl: u.avatarUrl ?? null,
        bio: u.bio ?? null,
        roles: Array.isArray(u.roles) ? u.roles : [],
        createdAt: u.createdAt ?? new Date().toISOString(),
      };

      const role = determineRole(userData.roles);
      setToken(data.token, role ?? undefined);

      setUser(userData);
      setUserRole(role);
      setIsAuthenticated(true);

      return { success: true, role };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please check if backend is running.' };
    }
  };

  /**
   * Logout - remove token and clear user state
   */
  const logout = async () => {
    try {
      // Clear state first to ensure UI updates immediately
      removeToken();
      setIsAuthenticated(false);
      setUserRole(null);
      setUser(null);
      
      // Call logout endpoint in background (optional, for logging/analytics)
      // Don't await - let it run in background
      api.post('/auth/logout').catch(() => {
        // Silently ignore errors
      });
    } catch (error) {
      // Even if something fails, ensure state is cleared
      removeToken();
      setIsAuthenticated(false);
      setUserRole(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userRole,
        user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

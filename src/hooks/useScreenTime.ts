import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to track screen time by sending heartbeat pings every 30 seconds
 */
export const useScreenTime = () => {
  const { isAuthenticated, userRole } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Only track screen time for authenticated students
    if (!isAuthenticated || userRole !== 'student') {
      return;
    }

    const sendPing = async () => {
      try {
        const response = await api.post('/screentime/ping');
        if (!response.ok && import.meta.env.DEV) {
          console.debug('Screen time ping failed:', response.status);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.debug('Screen time ping error:', error);
      }
    };

    // Send initial ping after a short delay
    const initialTimeout = setTimeout(sendPing, 1000);

    // Send ping every 60 seconds (halves DB writes vs 30s; accuracy is still fine for weekly totals)
    intervalRef.current = setInterval(sendPing, 60000);

    // Handle visibility change - pause tracking when tab is hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Resume tracking when tab becomes visible
        if (!intervalRef.current) {
          sendPing();
          intervalRef.current = setInterval(sendPing, 60000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, userRole]);
};

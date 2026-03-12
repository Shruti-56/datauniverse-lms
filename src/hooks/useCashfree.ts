import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Cashfree?: (options: {
      mode: 'sandbox' | 'production';
    }) => {
      checkout: (options: {
        paymentSessionId: string;
        returnUrl: string;
      }) => Promise<{ error?: { message: string }; redirect?: boolean }>;
    };
  }
}

type CourseData = {
  id: string;
  title: string;
  price: string;
};

export const useCashfree = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [cashfreeMode, setCashfreeMode] = useState<'sandbox' | 'production'>('sandbox');

  useEffect(() => {
    const existingScript = document.getElementById('cashfree-script');
    if (existingScript) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'cashfree-script';
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      toast({
        title: 'Error',
        description: 'Failed to load payment gateway. Please refresh the page.',
        variant: 'destructive',
      });
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isScriptLoaded) return;
    (async () => {
      try {
        const res = await api.get('/payments/config');
        if (!res.ok) return;
        const data = (await res.json()) as { env?: 'sandbox' | 'production' };
        if (data.env === 'production') setCashfreeMode('production');
        else setCashfreeMode('sandbox');
      } catch {
        // If config fetch fails, default to sandbox.
      }
    })();
  }, [isScriptLoaded]);

  const initiatePayment = useCallback(
    async (
      course: CourseData,
      onSuccess: (courseId: string) => void,
      onCancel?: () => void
    ) => {
      if (!isScriptLoaded || !window.Cashfree) {
        toast({
          title: 'Please Wait',
          description: 'Payment gateway is loading...',
        });
        // Tell caller to stop \"Processing...\" state
        onCancel?.();
        return;
      }

      setIsLoading(true);

      try {
        const orderResponse = await api.post('/payments/create-order', {
          courseId: course.id,
        });

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          throw new Error(errorData.error || 'Failed to create order');
        }

        const orderData = await orderResponse.json();
        const { paymentSessionId } = orderData;

        if (!paymentSessionId) {
          throw new Error('Invalid response from payment gateway');
        }

        const returnUrl = `${window.location.origin}/student/marketplace?payment_verify=1&order_id={order_id}`;

        const cashfree = window.Cashfree({ mode: cashfreeMode });
        const result = await cashfree.checkout({
          paymentSessionId,
          returnUrl,
        });

        if (result.error) {
          throw new Error(result.error.message || 'Payment failed');
        }

        if (result.redirect) {
          // Cashfree handled the redirect (full-page or popup). Clear loading + local \"processing\" state.
          setIsLoading(false);
          onCancel?.();
          return;
        }

        // If no redirect occurred (rare), we still treat checkout as started.
        setIsLoading(false);
        onCancel?.();
      } catch (error: unknown) {
        console.error('Payment initiation error:', error);
        toast({
          title: 'Payment Failed',
          description: error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
        onCancel?.();
      }
    },
    [cashfreeMode, isScriptLoaded]
  );

  return {
    initiatePayment,
    isLoading,
    isReady: isScriptLoaded,
  };
};

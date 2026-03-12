import { Request, Response } from 'express';
import { PurchaseStatus } from '@prisma/client';
import { emailService } from '../services/email.service';
import { prisma } from '../lib/prisma';

const CASHFREE_API_VERSION = '2023-08-01';
const CASHFREE_SANDBOX = 'https://sandbox.cashfree.com/pg';
const CASHFREE_PROD = 'https://api.cashfree.com/pg';

function getCashfreeMode(): 'sandbox' | 'production' {
  // If frontend URL is clearly http (localhost / non-https), force sandbox to avoid
  // Cashfree production rejecting non-https return URLs.
  const frontendUrl =
    process.env.FRONTEND_URL || process.env.CORS_ORIGINS?.split(',')[0]?.trim() || '';
  if (frontendUrl.startsWith('http://')) {
    return 'sandbox';
  }

  const env = process.env.CASHFREE_ENV?.toLowerCase();
  if (env === 'production') return 'production';
  if (env === 'sandbox') return 'sandbox';

  // Otherwise default based on NODE_ENV (production → production, else sandbox)
  return process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
}

function getCashfreeBaseUrl(): string {
  return getCashfreeMode() === 'production' ? CASHFREE_PROD : CASHFREE_SANDBOX;
}

async function cashfreeRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secretKey) {
    throw new Error('CASHFREE_APP_ID and CASHFREE_SECRET_KEY must be set');
  }
  const baseUrl = getCashfreeBaseUrl();
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    'X-Client-Id': appId,
    'X-Client-Secret': secretKey,
    'x-api-version': CASHFREE_API_VERSION,
    'Content-Type': 'application/json',
  };
  const options: RequestInit = {
    method,
    headers,
  };
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    const msg = (data as { message?: string }).message ?? `Cashfree API error: ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

class PaymentController {
  /**
   * Create a Cashfree order for course purchase
   * POST /api/payments/create-order
   */
  createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { courseId } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!courseId) {
        res.status(400).json({ error: 'Course ID is required' });
        return;
      }

      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }

      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId },
        },
      });

      if (existingEnrollment) {
        res.status(400).json({ error: 'You are already enrolled in this course' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const priceValue = Number(course.price);
      const orderAmount = Math.max(priceValue, 1);

      const purchase = await prisma.purchase.create({
        data: {
          userId,
          courseId,
          amount: course.price,
          status: PurchaseStatus.PENDING,
          paymentProvider: 'cashfree',
          paymentId: null,
        },
      });

      const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGINS?.split(',')[0]?.trim() || 'https://datauniverse.in';
      const returnUrl = `${frontendUrl}/student/marketplace?payment_verify=1&order_id=${purchase.id}`;
      if (getCashfreeMode() === 'production' && !returnUrl.startsWith('https://')) {
        throw new Error(
          `Cashfree production requires https return_url. Got: ${returnUrl}. ` +
            `Fix: set FRONTEND_URL to your https domain, or run sandbox in dev (set NODE_ENV!=production / CASHFREE_ENV=sandbox).`
        );
      }

      const cfOrder = await cashfreeRequest<{
        order_id?: string;
        payment_session_id?: string;
        data?: { order_id?: string; payment_session_id?: string };
      }>('POST', '/orders', {
        order_id: purchase.id,
        order_amount: orderAmount,
        order_currency: 'INR',
        customer_details: {
          customer_id: userId,
          customer_name: user.profile?.fullName || user.email.split('@')[0] || 'Customer',
          customer_email: user.email,
          customer_phone: user.profile?.phoneNumber || '9999999999',
        },
        order_meta: {
          return_url: returnUrl,
        },
      });

      const paymentSessionId = cfOrder.payment_session_id ?? cfOrder.data?.payment_session_id;
      const cfOrderId = cfOrder.order_id ?? cfOrder.data?.order_id ?? purchase.id;
      if (!paymentSessionId) {
        throw new Error('Cashfree did not return payment_session_id');
      }
      res.json({
        paymentSessionId,
        orderId: cfOrderId,
        purchaseId: purchase.id,
        amount: orderAmount,
        currency: 'INR',
        course: {
          id: course.id,
          title: course.title,
          price: course.price,
        },
      });
    } catch (error: unknown) {
      console.error('createOrder error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create order',
      });
    }
  };

  /**
   * Verify Cashfree payment and complete enrollment
   * POST /api/payments/verify
   */
  verifyPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { orderId } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!orderId) {
        res.status(400).json({ error: 'Order ID is required' });
        return;
      }

      const cfOrder = await cashfreeRequest<{ order_status: string }>('GET', `/orders/${orderId}`);
      if (cfOrder.order_status !== 'PAID') {
        res.status(400).json({ error: 'Payment not completed or verification failed' });
        return;
      }

      const purchase = await prisma.purchase.findUnique({
        where: { id: orderId },
        include: { course: true },
      });

      if (!purchase) {
        res.status(404).json({ error: 'Purchase not found' });
        return;
      }

      if (purchase.userId !== userId) {
        res.status(403).json({ error: 'Unauthorized access to purchase' });
        return;
      }

      if (purchase.status === PurchaseStatus.COMPLETED) {
        res.json({
          success: true,
          message: 'Payment already processed.',
          enrollment: {
            id: '',
            courseId: purchase.courseId,
            courseTitle: purchase.course.title,
          },
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      let paymentId = orderId;
      try {
        const paymentsRes = await cashfreeRequest<{ data?: Array<{ cf_payment_id?: string }> }>('GET', `/orders/${orderId}/payments`);
        if (Array.isArray(paymentsRes.data) && paymentsRes.data.length > 0 && paymentsRes.data[0].cf_payment_id) {
          paymentId = paymentsRes.data[0].cf_payment_id;
        }
      } catch {
        // Use orderId as payment reference if payments fetch fails
      }

      const result = await prisma.$transaction(async (tx) => {
        await tx.purchase.update({
          where: { id: orderId },
          data: {
            status: PurchaseStatus.COMPLETED,
            paymentId,
          },
        });
        const enrollment = await tx.enrollment.create({
          data: {
            userId,
            courseId: purchase.courseId,
          },
        });
        return { enrollment };
      });

      if (user) {
        emailService.sendPaymentReceiptEmail(
          user.email,
          purchase.course.title,
          Number(purchase.amount),
          paymentId,
          user.profile?.fullName || undefined
        ).catch(err => console.error('Failed to send payment receipt:', err));

        emailService.sendEnrollmentEmail(
          user.email,
          purchase.course.title,
          user.profile?.fullName || undefined
        ).catch(err => console.error('Failed to send enrollment email:', err));
      }

      res.json({
        success: true,
        message: 'Payment successful! You are now enrolled.',
        enrollment: {
          id: result.enrollment.id,
          courseId: purchase.courseId,
          courseTitle: purchase.course.title,
        },
      });
    } catch (error: unknown) {
      console.error('verifyPayment error:', error);
      res.status(500).json({ error: 'Payment verification failed' });
    }
  };

  getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const purchases = await prisma.purchase.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
            },
          },
        },
        orderBy: { purchasedAt: 'desc' },
      });

      res.json(purchases);
    } catch (error: unknown) {
      console.error('Get payment history error:', error);
      res.status(500).json({ error: 'Failed to fetch payment history' });
    }
  };

  /**
   * Get payment config (Cashfree uses session ID from create-order; no public key needed)
   * GET /api/payments/config
   */
  getConfig = async (_req: Request, res: Response): Promise<void> => {
    const appId = process.env.CASHFREE_APP_ID;
    if (!appId) {
      res.status(500).json({ error: 'Payment gateway not configured' });
      return;
    }
    res.json({
      provider: 'cashfree',
      appId,
      env: getCashfreeMode(),
    });
  };
}

export const paymentController = new PaymentController();

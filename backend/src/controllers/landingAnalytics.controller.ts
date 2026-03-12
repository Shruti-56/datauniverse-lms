import { Request, Response } from 'express';
import { emailService } from '../services/email.service';
import { prisma } from '../lib/prisma';
import Stripe from 'stripe';

/** Get client IP from request (handles proxies) */
function getClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0]?.trim() ?? null;
  }
  return req.socket?.remoteAddress ?? null;
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY must be set');
  return new Stripe(key);
}

function requireHttpsInProd(url: string): void {
  if (process.env.NODE_ENV === 'production' && !url.startsWith('https://')) {
    throw new Error(`In production, URLs must be https. Got: ${url}`);
  }
}

/**
 * POST /api/landing-analytics/track
 * Track a landing page visit (public, no auth - used by ads campaign landing pages)
 */
export const trackVisit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pageSlug } = req.body;
    const slug = typeof pageSlug === 'string' && pageSlug.trim() ? pageSlug.trim() : null;
    if (!slug) {
      res.status(400).json({ error: 'pageSlug is required' });
      return;
    }

    const referrer = typeof req.body.referrer === 'string' ? req.body.referrer : undefined;
    const userAgent = req.headers['user-agent'] ?? undefined;
    const utmSource = typeof req.body.utm_source === 'string' ? req.body.utm_source : undefined;
    const utmMedium = typeof req.body.utm_medium === 'string' ? req.body.utm_medium : undefined;
    const utmCampaign = typeof req.body.utm_campaign === 'string' ? req.body.utm_campaign : undefined;
    const utmContent = typeof req.body.utm_content === 'string' ? req.body.utm_content : undefined;
    const utmTerm = typeof req.body.utm_term === 'string' ? req.body.utm_term : undefined;
    const visitorIp = getClientIp(req);

    await prisma.landingPageVisit.create({
      data: {
        pageSlug: slug,
        referrer: referrer || null,
        userAgent: userAgent || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmContent: utmContent || null,
        utmTerm: utmTerm || null,
        visitorIp: visitorIp || null,
      },
    });

    res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Landing analytics track error:', error);
    res.status(500).json({ error: 'Failed to track visit' });
  }
};

/**
 * POST /api/landing-analytics/lead
 * Submit landing page form - sends email to SMTP_USER from .env
 */
export const submitLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pageSlug, name, email, phone } = req.body;
    const slug = typeof pageSlug === 'string' && pageSlug.trim() ? pageSlug.trim() : null;
    const nameStr = typeof name === 'string' && name.trim() ? name.trim() : null;
    const emailStr = typeof email === 'string' && email.trim() ? email.trim() : null;
    const phoneStr = typeof phone === 'string' && phone.trim() ? phone.trim() : null;

    if (!slug || !nameStr || !emailStr || !phoneStr) {
      res.status(400).json({ error: 'pageSlug, name, email, and phone are required' });
      return;
    }

    const sent = await emailService.sendLandingLeadEmail(slug, nameStr, emailStr, phoneStr);
    if (!sent) {
      res.status(500).json({ error: 'Failed to send lead notification. Please try again.' });
      return;
    }

    res.status(201).json({ ok: true, message: 'Thank you! We will get back to you soon.' });
  } catch (error) {
    console.error('Landing lead submit error:', error);
    res.status(500).json({ error: 'Failed to submit. Please try again.' });
  }
};

/**
 * POST /api/landing-analytics/lead/checkout
 * Create a lead record (PENDING) + Stripe Checkout session for ₹99
 *
 * Body:
 * - pageSlug, name, email, phone (required)
 * - returnBaseUrl (required) e.g. https://datauniverse.in/lp/working-professionals
 * - utm_* optional (for reporting)
 */
export const createLeadCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pageSlug, name, email, phone, returnBaseUrl } = req.body as Record<string, unknown>;
    const slug = typeof pageSlug === 'string' && pageSlug.trim() ? pageSlug.trim() : null;
    const nameStr = typeof name === 'string' && name.trim() ? name.trim() : null;
    const emailStr = typeof email === 'string' && email.trim() ? email.trim() : null;
    const phoneStr = typeof phone === 'string' && phone.trim() ? phone.trim() : null;
    const returnUrlBase = typeof returnBaseUrl === 'string' && returnBaseUrl.trim() ? returnBaseUrl.trim() : null;

    if (!slug || !nameStr || !emailStr || !phoneStr || !returnUrlBase) {
      res.status(400).json({ error: 'pageSlug, name, email, phone, and returnBaseUrl are required' });
      return;
    }
    requireHttpsInProd(returnUrlBase);

    const referrer = typeof (req.body as { referrer?: unknown }).referrer === 'string' ? (req.body as { referrer?: string }).referrer : undefined;
    const utmSource = typeof (req.body as { utm_source?: unknown }).utm_source === 'string' ? (req.body as { utm_source?: string }).utm_source : undefined;
    const utmMedium = typeof (req.body as { utm_medium?: unknown }).utm_medium === 'string' ? (req.body as { utm_medium?: string }).utm_medium : undefined;
    const utmCampaign = typeof (req.body as { utm_campaign?: unknown }).utm_campaign === 'string' ? (req.body as { utm_campaign?: string }).utm_campaign : undefined;
    const utmContent = typeof (req.body as { utm_content?: unknown }).utm_content === 'string' ? (req.body as { utm_content?: string }).utm_content : undefined;
    const utmTerm = typeof (req.body as { utm_term?: unknown }).utm_term === 'string' ? (req.body as { utm_term?: string }).utm_term : undefined;
    const visitorIp = getClientIp(req);

    const lead = await prisma.landingLead.create({
      data: {
        pageSlug: slug,
        name: nameStr,
        email: emailStr,
        phone: phoneStr,
        amountInr: 99,
        currency: 'INR',
        paymentStatus: 'PENDING',
        referrer: referrer || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmContent: utmContent || null,
        utmTerm: utmTerm || null,
        visitorIp: visitorIp || null,
      },
    });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: emailStr,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'inr',
            unit_amount: 9900, // 99 INR in paise
            product_data: {
              name: 'AI Workshop Seat (Ads Campaign)',
              description: slug,
            },
          },
        },
      ],
      metadata: {
        leadId: lead.id,
        pageSlug: slug,
        phone: phoneStr,
      },
      success_url: `${returnUrlBase}?lead_id=${encodeURIComponent(lead.id)}&stripe_session_id={CHECKOUT_SESSION_ID}&payment=success`,
      cancel_url: `${returnUrlBase}?lead_id=${encodeURIComponent(lead.id)}&payment=cancel`,
    });

    await prisma.landingLead.update({
      where: { id: lead.id },
      data: { stripeSessionId: session.id },
    });

    res.status(201).json({
      leadId: lead.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error('Landing lead checkout error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create checkout' });
  }
};

/**
 * GET /api/landing-analytics/lead/verify?leadId=...&sessionId=...
 * Verify Stripe checkout session, and mark lead as PAID if paid.
 */
export const verifyLeadPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = typeof req.query.leadId === 'string' ? req.query.leadId : null;
    const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : null;
    if (!leadId || !sessionId) {
      res.status(400).json({ error: 'leadId and sessionId are required' });
      return;
    }

    const lead = await prisma.landingLead.findUnique({ where: { id: leadId } });
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === 'paid' || session.status === 'complete';

    if (paid) {
      await prisma.landingLead.update({
        where: { id: leadId },
        data: {
          paymentStatus: 'PAID',
          stripeSessionId: session.id,
          stripePaymentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        },
      });
    }

    res.json({
      ok: true,
      paid,
      paymentStatus: paid ? 'PAID' : lead.paymentStatus,
    });
  } catch (error) {
    console.error('Landing lead verify error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Verification failed' });
  }
};

/**
 * GET /api/landing-analytics/:pageSlug/leads
 * Admin: list leads for a landing page, newest first.
 */
export const listLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.pageSlug?.trim();
    if (!slug) {
      res.status(400).json({ error: 'pageSlug is required' });
      return;
    }
    const leads = await prisma.landingLead.findMany({
      where: { pageSlug: slug },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    res.json(leads);
  } catch (error) {
    console.error('Landing leads list error:', error);
    res.status(500).json({ error: 'Failed to list leads' });
  }
};

/**
 * POST /api/landing-analytics/contact
 * Submit marketing page contact/enquiry form (public)
 */
export const submitContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, message, bookDemo, downloadBrochure } = req.body;
    const nameStr = typeof name === 'string' && name.trim() ? name.trim() : null;
    const emailStr = typeof email === 'string' && email.trim() ? email.trim() : null;
    const phoneStr = typeof phone === 'string' && phone.trim() ? phone.trim() : null;

    if (!nameStr || !emailStr || !phoneStr) {
      res.status(400).json({ error: 'Name, email, and phone are required' });
      return;
    }

    const messageStr = typeof message === 'string' ? message.trim() : '';
    const wantsDemo = bookDemo === true || bookDemo === 'true';
    const wantsBrochure = downloadBrochure === true || downloadBrochure === 'true';

    const sent = await emailService.sendMarketingEnquiryEmail(
      nameStr,
      emailStr,
      phoneStr,
      messageStr,
      wantsDemo,
      wantsBrochure
    );

    if (!sent) {
      res.status(500).json({ error: 'Failed to submit enquiry. Please try again.' });
      return;
    }

    res.status(201).json({ ok: true, message: "Thank you! We'll get back to you within 24 hours." });
  } catch (error) {
    console.error('Marketing contact submit error:', error);
    res.status(500).json({ error: 'Failed to submit. Please try again.' });
  }
};

/**
 * GET /api/landing-analytics/:pageSlug
 * Get analytics for a landing page (admin only)
 */
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pageSlug } = req.params;
    const slug = pageSlug?.trim();
    if (!slug) {
      res.status(400).json({ error: 'pageSlug is required' });
      return;
    }

    const visits = await prisma.landingPageVisit.findMany({
      where: { pageSlug: slug },
      orderBy: { visitedAt: 'desc' },
      take: 1000,
    });

    const totalVisits = visits.length;
    const uniqueByIp = new Set(visits.filter((v) => v.visitorIp).map((v) => v.visitorIp)).size;

    // UTM breakdown
    const bySource: Record<string, number> = {};
    const byCampaign: Record<string, number> = {};
    const byMedium: Record<string, number> = {};
    const byDate: Record<string, number> = {};

    for (const v of visits) {
      if (v.utmSource) bySource[v.utmSource] = (bySource[v.utmSource] ?? 0) + 1;
      if (v.utmCampaign) byCampaign[v.utmCampaign] = (byCampaign[v.utmCampaign] ?? 0) + 1;
      if (v.utmMedium) byMedium[v.utmMedium] = (byMedium[v.utmMedium] ?? 0) + 1;
      const dateKey = v.visitedAt.toISOString().slice(0, 10);
      byDate[dateKey] = (byDate[dateKey] ?? 0) + 1;
    }

    res.json({
      pageSlug: slug,
      totalVisits,
      uniqueVisitorsByIp: uniqueByIp,
      bySource,
      byCampaign,
      byMedium,
      byDate: Object.entries(byDate)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 30)
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as Record<string, number>),
      recentVisits: visits.slice(0, 50).map((v) => ({
        visitedAt: v.visitedAt,
        utmSource: v.utmSource,
        utmCampaign: v.utmCampaign,
        referrer: v.referrer,
      })),
    });
  } catch (error) {
    console.error('Landing analytics get error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
};

/**
 * GET /api/landing-analytics
 * List all landing page slugs with visit counts (admin only)
 */
export const listPages = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await prisma.landingPageVisit.groupBy({
      by: ['pageSlug'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    res.json(
      result.map((r) => ({
        pageSlug: r.pageSlug,
        totalVisits: r._count.id,
      }))
    );
  } catch (error) {
    console.error('Landing analytics list error:', error);
    res.status(500).json({ error: 'Failed to list landing pages' });
  }
};

/**
 * GET /api/landing-analytics/:pageSlug/config
 * Public: get editable config for a landing page (used by landing UI)
 */
export const getLandingConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.pageSlug?.trim();
    if (!slug) {
      res.status(400).json({ error: 'pageSlug is required' });
      return;
    }
    const config = await prisma.landingPageConfig.findUnique({
      where: { pageSlug: slug },
    });
    res.json(config ?? {});
  } catch (error) {
    console.error('Landing config get error:', error);
    res.status(500).json({ error: 'Failed to get landing config' });
  }
};

/**
 * PUT /api/landing-analytics/:pageSlug/config
 * Admin-only: update editable config for a landing page
 */
export const upsertLandingConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.pageSlug?.trim();
    if (!slug) {
      res.status(400).json({ error: 'pageSlug is required' });
      return;
    }
    const { dateLabel, timeLabel, modeLabel } = req.body as {
      dateLabel?: string;
      timeLabel?: string;
      modeLabel?: string;
    };
    const cfg = await prisma.landingPageConfig.upsert({
      where: { pageSlug: slug },
      update: {
        dateLabel: dateLabel ?? null,
        timeLabel: timeLabel ?? null,
        modeLabel: modeLabel ?? null,
      },
      create: {
        pageSlug: slug,
        dateLabel: dateLabel ?? null,
        timeLabel: timeLabel ?? null,
        modeLabel: modeLabel ?? null,
      },
    });
    res.json(cfg);
  } catch (error) {
    console.error('Landing config upsert error:', error);
    res.status(500).json({ error: 'Failed to save landing config' });
  }
};

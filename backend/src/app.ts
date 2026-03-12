import express, { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './routes';
import { liveLectureController } from './controllers/live-lecture.controller';
import { prisma } from './lib/prisma';

// Load environment variables - always from backend/.env so PORT=3000 is used
const backendEnv = path.join(__dirname, '..', '.env');
dotenv.config({ path: backendEnv });

// Startup diagnostics — development only
if (process.env.NODE_ENV !== 'production') {
  const DEBUG_LOG = path.join(process.cwd(), 'startup-debug.log');
  const entry = JSON.stringify({ timestamp: Date.now(), message: 'dotenv loaded', data: { NODE_ENV: process.env.NODE_ENV, PORT: process.env.PORT, hasDATABASE_URL: !!process.env.DATABASE_URL, hasJWT_SECRET: !!process.env.JWT_SECRET }, timestampISO: new Date().toISOString() }) + '\n';
  try { fs.appendFileSync(DEBUG_LOG, entry); } catch { /* ignore */ }
  console.log(`[startup] dotenv loaded — NODE_ENV=${process.env.NODE_ENV} PORT=${process.env.PORT}`);
}

// Live lecture reminders use server local time; default to India if not set
if (!process.env.TZ) process.env.TZ = 'Asia/Kolkata';

const app: Application = express();
// PORT from backend/.env (default 3000). Frontend uses window.location.origin + /api so it matches.
const PORT = Number(process.env.PORT) || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// Security headers — helmet sets X-Frame-Options, X-Content-Type-Options, HSTS, etc.
// CSP is disabled here because the React SPA uses inline scripts; configure separately if needed.
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — in production only allow explicitly configured origins; in development allow localhost
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : isProd
    ? [] // no origins allowed in production unless CORS_ORIGINS is set
    : ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // same-origin / server-to-server
    if (!isProd) return callback(null, true); // development: allow all
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Gzip compression - reduces response sizes 70-80%, cuts bandwidth and CPU on large JSON responses
app.use(compression());

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
// Lead/contact forms: 10 submissions per hour per IP (prevents email spam)
const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many form submissions, please try again later.' },
});
// General API: 300 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});
app.use('/api/auth', authLimiter);
app.use('/api/analytics/lead', formLimiter);
app.use('/api/analytics/contact', formLimiter);
app.use('/api', apiLimiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API routes
app.use('/api', routes);

// Block /src/* - never serve source .tsx/.ts files (they cause MIME type errors)
app.use('/src', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Serve React frontend (built files in backend/public)
// Always serve - Hostinger may not set NODE_ENV=production correctly
const publicDir = path.join(__dirname, '..', 'public');
const indexPath = path.join(publicDir, 'index.html');
if (fs.existsSync(indexPath)) {
  // Explicit MIME types for JS/CSS - fixes "text/plain" error on some hosts
  const mimeTypes: Record<string, string> = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
  };
  app.use(express.static(publicDir, {
    index: false,
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath);
      if (mimeTypes[ext]) res.setHeader('Content-Type', mimeTypes[ext]);
      // Vite outputs content-hashed filenames in assets/ — safe to cache for 1 year
      if (filePath.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        // index.html and other root files: no cache so new deploys take effect immediately
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(indexPath);
  });
}

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// SERVER START
// ============================================
// Bind to 0.0.0.0 unless explicitly in development. Hostinger may not set NODE_ENV=production,
// so use 0.0.0.0 when NOT development to avoid 503 (proxy cannot reach 127.0.0.1).
const bindHost = process.env.NODE_ENV === 'development' ? '127.0.0.1' : '0.0.0.0';

let remindersInterval: ReturnType<typeof setInterval> | null = null;

const server = app.listen(PORT, bindHost, () => {
  console.log(`
  🚀 DataUniverse API Server
  ========================
  Environment: ${process.env.NODE_ENV || 'development'}
  Port: ${PORT} (bind: ${bindHost})
  Health: /health  |  API: /api
  ========================
  `);
  // Run live-lecture module reminders every 5 min (windows are 5 min wide so nothing is missed)
  const FIVE_MIN = 5 * 60 * 1000;
  const runReminders = () => {
    liveLectureController.runModuleReminders().catch((e) => console.error('Module reminders error:', e));
  };
  runReminders(); // run once on startup (catches up if server was down)
  remindersInterval = setInterval(runReminders, FIVE_MIN);
  console.log('Live lecture reminders: running every 5 min. Set TZ=Asia/Kolkata for India.');
});

server.on('error', (err: Error) => {
  console.error('[server] listen error:', err.message, (err as NodeJS.ErrnoException).code);
});

process.on('uncaughtException', (err: Error) => {
  console.error('[server] uncaughtException:', err.message, err.stack);
});
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[server] unhandledRejection:', String(reason));
});

// Graceful shutdown - release DB connections and stop timers when process is killed
const shutdown = async (): Promise<void> => {
  if (remindersInterval) {
    clearInterval(remindersInterval);
    remindersInterval = null;
  }
  await prisma.$disconnect().catch(() => {});
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;

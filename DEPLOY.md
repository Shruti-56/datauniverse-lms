# Production Deployment Checklist

Before deploying, ensure the following:

## Backend (backend/.env)

1. **NODE_ENV=production** – Required for correct CORS and 0.0.0.0 binding
2. **FRONTEND_URL** – Set to your live URL (e.g. `https://datauniverse.in`) for email links
3. **CORS_ORIGINS** – Comma-separated list including your production domain(s)
4. **DATABASE_URL** – Production MySQL connection string. **Shared hosting (Hostinger):** add `?connection_limit=5` to stay within DB limits (e.g. `mysql://user:pass@host/DB?connection_limit=5`)
5. **JWT_SECRET** – Strong random string (32+ chars)
6. **SMTP_*** – Configured for sending emails

## Shared Hosting (500 errors, CPU spikes)

If you see 500 errors on login/signup and CPU/process limits after some uptime:
- The app uses a single shared Prisma client (no connection pool explosion)
- Add `?connection_limit=5` to DATABASE_URL for Hostinger and similar hosts

## Frontend (build-time env)

Set these in `.env` before running `npm run build`:

- `VITE_INSTITUTE_NAME`
- `VITE_CONTACT_PHONE`, `VITE_WHATSAPP_NUMBER`, `VITE_CONTACT_EMAIL`
- `VITE_RAZORPAY_KEY_ID` (use live key for production)
- `VITE_INSTITUTE_LOGO_URL` (optional)

## Build & Run

```bash
npm run build          # Full build: frontend + backend
cd backend && node dist/app.js   # Or: npm run start from root
```

The backend serves the built frontend from `backend/public` on the configured PORT.

## Notes

- Backend binds to **0.0.0.0** in production (accepts external connections)
- In development, binds to **127.0.0.1**
- API uses `window.location.origin/api` so it works with any domain
- Ensure your host allows outbound HTTPS (for emails, Razorpay, etc.)

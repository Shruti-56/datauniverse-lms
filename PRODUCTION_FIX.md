# Production 500 Error — Root Cause & Fix

## Problem Summary

- Site works after deployment
- After some time, CPU/process usage reaches Hostinger limit
- **Login and Signup return 500 Internal Server Error**
- Site still displays (static/auth-free pages work)
- Killing processes in Hostinger panel fixes it temporarily
- Issue recurs after some time

## Root Cause

**21 separate `PrismaClient` instances** across controllers and middleware.

Each `PrismaClient` creates its own MySQL connection pool (~10 connections by default).  
Total potential connections: **~210** vs Hostinger’s typical **15–50 per database**.

When connections are exhausted:
1. New requests (e.g. login, signup) fail with DB connection errors
2. Node returns 500 to the client
3. CPU/process usage rises due to retries and connection attempts
4. Killing the process frees all connections
5. After restart, connections accumulate again and the cycle repeats

## Fix Applied

### 1. Single shared PrismaClient (`backend/src/lib/prisma.ts`)

- One shared `PrismaClient` for the entire app
- Controllers and middleware import this client instead of creating their own
- Cuts connections from ~210 to one pool of 5–10

### 2. Replaced `new PrismaClient()` in 22 files

- 21 controllers
- 1 auth middleware

### 3. Graceful shutdown (`backend/src/app.ts`)

- Handles SIGTERM/SIGINT
- Clears the reminders interval
- Disconnects Prisma cleanly
- Avoids connections lingering after process kill

### 4. Connection limit for shared hosting

Add to `DATABASE_URL` for Hostinger and similar:

```
?connection_limit=5
```

Example:

```
mysql://user:password@host/database?connection_limit=5
```

This keeps DB connections within Hostinger’s limits.

## Action Required on Hostinger

1. Deploy the updated code.
2. In Hostinger’s backend `.env`, update:

   ```
   DATABASE_URL="mysql://USER:PASS@HOST/DB?connection_limit=5"
   ```

   Adjust `USER`, `PASS`, `HOST`, and `DB` for your setup.

3. Restart the Node app.

## Files Changed

| File | Change |
|------|--------|
| `backend/src/lib/prisma.ts` | **NEW** – shared PrismaClient |
| `backend/src/app.ts` | Graceful shutdown, import shared prisma |
| `backend/src/middleware/auth.ts` | Use shared prisma |
| `backend/src/controllers/*.ts` (21 files) | Use shared prisma |
| `backend/.env.example` | Added `connection_limit` note |
| `DEPLOY.md` | Shared hosting deployment note |

## Why Login/Signup Failed First

Login and Signup hit `auth.controller.ts`, which uses `prisma.user.findUnique()` and `prisma.user.create()`. When all connections are in use, those calls fail, the controller’s `catch` returns a 500, and the user sees an error. Static or cached pages that avoid DB calls keep working.

# Quick Start Guide

Get DataUniverse running locally in minutes.

## Prerequisites

- Node.js 18+ installed
- MySQL 8.0+ running locally or remote
- npm or yarn

## Setup Steps

### 1. Clone and Install

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE DataUniverse;
```

### 3. Configure Environment Variables

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env and set:
# - DATABASE_URL=mysql://user:password@localhost:3306/DataUniverse
# - JWT_SECRET=your-secret-key-here
```

**Frontend:**
```bash
# In root directory
cp .env.example .env
# Edit .env and set:
# - VITE_API_BASE_URL=http://localhost:3001/api
```

### 4. Run Database Migrations

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate dev
```

### 5. Seed Database (Optional)

```bash
cd backend
npm run seed
```

### 6. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 7. Access the Application

- Frontend: http://localhost:8080
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## Default Test Accounts

After seeding, you can use:

**Student:**
- Email: `student@example.com`
- Password: `password123`

**Admin:**
- Email: `admin@example.com`
- Password: `admin123`

*Note: Change these in production!*

## Troubleshooting

### Port Already in Use
- Frontend: Change port in `vite.config.ts`
- Backend: Change `PORT` in `backend/.env`

### Database Connection Error
- Verify MySQL is running
- Check `DATABASE_URL` format
- Ensure database exists

### CORS Errors
- Verify `CORS_ORIGINS` in backend `.env` includes frontend URL
- Check both servers are running

## Next Steps

- Read [DEPLOY.md](./DEPLOY.md) for production deployment
- Read [PRODUCTION.md](./PRODUCTION.md) for production best practices
- Check API documentation at `/api` endpoints

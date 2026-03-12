# DataUniverse Backend API

Node.js + Express + Prisma + MySQL backend for the DataUniverse e-learning platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and secrets
   ```

3. **Set up database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate

   # Seed with sample data
   npm run seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Server runs at `http://localhost:3001`

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/password` | Change password |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all courses |
| GET | `/api/courses/:id` | Get course details |
| GET | `/api/courses/:id/content` | Get course content (enrolled only) |

### Enrollments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/enrollments` | Get my enrollments |
| POST | `/api/enrollments` | Enroll in course |
| DELETE | `/api/enrollments/:courseId` | Unenroll |

### Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progress/course/:id` | Get course progress |
| POST | `/api/progress/video/:id/complete` | Mark video complete |
| GET | `/api/progress/overall` | Get overall progress |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| CRUD | `/api/admin/courses` | Manage courses |
| CRUD | `/api/admin/modules` | Manage modules |
| CRUD | `/api/admin/videos` | Manage videos |
| GET | `/api/admin/students` | List students |
| GET | `/api/admin/analytics` | Platform analytics |

## 🗄️ Database

### View database with Prisma Studio
```bash
npm run prisma:studio
```

### Create new migration
```bash
npx prisma migrate dev --name your_migration_name
```

## 🔐 Authentication

Uses JWT tokens. Include in requests:
```
Authorization: Bearer <token>
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, role guards
│   ├── routes/          # API routes
│   ├── services/        # Business logic (S3, etc.)
│   └── app.ts           # Express app
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed data
└── package.json
```

## 🧪 Test Accounts

After seeding:
- **Admin**: admin@datauniverse.com / Admin123!
- **Student**: student@datauniverse.com / Student123!

## 🚢 Deployment

1. Build: `npm run build`
2. Start: `npm start`

Recommended platforms: Railway, Render, AWS, DigitalOcean

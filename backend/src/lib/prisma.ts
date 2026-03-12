/**
 * Single shared PrismaClient instance for the entire application.
 * 
 * ROOT CAUSE FIX: Previously, each controller and middleware instantiated
 * its own PrismaClient (21+ instances), each with ~10 MySQL connections.
 * On shared hosting (Hostinger), this exceeded the DB connection limit (15-50),
 * causing 500 errors on login/signup and CPU growth until process kill.
 * 
 * Using one client reduces connections to a single pool. For shared hosting,
 * add ?connection_limit=5 to DATABASE_URL to stay within limits.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Cloudflare makes Worker secrets available at request runtime, not while
  // `next build` evaluates route modules. The inert build-only URL lets Next
  // inspect those modules without connecting anywhere. Production requests
  // always receive DATABASE_URL from the Worker secret.
  const connectionString =
    process.env.DATABASE_URL ?? 'postgresql://build:build@127.0.0.1:5432/build';

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

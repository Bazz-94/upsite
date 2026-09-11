import 'server-only'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

/** Keeps one client across hot reloads in development, where modules are re-evaluated. */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

/**
 * Builds a client on the Postgres pointed at by `DATABASE_URL`.
 * @returns A new client.
 * @throws Error When `DATABASE_URL` is not set.
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env and point it at your Postgres.')
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}

/** The Prisma client. The only place in the project that opens a database connection. */
export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

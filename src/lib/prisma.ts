// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

declare global {
  // To avoid TypeScript errors
  var prisma: PrismaClient | undefined
}

// Initialize Prisma Client only once per process
const prisma = global.prisma || new PrismaClient({
  log: ['error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma // Store Prisma client globally in development mode for reusability
}

export { prisma }

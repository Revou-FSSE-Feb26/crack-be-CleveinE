import { PrismaClient } from '@prisma/client';

export const prisma = process.env.DATABASE_URL ? new PrismaClient() : null;

export async function connectDatabase() {
  if (!prisma) return { configured: false, connected: false };
  await prisma.$connect();
  return { configured: true, connected: true };
}

export async function disconnectDatabase() {
  if (prisma) await prisma.$disconnect();
}

import { PrismaClient } from '@prisma/client';

/**
 * Prisma client 单例。
 * dev 热重载会反复 import 本模块，挂到 globalThis 上避免连接泄漏。
 * 见 conventions.md「数据访问」。
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

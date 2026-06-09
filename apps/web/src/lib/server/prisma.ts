import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (!global.prisma) {
  global.prisma = new PrismaClient();
}
prisma = global.prisma;

export default prisma;

declare global {
  var prisma: PrismaClient | undefined;
}

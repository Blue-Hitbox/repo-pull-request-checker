import { PrismaClient } from '@prisma/client';
import { env } from '$env/dynamic/private';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error']
});

export default prisma;

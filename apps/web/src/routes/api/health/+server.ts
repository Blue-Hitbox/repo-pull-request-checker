import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

export const GET: RequestHandler = async () => {
    try {
        // Check database connectivity
        await prisma.$queryRaw`SELECT 1`;

        return json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: 'connected'
        });
    } catch (error) {
        return json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                database: 'disconnected',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 503 }
        );
    }
};

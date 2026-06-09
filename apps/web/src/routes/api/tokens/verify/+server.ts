import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

// Rate limiter for token verification
const verifyRateLimit = new Map<string, { count: number; resetAt: number }>();
const VERIFY_LIMIT = 10;
const VERIFY_WINDOW = 60 * 1000;

function checkVerifyRateLimit(ip: string): boolean {
	const now = Date.now();
	const entry = verifyRateLimit.get(ip);
	if (!entry || now > entry.resetAt) {
		verifyRateLimit.set(ip, { count: 1, resetAt: now + VERIFY_WINDOW });
		return true;
	}
	if (entry.count >= VERIFY_LIMIT) return false;
	entry.count++;
	return true;
}

export const POST: RequestHandler = async ({ request }) => {
	const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
		|| request.headers.get('x-real-ip')
		|| 'unknown';

	if (!checkVerifyRateLimit(clientIp)) {
		return json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
	}

	const { token } = await request.json();

	if (!token || typeof token !== 'string') {
		return json({ success: false, error: 'Invalid token format' }, { status: 400 });
	}

	const cliToken = await prisma.cliToken.findUnique({
		where: { token },
		include: { user: true }
	});

	if (cliToken) {
		return json({
			success: true,
			username: cliToken.user.username,
			userId: cliToken.user.id
		});
	} else {
		return json({ success: false }, { status: 401 });
	}
};

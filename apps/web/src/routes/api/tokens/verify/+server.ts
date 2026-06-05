import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

export const POST: RequestHandler = async ({ request }) => {
	const { token } = await request.json();

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

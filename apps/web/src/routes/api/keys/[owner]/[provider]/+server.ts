import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';
import CryptoJS from 'crypto-js';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ params, request }) => {
	const authHeader = request.headers.get('authorization');
	const apiSecret = env.DASHBOARD_API_SECRET;

	if (apiSecret && authHeader !== `Bearer ${apiSecret}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { owner, provider } = params;

	const apiKeyRecord = await prisma.apiKey.findFirst({
		where: {
			user: {
				username: owner
			},
			provider: provider
		}
	});

	if (!apiKeyRecord) {
		return json({ error: 'Key not found' }, { status: 404 });
	}

	// Decrypt the key
	const encryptionKey = env.ENCRYPTION_KEY || 'default-secret';
	const bytes = CryptoJS.AES.decrypt(apiKeyRecord.encryptedKey, encryptionKey);
	const decryptedKey = bytes.toString(CryptoJS.enc.Utf8);

	return json({ apiKey: decryptedKey });
};

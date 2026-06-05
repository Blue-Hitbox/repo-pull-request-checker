import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';
import CryptoJS from 'crypto-js';
import { env } from '$env/dynamic/private';
import { getProvider } from '@ai-reviewer/core';

export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	const apiSecret = env.DASHBOARD_API_SECRET;

	if (apiSecret && authHeader !== `Bearer ${apiSecret}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { owner, provider: providerName, model: modelName, diff } = await request.json();

	if (!owner || !diff) {
		return json({ error: 'Missing owner or diff' }, { status: 400 });
	}

	// 1. Fetch the user's API key
	const apiKeyRecord = await prisma.apiKey.findFirst({
		where: {
			user: {
				username: owner
			},
			provider: providerName || 'openai'
		}
	});

	let apiKey: string | undefined;

	if (apiKeyRecord) {
		// Decrypt the key
		const encryptionKey = env.ENCRYPTION_KEY || 'default-secret';
		const bytes = CryptoJS.AES.decrypt(apiKeyRecord.encryptedKey, encryptionKey);
		apiKey = bytes.toString(CryptoJS.enc.Utf8);
	}

	// 2. Perform the review using @ai-reviewer/core
	try {
		const provider = getProvider({
			provider: providerName,
			model: modelName,
			apiKey: apiKey
		});

		const review = await provider.reviewCode(diff);
		return json({ review });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';
import CryptoJS from 'crypto-js';
import { env } from '$env/dynamic/private';
import { getProvider } from '@ai-reviewer/core';

export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	const apiSecret = env.DASHBOARD_API_SECRET;

    let user: any;

    if (authHeader?.startsWith('Bearer ')) {
        const tokenValue = authHeader.substring(7);

        // 1. Check if it's the dashboard-bot shared secret
        if (apiSecret && tokenValue === apiSecret) {
            // Authorized bot, owner must be provided in body
        } else {
            // 2. Check if it's a CLI token
            const cliToken = await prisma.cliToken.findUnique({
                where: { token: tokenValue },
                include: { user: true }
            });
            if (cliToken) {
                user = cliToken.user;
            } else {
                return json({ error: 'Unauthorized' }, { status: 401 });
            }
        }
    } else {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

	const { owner, provider: providerName, model: modelName, diff } = await request.json();

    const targetOwner = user ? user.username : owner;

	if (!targetOwner || !diff) {
		return json({ error: 'Missing owner or diff' }, { status: 400 });
	}

	// 1. Fetch the user's API key
	const apiKeyRecord = await prisma.apiKey.findFirst({
		where: {
			user: {
				username: targetOwner
			},
			provider: providerName || 'openai'
		}
	});

	let apiKey: string | undefined;

	if (apiKeyRecord) {
		const encryptionKey = env.ENCRYPTION_KEY || 'default-secret';
		const bytes = CryptoJS.AES.decrypt(apiKeyRecord.encryptedKey, encryptionKey);
		apiKey = bytes.toString(CryptoJS.enc.Utf8);
	}

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

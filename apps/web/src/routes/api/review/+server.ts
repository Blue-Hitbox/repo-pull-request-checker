import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';
import CryptoJS from 'crypto-js';
import { env } from '$env/dynamic/private';
import { getProvider } from '@ai-reviewer/core';

export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	const apiSecret = env.DASHBOARD_API_SECRET;
    const encryptionKey = env.ENCRYPTION_KEY;

    if (!encryptionKey) {
        return json({ error: 'Server configuration error: ENCRYPTION_KEY is missing' }, { status: 500 });
    }

    let user: any;

    if (authHeader?.startsWith('Bearer ')) {
        const tokenValue = authHeader.substring(7);

        if (apiSecret && tokenValue === apiSecret) {
            // Authorized bot/internal
        } else {
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

	const { owner, provider: providerName, model: modelName, diff, repoName } = await request.json();

    const targetOwner = user ? user.username : owner;

	if (!targetOwner) {
		return json({ error: 'Missing owner' }, { status: 400 });
	}

    if (!diff) {
        return json({ error: 'Missing diff' }, { status: 400 });
    }

    // 0. Check if repository is enabled (if repoName is provided)
    if (repoName) {
        const dbUser = await prisma.user.findUnique({ where: { username: targetOwner } });
        if (dbUser) {
            const repo = await prisma.repository.findUnique({
                where: {
                    userId_name: {
                        userId: dbUser.id,
                        name: repoName
                    }
                }
            });
            if (repo && !repo.isEnabled) {
                return json({ error: `Review disabled for repository: ${repoName}` }, { status: 403 });
            }
        }
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

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';
import CryptoJS from 'crypto-js';
import { env } from '$env/dynamic/private';
import { getProvider } from '@ai-reviewer/core';
import type { User } from '@prisma/client';

interface ReviewRequestBody {
    owner?: string;
    provider?: string;
    model?: string;
    diff?: string;
    repoName?: string;
}

const ALLOWED_PROVIDERS = ['openai', 'claude', 'openrouter'];

export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	const apiSecret = env.DASHBOARD_API_SECRET;
    const encryptionKey = env.ENCRYPTION_KEY;

    if (!encryptionKey) {
        return json({ error: 'Server configuration error: ENCRYPTION_KEY is missing' }, { status: 500 });
    }

    let user: User | null = null;

    if (authHeader?.startsWith('Bearer ')) {
        const tokenValue = authHeader.substring(7);

        if (apiSecret && tokenValue === apiSecret) {
            // Authorized internal/bot
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

	const body: ReviewRequestBody = await request.json();
    const { owner, provider: providerName, model: modelName, diff } = body;
    let repoName = body.repoName?.trim();

    if (repoName === '') {
        repoName = undefined;
    }

    const targetOwner = user ? user.username : owner;

	if (!targetOwner) {
		return json({ error: 'Missing owner' }, { status: 400 });
	}

    if (!diff) {
        return json({ error: 'Missing diff' }, { status: 400 });
    }

    if (diff.length > 50000) {
        return json({ error: 'Diff too large. Maximum size is 50KB.' }, { status: 400 });
    }

    if (providerName && !ALLOWED_PROVIDERS.includes(providerName.toLowerCase())) {
        return json({ error: `Invalid provider. Supported: ${ALLOWED_PROVIDERS.join(', ')}` }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { username: targetOwner } });
    if (!dbUser) {
        return json({ error: `User '${targetOwner}' not found in dashboard.` }, { status: 404 });
    }

    // 0. Check if repository is enabled (if repoName is provided)
    if (repoName) {
        const repo = await prisma.repository.findUnique({
            where: {
                userId_name: {
                    userId: dbUser.id,
                    name: repoName
                }
            }
        });

        if (!repo) {
            return json({ error: 'Repository not found' }, { status: 404 });
        }

        if (!repo.isEnabled) {
            return json({ error: `Review disabled for repository: ${repoName}` }, { status: 403 });
        }
    }

	// 1. Fetch the user's API key
	const apiKeyRecord = await prisma.apiKey.findFirst({
		where: {
			userId: dbUser.id,
			provider: providerName || 'openai'
		}
	});

	if (!apiKeyRecord) {
        return json({ error: `No API key configured for user '${targetOwner}' for provider '${providerName || 'openai'}'` }, { status: 400 });
    }

    const bytes = CryptoJS.AES.decrypt(apiKeyRecord.encryptedKey, encryptionKey);
    const apiKey = bytes.toString(CryptoJS.enc.Utf8);

    if (!apiKey) {
        return json({ error: 'Failed to decrypt API key — encryption key mismatch' }, { status: 400 });
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

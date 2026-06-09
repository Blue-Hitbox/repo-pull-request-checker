import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import CryptoJS from 'crypto-js';
import { env } from '$env/dynamic/private';
import { v4 as uuidv4 } from 'uuid';
import { fail } from '@sveltejs/kit';

const ALLOWED_PROVIDERS = ['openai', 'claude', 'openrouter'];

export const load: PageServerLoad = async () => {
	const user = await prisma.user.findFirst({
		include: {
			apiKeys: { orderBy: { createdAt: 'desc' } },
			tokens: { orderBy: { createdAt: 'desc' } },
			repos: { orderBy: { createdAt: 'desc' } }
		}
	});
	return { user };
};

export const actions: Actions = {
	saveKey: async ({ request }) => {
		const encryptionKey = env.ENCRYPTION_KEY;
		if (!encryptionKey) {
			return fail(500, { error: 'Server configuration error: ENCRYPTION_KEY is missing' });
		}

		const data = await request.formData();
		const username = (data.get('username') as string)?.trim();
		const provider = (data.get('provider') as string)?.trim().toLowerCase();
		const apiKey = (data.get('apiKey') as string)?.trim();

		if (!username || !provider || !apiKey) {
			return fail(400, { error: 'All fields are required' });
		}

		if (!ALLOWED_PROVIDERS.includes(provider)) {
			return fail(400, { error: `Invalid provider. Supported: ${ALLOWED_PROVIDERS.join(', ')}` });
		}

		if (apiKey.length < 10) {
			return fail(400, { error: 'API key appears to be invalid (too short)' });
		}

		let user = await prisma.user.findUnique({ where: { username } });
		if (!user) {
			user = await prisma.user.create({
				data: {
					username,
					githubId: Math.floor(Math.random() * 10000000) + 1000000
				}
			});
		}

		const encryptedKey = CryptoJS.AES.encrypt(apiKey, encryptionKey).toString();
		const keyHash = CryptoJS.SHA256(apiKey).toString();

		await prisma.apiKey.upsert({
			where: { userId_provider: { userId: user.id, provider } },
			update: { encryptedKey, keyHash, keyPrefix: apiKey.substring(0, 7) + '...' },
			create: { userId: user.id, provider, encryptedKey, keyHash, keyPrefix: apiKey.substring(0, 7) + '...' }
		});

		return { success: true };
	},

	deleteKey: async ({ request }) => {
		const data = await request.formData();
		const userId = data.get('userId') as string;
		const provider = (data.get('provider') as string)?.trim().toLowerCase();

		if (!userId || !provider) return fail(400, { error: 'Missing fields' });

		await prisma.apiKey.delete({
			where: { userId_provider: { userId, provider } }
		});

		return { success: true };
	},

	generateToken: async ({ request }) => {
		const data = await request.formData();
		const userId = data.get('userId') as string;

		if (!userId) return fail(400, { error: 'Missing user ID' });

		// Limit active tokens to 10 per user
		const existingTokens = await prisma.cliToken.count({ where: { userId } });
		if (existingTokens >= 10) {
			return fail(400, { error: 'Maximum of 10 active tokens reached. Revoke one first.' });
		}

		const token = uuidv4();
		await prisma.cliToken.create({
			data: { userId, token }
		});

		return { success: true, token };
	},

	revokeToken: async ({ request }) => {
		const data = await request.formData();
		const tokenId = data.get('tokenId') as string;

		if (!tokenId) return fail(400, { error: 'Missing token ID' });

		await prisma.cliToken.delete({
			where: { id: tokenId }
		});

		return { success: true };
	},

	toggleRepo: async ({ request }) => {
		const data = await request.formData();
		const userId = data.get('userId') as string;
		const repoName = (data.get('repoName') as string)?.trim();

		if (!userId || !repoName) return fail(400, { error: 'Missing fields' });

		if (!repoName.includes('/') || repoName.split('/').length !== 2 || repoName.includes(' ')) {
			return fail(400, { error: 'Invalid repository name. Use "owner/repo" format (no spaces).' });
		}

		const repo = await prisma.repository.findUnique({
			where: { userId_name: { userId, name: repoName } }
		});

		if (repo) {
			await prisma.repository.update({
				where: { id: repo.id },
				data: { isEnabled: !repo.isEnabled }
			});
		} else {
			await prisma.repository.create({
				data: { userId, name: repoName, isEnabled: true }
			});
		}

		return { success: true };
	},

	deleteRepo: async ({ request }) => {
		const data = await request.formData();
		const repoId = data.get('repoId') as string;

		if (!repoId) return fail(400, { error: 'Missing repository ID' });

		await prisma.repository.delete({
			where: { id: repoId }
		});

		return { success: true };
	}
};

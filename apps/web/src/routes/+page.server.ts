import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import CryptoJS from 'crypto-js';
import { env } from '$env/dynamic/private';
import { v4 as uuidv4 } from 'uuid';

export const load: PageServerLoad = async () => {
    // In a real app, get current user from session
    // For demo, we'll return the first user if exists
    const user = await prisma.user.findFirst({
        include: {
            apiKeys: true,
            tokens: true,
            repos: true
        }
    });
    return { user };
};

export const actions: Actions = {
    saveKey: async ({ request }) => {
        const data = await request.formData();
        const username = data.get('username') as string;
        const provider = data.get('provider') as string;
        const apiKey = data.get('apiKey') as string;

        if (!username || !provider || !apiKey) {
            return { success: false, error: 'Missing fields' };
        }

        let user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    username,
                    githubId: Math.floor(Math.random() * 1000000)
                }
            });
        }

        const encryptionKey = env.ENCRYPTION_KEY || 'default-secret';
        const encryptedKey = CryptoJS.AES.encrypt(apiKey, encryptionKey).toString();
        const keyHash = CryptoJS.SHA256(apiKey).toString();

        await prisma.apiKey.upsert({
            where: { userId_provider: { userId: user.id, provider } },
            update: { encryptedKey, keyHash, keyPrefix: apiKey.substring(0, 7) + '...' },
            create: { userId: user.id, provider, encryptedKey, keyHash, keyPrefix: apiKey.substring(0, 7) + '...' }
        });

        return { success: true };
    },

    generateToken: async ({ request }) => {
        const data = await request.formData();
        const userId = data.get('userId') as string;

        if (!userId) return { success: false };

        const token = uuidv4();
        await prisma.cliToken.create({
            data: { userId, token }
        });

        return { success: true, token };
    },

    toggleRepo: async ({ request }) => {
        const data = await request.formData();
        const userId = data.get('userId') as string;
        const repoName = data.get('repoName') as string;

        if (!userId || !repoName) return { success: false };

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
    }
};

import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import CryptoJS from 'crypto-js';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async () => {
    // In a real app, we would get the logged-in user here
    return {};
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

        // 1. Ensure user exists
        let user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    username,
                    githubId: Math.floor(Math.random() * 1000000) // Placeholder
                }
            });
        }

        // 2. Encrypt the key
        const encryptionKey = env.ENCRYPTION_KEY || 'default-secret';
        const encryptedKey = CryptoJS.AES.encrypt(apiKey, encryptionKey).toString();

        // 3. Hash the key for verification (optional but good practice)
        const keyHash = CryptoJS.SHA256(apiKey).toString();

        // 4. Upsert the API key
        await prisma.apiKey.upsert({
            where: {
                userId_provider: {
                    userId: user.id,
                    provider: provider
                }
            },
            update: {
                encryptedKey,
                keyHash,
                keyPrefix: apiKey.substring(0, 7) + '...'
            },
            create: {
                userId: user.id,
                provider,
                encryptedKey,
                keyHash,
                keyPrefix: apiKey.substring(0, 7) + '...'
            }
        });

        return { success: true };
    }
};

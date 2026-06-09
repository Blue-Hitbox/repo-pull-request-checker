import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			// Trust X-Forwarded-* headers from reverse proxy (Caddy/Coolify)
			// This ensures req.ips, req.protocol, and req.hostname are correct
		})
	}
};

export default config;

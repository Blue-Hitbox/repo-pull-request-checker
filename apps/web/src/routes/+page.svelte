<script lang="ts">
    import type { ActionData } from './$types';
    import { enhance } from '$app/forms';

    let { form }: { form: ActionData } = $props();

    let loading = $state(false);
</script>

<div class="container">
    <h1>AI Code Reviewer Dashboard</h1>

    <div class="warning">
        <strong>Security Warning:</strong> This is a demonstration dashboard using SvelteKit and PostgreSQL. In a production environment, use GitHub OAuth for authentication.
    </div>

    <form method="POST" action="?/saveKey" use:enhance={() => {
        loading = true;
        return async ({ update }) => {
            loading = false;
            await update();
        };
    }}>
        <div class="form-group">
            <label for="username">GitHub Organization or Username</label>
            <input type="text" id="username" name="username" placeholder="e.g. Blue-Hitbox" required />
        </div>

        <div class="form-group">
            <label for="provider">AI Provider</label>
            <select id="provider" name="provider">
                <option value="openai">OpenAI</option>
                <option value="claude">Claude (Anthropic)</option>
                <option value="openrouter">OpenRouter</option>
            </select>
        </div>

        <div class="form-group">
            <label for="apiKey">API Key</label>
            <input type="password" id="apiKey" name="apiKey" placeholder="sk-..." required />
        </div>

        <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save API Key'}
        </button>
    </form>

    {#if form?.success}
        <p class="success">API key saved successfully!</p>
    {:else if form?.error}
        <p class="error">{form.error}</p>
    {/if}
</div>

<style>
    :global(body) { font-family: sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 40px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    button { padding: 10px 15px; background: #238636; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; }
    button:hover { background: #2ea043; }
    button:disabled { background: #94d3a2; cursor: not-allowed; }
    .success { color: #238636; margin-top: 15px; font-weight: bold; }
    .error { color: #d73a49; margin-top: 15px; font-weight: bold; }
    .warning { background: #fffbdd; border: 1px solid #d4a017; padding: 15px; border-radius: 6px; margin-bottom: 20px; color: #735c0f; font-size: 0.9em; }
</style>

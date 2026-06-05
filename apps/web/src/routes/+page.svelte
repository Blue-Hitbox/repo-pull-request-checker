<script lang="ts">
    import type { ActionData, PageData } from './$types';
    import { enhance } from '$app/forms';

    let { data, form }: { data: PageData, form: ActionData } = $props();

    let loading = $state(false);
</script>

<div class="container">
    <h1>AI Code Reviewer Dashboard</h1>

    <div class="warning">
        <strong>Security Warning:</strong> This is a demonstration dashboard. In production, use real GitHub OAuth.
    </div>

    <section>
        <h2>Set API Keys</h2>
        <form method="POST" action="?/saveKey" use:enhance={() => {
            loading = true;
            return async ({ update }) => {
                loading = false;
                await update();
            };
        }}>
            <div class="form-group">
                <label for="username">GitHub Username</label>
                <input type="text" id="username" name="username" value={data.user?.username || ''} placeholder="e.g. Blue-Hitbox" required />
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

            <button type="submit" disabled={loading}>Save API Key</button>
        </form>
        {#if form?.success && !form?.token}
            <p class="success">API key saved successfully!</p>
        {/if}
    </section>

    {#if data.user}
        <section>
            <h2>CLI Access</h2>
            <form method="POST" action="?/generateToken" use:enhance>
                <input type="hidden" name="userId" value={data.user.id} />
                <button type="submit">Generate New CLI Token</button>
            </form>
            {#if form?.token}
                <div class="token-box">
                    <strong>Your CLI Token:</strong>
                    <code>{form.token}</code>
                    <p><small>Save this! You won't see it again. Run <code>ai-review login {form.token}</code> in your terminal.</small></p>
                </div>
            {/if}
            {#if data.user.tokens.length > 0}
                <p>You have {data.user.tokens.length} active token(s).</p>
            {/if}
        </section>

        <section>
            <h2>Repository Access</h2>
            <form method="POST" action="?/toggleRepo" use:enhance>
                <input type="hidden" name="userId" value={data.user.id} />
                <div class="form-group">
                    <label for="repoName">Repository Name (owner/repo)</label>
                    <input type="text" id="repoName" name="repoName" placeholder="e.g. Blue-Hitbox/my-project" required />
                </div>
                <button type="submit">Grant/Revoke Access</button>
            </form>

            {#if data.user.repos.length > 0}
                <ul class="repo-list">
                    {#each data.user.repos as repo}
                        <li>
                            <span>{repo.name}</span>
                            <span class={repo.isEnabled ? 'status-enabled' : 'status-disabled'}>
                                {repo.isEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>
    {/if}
</div>

<style>
    :global(body) { font-family: sans-serif; line-height: 1.6; color: #333; background: #f6f8fa; }
    .container { max-width: 600px; margin: 40px auto; padding: 30px; background: white; border: 1px solid #d0d7de; border-radius: 8px; }
    h1 { margin-top: 0; border-bottom: 1px solid #d0d7de; padding-bottom: 10px; }
    section { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    input, select { width: 100%; padding: 10px; border: 1px solid #d0d7de; border-radius: 6px; box-sizing: border-box; }
    button { padding: 10px 15px; background: #238636; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; }
    button:hover { background: #2ea043; }
    .success { color: #238636; margin-top: 15px; font-weight: bold; }
    .token-box { background: #f0f8ff; border: 1px solid #add8e6; padding: 15px; border-radius: 6px; margin-top: 15px; }
    code { background: #eee; padding: 2px 5px; border-radius: 4px; }
    .repo-list { list-style: none; padding: 0; margin-top: 15px; }
    .repo-list li { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
    .status-enabled { color: #238636; font-weight: bold; }
    .status-disabled { color: #d73a49; font-weight: bold; }
    .warning { background: #fffbdd; border: 1px solid #d4a017; padding: 15px; border-radius: 6px; margin-bottom: 20px; color: #735c0f; font-size: 0.9em; }
</style>

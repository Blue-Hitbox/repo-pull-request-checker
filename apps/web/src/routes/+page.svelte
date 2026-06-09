<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
	let copied = $state(false);

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			const textarea = document.createElement('textarea');
			textarea.value = text;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

<div class="layout">
	<!-- Header -->
	<header class="header">
		<div class="header-content">
			<div class="brand">
				<svg class="logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 2L2 7l10 5 10-5-10-5z" />
					<path d="M2 17l10 5 10-5" />
					<path d="M2 12l10 5 10-5" />
				</svg>
				<div>
					<h1>AI Code Reviewer</h1>
					<span class="subtitle">Dashboard</span>
				</div>
			</div>
			{#if data.user}
				<div class="user-badge">
					<span class="user-dot"></span>
					<span>{data.user.username}</span>
				</div>
			{/if}
		</div>
	</header>

	<!-- Main Content -->
	<main class="main">
		{#if !data.user}
			<div class="welcome-card">
				<div class="welcome-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
					</svg>
				</div>
				<h2>Welcome</h2>
				<p>
					Enter your GitHub username and configure an AI provider to start reviewing code.
					Your API keys are encrypted at rest and never exposed.
				</p>
			</div>
		{/if}

		<!-- API Key Configuration -->
		<section class="card">
			<div class="card-header">
				<div class="card-icon provider-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
						<path d="M7 11V7a5 5 0 0110 0v4" />
					</svg>
				</div>
				<div>
					<h2>API Keys</h2>
					<p class="card-desc">Configure your AI provider credentials</p>
				</div>
			</div>

			<form
				method="POST"
				action="?/saveKey"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
			>
				<div class="form-row">
					<div class="form-group">
						<label for="username">GitHub Username</label>
						<input
							type="text"
							id="username"
							name="username"
							value={data.user?.username || ''}
							placeholder="e.g. Blue-Hitbox"
							required
						/>
					</div>

					<div class="form-group">
						<label for="provider">AI Provider</label>
						<select id="provider" name="provider">
							<option value="openai">OpenAI</option>
							<option value="claude">Claude (Anthropic)</option>
							<option value="openrouter">OpenRouter</option>
						</select>
					</div>
				</div>

				<div class="form-group">
					<label for="apiKey">API Key</label>
					<input
						type="password"
						id="apiKey"
						name="apiKey"
						placeholder="sk-..."
						required
						autocomplete="off"
					/>
				</div>

				<div class="form-actions">
					<button type="submit" disabled={loading} class="btn-primary">
						{#if loading}
							<span class="spinner"></span>
							Saving...
						{:else}
							Save API Key
						{/if}
					</button>
				</div>
			</form>

			{#if form?.success && !form?.token}
				<div class="alert alert-success">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
						<path d="M22 4L12 14.01l-3-3" />
					</svg>
					<span>API key saved successfully</span>
				</div>
			{/if}

			{#if form?.error}
				<div class="alert alert-error">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" />
						<path d="M15 9l-6 6M9 9l6 6" />
					</svg>
					<span>{form.error}</span>
				</div>
			{/if}

			{#if data.user?.apiKeys && data.user.apiKeys.length > 0}
				<div class="existing-keys">
					<h3>Configured Keys</h3>
					<div class="key-list">
						{#each data.user.apiKeys as keyRecord}
							<div class="key-item">
								<div class="key-info">
									<span class="key-provider">{keyRecord.provider}</span>
									<span class="key-prefix">{keyRecord.keyPrefix}</span>
								</div>
								<span class="key-date">
									Added {keyRecord.createdAt ? new Date(keyRecord.createdAt).toLocaleDateString() : 'N/A'}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</section>

		{#if data.user}
			<!-- CLI Access -->
			<section class="card">
				<div class="card-header">
					<div class="card-icon cli-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="4 17 10 11 4 5" />
							<line x1="12" y1="19" x2="20" y2="19" />
						</svg>
					</div>
					<div>
						<h2>CLI Access</h2>
						<p class="card-desc">Generate tokens for command-line usage</p>
					</div>
				</div>

				<form method="POST" action="?/generateToken" use:enhance>
					<input type="hidden" name="userId" value={data.user.id} />
					<button type="submit" class="btn-primary btn-full">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
							<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
						</svg>
						Generate New Token
					</button>
				</form>

				{#if form?.token}
					<div class="token-display">
						<div class="token-header">
							<span class="token-label">New Token</span>
							<span class="token-warning">Copy this now — it won't be shown again</span>
</div>
<div class="token-value">
<code>{form.token}</code>
<button class="btn-copy" onclick={() => copyToClipboard(form.token)} title="Copy to clipboard">
{#if copied}
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
<path d="M20 6L9 17l-5-5" />
</svg>
{:else}
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
</svg>
{/if}
</button>
</div>
<div class="token-usage">
<span class="token-usage-label">Usage:</span>
<code>ai-review login {form.token}</code>
</div>
</div>
{/if}

{#if data.user.tokens && data.user.tokens.length > 0}
<div class="token-count">
<span class="badge">{data.user.tokens.length}</span>
<span> active token(s)</span>
</div>
{/if}
</section>

<!-- Repository Management -->
<section class="card">
<div class="card-header">
<div class="card-icon repo-icon">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
</svg>
</div>
<div>
<h2>Repositories</h2>
<p class="card-desc">Manage which repositories can be reviewed</p>
</div>
</div>

<form method="POST" action="?/toggleRepo" use:enhance>
<input type="hidden" name="userId" value={data.user.id} />
<div class="form-group">
<label for="repoName">Repository</label>
<input
type="text"
id="repoName"
name="repoName"
placeholder="owner/repo"
required
pattern="^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$"
/>
</div>
<button type="submit" class="btn-primary btn-full">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
<path d="M12 5v14M5 12h14" />
</svg>
Add / Toggle Repository
</button>
</form>

{#if data.user.repos && data.user.repos.length > 0}
<div class="repo-list">
{#each data.user.repos as repo}
<div class="repo-item">
<div class="repo-info">
<svg class="repo-folder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
</svg>
<span class="repo-name">{repo.name}</span>
</div>
<span class="badge" class:badge-active={repo.isEnabled}>
{repo.isEnabled ? 'Enabled' : 'Disabled'}
</span>
</div>
{/each}
</div>
{/if}
</section>
{/if}
</main>

<!-- Footer -->
<footer class="footer">
<span>AI Code Reviewer</span>
<span class="footer-sep">·</span>
<span>Self-hosted</span>
</footer>
</div>

<style>
:global(*) {
margin: 0;
padding: 0;
box-sizing: border-box;
}
:global(body) {
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
line-height: 1.6;
color: #1a1a2e;
background: #f0f2f5;
min-height: 100vh;
}

.layout {
min-height: 100vh;
display: flex;
flex-direction: column;
}

/* Header */
.header {
background: #1a1a2e;
border-bottom: 1px solid #2d2d4a;
padding: 0 24px;
position: sticky;
top: 0;
z-index: 100;
}
.header-content {
max-width: 720px;
margin: 0 auto;
display: flex;
align-items: center;
justify-content: space-between;
height: 56px;
}
.brand {
display: flex;
align-items: center;
gap: 12px;
}
.logo {
width: 28px;
height: 28px;
color: #6366f1;
}
.brand h1 {
font-size: 16px;
font-weight: 700;
color: #e2e8f0;
line-height: 1.2;
}
.subtitle {
font-size: 11px;
color: #94a3b8;
text-transform: uppercase;
letter-spacing: 0.05em;
}
.user-badge {
display: flex;
align-items: center;
gap: 8px;
padding: 6px 12px;
background: rgba(99, 102, 241, 0.15);
border: 1px solid rgba(99, 102, 241, 0.3);
border-radius: 20px;
font-size: 13px;
color: #a5b4fc;
}
.user-dot {
width: 8px;
height: 8px;
background: #22c55e;
border-radius: 50%;
}

/* Main */
.main {
flex: 1;
max-width: 720px;
width: 100%;
margin: 0 auto;
padding: 32px 24px;
display: flex;
flex-direction: column;
gap: 24px;
}

/* Welcome Card */
.welcome-card {
background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
border-radius: 16px;
padding: 32px;
color: white;
text-align: center;
}
.welcome-icon {
width: 48px;
height: 48px;
margin: 0 auto 16px;
opacity: 0.9;
}
.welcome-card h2 {
font-size: 20px;
font-weight: 700;
margin-bottom: 8px;
}
.welcome-card p {
font-size: 14px;
opacity: 0.85;
max-width: 400px;
margin: 0 auto;
}

/* Card */
.card {
background: white;
border-radius: 12px;
border: 1px solid #e2e8f0;
padding: 24px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.card-header {
display: flex;
align-items: center;
gap: 14px;
margin-bottom: 20px;
}
.card-icon {
width: 40px;
height: 40px;
border-radius: 10px;
display: flex;
align-items: center;
justify-content: center;
flex-shrink: 0;
}
.card-icon svg {
width: 20px;
height: 20px;
}
.provider-icon { background: #eff6ff; color: #3b82f6; }
.cli-icon { background: #f0fdf4; color: #22c55e; }
.repo-icon { background: #fef3c7; color: #f59e0b; }
.card-header h2 {
font-size: 16px;
font-weight: 600;
color: #1e293b;
}
.card-desc {
font-size: 13px;
color: #64748b;
}

/* Forms */
.form-row {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 16px;
}
.form-group {
margin-bottom: 16px;
}
.form-group:last-child {
margin-bottom: 0;
}
label {
display: block;
margin-bottom: 6px;
font-size: 13px;
font-weight: 500;
color: #374151;
}
input, select {
width: 100%;
padding: 10px 14px;
border: 1px solid #d1d5db;
border-radius: 8px;
font-size: 14px;
color: #1f2937;
background: white;
transition: border-color 0.15s, box-shadow 0.15s;
}
input:focus, select:focus {
outline: none;
border-color: #6366f1;
box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
input::placeholder { color: #9ca3af; }
.form-actions { margin-top: 20px; }

/* Buttons */
.btn-primary {
display: inline-flex;
align-items: center;
justify-content: center;
gap: 8px;
padding: 10px 20px;
background: #6366f1;
color: white;
border: none;
border-radius: 8px;
font-size: 14px;
font-weight: 600;
cursor: pointer;
transition: background 0.15s, transform 0.1s;
}
.btn-primary:hover:not(:disabled) { background: #4f46e5; }
.btn-primary:active:not(:disabled) { transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-full { width: 100%; }

/* Spinner */
.spinner {
width: 16px;
height: 16px;
border: 2px solid rgba(255, 255, 255, 0.3);
border-top-color: white;
border-radius: 50%;
animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Alerts */
.alert {
display: flex;
align-items: center;
gap: 10px;
padding: 12px 16px;
border-radius: 8px;
margin-top: 16px;
font-size: 14px;
}
.alert svg { width: 18px; height: 18px; flex-shrink: 0; }
.alert-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
.alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

/* Existing Keys */
.existing-keys {
margin-top: 20px;
padding-top: 20px;
border-top: 1px solid #f1f5f9;
}
.existing-keys h3 {
font-size: 13px;
font-weight: 600;
color: #64748b;
text-transform: uppercase;
letter-spacing: 0.03em;
margin-bottom: 12px;
}
.key-list { display: flex; flex-direction: column; gap: 8px; }
.key-item {
display: flex;
align-items: center;
justify-content: space-between;
padding: 10px 14px;
background: #f8fafc;
border-radius: 8px;
border: 1px solid #f1f5f9;
}
.key-info { display: flex; align-items: center; gap: 10px; }
.key-provider { font-size: 13px; font-weight: 600; color: #334155; text-transform: capitalize; }
.key-prefix { font-size: 12px; color: #94a3b8; font-family: 'SF Mono', SFMono-Regular, Consolas, monospace; }
.key-date { font-size: 12px; color: #94a3b8; }

/* Token Display */
.token-display {
margin-top: 16px;
background: #1e293b;
border-radius: 10px;
padding: 16px;
}
.token-header {
display: flex;
align-items: center;
justify-content: space-between;
margin-bottom: 10px;
}
.token-label {
font-size: 12px;
font-weight: 600;
color: #94a3b8;
text-transform: uppercase;
letter-spacing: 0.05em;
}
.token-warning { font-size: 11px; color: #fbbf24; }
.token-value { display: flex; align-items: center; gap: 10px; }
.token-value code {
flex: 1;
font-family: 'SF Mono', SFMono-Regular, Consolas, monospace;
font-size: 12px;
color: #e2e8f0;
word-break: break-all;
line-height: 1.5;
}
.btn-copy {
background: rgba(255, 255, 255, 0.1);
border: 1px solid rgba(255, 255, 255, 0.15);
color: #94a3b8;
padding: 6px;
border-radius: 6px;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
transition: all 0.15s;
flex-shrink: 0;
}
.btn-copy:hover { background: rgba(255, 255, 255, 0.2); color: white; }
.token-usage {
margin-top: 12px;
padding-top: 12px;
border-top: 1px solid rgba(255, 255, 255, 0.1);
display: flex;
align-items: center;
gap: 8px;
}
.token-usage-label { font-size: 11px; color: #64748b; }
.token-usage code {
font-family: 'SF Mono', SFMono-Regular, Consolas, monospace;
font-size: 11px;
color: #a5b4fc;
}
.token-count {
margin-top: 14px;
display: flex;
align-items: center;
gap: 6px;
font-size: 13px;
color: #64748b;
}

/* Repo List */
.repo-list {
margin-top: 16px;
display: flex;
flex-direction: column;
gap: 6px;
}
.repo-item {
display: flex;
align-items: center;
justify-content: space-between;
padding: 10px 14px;
background: #f8fafc;
border-radius: 8px;
border: 1px solid #f1f5f9;
}
.repo-info { display: flex; align-items: center; gap: 10px; }
.repo-folder { width: 16px; height: 16px; color: #94a3b8; flex-shrink: 0; }
.repo-name { font-size: 14px; font-weight: 500; color: #334155; }

/* Badge */
.badge {
display: inline-flex;
align-items: center;
padding: 3px 10px;
border-radius: 12px;
font-size: 12px;
font-weight: 600;
background: #fee2e2;
color: #991b1b;
}
.badge-active { background: #dcfce7; color: #166534; }

/* Footer */
.footer {
text-align: center;
padding: 20px 24px;
font-size: 12px;
color: #94a3b8;
display: flex;
align-items: center;
justify-content: center;
gap: 8px;
}
.footer-sep { color: #cbd5e1; }

/* Responsive */
@media (max-width: 640px) {
.form-row { grid-template-columns: 1fr; }
.main { padding: 20px 16px; }
.card { padding: 20px; }
}
</style>

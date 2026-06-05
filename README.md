# AI GitHub Code Reviewer (Monorepo)

A GitHub App, GitHub Action, and Terminal CLI that automatically reviews code using AI. It supports OpenAI, Claude (Anthropic), and OpenRouter.

This project is organized as a monorepo:
- `apps/bot`: The GitHub App (Probot).
- `apps/web`: The Dashboard website (SvelteKit + PostgreSQL).
- `apps/cli`: The Terminal CLI for local development and other git providers.
- `packages/ai-core`: Shared AI provider logic.

## Features

- **Automated Reviews**: Triggered on pull request events (GitHub App/Action).
- **Terminal CLI**: Review local changes or integrate with GitLab, Gitea, etc.
- **Multiple AI Providers**: Supports OpenAI, Claude, and OpenRouter.
- **Bring Your Own Key**: Users provide their API keys via a SvelteKit dashboard or CLI flags.
- **PostgreSQL Storage**: Securely store and encrypt user keys using Prisma.

---

## Integration Methods

### 1. Terminal CLI (`apps/cli`)

Use the CLI to review local changes or integrate with any git provider (GitLab, Gitea, etc.).

#### Installation

```bash
cd apps/cli
npm install
npm run build
alias ai-review="node $(pwd)/dist/index.js"
```

#### Usage

```bash
# Review unstaged changes
ai-review diff

# Review staged changes
ai-review diff --staged

# Review a specific diff via stdin (useful for GitLab/Gitea CI)
git diff HEAD~1 | ai-review stdin --provider claude --key your-api-key
```

### 2. GitHub App (with Dashboard)

The GitHub App uses a central dashboard where users can securely save their API keys.

#### Dashboard Setup (`apps/web`)

1. Go to `apps/web`.
2. Configure `.env` (DATABASE_URL, ENCRYPTION_KEY, DASHBOARD_API_SECRET).
3. Run migrations: `npx prisma migrate dev`.
4. Start: `npm run dev`.

#### Bot Setup (`apps/bot`)

1. Configure `.env` (DASHBOARD_URL, DASHBOARD_API_SECRET, GitHub App credentials).
2. Start: `npm run dev`.

### 3. GitHub Action

Use the Action in your GitHub workflows with repository secrets.

```yaml
uses: Blue-Hitbox/repo-pull-request-checker/apps/bot@main
with:
  provider: 'openai'
  api_key: ${{ secrets.AI_API_KEY }}
```

---

## License

ISC

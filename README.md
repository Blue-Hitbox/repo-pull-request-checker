# AI GitHub Code Reviewer (Monorepo)

A GitHub App and GitHub Action that automatically reviews pull requests using AI. It supports OpenAI, Claude (Anthropic), and OpenRouter.

This project is organized as a monorepo:
- `apps/bot`: The GitHub App (Probot).
- `apps/web`: The Dashboard website (SvelteKit + PostgreSQL).
- `packages/ai-core`: Shared AI provider logic.

## Features

- **Automated Reviews**: Triggered on pull request events.
- **Multiple AI Providers**: Supports OpenAI, Claude, and OpenRouter.
- **Bring Your Own Key**: Users provide their API keys via a SvelteKit dashboard.
- **PostgreSQL Storage**: Securely store and encrypt user keys using Prisma.
- **Monorepo Architecture**: Scalable and easy to manage.

## Integration Methods

### 1. GitHub App (with Dashboard)

#### Prerequisites

- **PostgreSQL**: A running instance of PostgreSQL.
- **Docker**: (Optional) Use the provided `docker-compose.yml`.

#### Dashboard Setup (`apps/web`)

1. Go to `apps/web`.
2. Configure `.env`:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/ai_reviewer?schema=public"
   ENCRYPTION_KEY="your-secret-key-for-encryption"
   DASHBOARD_API_SECRET="shared-secret-between-bot-and-dashboard"
   ```
3. Run migrations: `npx prisma migrate dev`.
4. Start the dashboard: `npm run dev` (runs on http://localhost:5173).

#### Bot Setup (`apps/bot`)

1. Configure `.env`:
   ```bash
   DASHBOARD_URL=http://localhost:5173
   DASHBOARD_API_SECRET=shared-secret-between-bot-and-dashboard
   ```
2. Start the bot: `npm run dev`.

### 2. GitHub Action

The GitHub Action uses GitHub Secrets for API keys.

```yaml
uses: Blue-Hitbox/repo-pull-request-checker/apps/bot@main
with:
  provider: 'openai'
  api_key: ${{ secrets.AI_API_KEY }}
```

## Security

- **Encryption**: API keys are encrypted at rest in the PostgreSQL database using AES encryption.
- **Authentication**: Communication between the bot and the dashboard is secured via `DASHBOARD_API_SECRET`.
- **Hashed Verification**: Keys are also hashed to prevent duplicate entries.

## License

ISC

# AI GitHub Code Reviewer (Monorepo)

A GitHub App and GitHub Action that automatically reviews pull requests using AI. It supports OpenAI, Claude (Anthropic), and OpenRouter.

This project is organized as a monorepo:
- `apps/bot`: The GitHub App (Probot).
- `apps/web`: The Dashboard website for users to provide their own keys.
- `packages/ai-core`: Shared AI provider logic.

## Features

- **Automated Reviews**: Triggered on pull request events.
- **Multiple AI Providers**: Supports OpenAI, Claude, and OpenRouter.
- **Bring Your Own Key**: Users provide their API keys via a central web dashboard.
- **Monorepo Architecture**: Scalable and easy to manage.

## Integration Methods

### 1. GitHub App (with Dashboard)

The GitHub App uses a central dashboard where users can securely save their API keys.

#### Dashboard Setup (`apps/web`)

1. Go to `apps/web`.
2. Install dependencies: `npm install`.
3. Start the dashboard: `npm run dev` (runs on http://localhost:3000).
4. Users can go to the homepage and save their API keys linked to their GitHub Username or Organization.

#### Bot Setup (`apps/bot`)

1. Go to `apps/bot`.
2. Create a GitHub App in your developer settings.
3. Configure the `.env` file (see `apps/bot/.env.example`).
4. Set `DASHBOARD_URL` to your running dashboard instance.
5. Start the bot: `npm run dev`.

### 2. GitHub Action

The GitHub Action is an alternative that uses GitHub Secrets for API keys.

```yaml
uses: Blue-Hitbox/repo-pull-request-checker/apps/bot@main
with:
  provider: 'openai'
  api_key: ${{ secrets.AI_API_KEY }}
```

## Repository Configuration

Users can customize the review by creating a `.github/ai-reviewer.yml` file in their repository:

```yaml
provider: claude
model: claude-3-5-sonnet-20240620
```

*Note: The `apiKey` field in the config file is no longer supported for security reasons. Use the Dashboard to provide keys for the App.*

## Development

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Start the dashboard
npm run start --workspace=@ai-reviewer/web

# Start the bot
npm run start --workspace=@ai-reviewer/bot
```

## License

ISC

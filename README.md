# AI GitHub Code Reviewer (Monorepo)

A unified AI code review platform. This project uses a "Brain" architecture where a central Web App handles all AI interactions, while a GitHub App and Terminal CLI act as clients.

## Architecture

- **The Brain (`apps/web`)**: A SvelteKit + PostgreSQL app that manages user API keys and performs the actual AI review process.
- **The Clients**:
    - **GitHub App (`apps/bot`)**: For automated pull request reviews on GitHub.
    - **Terminal CLI (`apps/cli`)**: For local git reviews or integration with GitLab, Gitea, etc.
- **Shared Logic (`packages/ai-core`)**: Centralized AI provider implementations.

## Features

- **Centralized Key Management**: Provide your API keys once in the dashboard.
- **Shared Review Process**: The same AI logic and prompts are used across all integration methods.
- **Secure**: API keys are encrypted at rest and never stored in client apps or repository configurations.

---

## Setup

### 1. The Brain (`apps/web`)

1. Go to `apps/web`.
2. Configure `.env` (DATABASE_URL, ENCRYPTION_KEY, DASHBOARD_API_SECRET).
3. Run migrations: `npx prisma migrate dev`.
4. Start: `npm run dev`.
5. Open the dashboard (http://localhost:5173) and save your API keys for your GitHub/GitLab username.

### 2. GitHub App Client (`apps/bot`)

1. Go to `apps/bot`.
2. Configure `.env` (DASHBOARD_URL, DASHBOARD_API_SECRET, GitHub App credentials).
3. Start: `npm run dev`.

### 3. Terminal CLI Client (`apps/cli`)

```bash
cd apps/cli
npm run build
alias ai-review="DASHBOARD_URL=http://localhost:5173 DASHBOARD_API_SECRET=your-secret node $(pwd)/dist/index.js"

# Usage
ai-review diff --owner your-username
```

---

## Repository Configuration

Customize per-repository behavior via `.github/ai-reviewer.yml`:

```yaml
provider: claude
model: claude-3-5-sonnet-20240620
```

## License

ISC

# AI Code Reviewer Platform

A unified AI code review platform. This project uses a "Brain" architecture where a central SvelteKit Web App handles all AI interactions, while a Terminal CLI acts as the client.

## Architecture

- **The Brain (`apps/web`)**: A SvelteKit + PostgreSQL app that manages user API keys and performs the actual AI review process.
- **The Client (`apps/cli`)**: A terminal application for local git reviews or integration with GitLab, Gitea, GitHub, etc.
- **Shared Logic (`packages/ai-core`)**: Centralized AI provider implementations.

## Features

- **Centralized Key Management**: Provide your API keys once in the dashboard.
- **CLI Login**: Authenticate the terminal app with a token for a seamless experience.
- **Shared Review Process**: The same AI logic and prompts are used across all git workflows.
- **Secure**: API keys are encrypted at rest and never stored in client apps.

---

## Quick Start (Development)

1. **Prerequisites**: PostgreSQL instance running (use `docker-compose up -d`).
2. **Setup**:
    ```bash
    npm install
    # Create apps/web/.env with DATABASE_URL, ENCRYPTION_KEY, DASHBOARD_API_SECRET
    npx prisma migrate dev --schema=apps/web/prisma/schema.prisma
    ```
3. **Run**:
    ```bash
    npm run dev
    ```
    This will start both the SvelteKit dashboard and the CLI in development mode.

---

## Integration Methods

### Terminal CLI (`apps/cli`)

Use the CLI to review changes from any git provider.

#### Setup

```bash
cd apps/cli
npm run build
alias ai-review="DASHBOARD_URL=http://localhost:5173 DASHBOARD_API_SECRET=your-secret node $(pwd)/dist/index.js"
```

#### Login

1. Go to the dashboard (http://localhost:5173).
2. Generate a **CLI Token**.
3. Run: `ai-review login <your-token>`.

#### Usage

```bash
# Review local git changes (owner automatically determined)
ai-review diff

# Review a specific diff via stdin
git diff HEAD~1 | ai-review stdin
```

## License

ISC

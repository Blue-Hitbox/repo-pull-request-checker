# AI GitHub Code Reviewer (Monorepo)

A unified AI code review platform. This project uses a "Brain" architecture where a central SvelteKit Web App handles all AI interactions, while a GitHub App and Terminal CLI act as clients.

## Features

- **Centralized Key Management**: Manage API keys in a central dashboard.
- **CLI Login**: Authenticate the terminal app with a token for a seamless experience.
- **Repository Access**: Control which repositories are allowed to be reviewed.
- **Shared Review Process**: Consistent AI logic across all integration methods.
- **Secure**: Keys are encrypted at rest in a PostgreSQL database.

---

## Integration Methods

### 1. Terminal CLI (`apps/cli`)

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
# Review changes (owner is automatically determined after login)
ai-review diff
```

### 2. GitHub App Client (`apps/bot`)

1. Go to `apps/bot`.
2. Configure `.env` (DASHBOARD_URL, DASHBOARD_API_SECRET, GitHub App credentials).
3. Start: `npm run dev`.

---

## Setup (The Brain)

1. **Database**: Start PostgreSQL (e.g., `docker-compose up -d`).
2. **Web App**:
    - Go to `apps/web`.
    - Configure `.env` (DATABASE_URL, ENCRYPTION_KEY, DASHBOARD_API_SECRET).
    - Run: `npx prisma migrate dev`.
    - Start: `npm run dev`.

## License

ISC

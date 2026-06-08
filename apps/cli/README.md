# AI Code Reviewer CLI

The terminal client for the AI Code Reviewer platform. Perform AI-powered code reviews on your local changes or integrate with GitLab, Gitea, and more.

## Setup

1. Build the CLI:
   ```bash
   npm run build
   ```
2. Create an alias (optional but recommended):
   ```bash
   alias ai-review="DASHBOARD_URL=http://localhost:5173 DASHBOARD_API_SECRET=your-secret node $(pwd)/dist/index.js"
   ```

## Usage

### Login

Authenticate with your central dashboard using a CLI token:

```bash
ai-review login <your-token>
```

### Review Local Changes

Review unstaged changes in your current git repository:

```bash
ai-review diff
```

Review staged changes:

```bash
ai-review diff --staged
```

Specify a repository for access control:

```bash
ai-review diff --repo owner/my-repo
```

### Review via Stdin

Pipe a diff directly to the reviewer (useful for CI/CD):

```bash
git diff HEAD~1 | ai-review stdin --provider claude
```

## Options

- `-o, --owner <name>`: GitHub/GitLab username or organization (automatic if logged in).
- `-r, --repo <name>`: Repository name in `owner/repo` format.
- `-p, --provider <name>`: AI provider (`openai`, `claude`, `openrouter`).
- `-m, --model <name>`: Specific AI model to use.

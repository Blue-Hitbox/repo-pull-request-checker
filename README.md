# AI GitHub Code Reviewer

A GitHub App and GitHub Action that automatically reviews pull requests using AI. It supports OpenAI, Claude (Anthropic), and OpenRouter, allowing you to bring your own API keys.

## Features

- **Automated Reviews**: Triggered on pull request events.
- **Multiple AI Providers**: Supports OpenAI, Claude, and OpenRouter.
- **Bring Your Own Key**: Provide your API key via repository configuration or GitHub Secrets.
- **Actionable Feedback**: Focuses on bugs, security, and performance.

## Choose Your Integration

You can use this tool either as a **GitHub App** (centrally hosted) or a **GitHub Action** (run in your own CI).

---

### Option 1: GitHub Action (Recommended for Security)

Using the GitHub Action is the most secure way to "bring your own key" because your API key is stored in your own repository's secrets.

#### Setup

1. In your repository, go to **Settings > Secrets and variables > Actions**.
2. Add a new repository secret named `AI_API_KEY` with your AI provider's API key.
3. Create a workflow file (e.g., `.github/workflows/ai-review.yml`):

```yaml
name: AI Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    steps:
      - name: AI Reviewer
        uses: Blue-Hitbox/repo-pull-request-checker@main # Use the latest version
        with:
          provider: 'openai' # or 'claude', 'openrouter'
          model: 'gpt-4o'
          api_key: ${{ secrets.AI_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

---

### Option 2: GitHub App

The GitHub App is useful if you want to manage multiple repositories from a single installation.

#### Setup

1. Create a GitHub App in your developer settings.
2. **Permissions**: Pull requests (write), Contents (read), Metadata (read).
3. **Events**: Pull request.
4. Deploy the app to a server (e.g., Vercel, Railway, or your own VPS).
5. Configure the server using a `.env` file (see `.env.example`).

#### Per-Repository Configuration

Users can customize the review by creating a `.github/ai-reviewer.yml` file in their repository:

```yaml
provider: claude
model: claude-3-5-sonnet-20240620
apiKey: your-api-key-here # ⚠️ Warning: Plain text keys in repo are NOT recommended. Use the GitHub Action for better security.
```

## Configuration Summary

### AI Providers

- `openai`: Requires `OPENAI_API_KEY`.
- `claude` / `anthropic`: Requires `ANTHROPIC_API_KEY`.
- `openrouter`: Requires `OPENROUTER_API_KEY`.

### Security Note

When using the **GitHub App** method, we strongly recommend against placing your `apiKey` in plain text in the `.github/ai-reviewer.yml` file. Instead, the app administrator should provide the keys via environment variables on the server.

For the best "bring your own key" experience where the key stays private to your repository, use **Option 1: GitHub Action**.

## License

ISC

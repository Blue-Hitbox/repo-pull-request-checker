# AI GitHub Code Reviewer

A GitHub App that automatically reviews pull requests using AI. It supports OpenAI, Claude (Anthropic), and OpenRouter, allowing you to bring your own API keys and choose your own models.

## Features

- **Automated Reviews**: Triggered on pull request creation and synchronization.
- **Multiple AI Providers**: Supports OpenAI, Claude, and OpenRouter.
- **Per-Repository Configuration**: Users can choose the AI provider and model for each repository.
- **Actionable Feedback**: Focuses on bugs, security, and performance.

## Setup

### 1. Create a GitHub App

1. Go to your GitHub Settings > Developer settings > GitHub Apps > New GitHub App.
2. Set the following:
   - **GitHub App name**: Your choice (e.g., `My AI Reviewer`).
   - **Homepage URL**: Any URL (e.g., your repo URL).
   - **Webhook**: Enable it and provide a Webhook URL (use smee.io for local development).
   - **Webhook secret**: A secure random string.
3. **Permissions**:
   - **Pull requests**: Read & write.
   - **Contents**: Read-only (to read `.github/ai-reviewer.yml`).
   - **Metadata**: Read-only.
4. **Subscribe to events**:
   - Pull request.
5. Create the app, then:
   - Generate a **Private key** and download it.
   - Note the **App ID**, **Client ID**, and **Client Secret**.

### 2. Installation

```bash
git clone https://github.com/Blue-Hitbox/repo-pull-request-checker.git
cd repo-pull-request-checker
npm install
```

### 3. Configuration

#### Server-side (.env)

Copy the `.env.example` file to `.env` and fill in the values:

```bash
cp .env.example .env
```

- `APP_ID`: Your GitHub App ID.
- `PRIVATE_KEY`: Your GitHub App Private Key.
- `WEBHOOK_SECRET`: Your Webhook Secret.
- `OPENAI_API_KEY`: Your OpenAI API key.
- `ANTHROPIC_API_KEY`: Your Anthropic API key.
- `OPENROUTER_API_KEY`: Your OpenRouter API key.
- `AI_PROVIDER`: Default provider (e.g., `openai`).
- `AI_MODEL`: Default model (e.g., `gpt-4o`).

#### Repository-side (.github/ai-reviewer.yml)

Users can customize the review per repository by creating a `.github/ai-reviewer.yml` file:

```yaml
provider: claude
model: claude-3-5-sonnet-20240620
```

Supported providers: `openai`, `claude`, `openrouter`.

### 4. Running the App

```bash
# Build the project
npm run build

# Start the app
npm start
```

## How it Works

When a pull request is opened or updated, the app fetches the diff and reads the configuration from the repository. It then sends the diff to the configured AI provider. The AI generates a review focusing on:
- Potential bugs
- Security vulnerabilities
- Performance optimizations
- Code readability and maintainability

The review is then posted as a comment on the pull request.

## License

ISC

# AI GitHub Code Reviewer

A GitHub App that automatically reviews pull requests using AI. It supports OpenAI, Claude (Anthropic), and OpenRouter, allowing you to bring your own API keys.

## Features

- **Automated Reviews**: Triggered on pull request creation and synchronization.
- **Multiple AI Providers**: Supports OpenAI, Claude, and OpenRouter.
- **Actionable Feedback**: Focuses on bugs, security, and performance.
- **Customizable**: Choose your preferred AI model and provider.

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

Copy the `.env.example` file to `.env` and fill in the values:

```bash
cp .env.example .env
```

- `APP_ID`: Your GitHub App ID.
- `PRIVATE_KEY`: Your GitHub App Private Key (replace newlines with `\n` or use a multi-line string in some environments).
- `WEBHOOK_SECRET`: Your Webhook Secret.
- `AI_PROVIDER`: `openai`, `claude`, or `openrouter`.
- `AI_API_KEY`: Your API key for the chosen provider.
- `AI_MODEL`: (Optional) The model to use (e.g., `gpt-4-turbo`, `claude-3-5-sonnet-20240620`).

### 4. Running the App

```bash
# Build the project
npm run build

# Start the app
npm start
```

For development with hot-reloading:
```bash
npm run dev
```

## How it Works

When a pull request is opened or updated, the app fetches the diff and sends it to the configured AI provider. The AI generates a review focusing on:
- Potential bugs
- Security vulnerabilities
- Performance optimizations
- Code readability and maintainability

The review is then posted as a comment on the pull request.

## License

ISC

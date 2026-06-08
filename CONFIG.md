# Configuration Guide

This document lists the environment variables used by the AI Code Reviewer platform.

## Required Variables (Dashboard Brain)

These variables must be set in `apps/web/.env`.

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string. | `postgresql://user:pass@localhost:5432/db` |
| `ENCRYPTION_KEY` | Master key used to encrypt user API keys at rest (AES-256). | A long random string. |
| `DASHBOARD_API_SECRET` | Shared secret used to authorize client apps (like the CLI). | A long random string. |

## Optional / Fallback Variables

These can be set in `apps/web/.env` or `apps/cli/.env` (or as shell exports).

| Variable | Description | Example |
|----------|-------------|---------|
| `AI_PROVIDER` | Default AI provider if not specified (`openai`, `claude`, `openrouter`). | `openai` |
| `AI_MODEL` | Default AI model to use. | `gpt-4o` |
| `OPENAI_API_KEY` | Fallback OpenAI key if not found in DB. | `sk-...` |
| `ANTHROPIC_API_KEY` | Fallback Anthropic key if not found in DB. | `sk-ant-...` |
| `OPENROUTER_API_KEY` | Fallback OpenRouter key if not found in DB. | `sk-or-...` |
| `DASHBOARD_URL` | URL of the SvelteKit dashboard (for the CLI). | `http://localhost:5173` |

## Security Note

**Never** commit your `.env` files. Ensure `ENCRYPTION_KEY` and `DASHBOARD_API_SECRET` are kept private and unique for your deployment.

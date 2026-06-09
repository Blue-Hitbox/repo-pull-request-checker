# Production Deployment Guide (Coolify)

This guide walks you through deploying the AI Code Reviewer platform to your Coolify server.

## Prerequisites

- A running Coolify instance
- A server connected to Coolify
- A domain name pointed to your server's IP
- GitHub repository pushed to a remote (GitHub, GitLab, etc.)

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Caddy /   │────▶│  SvelteKit   │────▶│  PostgreSQL │
│   Coolify   │     │  Web App     │     │  Database   │
│   Proxy     │     │  (Docker)    │     │  (Docker)   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  AI Provider │
                    │  (OpenAI,    │
                    │   Claude,    │
                    │   OpenRouter)│
                    └─────────────┘
```

## Step 1: Generate Secrets

Generate strong random values for the encryption keys:

```bash
# Generate ENCRYPTION_KEY
openssl rand -hex 32

# Generate DASHBOARD_API_SECRET
openssl rand -hex 32

# Generate POSTGRES_PASSWORD
openssl rand -hex 16
```

## Step 2: Configure Environment Variables in Coolify

In your Coolify dashboard, create a new resource (Docker Compose) and set these environment variables:

| Variable | Value | Required |
|----------|-------|----------|
| `POSTGRES_USER` | `ai_reviewer` | Yes |
| `POSTGRES_PASSWORD` | `<generated password>` | Yes |
| `POSTGRES_DB` | `ai_reviewer` | Yes |
| `ENCRYPTION_KEY` | `<64-char hex string>` | Yes |
| `DASHBOARD_API_SECRET` | `<64-char hex string>` | Yes |
| `ORIGIN` | `https://your-domain.com` | Yes |
| `WEB_PORT` | `3000` | Yes |
| `NODE_ENV` | `production` | Yes |

## Step 3: Deploy via Coolify

### Option A: Using GitHub Repository (Recommended)

1. In Coolify, click **"New Resource"** → **"Docker Compose"**
2. Select **"From Git"** and connect your repository
3. Set the branch to `main` (or your default branch)
4. Set the **Docker Compose File Location** to `docker-compose.yml`
5. Add all environment variables from Step 2
6. Click **"Deploy"**

### Option B: Using Raw Docker Compose

1. In Coolify, click **"New Resource"** → **"Docker Compose"**
2. Select **"Raw Docker Compose"**
3. Paste the contents of `docker-compose.yml`
4. Add all environment variables from Step 2
5. Click **"Deploy"**

## Step 4: Configure Domain & SSL

1. In Coolify, go to your web service settings
2. Set the domain to your desired domain (e.g., `reviewer.yourdomain.com`)
3. Coolify will automatically provision an SSL certificate via Let's Encrypt
4. Ensure your DNS A record points to your server's IP

## Step 5: Verify Deployment

1. Check the service health: `https://your-domain.com/api/health`
   - Should return: `{"status":"healthy","database":"connected",...}`
2. Access the dashboard: `https://your-domain.com`
3. Check Coolify logs for any errors

## Step 6: Initial Setup

1. Open the dashboard in your browser
2. Enter a GitHub username
3. Select an AI provider and enter your API key
4. Click "Save API Key"
5. Generate a CLI token
6. Use the CLI: `ai-review login <token>`

## Updating the Application

When you push changes to your repository:

1. Coolify will auto-detect the change (if webhooks are configured)
2. Or manually click **"Redeploy"** in Coolify
3. The new container will be built and deployed with zero downtime

## Database Backups

Coolify supports volume backups. To back up your PostgreSQL data:

1. Go to your database service in Coolify
2. Use the **"Execute Command"** feature:
   ```bash
   pg_dump -U ai_reviewer ai_reviewer > /backups/backup_$(date +%Y%m%d).sql
   ```
3. Or configure automated backups via Coolify's backup feature

## Troubleshooting

### Container won't start
- Check logs in Coolify for build errors
- Verify all environment variables are set
- Ensure `ENCRYPTION_KEY` and `DASHBOARD_API_SECRET` are set

### Database connection failed
- Verify `DATABASE_URL` is correctly formed
- Check that the `db` service is healthy
- Ensure `POSTGRES_PASSWORD` matches in both `db` and `web` services

### Health check failing
- Wait 30-60 seconds for the first Prisma migration to complete
- Check `web` service logs for migration errors
- Verify the database is accessible: `docker exec <web-container> wget -qO- http://localhost:3000/api/health`

### SSL not working
- Ensure your DNS A record points to the correct IP
- Check Coolify's SSL certificate status
- Try re-requesting the certificate in Coolify

## Security Checklist

- [ ] `ENCRYPTION_KEY` is a strong random string (64 hex chars)
- [ ] `DASHBOARD_API_SECRET` is a strong random string (64 hex chars)
- [ ] `POSTGRES_PASSWORD` is strong and unique
- [ ] `.env` files are not committed to git
- [ ] SSL is enabled (Coolify handles this automatically)
- [ ] Database port (5432) is not exposed to the internet
- [ ] Security headers are configured (Caddy/Coolify handles this)

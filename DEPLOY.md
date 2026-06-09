# Production Deployment Guide (Coolify)

This guide walks you through deploying the AI Code Reviewer platform to your Coolify server.

## Prerequisites

- A running Coolify instance
- A server connected to Coolify
- A domain name pointed to your server's IP
- A PostgreSQL database (Coolify managed or external)
- GitHub repository pushed to a remote (GitHub, GitLab, etc.)

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Coolify   │────▶│  SvelteKit   │────▶│  PostgreSQL │
│   Proxy     │     │  Web App     │     │  (Managed)  │
│   + SSL     │     │  (Docker)    │     │             │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  AI Provider │
                    │  (OpenAI,    │
                    │   Claude,    │
                    │   OpenRouter)│
                    └─────────────┘
```

## Step 1: Set Up PostgreSQL

### Option A: Coolify Managed Database (Recommended)

1. In Coolify, go to **"Databases"** → **"New Database"**
2. Select **PostgreSQL**
3. Coolify will provision a database and provide a connection string
4. Copy the connection string — it looks like:
   ```
   postgresql://postgres:password@host:5432/postgres
   ```

### Option B: External Database

If you have an external PostgreSQL instance, ensure:
- It accepts connections from your Coolify server
- You have the full connection string with credentials

## Step 2: Generate Secrets

Generate strong random values for the encryption keys:

```bash
# Generate ENCRYPTION_KEY
openssl rand -hex 32

# Generate DASHBOARD_API_SECRET
openssl rand -hex 32
```

## Step 3: Configure Environment Variables in Coolify

In your Coolify dashboard, create a new resource (Docker Compose) and set these environment variables:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Full PostgreSQL connection string from Step 1 | Yes |
| `ENCRYPTION_KEY` | `<64-char hex string>` | Yes |
| `DASHBOARD_API_SECRET` | `<64-char hex string>` | Yes |
| `ORIGIN` | `https://your-domain.com` | Yes |
| `NODE_ENV` | `production` | Yes |

## Step 4: Deploy via Coolify

### Option A: Using GitHub Repository (Recommended)

1. In Coolify, click **"New Resource"** → **"Docker Compose"**
2. Select **"From Git"** and connect your repository
3. Set the branch to `main` (or your default branch)
4. Set the **Docker Compose File Location** to `docker-compose.prod.yml`
5. Add all environment variables from Step 3
6. Click **"Deploy"**

### Option B: Using Raw Docker Compose

1. In Coolify, click **"New Resource"** → **"Docker Compose"**
2. Select **"Raw Docker Compose"**
3. Paste the contents of `docker-compose.prod.yml`
4. Add all environment variables from Step 3
5. Click **"Deploy"**

## Step 5: Configure Domain & SSL

1. In Coolify, go to your web service settings
2. Set the domain to your desired domain (e.g., `reviewer.yourdomain.com`)
3. Coolify will automatically provision an SSL certificate via Let's Encrypt
4. Ensure your DNS A record points to your server's IP

## Step 6: Verify Deployment

1. Check the service health: `https://your-domain.com/api/health`
   - Should return: `{"status":"healthy","database":"connected",...}`
2. Access the dashboard: `https://your-domain.com`
3. Check Coolify logs for any errors

## Step 7: Initial Setup

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

For Coolify managed databases, backups are handled automatically. For external databases:

```bash
pg_dump -h <host> -U <user> -d <database> > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Container won't start
- Check logs in Coolify for build errors
- Verify all environment variables are set
- Ensure `ENCRYPTION_KEY` and `DASHBOARD_API_SECRET` are set

### Database connection failed
- Verify `DATABASE_URL` is correctly formed and accessible from the container
- Check that the database host allows connections from the Coolify server IP
- Test the connection string locally: `psql "your_connection_string" -c "SELECT 1"`

### Health check failing
- Wait 30-60 seconds for the first Prisma migration to complete
- Check `web` service logs for migration errors
- Verify the database is accessible from within the container

### SSL not working
- Ensure your DNS A record points to the correct IP
- Check Coolify's SSL certificate status
- Try re-requesting the certificate in Coolify

## Security Checklist

- [ ] `ENCRYPTION_KEY` is a strong random string (64 hex chars)
- [ ] `DASHBOARD_API_SECRET` is a strong random string (64 hex chars)
- [ ] `.env` files are not committed to git
- [ ] SSL is enabled (Coolify handles this automatically)
- [ ] Database is not publicly accessible (only from Coolify server)
- [ ] Security headers are configured (Coolify handles this)

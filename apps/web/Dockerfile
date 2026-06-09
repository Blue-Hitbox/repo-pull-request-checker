# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:22-alpine AS installer

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/ai-core/package.json ./packages/ai-core/
COPY apps/cli/package.json ./apps/cli/

# Install all dependencies (including dev for build)
RUN npm ci

# ============================================
# Stage 2: Build the application
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy installed dependencies from installer
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=installer /app/packages/ai-core/node_modules ./packages/ai-core/node_modules
COPY --from=installer /app/apps/cli/node_modules ./apps/cli/node_modules

# Copy all source files
COPY . .

# Generate Prisma client
RUN cd apps/web && npx prisma generate

# Build all workspaces (ai-core first, then web)
RUN npm run build --workspace=@ai-reviewer/core
RUN npm run build --workspace=web

# ============================================
# Stage 3: Production image
# ============================================
FROM node:22-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy production root package.json
COPY package.json ./

# Copy production workspace package.json files
COPY apps/web/package.json ./apps/web/
COPY packages/ai-core/package.json ./packages/ai-core/

# Install production dependencies (keep prisma CLI for migrations)
RUN npm ci && \
    npm cache clean --force

# Copy built assets from builder
COPY --from=builder /app/packages/ai-core/dist ./packages/ai-core/dist
COPY --from=builder /app/apps/web/.svelte-kit ./apps/web/.svelte-kit
COPY --from=builder /app/apps/web/build ./apps/web/build
COPY --from=builder /app/apps/web/prisma ./apps/web/prisma

# Copy Prisma client (generated)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy source files needed at runtime
COPY --from=builder /app/apps/web/src ./apps/web/src
COPY --from=builder /app/apps/web/static ./apps/web/static
COPY --from=builder /app/apps/web/vite.config.ts ./apps/web/
COPY --from=builder /app/apps/web/svelte.config.js ./apps/web/
COPY --from=builder /app/apps/web/tsconfig.json ./apps/web/

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Copy and make startup script executable
COPY apps/web/start.sh /start.sh
RUN chmod +x /start.sh

# Run migrations and start the app
CMD ["/start.sh"]

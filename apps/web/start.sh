#!/bin/sh
set -e

echo "Running Prisma migrations..."
cd /app/apps/web
npx prisma migrate deploy

echo "Starting application..."
exec node build/index.js

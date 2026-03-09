#!/bin/sh
set -e

echo "Starting database migrations..."
cd /app
npx drizzle-kit migrate --config ./dist/drizzle.config.js
echo "Migrations completed successfully!"
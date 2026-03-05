#!/bin/sh
set -e

echo "Starting database migrations..."
# Run migrations
npx drizzle-kit migrate --config ./dist/drizzle.config.js

echo "Migrations completed successfully!"

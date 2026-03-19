#!/bin/sh
set -e

# ==========================================
# Step 1: Run database migrations
# ==========================================
# echo "Running database migrations..."
# sh /app/deployment/migration.sh

# ==========================================
# Step 2: Start the application
# ==========================================
echo "Starting application..."
exec "$@"
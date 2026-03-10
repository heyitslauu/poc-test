#!/bin/sh
set -e

echo "Running database migrations..."
sh /app/deployment/migration.sh

echo "Starting application..."
exec "$@"
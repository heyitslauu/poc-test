#!/bin/sh
set -e

# ==========================================
# Step 0: Download Amazon RDS CA cert at runtime
# ==========================================
# mkdir -p /app/certs
# if [ ! -f /app/certs/rds-ca.pem ]; then
#   echo "Downloading Amazon RDS CA certificate..."
#   wget -q -O /app/certs/rds-ca.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
# fi

# ==========================================
# Step 1: Run database migrations
# ==========================================
echo "Running database migrations..."
sh /app/deployment/migration.sh

# ==========================================
# Step 2: Start the application
# ==========================================
echo "Starting application..."
exec "$@"
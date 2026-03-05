#!/bin/bash

# ======================================================
# backup-logs.sh
# Syncs log files to S3 bucket
# ======================================================

set -e

# Load environment variables from .env file
ENV_FILE="/home/empowerx/empowerx-fsds-api/.env"

if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

# Configuration
LOGS_DIR="/home/empowerx/empowerx-fsds-api/logs"
S3_BUCKET="${AWS_BUCKET}"
S3_PREFIX="${AWS_S3_PREFIX}"
AWS_REGION="${AWS_REGION}"

echo "========================================="
echo "Starting log backup to S3..."
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="
echo "Local logs: $LOGS_DIR"
echo "S3 destination: s3://$S3_BUCKET/$S3_PREFIX/"
echo "AWS Region: $AWS_REGION"
echo "========================================="

# Check if logs directory exists
if [ ! -d "$LOGS_DIR" ]; then
    echo "Error: Logs directory not found: $LOGS_DIR"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed"
    exit 1
fi

# Sync logs to S3
echo "Syncing logs to S3..."
aws s3 sync "$LOGS_DIR" "s3://$S3_BUCKET/$S3_PREFIX/" \
    --region "$AWS_REGION" \
    --exclude "*.tmp" \
    --exclude ".gitkeep" \
    --storage-class STANDARD_IA

if [ $? -eq 0 ]; then
    echo "✓ Log backup completed successfully"
    echo "Total files in logs directory: $(find "$LOGS_DIR" -type f -name "*.log" | wc -l)"
else
    echo "✗ Log backup failed"
    exit 1
fi

echo "========================================="
echo "Backup completed at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

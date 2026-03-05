#!/bin/sh

# ======================================================
# cleanup-logs.sh
# Deletes log files older than RETENTION_DAYS
# Works for multiple projects under BASE_DIR
# ======================================================

# Base directory where your API repos live
BASE_DIR="/home/empowerx"

# Retention period in days
RETENTION_DAYS=7

echo "========================================="
echo "Starting log cleanup..."
echo "Base path: $BASE_DIR"
echo "Retention period: $RETENTION_DAYS days"
echo "========================================="

# Find all 'logs' directories under BASE_DIR
find "$BASE_DIR" -type d -name "logs" | while read LOG_DIR; do
    echo "Processing logs folder: $LOG_DIR"

    # Find all .log files older than RETENTION_DAYS
    OLD_LOGS=$(find "$LOG_DIR" -type f -name "*.log" -mtime +$RETENTION_DAYS)

    if [ -z "$OLD_LOGS" ]; then
        echo "No old logs to delete in $LOG_DIR"
    else
        echo "Deleting the following logs:"
        echo "$OLD_LOGS"
        # Delete the files
        find "$LOG_DIR" -type f -name "*.log" -mtime +$RETENTION_DAYS -delete
    fi

    echo "-----------------------------------------"
done

echo "Log cleanup completed."
echo "========================================="
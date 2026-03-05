#!/bin/sh

BASE_DIR="/home/empowerx/db_backups"
RETENTION_DAYS=7

echo "========================================="
echo "Starting database backup cleanup..."
echo "Base path: $BASE_DIR"
echo "Retention period: $RETENTION_DAYS days"
echo "========================================="

find "$BASE_DIR" -mindepth 1 -maxdepth 1 -type d | while read DIR; do
    echo "Processing project directory: $DIR"

    if find "$DIR" -type f -name "*.sql.gz" -mtime +"$RETENTION_DAYS" | grep -q .; then
        echo "Deleting the following backups:"
        find "$DIR" -type f -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -print -delete
    else
        echo "No old backups to delete in $DIR"
    fi

    echo "-----------------------------------------"
done

echo "Database backup cleanup completed."
echo "========================================="

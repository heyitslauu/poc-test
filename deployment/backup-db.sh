#!/bin/bash
set -e

# Source the .env file
echo "Sourcing environment variables..."
source .env

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROJECT_NAME=${APP_NAME:-empowerex-fsds-api}
DB_BACKUP_PATH=${DB_BACKUP_PATH:-/home/empowerx/db_backups/fsds}
DOCKER_SERVICE_DB=${DOCKER_SERVICE_DB:-empowerex-fsds-db}
BACKUP_FILE="${NODE_ENV}_${PROJECT_NAME}_${TIMESTAMP}.sql.gz"
BACKUP_FILE_FULL_PATH="$DB_BACKUP_PATH/$BACKUP_FILE"
S3_BUCKET_LOCATION="s3://$AWS_BUCKET/database/$NODE_ENV"
BACKUP_DB_TO_S3=${BACKUP_DB_TO_S3:-false}

echo "DB_BACKUP_PATH: $DB_BACKUP_PATH"
echo "DOCKER_SERVICE_DB: $DOCKER_SERVICE_DB"
echo "NODE_ENV: $NODE_ENV"

echo "Running remote backup..."
mkdir -p "$DB_BACKUP_PATH"
chmod 775 $DB_BACKUP_PATH
chown -R $DEPLOY_USER:$DEPLOY_USER $DB_BACKUP_PATH
chmod -R u+w $DB_BACKUP_PATH

if docker ps -a --format "{{.Names}}" | grep -Fx "$DOCKER_SERVICE_DB"; then
    echo "Backing up PostgreSQL database from Docker service $DOCKER_SERVICE_DB..."
    if docker exec "$DOCKER_SERVICE_DB" sh -c "export PGPASSWORD=$POSTGRES_PASSWORD; pg_dump -U $POSTGRES_USER $POSTGRES_DB" | gzip > "$BACKUP_FILE_FULL_PATH"; then
        echo "Backup completed: $BACKUP_FILE_FULL_PATH"
    else
        echo "Backup failed."
        exit 1
    fi

    if [ "$BACKUP_DB_TO_S3" = true ]; then
        echo "Uploading backup to S3 bucket..."
        docker run --rm -v $DB_BACKUP_PATH:/database \
                -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
                -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
                -e AWS_DEFAULT_REGION=$AWS_REGION \
                amazon/aws-cli \
                s3 cp /database/$BACKUP_FILE $S3_BUCKET_LOCATION/$BACKUP_FILE

        echo "Backup uploaded to S3 bucket: $S3_BUCKET_LOCATION/$BACKUP_FILE"
    else
        echo "📦 Skipping S3 upload (BACKUP_DB_TO_S3=$BACKUP_DB_TO_S3)"
    fi
else
    echo "No backup — Docker container $DOCKER_SERVICE_DB not found."
fi

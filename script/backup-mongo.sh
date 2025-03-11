#!/bin/bash

# Load environment variables
ENV_FILE="../.env.development"
if [ "$ENV" == "production" ]; then
    ENV_FILE="../.env.production"
fi


# Define variables
DB_NAME="bulkdid"
BACKUP_DIR="$(pwd)/backups/db"
TIMESTAMP=$(date +"%Y-%m-%d")  # Daily format by default

# Adjust timestamp format based on frequency
if [[ "$BACKUP_FQ" == "monthly" ]]; then
    TIMESTAMP=$(date +"%Y-%m")
elif [[ "$BACKUP_FQ" == "weekly" ]]; then
    TIMESTAMP=$(date +"%Y-%m-week%U")
fi

# Create backup directory if it does not exist
mkdir -p "$BACKUP_DIR"

# Run mongodump
mongodump --db "$DB_NAME" --out "$BACKUP_DIR/$TIMESTAMP"

# Compress the backup
tar -czf "$BACKUP_DIR/$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "$TIMESTAMP"

# Remove the uncompressed backup folder
rm -rf "$BACKUP_DIR/$TIMESTAMP"

echo "Backup completed: $BACKUP_DIR/$TIMESTAMP.tar.gz"

# Define variables
$DB_NAME = "bulkdid"
$BACKUP_DIR = "$PSScriptRoot\..\backups"
$TIMESTAMP = (Get-Date -Format "yyyy-MM")

# Create backup directory if it does not exist
if (!(Test-Path -Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

# Run mongodump
$BACKUP_PATH = "$BACKUP_DIR\$TIMESTAMP"
mongodump --db $DB_NAME --out $BACKUP_PATH

# Compress the backup
$ZIP_FILE = "$BACKUP_DIR\$TIMESTAMP.zip"
Compress-Archive -Path "$BACKUP_PATH\*" -DestinationPath $ZIP_FILE -Force

# Remove the uncompressed backup folder
Remove-Item -Recurse -Force $BACKUP_PATH

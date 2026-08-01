#!/bin/bash
set -euo pipefail
umask 077

exec 9>/run/lock/legitorganic-backup.lock
flock -n 9 || {
    echo "Another Legit Organic backup is already running" >&2
    exit 1
}

BACKUP_DIR=/var/backups/legitorganic
MEDIA_DIR=/var/www/legitorganic/backend/media
TIMESTAMP=$(date -u +%Y-%m-%d_%H-%M)
DB_BACKUP="$BACKUP_DIR/db_$TIMESTAMP.sql.gz"
MEDIA_BACKUP="$BACKUP_DIR/media_$TIMESTAMP.tar.gz"
DB_TMP="$DB_BACKUP.tmp"
MEDIA_TMP="$MEDIA_BACKUP.tmp"

cleanup() {
    rm -f "$DB_TMP" "$MEDIA_TMP"
}
trap cleanup EXIT

install -d -o root -g root -m 700 "$BACKUP_DIR"

pg_dump -h localhost -p 5433 -U legitorganic_user legitorganic | gzip -9 > "$DB_TMP"
test -s "$DB_TMP"
gzip -t "$DB_TMP"
mv "$DB_TMP" "$DB_BACKUP"

tar -C "$(dirname "$MEDIA_DIR")" -czf "$MEDIA_TMP" "$(basename "$MEDIA_DIR")"
test -s "$MEDIA_TMP"
gzip -t "$MEDIA_TMP"
mv "$MEDIA_TMP" "$MEDIA_BACKUP"

find "$BACKUP_DIR" -maxdepth 1 -type f \
    \( -name 'db_*.sql.gz' -o -name 'media_*.tar.gz' \) \
    -mtime +14 -delete

echo "Backup completed: $DB_BACKUP"
echo "Backup completed: $MEDIA_BACKUP"

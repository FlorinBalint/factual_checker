#!/bin/bash

# Daily Politician Stats Update Script
# This script generates new politician stats and pushes them to the repository

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="$PROJECT_DIR/app"
DASHBOARD_DIR="$PROJECT_DIR/dashboard"
CSV_FILE="$DASHBOARD_DIR/politician_stats.csv"
LOG_FILE="$PROJECT_DIR/logs/update_$(date +%Y%m%d).log"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Starting politician stats update ==="

# Change to project directory
cd "$PROJECT_DIR"

# Check if git repo is clean
if ! git diff --quiet HEAD; then
    log "WARNING: Git repository has uncommitted changes"
    git status
fi

# Pull latest changes
log "Pulling latest changes from remote..."
if ! git pull origin main; then
    log "ERROR: Failed to pull latest changes"
    exit 1
fi

# Change to app directory and generate new CSV
log "Generating new politician stats..."
cd "$APP_DIR"

# Backup existing CSV if it exists
if [ -f "$CSV_FILE" ]; then
    # Create backups directory if it doesn't exist
    BACKUP_DIR="$DASHBOARD_DIR/backups"
    mkdir -p "$BACKUP_DIR"
    
    # Move backup to backups directory
    cp "$CSV_FILE" "$BACKUP_DIR/politician_stats.csv.backup.$(date +%Y%m%d_%H%M%S)"
    log "Backed up existing CSV file to backups directory"
fi

# Generate new stats with error handling
# Enable debug mode and capture all output (stdout + stderr) to log
log "Running crawler with debug mode enabled..."
if python3 main.py --output "../dashboard/politician_stats.csv" --generate_party_stats false --workers 3 --debug true 2>&1 | tee -a "$LOG_FILE"; then
    log "Successfully generated new politician stats"
else
    exit_code=${PIPESTATUS[0]}
    log "ERROR: Failed to generate politician stats (exit code: $exit_code)"
    # Restore backup if generation failed and backup exists
    BACKUP_DIR="$DASHBOARD_DIR/backups"
    if [ -d "$BACKUP_DIR" ]; then
        latest_backup=$(ls -t "$BACKUP_DIR"/politician_stats.csv.backup.* 2>/dev/null | head -n1)
        if [ -n "$latest_backup" ] && [ -f "$latest_backup" ]; then
            cp "$latest_backup" "$CSV_FILE"
            log "Restored backup CSV file: $(basename "$latest_backup")"
        fi
    fi
    exit 1
fi

# Verify CSV file was created and has content
if [ ! -f "$CSV_FILE" ] || [ ! -s "$CSV_FILE" ]; then
    log "ERROR: CSV file was not created or is empty"
    exit 1
fi

# --- Safety check: detect politician count drop ---
NEW_COUNT=$(tail -n +2 "$CSV_FILE" | grep -c '[^[:space:]]' || true)
log "New politician count: $NEW_COUNT"

# Get the old count from the backup
BACKUP_DIR="$DASHBOARD_DIR/backups"
OLD_COUNT=0
if [ -d "$BACKUP_DIR" ]; then
    latest_backup=$(ls -t "$BACKUP_DIR"/politician_stats.csv.backup.* 2>/dev/null | head -n1)
    if [ -n "$latest_backup" ] && [ -f "$latest_backup" ]; then
        OLD_COUNT=$(tail -n +2 "$latest_backup" | grep -c '[^[:space:]]' || true)
        log "Previous politician count: $OLD_COUNT"
    fi
fi

# Allow up to 10% drop (some politicians/posts may legitimately be removed)
if [ "$OLD_COUNT" -gt 0 ]; then
    MAX_ALLOWED_DROP=$(( OLD_COUNT * 10 / 100 ))
    DROP=$(( OLD_COUNT - NEW_COUNT ))
    if [ "$DROP" -gt "$MAX_ALLOWED_DROP" ]; then
        log "ERROR: Politician count DROPPED by $DROP (from $OLD_COUNT to $NEW_COUNT), exceeds 10% threshold ($MAX_ALLOWED_DROP). Aborting to prevent data loss."
        log "Restoring backup..."
        if [ -n "$latest_backup" ] && [ -f "$latest_backup" ]; then
            cp "$latest_backup" "$CSV_FILE"
            log "Restored backup: $(basename "$latest_backup")"
        fi
        exit 1
    elif [ "$DROP" -gt 0 ]; then
        log "WARNING: Politician count dropped by $DROP (from $OLD_COUNT to $NEW_COUNT), within 10% threshold. Proceeding."
    fi
fi

# Check if there are actual changes
cd "$PROJECT_DIR"
if git diff --quiet "$CSV_FILE"; then
    log "No changes detected in politician stats"
    exit 0
fi

# Show changes summary
log "Changes detected:"
echo "Lines in new file: $(wc -l < "$CSV_FILE")"
git diff --stat "$CSV_FILE"

# Add and commit changes
log "Committing changes to git..."
git add "$CSV_FILE"

# Also add party_politician_stats.csv if it changed
PARTY_CSV_FILE="$PROJECT_DIR/party_politician_stats.csv"
if [ -f "$PARTY_CSV_FILE" ] && ! git diff --quiet "$PARTY_CSV_FILE" 2>/dev/null; then
    git add "$PARTY_CSV_FILE"
fi

# Create commit message with stats
COMMIT_MSG="Auto-update politician stats data - $(date '+%Y-%m-%d %H:%M')"
STATS_INFO="$(wc -l < "$CSV_FILE") politicians analyzed"

if git commit -m "$COMMIT_MSG" -m "$STATS_INFO"; then
    log "Successfully committed changes"
else
    log "ERROR: Failed to commit changes"
    exit 1
fi

# Push to remote
log "Pushing changes to remote repository..."
if git push origin main; then
    log "Successfully pushed changes to remote"
else
    log "ERROR: Failed to push changes to remote"
    exit 1
fi

# Clean up old backups (keep only last 7 days)
find "$DASHBOARD_DIR/backups" -name "politician_stats.csv.backup.*" -type f -mtime +7 -delete 2>/dev/null || true

# Clean up old logs (keep only last 30 days)
find "$PROJECT_DIR/logs" -name "update_*.log" -type f -mtime +30 -delete 2>/dev/null || true
find "$PROJECT_DIR/logs" -name "crawler_*.log" -type f -mtime +30 -delete 2>/dev/null || true

log "=== Politician stats update completed successfully ==="
log "Dashboard available at: https://$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\)\/\([^/]*\)\.git/\1.github.io\/\2/')/dashboard/political_dashboard.html"

# List the most recent crawler debug log
latest_crawler_log=$(ls -t "$PROJECT_DIR/logs"/crawler_*.log 2>/dev/null | head -n1)
if [ -n "$latest_crawler_log" ]; then
    log "Detailed crawler log: $latest_crawler_log"
fi
#!/bin/bash

# Rollback the latest auto-update run
# Reverts the last auto-update commit, commits the revert, and pushes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Find the latest auto-update commit
LATEST_AUTO_COMMIT=$(git log --oneline --grep="Auto-update politician stats data" -1 --format="%H")

if [ -z "$LATEST_AUTO_COMMIT" ]; then
    echo "ERROR: No auto-update commit found to rollback"
    exit 1
fi

COMMIT_MSG=$(git log --format="%s" -1 "$LATEST_AUTO_COMMIT")
COMMIT_DATE=$(git log --format="%ci" -1 "$LATEST_AUTO_COMMIT")

echo "Found latest auto-update commit:"
echo "  Hash: $LATEST_AUTO_COMMIT"
echo "  Message: $COMMIT_MSG"
echo "  Date: $COMMIT_DATE"
echo ""

# Check if HEAD is this commit (simple case) or if there are commits on top
HEAD_HASH=$(git rev-parse HEAD)
if [ "$HEAD_HASH" != "$LATEST_AUTO_COMMIT" ]; then
    echo "WARNING: The latest auto-update commit is not HEAD."
    echo "  HEAD is: $(git log --oneline -1 HEAD)"
    echo "  Will use 'git revert' to safely undo it without affecting later commits."
    echo ""
fi

# Confirm with user
read -p "Rollback this commit? (y/N) " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Aborted."
    exit 0
fi

echo "Reverting commit..."
if git revert --no-edit "$LATEST_AUTO_COMMIT"; then
    echo "Successfully reverted auto-update commit"
else
    echo "ERROR: Revert failed. You may need to resolve conflicts manually."
    exit 1
fi

echo "Pushing rollback to remote..."
if git push origin main; then
    echo "Successfully pushed rollback to remote"
else
    echo "ERROR: Failed to push. Run 'git push origin main' manually."
    exit 1
fi

echo ""
echo "=== Rollback Complete ==="
echo "Reverted: $COMMIT_MSG"
echo "New HEAD: $(git log --oneline -1 HEAD)"

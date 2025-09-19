#!/bin/bash

# Setup script for daily politician stats cron job
# This script configures a cron job that survives reboots

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
UPDATE_SCRIPT="$SCRIPT_DIR/update_dashboard_data.sh"
CRON_USER="$(whoami)"

echo "Setting up daily politician stats update cron job..."

# Verify the update script exists and is executable
if [ ! -f "$UPDATE_SCRIPT" ]; then
    echo "ERROR: Update script not found at $UPDATE_SCRIPT"
    exit 1
fi

if [ ! -x "$UPDATE_SCRIPT" ]; then
    echo "Making update script executable..."
    chmod +x "$UPDATE_SCRIPT"
fi

# Create a wrapper script for cron outside project directory (handles environment variables)
# Use ~/.local/bin which is a standard location for user scripts
WRAPPER_DIR="$HOME/.local/bin"
mkdir -p "$WRAPPER_DIR"
CRON_WRAPPER="$WRAPPER_DIR/politician-stats-cron-wrapper.sh"
cat > "$CRON_WRAPPER" << EOF
#!/bin/bash

# Cron wrapper script for politician stats update
# This ensures proper environment is loaded for cron execution

# Set up environment
export PATH="/usr/local/bin:/usr/bin:/bin:\$HOME/.local/bin:\$PATH"
export HOME="$HOME"
export USER="$CRON_USER"

# Add Python path if needed
if [ -d "\$HOME/.local/bin" ]; then
    export PATH="\$HOME/.local/bin:\$PATH"
fi

# Source bashrc/profile for user environment
if [ -f "\$HOME/.bashrc" ]; then
    source "\$HOME/.bashrc"
fi

if [ -f "\$HOME/.profile" ]; then
    source "\$HOME/.profile"
fi

# Change to project directory
cd "$PROJECT_DIR"

# Activate virtual environment
VENV_PATH="$PROJECT_DIR/.venv"
if [ -f "\$VENV_PATH/bin/activate" ]; then
    source "\$VENV_PATH/bin/activate"
    echo "Activated virtual environment at \$VENV_PATH"
else
    echo "ERROR: Virtual environment not found at \$VENV_PATH"
    exit 1
fi

# Verify required packages are available
if ! python3 -c "import pyquery" 2>/dev/null; then
    echo "ERROR: Required Python packages not available. Please install requirements:"
    echo "cd $PROJECT_DIR && pip install -r requirements.txt"
    exit 1
fi

# Run the update script
exec "$UPDATE_SCRIPT"
EOF

chmod +x "$CRON_WRAPPER"

# Create cron job entry
CRON_ENTRY="0 20 * * * $CRON_WRAPPER"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "politician-stats-cron-wrapper.sh"; then
    echo "Cron job already exists. Updating..."
    # Remove existing entry and add new one
    crontab -l 2>/dev/null | grep -v "politician-stats-cron-wrapper.sh" | crontab -
fi

# Add new cron job
echo "Adding cron job to run daily at 20:00 ..."
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

# Verify cron job was added
echo "Current cron jobs for user $CRON_USER:"
crontab -l | grep -E "(update_dashboard|politician-stats-cron-wrapper)" || echo "No matching cron jobs found"

# Create systemd user service for additional reliability (optional)
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
if command -v systemctl >/dev/null 2>&1; then
    echo "Creating systemd user service for additional reliability..."
    
    mkdir -p "$SYSTEMD_USER_DIR"
    
    # Create service file
    cat > "$SYSTEMD_USER_DIR/politician-stats-update.service" << EOF
[Unit]
Description=Daily Politician Stats Update
After=network-online.target

[Service]
Type=oneshot
ExecStart=$CRON_WRAPPER
WorkingDirectory=$PROJECT_DIR
User=$CRON_USER
Environment=HOME=$HOME
Environment=PATH=/usr/local/bin:/usr/bin:/bin:$HOME/.local/bin

[Install]
WantedBy=default.target
EOF

    # Create timer file
    cat > "$SYSTEMD_USER_DIR/politician-stats-update.timer" << EOF
[Unit]
Description=Daily Politician Stats Update Timer
Requires=politician-stats-update.service

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=1800

[Install]
WantedBy=timers.target
EOF

    # Reload systemd and enable timer
    systemctl --user daemon-reload
    systemctl --user enable politician-stats-update.timer
    systemctl --user start politician-stats-update.timer
    
    echo "Systemd user timer created and enabled"
    echo "Timer status:"
    systemctl --user status politician-stats-update.timer --no-pager
else
    echo "Systemd not available, relying on cron only"
fi

# Create startup script to ensure cron is running
STARTUP_SCRIPT="$HOME/.local/bin/ensure-politician-stats-cron.sh"
cat > "$STARTUP_SCRIPT" << EOF
#!/bin/bash

# Ensure cron service is running and our job is scheduled
# This script can be added to startup applications

# Start cron service if not running
if ! pgrep -x "cron" > /dev/null && ! pgrep -x "crond" > /dev/null; then
    echo "Starting cron service..."
    sudo service cron start 2>/dev/null || sudo service crond start 2>/dev/null || echo "Could not start cron service"
fi

# Verify our cron job exists
if ! crontab -l 2>/dev/null | grep -q "politician-stats-cron-wrapper.sh"; then
    echo "Re-adding politician stats cron job..."
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
fi

echo "Politician stats cron job verified"
EOF

chmod +x "$STARTUP_SCRIPT"

echo ""
echo "=== Setup Complete ==="
echo "✅ Cron job configured to run daily at 20:00"
echo "✅ Wrapper script created: $CRON_WRAPPER"
echo "✅ Startup script created: $STARTUP_SCRIPT"
echo "✅ Update script: $UPDATE_SCRIPT"

if command -v systemctl >/dev/null 2>&1; then
    echo "✅ Systemd timer enabled as backup"
fi

echo ""
echo "=== Manual Commands ==="
echo "Test update script: $UPDATE_SCRIPT"
echo "View cron jobs: crontab -l"
echo "Check logs: tail -f $PROJECT_DIR/logs/update_\$(date +%Y%m%d).log"

if command -v systemctl >/dev/null 2>&1; then
    echo "Check systemd timer: systemctl --user status politician-stats-update.timer"
fi

echo ""
echo "=== To ensure persistence across reboots ==="
echo "Add this to your startup applications or .bashrc:"
echo "$STARTUP_SCRIPT"

echo ""
echo "The script will run daily at 20:00 and:"
echo "- Generate new politician stats"
echo "- Commit changes to git"
echo "- Push to GitHub"
echo "- Update your dashboard automatically"
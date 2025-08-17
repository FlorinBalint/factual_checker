#!/bin/bash

# Install autostart configuration to ensure cron job persists across reboots
# This script sets up various methods to ensure the cron job survives system restarts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STARTUP_SCRIPT="$SCRIPT_DIR/ensure_cron_on_startup.sh"
USER_NAME="$(whoami)"

echo "Installing autostart configuration for politician stats update..."

# Method 1: XDG Autostart (for desktop environments)
AUTOSTART_DIR="$HOME/.config/autostart"
DESKTOP_FILE="$AUTOSTART_DIR/politician-stats-cron.desktop"

if [ "$XDG_CURRENT_DESKTOP" ]; then
    echo "Setting up XDG autostart for desktop environment: $XDG_CURRENT_DESKTOP"
    
    mkdir -p "$AUTOSTART_DIR"
    
    cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Type=Application
Name=Politician Stats Cron Checker
Comment=Ensure politician stats update cron job is active
Exec=$STARTUP_SCRIPT
Hidden=false
NoDisplay=true
X-GNOME-Autostart-enabled=true
StartupNotify=false
EOF
    
    echo "✅ Created XDG autostart entry: $DESKTOP_FILE"
fi

# Method 2: Add to .profile or .bashrc
PROFILE_ENTRY="# Politician Stats Auto-update - Ensure cron job exists
if [ -f \"$STARTUP_SCRIPT\" ] && [ \"\$(ps -o comm= -p \$\$)\" != \"cron\" ]; then
    \"$STARTUP_SCRIPT\" > /dev/null 2>&1 &
fi"

# Check if already added to .profile
if [ -f "$HOME/.profile" ]; then
    if ! grep -q "Politician Stats Auto-update" "$HOME/.profile"; then
        echo "" >> "$HOME/.profile"
        echo "$PROFILE_ENTRY" >> "$HOME/.profile"
        echo "✅ Added to ~/.profile"
    else
        echo "ℹ️  Already present in ~/.profile"
    fi
fi

# Method 3: User systemd service (if systemd is available)
if command -v systemctl >/dev/null 2>&1; then
    SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
    mkdir -p "$SYSTEMD_USER_DIR"
    
    # Create a service that ensures cron job exists on startup
    cat > "$SYSTEMD_USER_DIR/politician-stats-cron-ensure.service" << EOF
[Unit]
Description=Ensure Politician Stats Cron Job Exists
After=graphical-session.target

[Service]
Type=oneshot
ExecStart=$STARTUP_SCRIPT
RemainAfterExit=yes

[Install]
WantedBy=default.target
EOF

    # Enable the service
    systemctl --user daemon-reload
    systemctl --user enable politician-stats-cron-ensure.service
    
    echo "✅ Created and enabled systemd user service"
fi

# Method 4: Cron @reboot entry (backup method)
REBOOT_CRON_ENTRY="@reboot sleep 60 && $STARTUP_SCRIPT"

# Add @reboot entry if not exists
if ! crontab -l 2>/dev/null | grep -q "@reboot.*ensure_cron_on_startup"; then
    (crontab -l 2>/dev/null; echo "$REBOOT_CRON_ENTRY") | crontab -
    echo "✅ Added @reboot cron entry"
else
    echo "ℹ️  @reboot cron entry already exists"
fi

# Create a test script
TEST_SCRIPT="$SCRIPT_DIR/test_setup.sh"
cat > "$TEST_SCRIPT" << EOF
#!/bin/bash

echo "=== Testing Politician Stats Auto-update Setup ==="
echo ""

echo "1. Checking cron service status..."
if pgrep -x "cron" > /dev/null || pgrep -x "crond" > /dev/null; then
    echo "✅ Cron service is running"
else
    echo "❌ Cron service is not running"
fi

echo ""
echo "2. Checking cron jobs..."
if crontab -l 2>/dev/null | grep -q "update_dashboard_data"; then
    echo "✅ Daily update cron job exists:"
    crontab -l | grep "update_dashboard_data"
else
    echo "❌ Daily update cron job not found"
fi

if crontab -l 2>/dev/null | grep -q "@reboot.*ensure_cron"; then
    echo "✅ Reboot cron job exists"
else
    echo "❌ Reboot cron job not found"
fi

echo ""
echo "3. Checking autostart configurations..."

if [ -f "$DESKTOP_FILE" ]; then
    echo "✅ XDG autostart file exists"
else
    echo "ℹ️  XDG autostart file not created (no desktop environment?)"
fi

if grep -q "Politician Stats Auto-update" "$HOME/.profile" 2>/dev/null; then
    echo "✅ .profile entry exists"
else
    echo "❌ .profile entry not found"
fi

if command -v systemctl >/dev/null 2>&1; then
    if systemctl --user is-enabled politician-stats-cron-ensure.service >/dev/null 2>&1; then
        echo "✅ Systemd user service is enabled"
    else
        echo "❌ Systemd user service not enabled"
    fi
    
    if systemctl --user is-enabled politician-stats-update.timer >/dev/null 2>&1; then
        echo "✅ Systemd timer is enabled"
        echo "   Next run: \$(systemctl --user list-timers politician-stats-update.timer --no-pager | tail -n +2 | head -n 1 | awk '{print \$1, \$2}')"
    else
        echo "❌ Systemd timer not enabled"
    fi
fi

echo ""
echo "4. Testing update script..."
if [ -x "$SCRIPT_DIR/update_dashboard_data.sh" ]; then
    echo "✅ Update script is executable"
    echo "   Location: $SCRIPT_DIR/update_dashboard_data.sh"
else
    echo "❌ Update script not found or not executable"
fi

echo ""
echo "=== Test Complete ==="
echo ""
echo "To test the update manually:"
echo "$SCRIPT_DIR/update_dashboard_data.sh"
echo ""
echo "To view logs:"
echo "tail -f $PROJECT_DIR/logs/update_\$(date +%Y%m%d).log"
EOF

chmod +x "$TEST_SCRIPT"

echo ""
echo "=== Autostart Installation Complete ==="
echo ""
echo "Installed methods:"
[ -f "$DESKTOP_FILE" ] && echo "✅ XDG Autostart (desktop)"
grep -q "Politician Stats Auto-update" "$HOME/.profile" 2>/dev/null && echo "✅ Shell profile"
systemctl --user is-enabled politician-stats-cron-ensure.service >/dev/null 2>&1 && echo "✅ Systemd user service"
crontab -l 2>/dev/null | grep -q "@reboot.*ensure_cron" && echo "✅ @reboot cron entry"

echo ""
echo "=== Next Steps ==="
echo "1. Reboot your system to test autostart"
echo "2. Run test script: $TEST_SCRIPT"
echo "3. Check logs after reboot: tail -f $PROJECT_DIR/logs/update_\$(date +%Y%m%d).log"
echo ""
echo "The system will now automatically:"
echo "• Ensure cron jobs exist after each reboot"
echo "• Run daily politician stats updates at 20:00"
echo "• Push updates to GitHub automatically"
echo "• Keep your dashboard current"
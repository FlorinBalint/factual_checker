#!/bin/bash

# Install autostart configuration to ensure cron job persists across reboots
# This script sets up various methods to ensure the cron job survives system restarts
# Supports both Linux and macOS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
STARTUP_SCRIPT="$HOME/.local/bin/ensure-politician-stats-cron.sh"
USER_NAME="$(whoami)"

# Detect operating system
OS_TYPE="$(uname -s)"
case "$OS_TYPE" in
    Linux*)     OS="Linux";;
    Darwin*)    OS="macOS";;
    *)          OS="Unknown";;
esac

echo "Installing autostart configuration for politician stats update..."
echo "Detected OS: $OS"

# Method 1: XDG Autostart (for Linux desktop environments only)
if [ "$OS" = "Linux" ]; then
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
fi

# Method 2: Add to .profile, .bashrc, or .zshrc (macOS typically uses .zshrc)
PROFILE_ENTRY="# Politician Stats Auto-update - Ensure cron job exists
if [ -f \"$STARTUP_SCRIPT\" ] && [ \"\$(ps -o comm= -p \$\$)\" != \"cron\" ]; then
    \"$STARTUP_SCRIPT\" > /dev/null 2>&1 &
fi"

# Determine which profile file to use
if [ "$OS" = "macOS" ]; then
    # macOS uses zsh by default since Catalina
    PROFILE_FILE="$HOME/.zshrc"
    if [ ! -f "$PROFILE_FILE" ] && [ -f "$HOME/.bash_profile" ]; then
        PROFILE_FILE="$HOME/.bash_profile"
    fi
else
    # Linux typically uses .profile or .bashrc
    PROFILE_FILE="$HOME/.profile"
    if [ ! -f "$PROFILE_FILE" ] && [ -f "$HOME/.bashrc" ]; then
        PROFILE_FILE="$HOME/.bashrc"
    fi
fi

# Check if already added to profile
if [ -f "$PROFILE_FILE" ]; then
    if ! grep -q "Politician Stats Auto-update" "$PROFILE_FILE"; then
        echo "" >> "$PROFILE_FILE"
        echo "$PROFILE_ENTRY" >> "$PROFILE_FILE"
        echo "✅ Added to $PROFILE_FILE"
    else
        echo "ℹ️  Already present in $PROFILE_FILE"
    fi
else
    echo "ℹ️  No profile file found, skipping profile entry"
fi

# Method 3: User systemd service (Linux only)
if [ "$OS" = "Linux" ] && command -v systemctl >/dev/null 2>&1; then
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

# Method 4: Cron @reboot entry (both Linux and macOS)
REBOOT_CRON_ENTRY="@reboot sleep 60 && $STARTUP_SCRIPT"

# Add @reboot entry if not exists
if ! crontab -l 2>/dev/null | grep -q "@reboot.*ensure-politician-stats-cron"; then
    (crontab -l 2>/dev/null; echo "$REBOOT_CRON_ENTRY") | crontab -
    echo "✅ Added @reboot cron entry"
else
    echo "ℹ️  @reboot cron entry already exists"
fi

# Method 5: macOS LaunchAgent (macOS only)
if [ "$OS" = "macOS" ]; then
    LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
    mkdir -p "$LAUNCH_AGENTS_DIR"
    PLIST_FILE="$LAUNCH_AGENTS_DIR/com.factualchecker.cron-ensure.plist"

    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.factualchecker.cron-ensure</string>
    <key>ProgramArguments</key>
    <array>
        <string>$STARTUP_SCRIPT</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$PROJECT_DIR/logs/cron-ensure.log</string>
    <key>StandardErrorPath</key>
    <string>$PROJECT_DIR/logs/cron-ensure-error.log</string>
</dict>
</plist>
EOF

    # Load the LaunchAgent
    launchctl unload "$PLIST_FILE" 2>/dev/null || true
    launchctl load "$PLIST_FILE"

    echo "✅ macOS LaunchAgent created to ensure cron job on startup"
fi

# Create a test script
TEST_SCRIPT="$SCRIPT_DIR/test_setup.sh"
cat > "$TEST_SCRIPT" << 'TEST_EOF'
#!/bin/bash

# Detect OS
OS_TYPE="$(uname -s)"
case "$OS_TYPE" in
    Linux*)     OS="Linux";;
    Darwin*)    OS="macOS";;
    *)          OS="Unknown";;
esac

echo "=== Testing Politician Stats Auto-update Setup ==="
echo "OS: $OS"
echo ""

echo "1. Checking cron service status..."
if [ "$OS" = "macOS" ]; then
    echo "✅ macOS - cron is managed by launchd (always available)"
elif pgrep -x "cron" > /dev/null || pgrep -x "crond" > /dev/null; then
    echo "✅ Cron service is running"
else
    echo "❌ Cron service is not running"
fi
TEST_EOF
cat >> "$TEST_SCRIPT" << EOF

echo ""
echo "2. Checking cron jobs..."
if crontab -l 2>/dev/null | grep -q "update_dashboard_data"; then
    echo "✅ Daily update cron job exists:"
    crontab -l | grep "update_dashboard_data"
else
    echo "❌ Daily update cron job not found"
fi

if crontab -l 2>/dev/null | grep -q "@reboot.*ensure-politician-stats-cron"; then
    echo "✅ Reboot cron job exists"
else
    echo "❌ Reboot cron job not found"
fi

echo ""
echo "3. Checking autostart configurations..."

if [ "\$OS" = "Linux" ]; then
    if [ -f "$DESKTOP_FILE" ]; then
        echo "✅ XDG autostart file exists"
    else
        echo "ℹ️  XDG autostart file not created (no desktop environment?)"
    fi

    if grep -q "Politician Stats Auto-update" "$HOME/.profile" 2>/dev/null || grep -q "Politician Stats Auto-update" "$HOME/.bashrc" 2>/dev/null; then
        echo "✅ Shell profile entry exists"
    else
        echo "❌ Shell profile entry not found"
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
elif [ "\$OS" = "macOS" ]; then
    if grep -q "Politician Stats Auto-update" "$HOME/.zshrc" 2>/dev/null || grep -q "Politician Stats Auto-update" "$HOME/.bash_profile" 2>/dev/null; then
        echo "✅ Shell profile entry exists"
    else
        echo "❌ Shell profile entry not found"
    fi

    if launchctl list | grep -q "com.factualchecker.cron-ensure"; then
        echo "✅ macOS LaunchAgent (cron-ensure) is loaded"
    else
        echo "❌ macOS LaunchAgent (cron-ensure) not loaded"
    fi

    if launchctl list | grep -q "com.factualchecker.politicianstats"; then
        echo "✅ macOS LaunchAgent (politicianstats) is loaded"
    else
        echo "ℹ️  macOS LaunchAgent (politicianstats) not loaded (run setup_cron.sh)"
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
echo "Installed methods for $OS:"

if [ "$OS" = "Linux" ]; then
    [ -f "$DESKTOP_FILE" ] && echo "✅ XDG Autostart (desktop)"
    grep -q "Politician Stats Auto-update" "$HOME/.profile" 2>/dev/null && echo "✅ Shell profile (.profile)"
    grep -q "Politician Stats Auto-update" "$HOME/.bashrc" 2>/dev/null && echo "✅ Shell profile (.bashrc)"
    systemctl --user is-enabled politician-stats-cron-ensure.service >/dev/null 2>&1 && echo "✅ Systemd user service"
elif [ "$OS" = "macOS" ]; then
    grep -q "Politician Stats Auto-update" "$HOME/.zshrc" 2>/dev/null && echo "✅ Shell profile (.zshrc)"
    grep -q "Politician Stats Auto-update" "$HOME/.bash_profile" 2>/dev/null && echo "✅ Shell profile (.bash_profile)"
    launchctl list | grep -q "com.factualchecker.cron-ensure" 2>/dev/null && echo "✅ macOS LaunchAgent (cron-ensure)"
fi

crontab -l 2>/dev/null | grep -q "@reboot.*ensure-politician-stats-cron" && echo "✅ @reboot cron entry"

echo ""
echo "=== Next Steps ==="
echo "1. Reboot your system to test autostart"
echo "2. Run test script: $TEST_SCRIPT"
echo "3. Check logs after reboot: tail -f $PROJECT_DIR/logs/update_\$(date +%Y%m%d).log"

if [ "$OS" = "macOS" ]; then
    echo "4. For macOS: Check LaunchAgent logs: tail -f $PROJECT_DIR/logs/cron-ensure.log"
fi

echo ""
echo "The system will now automatically:"
echo "• Ensure cron jobs exist after each reboot"
echo "• Run daily politician stats updates at 20:00"
echo "• Push updates to GitHub automatically"
echo "• Keep your dashboard current"
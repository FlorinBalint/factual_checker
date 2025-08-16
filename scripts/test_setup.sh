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

if [ -f "/home/florin/.config/autostart/politician-stats-cron.desktop" ]; then
    echo "✅ XDG autostart file exists"
else
    echo "ℹ️  XDG autostart file not created (no desktop environment?)"
fi

if grep -q "Politician Stats Auto-update" "/home/florin/.profile" 2>/dev/null; then
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
        echo "   Next run: $(systemctl --user list-timers politician-stats-update.timer --no-pager | tail -n +2 | head -n 1 | awk '{print $1, $2}')"
    else
        echo "❌ Systemd timer not enabled"
    fi
fi

echo ""
echo "4. Testing update script..."
if [ -x "/home/florin/Work/Repos/python/factual_checker/scripts/update_dashboard_data.sh" ]; then
    echo "✅ Update script is executable"
    echo "   Location: /home/florin/Work/Repos/python/factual_checker/scripts/update_dashboard_data.sh"
else
    echo "❌ Update script not found or not executable"
fi

echo ""
echo "=== Test Complete ==="
echo ""
echo "To test the update manually:"
echo "/home/florin/Work/Repos/python/factual_checker/scripts/update_dashboard_data.sh"
echo ""
echo "To view logs:"
echo "tail -f /logs/update_$(date +%Y%m%d).log"

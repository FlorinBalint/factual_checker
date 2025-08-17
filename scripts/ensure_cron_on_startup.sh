#!/bin/bash

# Ensure cron service is running and our job is scheduled
# This script can be added to startup applications

# Start cron service if not running
if ! pgrep -x "cron" > /dev/null && ! pgrep -x "crond" > /dev/null; then
    echo "Starting cron service..."
    sudo service cron start 2>/dev/null || sudo service crond start 2>/dev/null || echo "Could not start cron service"
fi

# Verify our cron job exists
if ! crontab -l 2>/dev/null | grep -q "/home/florin/Work/Repos/python/factual_checker/scripts/cron_wrapper.sh"; then
    echo "Re-adding politician stats cron job..."
    (crontab -l 2>/dev/null; echo "0 20 * * * /home/florin/Work/Repos/python/factual_checker/scripts/cron_wrapper.sh") | crontab -
fi

echo "Politician stats cron job verified"

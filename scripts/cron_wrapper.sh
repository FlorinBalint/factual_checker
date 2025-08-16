#!/bin/bash

# Cron wrapper script for politician stats update
# This ensures proper environment is loaded for cron execution

# Set up environment
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
export HOME="/home/florin"
export USER="florin"

# Add Python path if needed
if [ -d "$HOME/.local/bin" ]; then
    export PATH="$HOME/.local/bin:$PATH"
fi

# Source bashrc/profile for user environment
if [ -f "$HOME/.bashrc" ]; then
    source "$HOME/.bashrc"
fi

if [ -f "$HOME/.profile" ]; then
    source "$HOME/.profile"
fi

# Change to project directory
cd "/home/florin/Work/Repos/python/factual_checker"

# Run the update script
exec "/home/florin/Work/Repos/python/factual_checker/scripts/update_dashboard_data.sh"

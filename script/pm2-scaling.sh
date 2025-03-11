#!/bin/bash

# Load environment variables
ENV_FILE="../.env.development"
if [ "$ENV" == "production" ]; then
    ENV_FILE="../.env.production"
fi


# Set monitoring parameters
APP_NAME="$PM2_APP_NAME"  
INTERVAL=30  
SCALE_THRESHOLD=$PM2_SCALE_CPU_USAGE
MIN_INSTANCES=1  # Minimum PM2 instances
MAX_INSTANCES=10  # Maximum PM2 instances

while true; do
    if [[ "$IS_AUTO_SCALING" == "true" ]]; then
        # Get the average CPU usage of the system
        CPU_USAGE=$(awk '{u=$2+$4; t=$2+$4+$5; if (NR>1) print int((u-prev_u) * 100 / (t-prev_t)); prev_u=u; prev_t=t; }' <(grep 'cpu ' /proc/stat) <(sleep 5; grep 'cpu ' /proc/stat))

        # Get current PM2 instance count
        CURRENT_INSTANCES=$(pm2 list | grep -c "$APP_NAME")

        echo "Current CPU Usage: $CPU_USAGE%"
        echo "Current PM2 Instances: $CURRENT_INSTANCES"

        # Scale Up: If CPU usage > 50% and instances < MAX_INSTANCES
        if (( CPU_USAGE > SCALE_THRESHOLD )) && (( CURRENT_INSTANCES < MAX_INSTANCES )); then
            NEW_INSTANCES=$((CURRENT_INSTANCES + 1))
            echo "Scaling up to $NEW_INSTANCES instances..."
            pm2 scale "$APP_NAME" "$NEW_INSTANCES"
        fi

        # Scale Down: If CPU usage < 50% and instances > MIN_INSTANCES
        if (( CPU_USAGE < SCALE_THRESHOLD )) && (( CURRENT_INSTANCES > MIN_INSTANCES )); then
            NEW_INSTANCES=$((CURRENT_INSTANCES - 1))
            echo "Scaling down to $NEW_INSTANCES instances..."
            pm2 scale "$APP_NAME" "$NEW_INSTANCES"
        fi
    else
        echo "Auto-scaling is disabled. Exiting..."
        exit 0
    fi
    pm2 save
    sleep "$INTERVAL"
done

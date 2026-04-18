#!/bin/sh
# 🏝️ DuDe Hawaiian v2.1 — Daily Scheduler
# This script runs daily via the dude_scheduler container

AG_BOSS_URL="${AG_BOSS_URL:-http://ag_boss:8000}"
LOG_PREFIX="[DuDe Scheduler $(date '+%Y-%m-%d %H:%M:%S')]"

echo "$LOG_PREFIX Starting daily operations check..."

# Trigger Daily Operations Report
RESP=$(wget -qO- --post-data='{}' \
    --header='Content-Type: application/json' \
    "${AG_BOSS_URL}/api/daily_operations" 2>&1)

if echo "$RESP" | grep -q '"status"'; then
    echo "$LOG_PREFIX ✅ Daily operations check completed"
else
    echo "$LOG_PREFIX ❌ Daily operations check failed: $RESP"
    exit 1
fi

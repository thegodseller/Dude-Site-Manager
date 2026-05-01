#!/usr/bin/env bash
#
# scripts/cleanup_pos_test_data.sh
# Safely deactivates test products and employees created by validate_pos_api.sh
#

set -e

POS_URL="${POS_URL:-http://localhost:11116}"

echo "Starting POS test data cleanup at $POS_URL..."

# 1. Find a Manager to perform admin actions
echo "Finding Manager employee..."
MANAGER_ID=$(curl -s "$POS_URL/api/pos/employees" | jq -r '.employees[] | select(.display_name | contains("Manager")) | .id' | head -n 1)

if [ -z "$MANAGER_ID" ] || [ "$MANAGER_ID" = "null" ]; then
    echo "Error: Could not find a Manager employee to perform cleanup."
    exit 1
fi
echo "Using Manager ID: $MANAGER_ID"

# 2. Deactivate REORDER-* products
echo "Searching for REORDER- test products..."
REORDER_IDS=$(curl -s -G --data-urlencode "q=REORDER-" "$POS_URL/api/pos/products/search" | jq -r '.items[] | select(.sku | startswith("REORDER-")) | .product_id')

count=0
for id in $REORDER_IDS; do
    if [ -n "$id" ]; then
        curl -s -X POST "$POS_URL/api/pos/products/$id/deactivate?employee_id=$MANAGER_ID" > /dev/null
        count=$((count + 1))
    fi
done
echo "Deactivated $count REORDER- test product(s)."

# 3. Deactivate TEST-PROD-* products (just in case they were left active)
echo "Searching for TEST-PROD- test products..."
TESTPROD_IDS=$(curl -s -G --data-urlencode "q=TEST-PROD-" "$POS_URL/api/pos/products/search" | jq -r '.items[] | select(.sku | startswith("TEST-PROD-")) | .product_id')

count2=0
for id in $TESTPROD_IDS; do
    if [ -n "$id" ]; then
        curl -s -X POST "$POS_URL/api/pos/products/$id/deactivate?employee_id=$MANAGER_ID" > /dev/null
        count2=$((count2 + 1))
    fi
done
echo "Deactivated $count2 TEST-PROD- test product(s)."

# 4. Deactivate 'Admin Test User' employee
echo "Searching for test employees..."
TEST_EMP_IDS=$(curl -s "$POS_URL/api/pos/employees" | jq -r '.employees[] | select(.display_name == "Admin Test User" and .is_active == true) | .id')

count3=0
for id in $TEST_EMP_IDS; do
    if [ -n "$id" ]; then
        curl -s -X POST "$POS_URL/api/pos/employees/$id/deactivate" > /dev/null
        count3=$((count3 + 1))
    fi
done
echo "Deactivated $count3 test employee(s)."

echo "Cleanup completed safely!"

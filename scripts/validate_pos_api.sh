#!/usr/bin/env bash
# Lightweight POS API Verification Script

set -u

POS_URL="${POS_URL:-http://localhost:11116}"

echo "--- POS API Verification: $POS_URL ---"

# 1. Health Endpoint
echo -n "Health Check: "
if curl -sS "$POS_URL/health" | grep -q '"service":"ag_pos"'; then
    echo "PASS"
else
    echo "FAIL"
    exit 1
fi

# 2. Schema Status
echo -n "Schema Status: "
if curl -sS "$POS_URL/api/pos/schema/status" | grep -q '"status":"ok"'; then
    echo "PASS"
else
    echo "FAIL"
    exit 1
fi

# 3. Thai Search (URL Encoded)
echo -n "Thai Search (น้ำแข็ง): "
RESP_THAI=$(curl -s -G --data-urlencode "q=น้ำแข็ง" "$POS_URL/api/pos/products/search")
if echo "$RESP_THAI" | grep -q '"success":true'; then
    echo "PASS"
else
    echo "FAIL"
    exit 1
fi

# 4. Barcode Search (885001)
echo -n "Barcode Search (885001): "
RESP_BC=$(curl -s -G --data-urlencode "barcode=885001" "$POS_URL/api/pos/products/search")
if echo "$RESP_BC" | grep -q '"barcode":"885001"'; then
    echo "PASS"
else
    echo "FAIL"
    exit 1
fi

# 5. Dude Search
echo -n "Dude Search: "
RESP_DUDE=$(curl -s -G --data-urlencode "q=Dude" "$POS_URL/api/pos/products/search")
if echo "$RESP_DUDE" | grep -q '"name":"น้ำดื่ม Dude Pure 600ml"'; then
    echo "PASS"
else
    echo "FAIL"
    exit 1
fi

# 6. Response Fields Verification
echo -n "Field Validation (unit_price, category_name, uom): "
ITEM=$(echo "$RESP_THAI" | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data['items'][0]) if data['items'] else '{}')")
MISSING=()

if ! echo "$ITEM" | grep -q '"unit_price"'; then MISSING+=("unit_price"); fi
if ! echo "$ITEM" | grep -q '"category_name"'; then MISSING+=("category_name"); fi
if ! echo "$ITEM" | grep -q '"uom"'; then MISSING+=("uom"); fi

if [ ${#MISSING[@]} -eq 0 ]; then
    echo "PASS"
else
    echo "FAIL (Missing: ${MISSING[*]})"
    exit 1
fi

echo "--- ALL POS API TESTS PASSED ---"

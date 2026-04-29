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

# 7. Shift Management Tests
echo "--- Shift Management Tests ---"
TS=$(date +%s)
# Generate a valid-looking UUID by padding the timestamp to 12 hex digits
# e.g. 00000000-0000-0000-0000-001777486017
TEST_EMPLOYEE_ID=$(printf "00000000-0000-0000-0000-%012d" "$TS")
echo "Test Employee ID: $TEST_EMPLOYEE_ID"

# 7.1 Open Shift
echo -n "Open Shift: "
OPEN_RESP=$(curl -s -X POST "$POS_URL/api/pos/shifts/open" \
    -H "Content-Type: application/json" \
    -d "{\"employee_id\": \"$TEST_EMPLOYEE_ID\", \"opening_cash\": 500.00}")
if echo "$OPEN_RESP" | grep -q '"status":"ok"'; then
    SHIFT_ID=$(echo "$OPEN_RESP" | python3 -c "import sys, json; print(json.load(sys.stdin)['shift']['id'])")
    echo "PASS (Shift ID: $SHIFT_ID)"
else
    echo "FAIL: $OPEN_RESP"
    exit 1
fi

# 7.2 Duplicate Open Shift Rejection
echo -n "Duplicate Open Shift Rejection: "
DUP_OPEN_RESP=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$POS_URL/api/pos/shifts/open" \
    -H "Content-Type: application/json" \
    -d "{\"employee_id\": \"$TEST_EMPLOYEE_ID\", \"opening_cash\": 100.00}")
if [ "$DUP_OPEN_RESP" = "409" ]; then
    echo "PASS"
else
    echo "FAIL (Expected 409, got $DUP_OPEN_RESP)"
    exit 1
fi

# 7.3 Get Current Shift
echo -n "Get Current Shift: "
CURR_RESP=$(curl -s -X GET "$POS_URL/api/pos/shifts/current?employee_id=$TEST_EMPLOYEE_ID")
if echo "$CURR_RESP" | grep -q "\"id\":\"$SHIFT_ID\""; then
    echo "PASS"
else
    echo "FAIL: $CURR_RESP"
    exit 1
fi

# 7.4 Close Shift
echo -n "Close Shift: "
CLOSE_RESP=$(curl -s -X POST "$POS_URL/api/pos/shifts/close" \
    -H "Content-Type: application/json" \
    -d "{\"shift_id\": \"$SHIFT_ID\", \"actual_cash\": 550.00}")
VARIANCE=$(echo "$CLOSE_RESP" | python3 -c "import sys, json; print(json.load(sys.stdin)['shift']['variance'])")
if [ "$VARIANCE" = "50.0" ] || [ "$VARIANCE" = "50.00" ] || [ "$VARIANCE" = "50" ]; then
    echo "PASS"
else
    echo "FAIL: $CLOSE_RESP"
    exit 1
fi

# 7.5 Close Already Closed Shift Rejection
echo -n "Already Closed Shift Rejection: "
DUP_CLOSE_RESP=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$POS_URL/api/pos/shifts/close" \
    -H "Content-Type: application/json" \
    -d "{\"shift_id\": \"$SHIFT_ID\", \"actual_cash\": 600.00}")
if [ "$DUP_CLOSE_RESP" = "409" ]; then
    echo "PASS"
else
    echo "FAIL (Expected 409, got $DUP_CLOSE_RESP)"
    exit 1
fi

echo "--- ALL POS API TESTS PASSED ---"

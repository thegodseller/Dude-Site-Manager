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

# 7.0 Cashier Identity Tests
echo -n "List Employees: "
EMP_LIST_RESP=$(curl -s -X GET "$POS_URL/api/pos/employees")
if echo "$EMP_LIST_RESP" | grep -q '"success":true' && echo "$EMP_LIST_RESP" | grep -q 'Demo Cashier'; then
    TEST_EMPLOYEE_ID=$(echo "$EMP_LIST_RESP" | python3 -c "import sys, json; print(json.load(sys.stdin)['employees'][0]['id'])")
    echo "PASS (Test Employee: $TEST_EMPLOYEE_ID)"
else
    echo "FAIL: $EMP_LIST_RESP"
    exit 1
fi

echo -n "Start Employee Session (Invalid PIN): "
BAD_PIN_RESP=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$POS_URL/api/pos/employees/session/start" \
    -H "Content-Type: application/json" \
    -d "{\"employee_id\": \"$TEST_EMPLOYEE_ID\", \"pin_code\": \"0000\"}")
if [ "$BAD_PIN_RESP" = "401" ]; then
    echo "PASS"
else
    echo "FAIL (Expected 401, got $BAD_PIN_RESP)"
    exit 1
fi

echo -n "Start Employee Session (Valid PIN 1234): "
SESSION_RESP=$(curl -s -X POST "$POS_URL/api/pos/employees/session/start" \
    -H "Content-Type: application/json" \
    -d "{\"employee_id\": \"$TEST_EMPLOYEE_ID\", \"pin_code\": \"1234\"}")
if echo "$SESSION_RESP" | grep -q '"status":"ok"'; then
    echo "PASS"
else
    echo "FAIL: $SESSION_RESP"
    exit 1
fi

echo -n "End Employee Session: "
END_SESSION_RESP=$(curl -s -X POST "$POS_URL/api/pos/employees/session/end" \
    -H "Content-Type: application/json" \
    -d "{\"employee_id\": \"$TEST_EMPLOYEE_ID\"}")
if echo "$END_SESSION_RESP" | grep -q '"status":"ok"'; then
    echo "PASS"
else
    echo "FAIL: $END_SESSION_RESP"
    exit 1
fi

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

echo -n "Open Shift (Invalid Employee): "
INVALID_EMP_ID="00000000-0000-0000-0000-000000000000"
INV_OPEN_RESP=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$POS_URL/api/pos/shifts/open" \
    -H "Content-Type: application/json" \
    -d "{\"employee_id\": \"$INVALID_EMP_ID\", \"opening_cash\": 100.00}")
if [ "$INV_OPEN_RESP" = "404" ]; then
    echo "PASS"
else
    echo "FAIL (Expected 404, got $INV_OPEN_RESP)"
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
# (Moved after Sale Ticket tests)

# 8. Sale Ticket Tests
echo "--- Sale Ticket Tests ---"
# 8.1 Get Product IDs and Initial Stock
PROD_SEARCH=$(curl -s -G --data-urlencode "q=น้ำแข็งหลอดเล็ก 5kg" "$POS_URL/api/pos/products/search")
PROD_ICE_ID=$(echo "$PROD_SEARCH" | python3 -c "import sys, json; print(json.load(sys.stdin)['items'][0]['product_id'])")
STOCK_BEFORE=$(echo "$PROD_SEARCH" | python3 -c "import sys, json; print(json.load(sys.stdin)['items'][0]['on_hand_qty'])")

PROD_WAT_ID=$(curl -s -G --data-urlencode "q=น้ำดื่ม Dude Pure 600ml" "$POS_URL/api/pos/products/search" | python3 -c "import sys, json; print(json.load(sys.stdin)['items'][0]['product_id'])")

echo "Initial Stock for Ice: $STOCK_BEFORE"

# 8.2 Create Ticket
# 2x Ice (25.00) + 1x Water (10.00) = 60.00
echo -n "Create Sale Ticket: "
TKT_RESP=$(curl -s -X POST "$POS_URL/api/pos/tickets" \
    -H "Content-Type: application/json" \
    -d "{
        \"shift_id\": \"$SHIFT_ID\",
        \"vat_mode\": \"NO_VAT\",
        \"vat_calc_mode\": \"EXCLUSIVE\",
        \"vat_rate\": 0,
        \"items\": [
            {\"product_id\": \"$PROD_ICE_ID\", \"qty\": 2, \"unit_price\": 25.00, \"master_price\": 25.00},
            {\"product_id\": \"$PROD_WAT_ID\", \"qty\": 1, \"unit_price\": 10.00, \"master_price\": 10.00}
        ],
        \"payment\": {\"method\": \"CASH\", \"amount\": 60.00}
    }")

if echo "$TKT_RESP" | grep -q '"status":"ok"' && echo "$TKT_RESP" | grep -q '"total_amount":"60.0"'; then
    TICKET_ID=$(echo "$TKT_RESP" | python3 -c "import sys, json; print(json.load(sys.stdin)['ticket_id'])")
    TICKET_NO=$(echo "$TKT_RESP" | python3 -c "import sys, json; print(json.load(sys.stdin)['ticket_no'])")
    echo "PASS (Ticket ID: $TICKET_ID, No: $TICKET_NO)"
else
    echo "FAIL: $TKT_RESP"
    exit 1
fi

# 8.2.0 Fetch Receipt (Confirmed)
echo -n "Fetch Receipt (Confirmed): "
REC_CONF_RESP=$(curl -s -X GET "$POS_URL/api/pos/tickets/$TICKET_ID/receipt")
if echo "$REC_CONF_RESP" | grep -q "\"ticket_no\":\"$TICKET_NO\"" && echo "$REC_CONF_RESP" | grep -q '"is_voided":false' && echo "$REC_CONF_RESP" | grep -q '"total_amount":"60.00"'; then
    echo "PASS"
else
    echo "FAIL: $REC_CONF_RESP"
    exit 1
fi

# 8.2.1 Get Shift Summary (After Create)
echo -n "Shift Summary (After Create): "
SUMM_RESP=$(curl -s -X GET "$POS_URL/api/pos/shifts/$SHIFT_ID/summary")
CHECK_CREATE=$(echo "$SUMM_RESP" | python3 -c "
import sys, json; 
data = json.load(sys.stdin); 
s = data.get('summary', {}); 
ok = s.get('confirmed_ticket_count') == 1 and float(s.get('net_sales', 0)) == 60.0;
print('PASS' if ok else f'FAIL: {json.dumps(data)}');
")
if [ "$CHECK_CREATE" = "PASS" ]; then
    echo "PASS"
else
    echo "$CHECK_CREATE"
    exit 1
fi

# 8.3 Verify Stock Deduction
echo -n "Verify Stock Deduction: "
STOCK_AFTER=$(curl -s -G --data-urlencode "q=น้ำแข็งหลอดเล็ก 5kg" "$POS_URL/api/pos/products/search" | python3 -c "import sys, json; print(json.load(sys.stdin)['items'][0]['on_hand_qty'])")
EXPECTED_STOCK=$(python3 -c "print(float('$STOCK_BEFORE') - 2)")

if [ "$STOCK_AFTER" = "$EXPECTED_STOCK" ] || [ "$(printf \"%.0f\" \"$STOCK_AFTER\")" = "$(printf \"%.0f\" \"$EXPECTED_STOCK\")" ]; then
    echo "PASS (Before: $STOCK_BEFORE, After: $STOCK_AFTER)"
else
    echo "FAIL (Before: $STOCK_BEFORE, After: $STOCK_AFTER, Expected: $EXPECTED_STOCK)"
    exit 1
fi

# 8.4 Insufficient Stock Rejection
echo -n "Insufficient Stock Rejection: "
LARGE_QTY=$(python3 -c "print(int(float('$STOCK_AFTER') + 100))")
ERR_RESP=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$POS_URL/api/pos/tickets" \
    -H "Content-Type: application/json" \
    -d "{
        \"shift_id\": \"$SHIFT_ID\",
        \"vat_mode\": \"NO_VAT\",
        \"vat_calc_mode\": \"EXCLUSIVE\",
        \"vat_rate\": 0,
        \"items\": [
            {\"product_id\": \"$PROD_ICE_ID\", \"qty\": $LARGE_QTY, \"unit_price\": 25.00, \"master_price\": 25.00}
        ],
        \"payment\": {\"method\": \"CASH\", \"amount\": 1000.00}
    }")

if [ "$ERR_RESP" = "409" ]; then
    echo "PASS"
else
    echo "FAIL (Expected 409, got $ERR_RESP)"
    exit 1
fi

# 8.5 Get Ticket Details
echo -n "Get Ticket Details: "
TKT_GET=$(curl -s "$POS_URL/api/pos/tickets/$TICKET_ID")
if echo "$TKT_GET" | grep -q "\"id\":\"$TICKET_ID\"" && echo "$TKT_GET" | grep -q "น้ำแข็งหลอดเล็ก 5kg"; then
    echo "PASS"
else
    echo "FAIL: $TKT_GET"
    exit 1
fi

# 8.6 Void Ticket
echo -n "Void Ticket: "
VOID_RESP=$(curl -s -X POST "$POS_URL/api/pos/tickets/$TICKET_ID/void" \
    -H "Content-Type: application/json" \
    -d "{\"reason\": \"test void\", \"employee_id\": \"$TEST_EMPLOYEE_ID\"}")

if echo "$VOID_RESP" | grep -q '"status":"ok"'; then
    echo "PASS"
else
    echo "FAIL: $VOID_RESP"
    exit 1
fi

# 8.6.1 Get Shift Summary (After Void)
echo -n "Shift Summary (After Void): "
SUMM_VOID_RESP=$(curl -s -X GET "$POS_URL/api/pos/shifts/$SHIFT_ID/summary")
CHECK_VOID=$(echo "$SUMM_VOID_RESP" | python3 -c "
import sys, json; 
data = json.load(sys.stdin); 
s = data.get('summary', {}); 
ok = s.get('confirmed_ticket_count') == 0 and s.get('voided_ticket_count') == 1 and float(s.get('net_sales', 0)) == 0.0;
print('PASS' if ok else f'FAIL: {json.dumps(data)}');
")
if [ "$CHECK_VOID" = "PASS" ]; then
    echo "PASS"
else
    echo "$CHECK_VOID"
    exit 1
fi

# 8.6.2 Fetch Receipt (Voided)
echo -n "Fetch Receipt (Voided): "
REC_VOID_RESP=$(curl -s -X GET "$POS_URL/api/pos/tickets/$TICKET_ID/receipt")
if echo "$REC_VOID_RESP" | grep -q "\"ticket_no\":\"$TICKET_NO\"" && echo "$REC_VOID_RESP" | grep -q '"is_voided":true'; then
    echo "PASS"
else
    echo "FAIL: $REC_VOID_RESP"
    exit 1
fi

# 8.7 Verify Stock Restored
echo -n "Verify Stock Restored: "
STOCK_RESTORED=$(curl -s -G --data-urlencode "q=น้ำแข็งหลอดเล็ก 5kg" "$POS_URL/api/pos/products/search" | python3 -c "import sys, json; print(json.load(sys.stdin)['items'][0]['on_hand_qty'])")
if [ "$STOCK_RESTORED" = "$STOCK_BEFORE" ] || [ "$(printf \"%.0f\" \"$STOCK_RESTORED\")" = "$(printf \"%.0f\" \"$STOCK_BEFORE\")" ]; then
    echo "PASS (Restored to: $STOCK_RESTORED)"
else
    echo "FAIL (Expected: $STOCK_BEFORE, Got: $STOCK_RESTORED)"
    exit 1
fi

# 8.8 Verify Second Void Rejected
echo -n "Duplicate Void Rejection: "
DUP_VOID_RESP=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$POS_URL/api/pos/tickets/$TICKET_ID/void" \
    -H "Content-Type: application/json" \
    -d "{\"reason\": \"second void\", \"employee_id\": \"$TEST_EMPLOYEE_ID\"}")
if [ "$DUP_VOID_RESP" = "409" ]; then
    echo "PASS"
else
    echo "FAIL (Expected 409, got $DUP_VOID_RESP)"
    exit 1
fi

# 9. Close Shift with Sales (Adjusted for Void)
echo "--- Re-testing Close Shift (After Void) ---"
echo -n "Close Shift (Expected 0.00 sales after void): "
# Opening 500 + Sale 60 - Void 60 = 500
CLOSE_RESP=$(curl -s -X POST "$POS_URL/api/pos/shifts/close" \
    -H "Content-Type: application/json" \
    -d "{\"shift_id\": \"$SHIFT_ID\", \"actual_cash\": 500.00}")
VARIANCE=$(echo "$CLOSE_RESP" | python3 -c "import sys, json; print(json.load(sys.stdin)['shift']['variance'])")
if [ "$VARIANCE" = "0.0" ] || [ "$VARIANCE" = "0.00" ] || [ "$VARIANCE" = "0" ]; then
    echo "PASS"
else
    echo "FAIL: $CLOSE_RESP"
    exit 1
fi

# 9.1 Get Shift Summary (After Close)
echo -n "Shift Summary (After Close): "
SUMM_CLOSE_RESP=$(curl -s -X GET "$POS_URL/api/pos/shifts/$SHIFT_ID/summary")
CHECK_CLOSE=$(echo "$SUMM_CLOSE_RESP" | python3 -c "
import sys, json; 
data = json.load(sys.stdin); 
s = data.get('summary', {}); 
ok = s.get('status') == 'CLOSED' and float(s.get('net_sales', 0)) == 0.0;
print('PASS' if ok else f'FAIL: {json.dumps(data)}');
")
if [ "$CHECK_CLOSE" = "PASS" ]; then
    echo "PASS"
else
    echo "$CHECK_CLOSE"
    exit 1
fi

echo "--- ALL POS API TESTS PASSED ---"

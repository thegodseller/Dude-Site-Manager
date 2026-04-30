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
    TEST_CASHIER_ID=$(echo "$EMP_LIST_RESP" | python3 -c "import sys, json; data=json.load(sys.stdin); print(next(e['id'] for e in data['employees'] if 'Cashier' in e['display_name']))")
    TEST_MANAGER_ID=$(echo "$EMP_LIST_RESP" | python3 -c "import sys, json; data=json.load(sys.stdin); print(next(e['id'] for e in data['employees'] if 'Manager' in e['display_name']))")
    TEST_EMPLOYEE_ID="$TEST_CASHIER_ID"
    echo "PASS (Cashier: $TEST_CASHIER_ID, Manager: $TEST_MANAGER_ID)"
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

# 7.0.1 Employee Management Admin Tests
echo "--- Employee Management Admin Tests ---"
echo -n "Create Employee: "
CREATE_EMP_RESP=$(curl -s -X POST "$POS_URL/api/pos/employees" \
    -H "Content-Type: application/json" \
    -d "{\"display_name\": \"Admin Test User\", \"role\": \"CASHIER\", \"pin_code\": \"7777\"}")
if echo "$CREATE_EMP_RESP" | grep -q '"status":"ok"'; then
    ADMIN_TEST_EMP_ID=$(echo "$CREATE_EMP_RESP" | python3 -c "import sys, json; print(json.load(sys.stdin)['employee']['id'])")
    echo "PASS (ID: $ADMIN_TEST_EMP_ID)"
else
    echo "FAIL: $CREATE_EMP_RESP"
    exit 1
fi

echo -n "Login with New Employee: "
LOGIN_NEW_RESP=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$POS_URL/api/pos/employees/session/start" \
    -H "Content-Type: application/json" \
    -d "{\"employee_id\": \"$ADMIN_TEST_EMP_ID\", \"pin_code\": \"7777\"}")
if [ "$LOGIN_NEW_RESP" = "200" ]; then
    echo "PASS"
else
    echo "FAIL (Expected 200, got $LOGIN_NEW_RESP)"
    exit 1
fi

echo -n "Reset Employee PIN: "
RESET_PIN_RESP=$(curl -s -X POST "$POS_URL/api/pos/employees/$ADMIN_TEST_EMP_ID/reset-pin" \
    -H "Content-Type: application/json" \
    -d "{\"new_pin\": \"8888\"}")
if echo "$RESET_PIN_RESP" | grep -q '"status":"ok"'; then
    echo "PASS"
else
    echo "FAIL: $RESET_PIN_RESP"
    exit 1
fi

echo -n "Login with Old PIN (Should Fail): "
LOGIN_OLD_RESP=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$POS_URL/api/pos/employees/session/start" \
    -H "Content-Type: application/json" \
    -d "{\"employee_id\": \"$ADMIN_TEST_EMP_ID\", \"pin_code\": \"7777\"}")
if [ "$LOGIN_OLD_RESP" = "401" ]; then
    echo "PASS"
else
    echo "FAIL (Expected 401, got $LOGIN_OLD_RESP)"
    exit 1
fi

echo -n "Login with New PIN: "
LOGIN_NEW_PIN_RESP=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$POS_URL/api/pos/employees/session/start" \
    -H "Content-Type: application/json" \
    -d "{\"employee_id\": \"$ADMIN_TEST_EMP_ID\", \"pin_code\": \"8888\"}")
if [ "$LOGIN_NEW_PIN_RESP" = "200" ]; then
    echo "PASS"
else
    echo "FAIL (Expected 200, got $LOGIN_NEW_PIN_RESP)"
    exit 1
fi

echo -n "Deactivate Employee: "
DEACTIVATE_RESP=$(curl -s -X POST "$POS_URL/api/pos/employees/$ADMIN_TEST_EMP_ID/deactivate")
if echo "$DEACTIVATE_RESP" | grep -q '"status":"ok"'; then
    echo "PASS"
else
    echo "FAIL: $DEACTIVATE_RESP"
    exit 1
fi

echo -n "Login with Deactivated Employee (Should Fail): "
LOGIN_DEACT_RESP=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$POS_URL/api/pos/employees/session/start" \
    -H "Content-Type: application/json" \
    -d "{\"employee_id\": \"$ADMIN_TEST_EMP_ID\", \"pin_code\": \"8888\"}")
if [ "$LOGIN_DEACT_RESP" = "403" ]; then
    echo "PASS"
else
    echo "FAIL (Expected 403, got $LOGIN_DEACT_RESP)"
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

# 8.2.1 Create Second Ticket (For History/Report Tests)
echo -n "Create Second Ticket (Confirmed): "
TKT2_RESP=$(curl -s -X POST "$POS_URL/api/pos/tickets" \
    -H "Content-Type: application/json" \
    -d "{
        \"shift_id\": \"$SHIFT_ID\",
        \"vat_mode\": \"NO_VAT\",
        \"vat_calc_mode\": \"EXCLUSIVE\",
        \"vat_rate\": 0,
        \"items\": [
            {\"product_id\": \"$PROD_ICE_ID\", \"qty\": 1, \"unit_price\": 25.00, \"master_price\": 25.00}
        ],
        \"payment\": {\"method\": \"CASH\", \"amount\": 25.00},
        \"employee_id\": \"$TEST_EMPLOYEE_ID\"
    }")
if echo "$TKT2_RESP" | grep -q '"status":"ok"'; then
    TICKET2_ID=$(echo "$TKT2_RESP" | python3 -c "import sys, json; print(json.load(sys.stdin)['ticket_id'])")
    echo "PASS (ID: $TICKET2_ID)"
else
    echo "FAIL: $TKT2_RESP"
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
ok = s.get('confirmed_ticket_count') == 2 and float(s.get('net_sales', 0)) == 85.0;
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
EXPECTED_STOCK=$(python3 -c "print(float('$STOCK_BEFORE') - 3)")

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

# 8.6 RBAC Void Test (Cashier - Unauthorized)
echo -n "RBAC Void Test (Cashier - Unauthorized): "
VOID_UNAUTH_RESP=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$POS_URL/api/pos/tickets/$TICKET_ID/void" \
    -H "Content-Type: application/json" \
    -d "{\"reason\": \"unauthorized void attempt\", \"employee_id\": \"$TEST_CASHIER_ID\"}")
if [ "$VOID_UNAUTH_RESP" = "403" ]; then
    echo "PASS"
else
    echo "FAIL (Expected 403, got $VOID_UNAUTH_RESP)"
    exit 1
fi

# 8.6.1 RBAC Void Test (Manager - Authorized)
echo -n "RBAC Void Test (Manager - Authorized): "
VOID_AUTH_RESP=$(curl -s -X POST "$POS_URL/api/pos/tickets/$TICKET_ID/void" \
    -H "Content-Type: application/json" \
    -d "{\"reason\": \"manager void\", \"employee_id\": \"$TEST_MANAGER_ID\"}")

if echo "$VOID_AUTH_RESP" | grep -q '"status":"ok"'; then
    echo "PASS"
else
    echo "FAIL: $VOID_AUTH_RESP"
    exit 1
fi

# 8.6.1 Get Shift Summary (After Void)
echo -n "Shift Summary (After Void): "
SUMM_VOID_RESP=$(curl -s -X GET "$POS_URL/api/pos/shifts/$SHIFT_ID/summary")
CHECK_VOID=$(echo "$SUMM_VOID_RESP" | python3 -c "
import sys, json; 
data = json.load(sys.stdin); 
s = data.get('summary', {}); 
ok = s.get('confirmed_ticket_count') == 1 and s.get('voided_ticket_count') == 1 and float(s.get('net_sales', 0)) == 25.0;
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
EXPECTED_RESTORED=$(python3 -c "print(float('$STOCK_BEFORE') - 1)")
if [ "$STOCK_RESTORED" = "$EXPECTED_RESTORED" ] || [ "$(printf \"%.0f\" \"$STOCK_RESTORED\")" = "$(printf \"%.0f\" \"$EXPECTED_RESTORED\")" ]; then
    echo "PASS (Restored to: $STOCK_RESTORED)"
else
    echo "FAIL (Expected: $EXPECTED_RESTORED, Got: $STOCK_RESTORED)"
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
echo -n "Close Shift (Expected 25.00 sales after void): "
# Opening 500 + T1 60 + T2 25 - Void T1 60 = 525
CLOSE_RESP=$(curl -s -X POST "$POS_URL/api/pos/shifts/close" \
    -H "Content-Type: application/json" \
    -d "{\"shift_id\": \"$SHIFT_ID\", \"actual_cash\": 525.00}")
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
ok = s.get('status') == 'CLOSED' and float(s.get('net_sales', 0)) == 25.0;
print('PASS' if ok else f'FAIL: {json.dumps(data)}');
")
if [ "$CHECK_CLOSE" = "PASS" ]; then
    echo "PASS"
else
    echo "$CHECK_CLOSE"
    exit 1
fi

# 11. Audit Log Tests
echo "--- Audit Log Tests ---"
echo -n "Fetch Audit Log: "
AUDIT_RESP=$(curl -s -X GET "$POS_URL/api/pos/audit-log?limit=50")
if echo "$AUDIT_RESP" | grep -q '"status":"ok"'; then
    echo "PASS"
    
    # Verify expected event types
    echo -n "  Verify EMPLOYEE_CREATED: "
    if echo "$AUDIT_RESP" | grep -q 'EMPLOYEE_CREATED'; then echo "PASS"; else echo "FAIL"; exit 1; fi
    
    echo -n "  Verify EMPLOYEE_PIN_RESET: "
    if echo "$AUDIT_RESP" | grep -q 'EMPLOYEE_PIN_RESET'; then echo "PASS"; else echo "FAIL"; exit 1; fi

    echo -n "  Verify EMPLOYEE_DEACTIVATED: "
    if echo "$AUDIT_RESP" | grep -q 'EMPLOYEE_DEACTIVATED'; then echo "PASS"; else echo "FAIL"; exit 1; fi

    echo -n "  Verify SHIFT_OPENED: "
    if echo "$AUDIT_RESP" | grep -q 'SHIFT_OPENED'; then echo "PASS"; else echo "FAIL"; exit 1; fi
    
    echo -n "  Verify MANAGER_OVERRIDE_VOID: "
    if echo "$AUDIT_RESP" | grep -q 'MANAGER_OVERRIDE_VOID'; then echo "PASS"; else echo "FAIL"; exit 1; fi

    echo -n "  Verify SHIFT_CLOSED: "
    if echo "$AUDIT_RESP" | grep -q 'SHIFT_CLOSED'; then echo "PASS"; else echo "FAIL"; exit 1; fi
else
    echo "FAIL: $AUDIT_RESP"
    exit 1
fi

# 12. Ticket History Tests
echo "--- Ticket History Tests ---"
echo -n "Fetch Ticket History: "
HISTORY_RESP=$(curl -s -X GET "$POS_URL/api/pos/tickets?limit=10")
if echo "$HISTORY_RESP" | grep -q '"status":"ok"'; then
    echo "PASS"
    
    echo -n "  Verify Ticket in History: "
    if echo "$HISTORY_RESP" | grep -q "$TICKET_ID"; then echo "PASS"; else echo "FAIL"; exit 1; fi
    
    echo -n "  Filter by CONFIRMED: "
    if curl -s -X GET "$POS_URL/api/pos/tickets?status=CONFIRMED" | grep -q '"status":"ok"'; then echo "PASS"; else echo "FAIL"; exit 1; fi
    
    echo -n "  Filter by VOIDED: "
    if curl -s -X GET "$POS_URL/api/pos/tickets?status=VOIDED" | grep -q "$TICKET_ID"; then echo "PASS"; else echo "FAIL"; exit 1; fi
    
    echo -n "  Search by Ticket No: "
    TICKET_NO=$(echo "$HISTORY_RESP" | jq -r '.tickets[0].ticket_no')
    if curl -s -X GET "$POS_URL/api/pos/tickets?q=$TICKET_NO" | grep -q "$TICKET_NO"; then echo "PASS"; else echo "FAIL"; exit 1; fi
else
    echo "FAIL: $HISTORY_RESP"
    exit 1
fi

# 13. Daily Report Tests
echo "--- Daily Report Tests ---"
TODAY=$(date +%Y-%m-%d)
echo -n "Fetch Daily Report ($TODAY): "
REPORT_RESP=$(curl -s -X GET "$POS_URL/api/pos/reports/daily?date=$TODAY")
if echo "$REPORT_RESP" | grep -q '"status":"ok"'; then
    echo "PASS"
    
    echo -n "  Verify Net Sales Calculation: "
    NET_SALES=$(echo "$REPORT_RESP" | jq -r '.net_sales')
    if [ "$NET_SALES" != "0.00" ]; then echo "PASS ($NET_SALES)"; else echo "FAIL ($NET_SALES)"; exit 1; fi
    
    echo -n "  Verify Top Items Included: "
    if echo "$REPORT_RESP" | jq -e '.top_items | length > 0' > /dev/null; then echo "PASS"; else echo "FAIL"; exit 1; fi
    
    echo -n "  Verify Cashier Summary Included: "
    if echo "$REPORT_RESP" | jq -e '.cashier_summary | length > 0' > /dev/null; then echo "PASS"; else echo "FAIL"; exit 1; fi
else
    echo "FAIL: $REPORT_RESP"
    exit 1
fi

# 14. Inventory Adjustment Tests
echo "--- Inventory Adjustment Tests ---"
PROD_LEDG_ID=$PROD_ICE_ID
STOCK_BEFORE_ADJ=$(curl -s -G --data-urlencode "q=น้ำแข็งหลอดเล็ก 5kg" "$POS_URL/api/pos/products/search" | python3 -c "import sys, json; print(json.load(sys.stdin)['items'][0]['on_hand_qty'])")

echo -n "Restock Adjustment (+10): "
ADJ_RESP=$(curl -s -X POST "$POS_URL/api/pos/inventory/adjust" \
    -H "Content-Type: application/json" \
    -d "{
        \"product_id\": \"$PROD_LEDG_ID\",
        \"qty_delta\": 10.0,
        \"reason\": \"Validation restock\",
        \"employee_id\": \"$TEST_MANAGER_ID\"
    }")
if echo "$ADJ_RESP" | grep -q '"status":"ok"' && echo "$ADJ_RESP" | grep -q '"qty_delta":10.0'; then
    echo "PASS"
else
    echo "FAIL: $ADJ_RESP"
    exit 1
fi

echo -n "Verify Stock Increased: "
STOCK_AFTER_POS=$(curl -s -G --data-urlencode "q=น้ำแข็งหลอดเล็ก 5kg" "$POS_URL/api/pos/products/search" | python3 -c "import sys, json; print(json.load(sys.stdin)['items'][0]['on_hand_qty'])")
EXPECTED_POS=$(python3 -c "print(float('$STOCK_BEFORE_ADJ') + 10)")
if [ "$STOCK_AFTER_POS" = "$EXPECTED_POS" ] || [ "$(printf \"%.0f\" \"$STOCK_AFTER_POS\")" = "$(printf \"%.0f\" \"$EXPECTED_POS\")" ]; then
    echo "PASS ($STOCK_AFTER_POS)"
else
    echo "FAIL: Got $STOCK_AFTER_POS, Expected $EXPECTED_POS"
    exit 1
fi

echo -n "Negative Adjustment (-5): "
ADJ_NEG_RESP=$(curl -s -X POST "$POS_URL/api/pos/inventory/adjust" \
    -H "Content-Type: application/json" \
    -d "{
        \"product_id\": \"$PROD_LEDG_ID\",
        \"qty_delta\": -5.0,
        \"reason\": \"Validation reduction\",
        \"employee_id\": \"$TEST_MANAGER_ID\"
    }")
if echo "$ADJ_NEG_RESP" | grep -q '"status":"ok"'; then
    echo "PASS"
else
    echo "FAIL: $ADJ_NEG_RESP"
    exit 1
fi

echo -n "Excessive Negative Rejection (allow_negative=false): "
# Ice is allow_negative=false by default in seeds
LARGE_NEG=$(python3 -c "print(-(float('$STOCK_AFTER_POS') + 100))")
ERR_ADJ=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$POS_URL/api/pos/inventory/adjust" \
    -H "Content-Type: application/json" \
    -d "{
        \"product_id\": \"$PROD_LEDG_ID\",
        \"qty_delta\": $LARGE_NEG,
        \"reason\": \"Illegal reduction\",
        \"employee_id\": \"$TEST_MANAGER_ID\"
    }")
if [ "$ERR_ADJ" = "500" ]; then
    echo "PASS"
else
    echo "FAIL: Got $ERR_ADJ, Expected 500"
    exit 1
fi

echo -n "Verify Ledger Entry: "
LEDGER_RESP=$(curl -s -X GET "$POS_URL/api/pos/inventory/ledger?product_id=$PROD_LEDG_ID&limit=5")
if echo "$LEDGER_RESP" | grep -q 'Validation restock' && echo "$LEDGER_RESP" | grep -q 'Validation reduction'; then
    echo "PASS"
else
    echo "FAIL: $LEDGER_RESP"
    exit 1
fi

echo -n "Verify Audit Log (INVENTORY_ADJUSTED): "
AUDIT_ADJ_RESP=$(curl -s -X GET "$POS_URL/api/pos/audit-log?limit=15")
if echo "$AUDIT_ADJ_RESP" | grep -q 'INVENTORY_ADJUSTED'; then
    echo "PASS"
else
    echo "FAIL"
    exit 1
fi

# 15. Product Catalog Management Tests
echo "--- Product Catalog Management Tests ---"
NEW_PROD_SKU="TEST-PROD-$(date +%s)"
echo -n "Create Product: "
CREATE_PROD_RESP=$(curl -s -X POST "$POS_URL/api/pos/products" \
    -H "Content-Type: application/json" \
    -d "{
        \"sku\": \"$NEW_PROD_SKU\",
        \"name\": \"Test Admin Product\",
        \"category_name\": \"Test\",
        \"uom\": \"unit\",
        \"unit_price\": 99.0,
        \"on_hand_qty\": 100.0,
        \"allow_negative_stock\": false
    }")
NEW_PROD_ID=$(echo "$CREATE_PROD_RESP" | jq -r '.product_id')
if [ "$NEW_PROD_ID" != "null" ] && [ -n "$NEW_PROD_ID" ]; then
    echo "PASS (ID: $NEW_PROD_ID)"
else
    echo "FAIL: $CREATE_PROD_RESP"
    exit 1
fi

echo -n "Reject Duplicate SKU: "
DUP_SKU_RESP=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$POS_URL/api/pos/products" \
    -H "Content-Type: application/json" \
    -d "{
        \"sku\": \"$NEW_PROD_SKU\",
        \"name\": \"Another Name\",
        \"category_name\": \"Test\",
        \"uom\": \"unit\",
        \"unit_price\": 50.0
    }")
if [ "$DUP_SKU_RESP" = "500" ]; then
    echo "PASS"
else
    echo "FAIL: Got $DUP_SKU_RESP, Expected 500"
    exit 1
fi

echo -n "Update Product Name/Price: "
UPDATE_RESP=$(curl -s -X PATCH "$POS_URL/api/pos/products/$NEW_PROD_ID" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"Updated Admin Product\",
        \"unit_price\": 120.0
    }")
if echo "$UPDATE_RESP" | grep -q '"success":true'; then
    echo "PASS"
else
    echo "FAIL: $UPDATE_RESP"
    exit 1
fi

echo -n "Verify Update: "
VERIFY_PROD=$(curl -s "$POS_URL/api/pos/products/$NEW_PROD_ID")
if echo "$VERIFY_PROD" | grep -q "Updated Admin Product" && echo "$VERIFY_PROD" | grep -q "120.00"; then
    echo "PASS"
else
    echo "FAIL: $VERIFY_PROD"
    exit 1
fi

echo -n "Deactivate Product: "
DEACT_RESP=$(curl -s -X POST "$POS_URL/api/pos/products/$NEW_PROD_ID/deactivate")
if echo "$DEACT_RESP" | grep -q '"success":true'; then
    echo "PASS"
else
    echo "FAIL: $DEACT_RESP"
    exit 1
fi

echo -n "Verify Inactive Product (Search should filter): "
SEARCH_INACT=$(curl -s -G --data-urlencode "q=$NEW_PROD_SKU" "$POS_URL/api/pos/products/search")
if echo "$SEARCH_INACT" | grep -q '"items":\[\]'; then
    echo "PASS"
else
    echo "FAIL: Product still visible in search"
    exit 1
fi

echo -n "Verify Audit Log (PRODUCT_CREATED, UPDATED, PRICE_CHANGED, DEACTIVATED): "
AUDIT_PROD_RESP=$(curl -s -X GET "$POS_URL/api/pos/audit-log?limit=20")
if echo "$AUDIT_PROD_RESP" | grep -q 'PRODUCT_CREATED' && \
   echo "$AUDIT_PROD_RESP" | grep -q 'PRODUCT_UPDATED' && \
   echo "$AUDIT_PROD_RESP" | grep -q 'PRODUCT_PRICE_CHANGED' && \
   echo "$AUDIT_PROD_RESP" | grep -q 'PRODUCT_DEACTIVATED'; then
    echo "PASS"
else
    echo "FAIL"
    exit 1
fi

# 16. Low Stock / Reorder Alert Tests
echo "--- Low Stock / Reorder Alert Tests ---"
REORDER_PROD_SKU="REORDER-$(date +%s)"
CREATE_REORDER_RESP=$(curl -s -X POST "$POS_URL/api/pos/products" \
    -H "Content-Type: application/json" \
    -d "{
        \"sku\": \"$REORDER_PROD_SKU\",
        \"name\": \"Reorder Test Product\",
        \"category_name\": \"Test\",
        \"uom\": \"unit\",
        \"unit_price\": 10.0,
        \"on_hand_qty\": 100.0,
        \"allow_negative_stock\": false
    }")
REORDER_PROD_ID=$(echo "$CREATE_REORDER_RESP" | jq -r '.product_id')

echo -n "Set Reorder Settings (Point: 50, Qty: 100): "
REORDER_SET_RESP=$(curl -s -X PATCH "$POS_URL/api/pos/products/$REORDER_PROD_ID/reorder-settings" \
    -H "Content-Type: application/json" \
    -d "{\"reorder_point\": 50.0, \"reorder_qty\": 100.0}")
if echo "$REORDER_SET_RESP" | grep -q '"success":true'; then
    echo "PASS"
else
    echo "FAIL: $REORDER_SET_RESP"
    exit 1
fi

echo -n "Adjust Stock Below Threshold (to 40): "
ADJUST_DOWN_RESP=$(curl -s -X POST "$POS_URL/api/pos/inventory/adjust" \
    -H "Content-Type: application/json" \
    -d "{
        \"product_id\": \"$REORDER_PROD_ID\",
        \"qty_delta\": -60.0,
        \"reason\": \"Test Depletion\",
        \"employee_id\": \"$TEST_CASHIER_ID\"
    }")
if echo "$ADJUST_DOWN_RESP" | grep -q '"success":true'; then
    echo "PASS"
else
    echo "FAIL: $ADJUST_DOWN_RESP"
    exit 1
fi

echo -n "Verify Low Stock Alert: "
LOW_STOCK_RESP=$(curl -s "$POS_URL/api/pos/inventory/low-stock")
if echo "$LOW_STOCK_RESP" | grep -q "$REORDER_PROD_SKU" && echo "$LOW_STOCK_RESP" | grep -q "LOW_STOCK"; then
    echo "PASS"
else
    echo "FAIL: Product not in low stock list: $LOW_STOCK_RESP"
    exit 1
fi

echo -n "Restock Above Threshold (to 140): "
RESTOCK_UP_RESP=$(curl -s -X POST "$POS_URL/api/pos/inventory/adjust" \
    -H "Content-Type: application/json" \
    -d "{
        \"product_id\": \"$REORDER_PROD_ID\",
        \"qty_delta\": 100.0,
        \"reason\": \"Test Restock\",
        \"employee_id\": \"$TEST_CASHIER_ID\"
    }")
if echo "$RESTOCK_UP_RESP" | grep -q '"success":true'; then
    echo "PASS"
else
    echo "FAIL: $RESTOCK_UP_RESP"
    exit 1
fi

echo -n "Verify Low Stock Clear: "
LOW_STOCK_CLEAR_RESP=$(curl -s "$POS_URL/api/pos/inventory/low-stock")
if ! echo "$LOW_STOCK_CLEAR_RESP" | grep -q "$REORDER_PROD_SKU"; then
    echo "PASS"
else
    echo "FAIL: Product still in low stock list"
    exit 1
fi

echo -n "Verify Reorder Audit: "
AUDIT_REORDER_RESP=$(curl -s -X GET "$POS_URL/api/pos/audit-log?limit=10")
if echo "$AUDIT_REORDER_RESP" | grep -q 'PRODUCT_REORDER_SETTINGS_UPDATED'; then
    echo "PASS"
else
    echo "FAIL"
    exit 1
fi

# 17. Purchase Order MVP Tests
echo "--- Purchase Order MVP Tests ---"
echo -n "Create Purchase Order: "
PO_CREATE_RESP=$(curl -s -X POST "$POS_URL/api/pos/purchase-orders" \
    -H "Content-Type: application/json" \
    -d "{
        \"supplier_name\": \"Ice Wholesaler Inc.\",
        \"notes\": \"Monthly restock\",
        \"employee_id\": \"$TEST_MANAGER_ID\",
        \"items\": [
            {\"product_id\": \"$REORDER_PROD_ID\", \"qty_ordered\": 200.0, \"unit_cost\": 8.50}
        ]
    }")
PO_ID=$(echo "$PO_CREATE_RESP" | jq -r '.po_id')
if [ "$PO_ID" != "null" ] && [ -n "$PO_ID" ]; then
    echo "PASS (ID: $PO_ID)"
else
    echo "FAIL: $PO_CREATE_RESP"
    exit 1
fi

echo -n "Verify PO in List: "
PO_LIST_RESP=$(curl -s "$POS_URL/api/pos/purchase-orders?status=ORDERED")
if echo "$PO_LIST_RESP" | grep -q "$PO_ID"; then
    echo "PASS"
else
    echo "FAIL: PO not in list"
    exit 1
fi

echo -n "Receive Purchase Order: "
STOCK_BEFORE_PO=$(curl -s "$POS_URL/api/pos/products/$REORDER_PROD_ID" | jq -r '.on_hand_qty')
RECEIVE_RESP=$(curl -s -X POST "$POS_URL/api/pos/purchase-orders/$PO_ID/receive?employee_id=$TEST_MANAGER_ID")
if echo "$RECEIVE_RESP" | grep -q '"success":true'; then
    echo "PASS"
else
    echo "FAIL: $RECEIVE_RESP"
    exit 1
fi

echo -n "Verify Stock Increased (+200): "
STOCK_AFTER_PO=$(curl -s "$POS_URL/api/pos/products/$REORDER_PROD_ID" | jq -r '.on_hand_qty')
EXPECTED_STOCK_PO=$(python3 -c "print(float('$STOCK_BEFORE_PO') + 200.0)")
if [ "$STOCK_AFTER_PO" = "$EXPECTED_STOCK_PO" ] || [ "$(printf \"%.0f\" \"$STOCK_AFTER_PO\")" = "$(printf \"%.0f\" \"$EXPECTED_STOCK_PO\")" ]; then
    echo "PASS (Before: $STOCK_BEFORE_PO, After: $STOCK_AFTER_PO)"
else
    echo "FAIL (Expected: $EXPECTED_STOCK_PO, Got: $STOCK_AFTER_PO)"
    exit 1
fi

echo -n "Verify Second Receive Rejected: "
REC2_RESP=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$POS_URL/api/pos/purchase-orders/$PO_ID/receive?employee_id=$TEST_MANAGER_ID")
if [ "$REC2_RESP" = "500" ]; then
    echo "PASS"
else
    echo "FAIL: Got $REC2_RESP, Expected 500"
    exit 1
fi

echo -n "Verify Stock Ledger Entry: "
LEDGER_PO_RESP=$(curl -s "$POS_URL/api/pos/inventory/ledger?product_id=$REORDER_PROD_ID&limit=5")
if echo "$LEDGER_PO_RESP" | grep -q "PO Receive"; then
    echo "PASS"
else
    echo "FAIL"
    exit 1
fi

echo -n "Verify Audit Log (PURCHASE_ORDER_CREATED, RECEIVED): "
AUDIT_PO_FINAL_RESP=$(curl -s -X GET "$POS_URL/api/pos/audit-log?limit=20")
if echo "$AUDIT_PO_FINAL_RESP" | grep -q 'PURCHASE_ORDER_CREATED' && \
   echo "$AUDIT_PO_FINAL_RESP" | grep -q 'PURCHASE_ORDER_RECEIVED'; then
    echo "PASS"
else
    echo "FAIL"
    exit 1
fi

echo "--- ALL POS API TESTS PASSED ---"

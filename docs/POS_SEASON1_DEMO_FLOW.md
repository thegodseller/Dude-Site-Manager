# DuDe Hawaiian POS - Season 1 Demo Flow

This guide outlines the verified operational flow for the DuDe Hawaiian POS Season 1 demonstration.

## Preparation
1. Ensure the backend services are running (`docker compose --profile pos up -d`).
2. Verify API connectivity (`bash scripts/validate_pos_api.sh`).
3. Open the POS Register in a browser.

## Step 1: Manager Authentication
- **Action**: Enter Manager PIN (Default: `1234` for Admin Test User).
- **Goal**: Demonstrate Role-Based Access Control (RBAC).

## Step 2: Open Shift
- **Action**: Click "OPEN SHIFT" and confirm.
- **Goal**: Initialize the financial and operational session.

## Step 3: Transaction Lifecycle
- **Action**: 
  - Search for "น้ำแข็ง" (Ice) or scan a barcode (e.g., `885001`).
  - Add items to cart.
  - Click "CHECKOUT".
  - Select "CASH" or "QR".
  - Click "CONFIRM & PRINT".
- **Goal**: Demonstrate core sales flow and stock deduction.

## Step 4: Receipt & History
- **Action**:
  - View the generated receipt.
  - Open "TICKETS" to see the history.
  - Search for a specific ticket number.
- **Goal**: Demonstrate traceability and record-keeping.

## Step 5: Manager Override (Void)
- **Action**:
  - Select a ticket in History.
  - Click "VOID TICKET".
  - (If logged in as cashier) Demonstrate the PIN prompt for Manager authorization.
- **Goal**: Demonstrate secure error correction and stock restoration.

## Step 6: Inventory Management
- **Action**:
  - Click "INVENTORY".
  - Search for a product.
  - Perform a manual adjustment (e.g., "Restock +10").
  - View the stock ledger for movement history.
- **Goal**: Demonstrate real-time stock control.

## Step 7: Low Stock Dashboard
- **Action**:
  - Click "LOW STOCK".
  - View items requiring attention.
  - Update a product's "Reorder Point".
- **Goal**: Demonstrate proactive replenishment alerts.

## Step 8: Reporting & Auditing
- **Action**:
  - Click "REPORT" to view the Daily Sales Report (Net Sales, Payment Breakdown, Top Items).
  - Click "AUDIT" to view the system-wide activity log.
- **Goal**: Demonstrate operational visibility and accountability.

## Step 9: Close Shift
- **Action**:
  - Click "CLOSE SHIFT".
  - Review the session summary.
- **Goal**: Finalize the operational cycle.

---

## Screenshot Mode (For Marketing/Docs)
Add `?screenshot=1&clean=1&shot=[TYPE]` to the URL to generate clean UI captures:
- `main`: Core register view.
- `stock`: Inventory management view.
- `success`: Post-checkout state.
- `void`: Voided ticket state.
- `summary`: Shift summary view.
- `receipt`: Receipt preview.

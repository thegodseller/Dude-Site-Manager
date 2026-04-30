import React, { useState, useEffect, useCallback } from 'react';
import '../pos_register.css';

interface Product {
  product_id: string;
  name: string;
  sku: string;
  barcode: string | null;
  unit_price: string;
  is_active: boolean;
  category_name?: string | null;
  uom?: string | null;
  on_hand_qty?: number | string | null;
  allow_negative_stock?: boolean | string | null;
}

interface CartItem extends Product {
  quantity: number;
}

interface Employee {
  id: string;
  display_name: string;
  role: string;
  is_active: boolean;
}

interface ShiftData {
  id?: string;
  shift_id: string;
  employee_id: string;
  status: 'OPEN' | 'CLOSED';
  opening_cash: string;
  actual_cash?: string | null;
  variance?: string | null;
  opened_at: string;
  closed_at?: string | null;
}

interface ShiftSummary {
  status: string;
  opened_at: string;
  closed_at: string | null;
  opening_cash: string;
  expected_cash: string;
  actual_cash: string | null;
  variance: string | null;
  confirmed_ticket_count: number;
  voided_ticket_count: number;
  gross_sales: string;
  voided_sales: string;
  net_sales: string;
  cash_sales: string;
  qr_sales: string;
  credit_sales: string;
  top_items: Array<{ name: string; quantity: number; total: string }>;
}

interface ReceiptData {
  business_name: string;
  ticket_id: string;
  ticket_no: string;
  status: string;
  created_at: string;
  shift_id: string;
  employee_id: string;
  items: Array<{
    product_id: string;
    name: string;
    qty: number;
    unit_price: string;
    line_total: string;
  }>;
  subtotal: string;
  vat_amount: string;
  total_amount: string;
  payment: {
    method: string;
    amount: string;
  };
  is_voided: boolean;
}

interface AuditLogEntry {
  id: string;
  event_type: string;
  actor_employee_id: string | null;
  target_type: string | null;
  target_id: string | null;
  reason: string | null;
  metadata: any;
  created_at: string;
}

interface TicketHistoryEntry {
  id: string;
  ticket_no: string;
  shift_id: string;
  status: string;
  total_amount: string;
  payment_method: string | null;
  created_at: string;
  created_by: string | null;
}

interface DailyReportData {
  success: boolean;
  status: string;
  date: string;
  confirmed_ticket_count: number;
  voided_ticket_count: number;
  gross_sales: string;
  voided_sales: string;
  net_sales: string;
  cash_sales: string;
  qr_sales: string;
  credit_sales: string;
  total_payments: string;
  top_items: {
    name: string;
    quantity: number;
    total: string;
  }[];
  shifts_included: number;
  cashier_summary: {
    employee_id: string;
    display_name: string;
    ticket_count: number;
    net_sales: string;
  }[];
}

interface LowStockItem {
  product_id: string;
  sku: string;
  barcode: string | null;
  name: string;
  category_name: string | null;
  uom: string;
  on_hand_qty: string;
  reorder_point: string;
  reorder_qty: string;
  stock_status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

interface StockLedgerEntry {
  id: string;
  product_id: string;
  product_name: string;
  qty_change: string;
  reason: string;
  created_at: string;
  actor_name: string | null;
}

const MOCK_PRODUCTS: Product[] = [
  { product_id: 'm1', name: 'น้ำแข็งหลอดเล็ก 5kg (MOCK)', sku: 'ICE-S-05', barcode: '885001', unit_price: '25.00', is_active: true, on_hand_qty: 10, allow_negative_stock: false },
  { product_id: 'm2', name: 'น้ำแข็งหลอดใหญ่ 10kg (MOCK)', sku: 'ICE-L-10', barcode: '885002', unit_price: '45.00', is_active: true, on_hand_qty: 2, allow_negative_stock: false },
  { product_id: 'm3', name: 'น้ำดื่ม Dude Pure 600ml (MOCK)', sku: 'WAT-600', barcode: '885003', unit_price: '10.00', is_active: true, on_hand_qty: 50, allow_negative_stock: true },
  { product_id: 'm4', name: 'น้ำแข็งป่นถุงกลาง (MOCK)', sku: 'ICE-P-08', barcode: '885004', unit_price: '35.00', is_active: true, on_hand_qty: 0, allow_negative_stock: false },
];

const LOW_STOCK_THRESHOLD = 5;

const parseStockQty = (value: Product['on_hand_qty']): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const allowsNegativeStock = (product: Product): boolean => {
  return product.allow_negative_stock === true || product.allow_negative_stock === 'true';
};

const normalizeProduct = (product: Product): Product => {
  const stockQty = parseStockQty(product.on_hand_qty);
  return {
    ...product,
    on_hand_qty: stockQty ?? undefined,
    allow_negative_stock: allowsNegativeStock(product)
  };
};

const getStockBadge = (stockQty: number) => {
  if (stockQty <= 0) return { label: 'Out of stock', className: 'out-of-stock' };
  if (stockQty <= LOW_STOCK_THRESHOLD) return { label: 'Low stock', className: 'low-stock' };
  return { label: 'In stock', className: 'in-stock' };
};

const canUseQuantity = (product: Product, quantity: number): boolean => {
  if (allowsNegativeStock(product)) return true;
  const stockQty = parseStockQty(product.on_hand_qty);
  return stockQty === null || quantity <= stockQty;
};

const getStockLimitMessage = (product: Product): string => {
  const stockQty = parseStockQty(product.on_hand_qty);
  if (stockQty === null) return 'Stock availability is unknown. Please refresh product search.';
  if (stockQty <= 0) return 'Out of stock. Please restock product before adding it.';
  return `Only ${stockQty} in stock. Please reduce quantity or restock product.`;
};

const normalizeShift = (shift: ShiftData): ShiftData => ({
  ...shift,
  shift_id: shift.shift_id || shift.id || ''
});

const DEMO_PRODUCTS: Product[] = [
  { product_id: 'd1', name: 'น้ำแข็งหลอดใหญ่ 10kg', sku: 'ICE-L-10', barcode: '885001', unit_price: '45.00', is_active: true, on_hand_qty: 42, allow_negative_stock: false, category_name: 'Ice' },
  { product_id: 'd2', name: 'น้ำแข็งหลอดเล็ก 5kg', sku: 'ICE-S-05', barcode: '885002', unit_price: '25.00', is_active: true, on_hand_qty: 18, allow_negative_stock: false, category_name: 'Ice' },
  { product_id: 'd3', name: 'น้ำแข็งป่นถุงกลาง', sku: 'ICE-P-08', barcode: '885003', unit_price: '35.00', is_active: true, on_hand_qty: 0, allow_negative_stock: false, category_name: 'Ice' },
  { product_id: 'd4', name: 'น้ำดื่ม Dude Pure 600ml', sku: 'WAT-600', barcode: '885004', unit_price: '10.00', is_active: true, on_hand_qty: 120, allow_negative_stock: true, category_name: 'Beverage' },
  { product_id: 'd5', name: 'น้ำดื่ม Dude Pure 1500ml', sku: 'WAT-1500', barcode: '885005', unit_price: '20.00', is_active: true, on_hand_qty: 4, allow_negative_stock: false, category_name: 'Beverage' },
  { product_id: 'd6', name: 'ถุงบรรจุน้ำแข็ง (L)', sku: 'PKG-L', barcode: '885006', unit_price: '5.00', is_active: true, on_hand_qty: 500, allow_negative_stock: true, category_name: 'Packaging' },
  { product_id: 'd7', name: 'ค่าจัดส่ง (Delivery)', sku: 'SVC-DEL', barcode: null, unit_price: '50.00', is_active: true, on_hand_qty: 999, allow_negative_stock: true, category_name: 'Service' },
  { product_id: 'd8', name: 'คูลเลอร์เก็บความเย็น', sku: 'ACC-CLR', barcode: '885008', unit_price: '450.00', is_active: true, on_hand_qty: 3, allow_negative_stock: false, category_name: 'Accessory' },
];

const DEMO_SHIFT: ShiftData = {
  shift_id: 'demo-shift-2026',
  employee_id: 'demo-admin',
  status: 'OPEN',
  opening_cash: '1000.00',
  opened_at: '2026-04-30T09:00:00.000Z'
};

const DEMO_CASHIER: Employee = {
  id: 'demo-cashier-id',
  display_name: 'Demo Cashier / POS Operator',
  role: 'CASHIER',
  is_active: true
};

const DEMO_CART_MAIN: CartItem[] = [
  { ...DEMO_PRODUCTS[4], quantity: 2 },
  { ...DEMO_PRODUCTS[1], quantity: 2 },
  { ...DEMO_PRODUCTS[3], quantity: 3 },
];

const DEMO_STOCK_WARNING = 'Stock limit reached. Reduce quantity or restock product.';

const DEMO_PROOF_PANELS = [
  { label: 'Today Sales', value: '฿8,420', tone: 'orange' },
  { label: 'Tickets', value: '128', tone: 'green' },
  { label: 'Inventory Sync', value: 'Live', tone: 'green' },
  { label: 'Shift Cash', value: 'Balanced', tone: 'green' },
];

const RECEIPT_LINE_ITEMS = [
  { name: 'น้ำดื่ม Dude Pure 1500ml', qty: 2, total: '฿40.00' },
  { name: 'น้ำแข็งหลอดเล็ก 5kg', qty: 2, total: '฿50.00' },
  { name: 'น้ำดื่ม Dude Pure 600ml', qty: 3, total: '฿30.00' },
];

const DEMO_SUCCESS_TICKET = {
  ticket_id: 'demo-tk-128',
  ticket_no: 'POS-2026-000128',
  total_amount: '120.00',
  status: 'COMPLETED'
};

const DEMO_VOID_TICKET = {
  ...DEMO_SUCCESS_TICKET,
  status: 'VOIDED'
};

const AUTHORIZED_VOID_ROLES = ['MANAGER', 'ADMIN', 'SUPERVISOR', 'OWNER'];

const buildDemoCart = (items: CartItem[]): CartItem[] => (
  items.map(item => ({ ...normalizeProduct(item), quantity: item.quantity }))
);

const buildStockDemoCart = (): CartItem[] => {
  const lowStockItem = DEMO_PRODUCTS[4];
  return [{ ...normalizeProduct(lowStockItem), quantity: 4 }];
};

export const POSRegister: React.FC = () => {
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const isScreenshotMode = params.get('screenshot') === '1';
  const isCleanCapture = isScreenshotMode && params.get('clean') === '1';
  const shotMode = params.get('shot') || 'main';

  const [query, setQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [products, setProducts] = useState<Product[]>(() => (
    isScreenshotMode ? DEMO_PRODUCTS.map(product => normalizeProduct(product)) : []
  ));
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (!isScreenshotMode) return [];
    return shotMode === 'stock' ? buildStockDemoCart() : buildDemoCart(DEMO_CART_MAIN);
  });
  const [isVat, setIsVat] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'PROMPTPAY' | 'CREDIT'>(() => (
    isScreenshotMode && shotMode === 'success' ? 'PROMPTPAY' : 'CASH'
  ));
  const [serviceStatus, setServiceStatus] = useState({ 
    backend: isScreenshotMode ? 'ok' : 'checking',
    db: isScreenshotMode ? 'ok' : 'checking',
    catalog: isScreenshotMode ? 'ready' : 'unknown'
  });
  const [isMock, setIsMock] = useState(!isScreenshotMode);
  const [showModal, setShowModal] = useState<string | null>(() => {
    if (!isScreenshotMode) return null;
    if (shotMode === 'success') return 'ticket_success';
    if (shotMode === 'void') return 'void_success';
    return null;
  });
  const [cartWarning, setCartWarning] = useState<{ product_id: string; message: string } | null>(() => (
    isScreenshotMode && shotMode === 'stock'
      ? { product_id: DEMO_PRODUCTS[4].product_id, message: DEMO_STOCK_WARNING }
      : null
  ));

  // Shift Management State
  const [currentShift, setCurrentShift] = useState<ShiftData | null>(() => (
    isScreenshotMode ? DEMO_SHIFT : null
  ));
  const [shiftLoading, setShiftLoading] = useState(false);
  const [shiftError, setShiftError] = useState<string | null>(null);

  // Cashier Session State
  const [currentCashier, setCurrentCashier] = useState<Employee | null>(() => {
    if (isScreenshotMode) return DEMO_CASHIER;
    const stored = localStorage.getItem('dude_pos_active_cashier');
    return stored ? JSON.parse(stored) : null;
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedCashierId, setSelectedCashierId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [openingCashInput, setOpeningCashInput] = useState('0');
  const [actualCashInput, setActualCashInput] = useState(() => (
    isScreenshotMode ? DEMO_SHIFT.opening_cash : '0'
  ));

  // Checkout State
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [lastTicket, setLastTicket] = useState<{
    ticket_id: string;
    ticket_no: string;
    total_amount: string;
    status: string;
  } | null>(() => {
    if (!isScreenshotMode) return null;
    if (shotMode === 'success') return DEMO_SUCCESS_TICKET;
    if (shotMode === 'void') return DEMO_VOID_TICKET;
    return null;
  });
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [voidReason, setVoidReason] = useState('Cashier correction');
  const [voidLoading, setVoidLoading] = useState(false);

  // Shift Summary State
  const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Receipt State
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  // Manager Override State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideManagerId, setOverrideManagerId] = useState<string | null>(null);
  const [overridePin, setOverridePin] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Staff Management State
  const [managementLoading, setManagementLoading] = useState(false);
  const [managementError, setManagementError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [staffForm, setStaffForm] = useState({ display_name: '', role: 'CASHIER', pin_code: '' });
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLimit, setAuditLimit] = useState(50);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Ticket History State
  const [ticketHistory, setTicketHistory] = useState<TicketHistoryEntry[]>([]);
  const [historyLimit, setHistoryLimit] = useState(50);
  const [historyStatus, setHistoryStatus] = useState('ALL');
  const [historySearch, setHistorySearch] = useState('');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Daily Report State
  const [dailyReportDate, setDailyReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyReport, setDailyReport] = useState<DailyReportData | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Inventory State
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedInventoryProduct, setSelectedInventoryProduct] = useState<Product | null>(null);
  const [inventoryLedger, setInventoryLedger] = useState<StockLedgerEntry[]>([]);
  const [adjustQtyDelta, setAdjustQtyDelta] = useState('');
  const [adjustReason, setAdjustReason] = useState('Restock');
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  // Product Catalog State
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productFormData, setProductFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    category_name: '',
    uom: 'pcs',
    unit_price: '',
    on_hand_qty: '0',
    allow_negative_stock: false
  });

  // Low Stock Dashboard State
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [isLowStockLoading, setIsLowStockLoading] = useState(false);
  const [lowStockError, setLowStockError] = useState<string | null>(null);
  const [editingReorderProduct, setEditingReorderProduct] = useState<LowStockItem | null>(null);
  const [reorderFormData, setReorderFormData] = useState({
    reorder_point: '',
    reorder_qty: ''
  });

  // Health check
  const checkHealth = async () => {
    try {
      const res = await fetch('/ag_pos_health');
      const data = await res.json();
      const backendOk = data.status === 'ok';
      setServiceStatus(prev => ({ ...prev, backend: backendOk ? 'ok' : 'error' }));
      
      const dbRes = await fetch('/ag_pos_health/db');
      const dbData = await dbRes.json();
      setServiceStatus(prev => ({ ...prev, db: dbData.database === 'ok' ? 'ok' : 'error' }));

      // Check catalog status
      const schemaRes = await fetch('/ag_pos_api/schema/status');
      const schemaData = await schemaRes.json();
      // If products table exists, it's live (though POS-008 checks candidates)
      // For now, if we can successfully search and it's not product_source_missing
      setServiceStatus(prev => ({ ...prev, catalog: schemaData.status === 'ok' ? 'ready' : 'missing' }));
    } catch {
      setServiceStatus({ backend: 'error', db: 'error', catalog: 'error' });
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/ag_pos_api/employees');
      const data = await res.json();
      if (data.success) {
        setEmployees(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const fetchCurrentShift = async (empId: string) => {
    setShiftLoading(true);
    try {
      const res = await fetch(`/ag_pos_api/shifts/current?employee_id=${empId}`);
      const data = await res.json();
      if (data.success && data.shift) {
        setCurrentShift(normalizeShift(data.shift));
        setActualCashInput(data.shift.opening_cash);
        fetchShiftSummary(data.shift.shift_id || data.shift.id);
      } else {
        setCurrentShift(null);
      }
    } catch (err) {
      console.error('Failed to fetch shift:', err);
      setShiftError('Failed to sync shift status.');
    } finally {
      setShiftLoading(false);
    }
  };

  const handleCashierLogin = async () => {
    if (!selectedCashierId || pin.length < 4) return;
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('/ag_pos_api/employees/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: selectedCashierId, pin_code: pin })
      });
      const data = await res.json();
      if (data.success) {
        const cashier = data.employee;
        setCurrentCashier(cashier);
        localStorage.setItem('dude_pos_active_cashier', JSON.stringify(cashier));
        setPin('');
        fetchCurrentShift(cashier.id);
      } else {
        setLoginError(data.message || 'Login failed. Check PIN.');
      }
    } catch (err) {
      setLoginError('Network error during login.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!currentCashier) return;
    if (currentShift) {
      alert('Close active shift before ending session.');
      return;
    }
    
    try {
      await fetch('/ag_pos_api/employees/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: currentCashier.id })
      });
    } catch (err) {
      console.error('End session call failed:', err);
    }

    setCurrentCashier(null);
    localStorage.removeItem('dude_pos_active_cashier');
    setSelectedCashierId(null);
    setPin('');
    setProducts([]);
    setCart([]);
    fetchEmployees();
  };

  useEffect(() => {
    if (isScreenshotMode) {
      setServiceStatus({ backend: 'ok', db: 'ok', catalog: 'ready' });
      setIsMock(false);
      setPaymentMethod(shotMode === 'success' ? 'PROMPTPAY' : 'CASH');
      setCurrentShift(DEMO_SHIFT);
      setCurrentCashier(DEMO_CASHIER);
      // ... rest of shotMode logic

      if (shotMode === 'main' || shotMode === 'success' || shotMode === 'void') {
        setProducts(DEMO_PRODUCTS.map(product => normalizeProduct(product)));
        setCart(buildDemoCart(DEMO_CART_MAIN));
        if (shotMode === 'success') {
          setLastTicket(DEMO_SUCCESS_TICKET);
          setShowModal('ticket_success');
        }
        if (shotMode === 'void') {
          setLastTicket(DEMO_VOID_TICKET);
          setShowModal('void_success');
        }
      } else if (shotMode === 'stock') {
        setProducts(DEMO_PRODUCTS.map(product => normalizeProduct(product)));
        const lowStockItem = DEMO_PRODUCTS[4]; // WAT-1500 (Qty 4)
        setCart(buildStockDemoCart());
        setCartWarning({ product_id: lowStockItem.product_id, message: DEMO_STOCK_WARNING });
      }

      setShiftSummary({
        status: 'OPEN',
        opened_at: DEMO_SHIFT.opened_at,
        closed_at: null,
        opening_cash: '1000.00',
        expected_cash: '1120.00',
        actual_cash: null,
        variance: null,
        confirmed_ticket_count: 3,
        voided_ticket_count: 1,
        gross_sales: '155.00',
        voided_sales: '35.00',
        net_sales: '120.00',
        cash_sales: '0.00',
        qr_sales: '120.00',
        credit_sales: '0.00',
        top_items: [
          { name: 'น้ำแข็งหลอดเล็ก 5kg', quantity: 2, total: '50.00' },
          { name: 'น้ำดื่ม Dude Pure 1500ml', quantity: 2, total: '40.00' },
          { name: 'น้ำดื่ม Dude Pure 600ml', quantity: 3, total: '30.00' },
        ]
      });
      return;
    }

    checkHealth();
    if (currentCashier) {
      fetchCurrentShift(currentCashier.id);
    } else {
      fetchEmployees();
    }
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [isScreenshotMode, shotMode, currentCashier?.id]);

  const handleOpenShift = async () => {
    if (isScreenshotMode) return;
    setShiftLoading(true);
    setShiftError(null);
    try {
      const res = await fetch('/ag_pos_api/shifts/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: currentCashier?.id,
          opening_cash: parseFloat(openingCashInput)
        })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentShift(normalizeShift(data.shift));
        fetchShiftSummary(data.shift.shift_id || data.shift.id);
        setShowModal(null);
      } else {
        setShiftError(data.message || 'Failed to open shift.');
      }
    } catch (err) {
      setShiftError('Network error opening shift.');
    } finally {
      setShiftLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (isScreenshotMode) return;
    if (!currentShift) return;
    setShiftLoading(true);
    setShiftError(null);
    try {
      const res = await fetch('/ag_pos_api/shifts/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift_id: currentShift.shift_id,
          actual_cash: parseFloat(actualCashInput)
        })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentShift(null);
        setShowModal(null);
        alert(`Shift Closed. Variance: ${formatCurrency(parseFloat(data.shift.variance || '0'))}`);
      } else {
        setShiftError(data.message || 'Failed to close shift.');
      }
    } catch (err) {
      setShiftError('Network error closing shift.');
    } finally {
      setShiftLoading(false);
    }
  };

  // Search logic
  const searchProducts = useCallback(async (q: string = '', bc: string = '') => {
    try {
      const url = new URL('/ag_pos_api/products/search', window.location.origin);
      if (q) {
        url.searchParams.append('q', q);
        url.searchParams.append('limit', '20');
      }
      if (bc) {
        url.searchParams.append('barcode', bc);
        url.searchParams.append('limit', '1');
      }
      if (!q && !bc) {
        url.searchParams.append('limit', '20');
      }
      
      const res = await fetch(url.toString());
      const data = await res.json();
      
      if (data.success) {
        setProducts((data.items || []).map((item: Product) => normalizeProduct(item)));
        setIsMock(false);
      } else if (data.status === 'product_source_missing' || !data.success) {
        setIsMock(true);
        // Fallback to mock data if q or bc matches
        const filteredMock = MOCK_PRODUCTS.filter(p => 
          (q && (p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))) || 
          (bc && p.barcode === bc) ||
          (!q && !bc)
        );
        setProducts(filteredMock.map(product => normalizeProduct(product)));
      }
    } catch {
      setIsMock(true);
      setProducts(MOCK_PRODUCTS.map(product => normalizeProduct(product)));
    }
  }, []);

  useEffect(() => {
    if (isScreenshotMode) return;
    const timer = setTimeout(() => searchProducts(query, barcode), 300);
    return () => clearTimeout(timer);
  }, [query, barcode, searchProducts, isScreenshotMode]);

  // Cart operations
  const addToCart = (product: Product) => {
    const normalizedProduct = normalizeProduct(product);
    const existing = cart.find(item => item.product_id === normalizedProduct.product_id);

    if (existing) {
      const nextQuantity = existing.quantity + 1;
      const nextItem = { ...existing, ...normalizedProduct, quantity: existing.quantity };
      if (!canUseQuantity(nextItem, nextQuantity)) {
        setCartWarning({ product_id: existing.product_id, message: getStockLimitMessage(nextItem) });
        return;
      }

      setCartWarning(null);
      setCart(cart.map(item =>
        item.product_id === normalizedProduct.product_id
          ? { ...item, ...normalizedProduct, quantity: nextQuantity }
          : item
      ));
      return;
    }

    if (!canUseQuantity(normalizedProduct, 1)) {
      setCartWarning({ product_id: normalizedProduct.product_id, message: getStockLimitMessage(normalizedProduct) });
      return;
    }

    setCartWarning(null);
    setCart([...cart, { ...normalizedProduct, quantity: 1 }]);
  };

  const updateQuantity = (id: string, delta: number) => {
    const item = cart.find(cartItem => cartItem.product_id === id);
    if (!item) return;

    const newQty = Math.max(1, item.quantity + delta);
    if (delta > 0 && !canUseQuantity(item, newQty)) {
      setCartWarning({ product_id: item.product_id, message: getStockLimitMessage(item) });
      return;
    }

    setCartWarning(null);
    setCart(cart.map(cartItem =>
      cartItem.product_id === id
        ? { ...cartItem, quantity: newQty }
        : cartItem
    ));
  };

  const handleCheckout = async () => {
    if (isScreenshotMode) return;
    if (!currentShift?.shift_id || cart.length === 0) return;
    
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const ticketItems = cart.map(item => {
        const unitPrice = parseFloat(item.unit_price);
        return {
          product_id: item.product_id,
          qty: item.quantity,
          unit_price: unitPrice,
          master_price: unitPrice
        };
      });

      const res = await fetch('/ag_pos_api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift_id: currentShift.shift_id,
          vat_mode: isVat ? 'VAT' : 'NO_VAT',
          vat_calc_mode: 'EXCLUSIVE',
          vat_rate: isVat ? 7 : 0,
          items: ticketItems,
          payment: {
            method: paymentMethod,
            amount: total
          },
          employee_id: currentCashier?.id
        })
      });
      
      const data = await res.json().catch(() => ({
        success: false,
        message: res.statusText || 'Checkout failed'
      }));
      if (data.success) {
        setLastTicket(data.ticket ?? {
          ticket_id: data.ticket_id,
          ticket_no: data.ticket_no,
          total_amount: data.total_amount,
          status: data.status
        });
        setCart([]);
        setShowModal('ticket_success');
        if (currentShift) fetchShiftSummary(currentShift.shift_id);
      } else {
        // Detailed error handling
        const detail = Array.isArray(data.detail)
          ? data.detail.map((entry: { msg?: string }) => entry.msg || 'Invalid checkout data').join('; ')
          : data.detail;
        let msg = data.message || detail || 'Checkout failed';
        if (res.status === 400) msg = `Invalid Data: ${msg}`;
        if (res.status === 404) msg = `Not Found: ${msg}`;
        if (res.status === 409) {
          msg = String(msg).toLowerCase().includes('insufficient stock')
            ? 'Insufficient stock. Please reduce quantity or restock product.'
            : `Conflict: ${msg}`;
        }
        setCheckoutError(msg);
        setShowModal('error');
      }
    } catch (err) {
      setCheckoutError('Network error. Check server connectivity.');
      setShowModal('error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const fetchShiftSummary = async (shiftId: string) => {
    if (isScreenshotMode) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await fetch(`/ag_pos_api/shifts/${shiftId}/summary`);
      const data = await res.json();
      if (data.success) {
        setShiftSummary(data.summary);
      } else {
        setSummaryError(data.message || 'Failed to fetch summary');
      }
    } catch (err) {
      setSummaryError('Network error');
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchReceipt = async (ticketId: string) => {
    if (isScreenshotMode) return;
    setReceiptLoading(true);
    setReceiptError(null);
    try {
      const res = await fetch(`/ag_pos_api/tickets/${ticketId}/receipt`);
      const data = await res.json();
      if (data.success) {
        setReceiptData(data.receipt);
      } else {
        setReceiptError(data.message || 'Failed to load receipt');
      }
    } catch (err) {
      setReceiptError('Network error');
    } finally {
      setReceiptLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleVoid = async (overrideEmpId?: string) => {
    if (!lastTicket || (!currentShift && !isScreenshotMode)) return;

    // Screenshot Mode deterministic behavior
    if (isScreenshotMode) {
      setLastTicket(prev => prev ? { ...prev, status: 'VOIDED' } : null);
      setShowModal('void_success_real');
      return;
    }

    if (lastTicket.status === 'VOIDED') return;

    // RBAC Check
    const effectiveEmpId = overrideEmpId || currentCashier?.id;
    const effectiveRole = overrideEmpId 
      ? employees.find(e => e.id === overrideEmpId)?.role 
      : currentCashier?.role;

    if (!AUTHORIZED_VOID_ROLES.includes(effectiveRole?.toUpperCase() || '')) {
      setShowOverrideModal(true);
      return;
    }

    setVoidLoading(true);
    try {
      const res = await fetch(`/ag_pos_api/tickets/${lastTicket.ticket_id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason: voidReason + (overrideEmpId ? ' (Manager Override)' : ''), 
          employee_id: effectiveEmpId 
        })
      });

      const data = await res.json();
      if (data.success) {
        setLastTicket(prev => prev ? { ...prev, status: 'VOIDED' } : null);
        setShowModal('void_success_real');
        if (currentShift) fetchShiftSummary(currentShift.shift_id);
        if (showModal === 'receipt_preview' && lastTicket) fetchReceipt(lastTicket.ticket_id);
      } else {
        alert(`Void Failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Network error during void request.');
    } finally {
      setVoidLoading(false);
    }
  };

  const handleManagerOverride = async () => {
    if (!overrideManagerId || overridePin.length < 4) {
      setOverrideError('Select manager and enter valid PIN');
      return;
    }
    setOverrideLoading(true);
    setOverrideError(null);
    try {
      const res = await fetch('/ag_pos_api/employees/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: overrideManagerId, pin_code: overridePin })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        const manager = data.employee;
        if (AUTHORIZED_VOID_ROLES.includes(manager.role.toUpperCase())) {
          setShowOverrideModal(false);
          setOverridePin('');
          await handleVoid(manager.id);
        } else {
          setOverrideError('Selected employee is not authorized for voids');
        }
      } else {
        setOverrideError(data.message || 'Invalid Manager PIN');
      }
    } catch (err) {
      setOverrideError('Network error during override verification');
    } finally {
      setOverrideLoading(false);
    }
  };

  // Staff Management Functions
  const fetchStaff = async () => {
    setManagementLoading(true);
    try {
      const res = await fetch('/ag_pos_api/employees');
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (err) {
      setManagementError('Failed to fetch staff list');
    } finally {
      setManagementLoading(false);
    }
  };

  const handleCreateEmployee = async () => {
    if (!staffForm.display_name || !staffForm.pin_code) {
      setManagementError('Name and PIN are required');
      return;
    }
    setManagementLoading(true);
    try {
      const res = await fetch('/ag_pos_api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm)
      });
      const data = await res.json();
      if (data.success) {
        await fetchStaff();
        setIsAddingEmployee(false);
        setStaffForm({ display_name: '', role: 'CASHIER', pin_code: '' });
      } else {
        setManagementError(data.message || 'Failed to create employee');
      }
    } catch (err) {
      setManagementError('Network error during employee creation');
    } finally {
      setManagementLoading(false);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;
    setManagementLoading(true);
    try {
      const res = await fetch(`/ag_pos_api/employees/${editingEmployee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: staffForm.display_name,
          role: staffForm.role
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchStaff();
        setEditingEmployee(null);
      } else {
        setManagementError(data.message || 'Failed to update employee');
      }
    } catch (err) {
      setManagementError('Network error during update');
    } finally {
      setManagementLoading(false);
    }
  };

  const handleDeactivateEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) return;
    setManagementLoading(true);
    try {
      const res = await fetch(`/ag_pos_api/employees/${id}/deactivate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchStaff();
      }
    } catch (err) {
      setManagementError('Failed to deactivate employee');
    } finally {
      setManagementLoading(false);
    }
  };

  const handleResetPin = async (id: string) => {
    if (!newPinInput || newPinInput.length < 4) {
      setManagementError('Valid new PIN required');
      return;
    }
    setManagementLoading(true);
    try {
      const res = await fetch(`/ag_pos_api/employees/${id}/reset-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_pin: newPinInput })
      });
      const data = await res.json();
      if (data.success) {
        alert('PIN reset successful');
        setIsResettingPin(false);
        setNewPinInput('');
        await fetchStaff();
      } else {
        setManagementError(data.message || 'Failed to reset PIN');
      }
    } catch (err) {
      setManagementError('Network error during PIN reset');
    } finally {
      setManagementLoading(false);
    }
  };

  // Audit Log Functions
  const fetchAuditLogs = async (limit = auditLimit) => {
    setIsAuditLoading(true);
    setAuditError(null);
    try {
      const res = await fetch(`/ag_pos_api/audit-log?limit=${limit}`);
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs);
      } else {
        setAuditError(data.message || 'Failed to fetch audit logs');
      }
    } catch (err) {
      setAuditError('Network error while fetching audit logs');
    } finally {
      setIsAuditLoading(false);
    }
  };

  const fetchTicketHistory = async (limit = historyLimit, status = historyStatus, q = historySearch) => {
    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      let url = `/ag_pos_api/tickets?limit=${limit}`;
      if (status !== 'ALL') url += `&status=${status}`;
      if (q) url += `&q=${encodeURIComponent(q)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTicketHistory(data.tickets);
      } else {
        setHistoryError(data.message || 'Failed to fetch ticket history');
      }
    } catch (err) {
      setHistoryError('Network error while fetching ticket history');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const fetchDailyReport = async (date = dailyReportDate) => {
    setIsReportLoading(true);
    setReportError(null);
    try {
      const res = await fetch(`/ag_pos_api/reports/daily?date=${date}`);
      const data = await res.json();
      if (data.success) {
        setDailyReport(data);
      } else {
        setReportError(data.message || 'Failed to fetch daily report');
      }
    } catch (err) {
      setReportError('Network error while fetching daily report');
    } finally {
      setIsReportLoading(false);
    }
  };

  const fetchStockLedger = async (productId: string) => {
    try {
      const res = await fetch(`/ag_pos_api/inventory/ledger?product_id=${productId}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setInventoryLedger(data.ledger);
      }
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    }
  };

  const handleAdjustInventory = async () => {
    if (!selectedInventoryProduct || !currentCashier) return;
    
    const delta = parseFloat(adjustQtyDelta);
    if (isNaN(delta) || delta === 0) {
      setInventoryError('Please enter a valid non-zero quantity');
      return;
    }

    setIsInventoryLoading(true);
    setInventoryError(null);
    try {
      const res = await fetch('/ag_pos_api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedInventoryProduct.product_id,
          qty_delta: delta,
          reason: adjustReason,
          employee_id: currentCashier.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedInventoryProduct({
          ...selectedInventoryProduct,
          on_hand_qty: data.new_qty
        });
        setAdjustQtyDelta('');
        searchProducts(inventorySearch);
        fetchStockLedger(selectedInventoryProduct.product_id);
      } else {
        setInventoryError(data.detail || data.message || 'Adjustment failed');
      }
    } catch (err) {
      setInventoryError('Network error during adjustment');
    } finally {
      setIsInventoryLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!currentCashier) return;
    setIsCatalogLoading(true);
    setCatalogError(null);
    try {
      const res = await fetch(`/ag_pos_api/products?employee_id=${currentCashier.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productFormData,
          unit_price: parseFloat(productFormData.unit_price),
          on_hand_qty: parseFloat(productFormData.on_hand_qty)
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsAddingProduct(false);
        setProductFormData({
          sku: '', barcode: '', name: '', category_name: '', uom: 'pcs', unit_price: '', on_hand_qty: '0', allow_negative_stock: false
        });
        searchProducts(catalogSearch);
      } else {
        setCatalogError(data.detail || data.message || 'Creation failed');
      }
    } catch (err) {
      setCatalogError('Network error');
    } finally {
      setIsCatalogLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !currentCashier) return;
    setIsCatalogLoading(true);
    setCatalogError(null);
    try {
      const res = await fetch(`/ag_pos_api/products/${editingProduct.product_id}?employee_id=${currentCashier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productFormData.name,
          category_name: productFormData.category_name,
          barcode: productFormData.barcode,
          uom: productFormData.uom,
          unit_price: parseFloat(productFormData.unit_price),
          allow_negative_stock: productFormData.allow_negative_stock
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditingProduct(null);
        searchProducts(catalogSearch);
      } else {
        setCatalogError(data.detail || data.message || 'Update failed');
      }
    } catch (err) {
      setCatalogError('Network error');
    } finally {
      setIsCatalogLoading(false);
    }
  };

  const handleDeactivateProduct = async (productId: string) => {
    if (!currentCashier) return;
    if (!window.confirm('Are you sure you want to deactivate this product? It will no longer be sellable, but historical data will be preserved.')) return;
    
    setIsCatalogLoading(true);
    try {
      const res = await fetch(`/ag_pos_api/products/${productId}/deactivate?employee_id=${currentCashier.id}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setEditingProduct(null);
        searchProducts(catalogSearch);
      }
    } catch (err) {
      console.error('Deactivation failed:', err);
    } finally {
      setIsCatalogLoading(false);
    }
  };

  const fetchLowStock = async () => {
    setIsLowStockLoading(true);
    setLowStockError(null);
    try {
      const res = await fetch('/ag_pos_api/inventory/low-stock');
      const data = await res.json();
      if (data.success) {
        setLowStockItems(data.items);
      } else {
        setLowStockError(data.message || 'Failed to fetch low stock alerts');
      }
    } catch (err) {
      setLowStockError('Network error');
    } finally {
      setIsLowStockLoading(false);
    }
  };

  const handleUpdateReorderSettings = async () => {
    if (!editingReorderProduct || !currentCashier) return;
    setIsLowStockLoading(true);
    try {
      const res = await fetch(`/ag_pos_api/products/${editingReorderProduct.product_id}/reorder-settings?employee_id=${currentCashier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reorder_point: parseFloat(reorderFormData.reorder_point),
          reorder_qty: parseFloat(reorderFormData.reorder_qty)
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditingReorderProduct(null);
        fetchLowStock();
      } else {
        setLowStockError(data.detail || data.message || 'Update failed');
      }
    } catch (err) {
      setLowStockError('Network error');
    } finally {
      setIsLowStockLoading(false);
    }
  };

  const getEventColor = (type: string) => {
    if (type.includes('VOID')) return 'inactive';
    if (type.includes('DEACTIVATED')) return 'inactive';
    if (type.includes('CREATED') || type.includes('OPENED')) return 'active';
    return '';
  };

  const sanitizeMetadata = (meta: any) => {
    if (!meta) return {};
    const sanitized = { ...meta };
    const suspiciousKeys = ['pin', 'pin_code', 'pin_code_hash', 'pin_hash', 'salt', 'pin_salt'];
    suspiciousKeys.forEach(key => {
      if (key in sanitized) {
        sanitized[key] = '***REDACTED***';
      }
    });
    return sanitized;
  };

  // Calculations with formatting
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.unit_price) * item.quantity), 0);
  const vatAmount = isVat ? subtotal * 0.07 : 0;
  const total = subtotal + vatAmount;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', { 
      style: 'currency', 
      currency: 'THB',
      minimumFractionDigits: 2 
    }).format(val).replace('฿', '฿ ');
  };

  return (
    <div className={`pos-container ${isScreenshotMode ? `screenshot-mode shot-${shotMode}` : ''} ${isCleanCapture ? 'clean-capture' : ''}`}>
      {/* Main Panel */}
      <div className="main-panel">
        {isScreenshotMode && !isCleanCapture && (
          <div className="demo-badge">DEMO CAPTURE MODE: {shotMode.toUpperCase()}</div>
        )}
        <div className="pos-header">
          <div className="flex flex-col">
            <h2 className="font-tech text-xl text-glow text-orange-500">POS REGISTER v0.2</h2>
            {!isCleanCapture && <div className={`text-[9px] font-bold tracking-widest mt-1 ${isMock ? 'text-yellow-500' : 'text-green-500'}`}>
              {isMock ? '● MOCK CATALOG MODE' : '● LIVE PRODUCT CATALOG MODE'}
            </div>}
          </div>
          <div className="status-group">
            <div className={`status-badge ${serviceStatus.backend}`} title="ag_pos service status">
              <div className="status-dot"></div>
              {isCleanCapture ? 'System: Live' : `Backend: ${serviceStatus.backend}`}
            </div>
            <div className={`status-badge ${serviceStatus.db}`} title="PostgreSQL connection status">
              <div className="status-dot"></div>
              {isCleanCapture ? 'Ledger: Synced' : `DB: ${serviceStatus.db}`}
            </div>
            <div className={`status-badge ${currentShift ? 'ok' : 'error'}`} title="Current shift status">
              <div className="status-dot"></div>
              Shift: {currentShift ? 'OPEN' : 'NO SHIFT'}
            </div>
            {currentCashier && (
              <div className="cashier-header-info">
                <div className="cashier-avatar">{currentCashier.display_name.charAt(0)}</div>
                <div className="cashier-meta">
                  <span className="name">{currentCashier.display_name}</span>
                  <span className="role">{currentCashier.role}</span>
                </div>
                {!isScreenshotMode && (
                  <button className="end-session-btn" onClick={handleEndSession}>End Session</button>
                )}
              </div>
            )}
          </div>
        </div>

        {isScreenshotMode && (
          <div className="capture-action-row">
            <div className="capture-action-copy">
              <span>Counter 01</span>
              <strong>Live cashier session</strong>
            </div>
            <button className="payment-btn" onClick={() => setShowModal('summary')}>SHIFT SUMMARY</button>
            <button className="payment-btn active">SHIFT CONTROL</button>
            <button className="payment-btn">VOID / REFUND</button>
          </div>
        )}

        <div className="search-bar">
          <input 
            type="text" 
            className="input-glow" 
            placeholder="Search products (Name, SKU)..." 
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setBarcode(''); // Clear barcode when typing search
            }}
          />
          <input 
            type="text" 
            className="input-glow" 
            placeholder="Barcode Scan..." 
            value={barcode}
            onChange={(e) => {
              setBarcode(e.target.value);
              setQuery(''); // Clear query when scanning
            }}
          />
        </div>

        {isScreenshotMode && shotMode === 'main' && (
          <div className="capture-proof-grid">
            {DEMO_PROOF_PANELS.map(panel => (
              <div key={panel.label} className={`capture-proof-card ${panel.tone}`}>
                <span>{panel.label}</span>
                <strong>{panel.value}</strong>
              </div>
            ))}
          </div>
        )}

        <div className="product-grid">
          {products.map(product => {
            const stockQty = parseStockQty(product.on_hand_qty);
            const stockBadge = stockQty === null ? null : getStockBadge(stockQty);
            const isUnavailable = stockBadge?.className === 'out-of-stock' && !allowsNegativeStock(product);
            
            return (
              <div key={product.product_id} className={`product-card ${isUnavailable ? 'stock-unavailable' : ''}`} onClick={() => addToCart(product)}>
                <div className="product-card-header">
                  <div className="text-sm font-bold truncate">{product.name}</div>
                  {stockBadge && (
                    <div className={`stock-badge ${stockBadge.className}`}>{stockBadge.label}</div>
                  )}
                </div>
                <div className="text-[10px] text-slate-500">{product.sku} {product.category_name ? `| ${product.category_name}` : ''}</div>
                <div className="product-card-footer">
                  <div className="product-price">{formatCurrency(parseFloat(product.unit_price))}{product.uom ? ` / ${product.uom}` : ''}</div>
                  {stockQty !== null && (
                    <div className="stock-qty">Stock: {stockQty}</div>
                  )}
                </div>
              </div>
            );
          })}
          {products.length === 0 && (
            <div className="empty-state">
              {serviceStatus.backend === 'error' 
                ? 'Backend is disconnected. Please check ag_pos.' 
                : 'No products found in current catalog.'}
            </div>
          )}
        </div>

        {!isScreenshotMode && <div className="mt-auto pt-10 flex gap-4">
          {AUTHORIZED_VOID_ROLES.includes(currentCashier?.role.toUpperCase() || '') && (
            <>
              <button className="payment-btn" style={{flex: 1}} onClick={() => {
                fetchStaff();
                setShowModal('staff');
              }}>STAFF</button>
              <button className="payment-btn" style={{flex: 1}} onClick={() => {
                fetchAuditLogs();
                setShowModal('audit');
              }}>AUDIT</button>
              <button className="payment-btn" style={{flex: 1}} onClick={() => {
                fetchTicketHistory();
                setShowModal('history');
              }}>TICKETS</button>
              <button className="payment-btn" style={{flex: 1}} onClick={() => {
                fetchDailyReport();
                setShowModal('daily_report');
              }}>REPORT</button>
              <button className="payment-btn" style={{flex: 1}} onClick={() => {
                setShowModal('inventory');
              }}>INVENTORY</button>
              <button className="payment-btn" style={{flex: 1, position: 'relative'}} onClick={() => {
                setShowModal('lowstock');
                fetchLowStock();
              }}>
                LOW STOCK
              </button>
              <button className="payment-btn" style={{flex: 1}} onClick={() => {
                setShowModal('catalog');
              }}>PRODUCTS</button>
            </>
          )}
          <button className="payment-btn" style={{flex: 1}} onClick={() => {
            if (currentShift) {
              fetchShiftSummary(currentShift.shift_id);
              setShowModal('summary');
            } else {
              alert('No active shift. Open shift to view summary.');
            }
          }}>SHIFT SUMMARY</button>
          <button className="payment-btn" style={{flex: 1}} onClick={() => setShowModal('shift')}>SHIFT CONTROL</button>
          <button className="payment-btn" style={{flex: 1}} onClick={() => {
            if (!lastTicket) {
              alert('No completed ticket available to void.');
            } else if (lastTicket.status === 'VOIDED') {
              alert('This ticket has already been voided.');
            } else {
              setShowModal('void_confirm');
            }
          }}>VOID / REFUND</button>
        </div>}
      </div>

      {/* Cart Panel */}
      <div className="cart-panel">
        <h3 className="font-tech text-sm tracking-widest mb-4">CURRENT ORDER</h3>
        
        <div className="toggle-group">
          <button className={`toggle-btn ${!isVat ? 'active' : ''}`} onClick={() => setIsVat(false)}>NO VAT</button>
          <button className={`toggle-btn ${isVat ? 'active' : ''}`} onClick={() => setIsVat(true)}>VAT 7%</button>
        </div>

        <div className="cart-items">
          {cartWarning && !cart.some(item => item.product_id === cartWarning.product_id) && (
            <div className="cart-warning">{cartWarning.message}</div>
          )}
          {cart.map(item => (
            (() => {
              const stockQty = parseStockQty(item.on_hand_qty);
              const atStockLimit = !allowsNegativeStock(item) && stockQty !== null && item.quantity >= stockQty;
              return (
                <div key={item.product_id} className="cart-item">
                  <div>
                    <div className="text-xs font-bold">{item.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {formatCurrency(parseFloat(item.unit_price))} x {item.quantity} {item.uom || ''}
                    </div>
                    {cartWarning?.product_id === item.product_id && (
                      <div className="cart-line-warning">{cartWarning.message}</div>
                    )}
                  </div>
                  <div className="quantity-ctrl">
                    <button className="btn-icon" onClick={() => updateQuantity(item.product_id, -1)} disabled={item.quantity <= 1}>-</button>
                    <div className="cart-qty-stack">
                      <span className={`cart-qty-value ${isScreenshotMode && atStockLimit ? 'at-limit' : ''}`}>
                        {isScreenshotMode && atStockLimit ? `MAX ${item.quantity}` : item.quantity}
                      </span>
                      {!isScreenshotMode && atStockLimit && (
                        <span className="text-[8px] text-red-500 font-bold leading-none mt-1">MAX</span>
                      )}
                    </div>
                    <button 
                      className="btn-icon" 
                      onClick={() => updateQuantity(item.product_id, 1)}
                    >+</button>
                  </div>
                </div>
              );
            })()
          ))}
          {cart.length === 0 && <div className="empty-state">Cart is empty</div>}
        </div>

        <div className="cart-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {isVat && (
            <div className="summary-row">
              <span>VAT (7%)</span>
              <span>{formatCurrency(vatAmount)}</span>
            </div>
          )}
          <div className="total-row">
            <span>TOTAL</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <div className="payment-methods">
            <button className={`payment-btn ${paymentMethod === 'CASH' ? 'active' : ''}`} onClick={() => setPaymentMethod('CASH')}>CASH</button>
            <button className={`payment-btn ${paymentMethod === 'PROMPTPAY' ? 'active' : ''}`} onClick={() => setPaymentMethod('PROMPTPAY')}>QR PAY</button>
            <button className={`payment-btn ${paymentMethod === 'CREDIT' ? 'active' : ''}`} onClick={() => setPaymentMethod('CREDIT')}>CREDIT</button>
          </div>

          <button 
            className={`btn-primary ${(checkoutLoading || !currentShift || cart.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`} 
            onClick={handleCheckout}
            disabled={checkoutLoading || !currentShift || cart.length === 0}
          >
            {checkoutLoading ? 'COMMITTING...' : (currentShift ? `CHECKOUT ${formatCurrency(total)}` : 'OPEN SHIFT TO START')}
          </button>
          {!isCleanCapture && <div className="text-[9px] text-center text-slate-600 mt-2">
            Real ticket commitment enabled. All sales are logged to ag_pos database.
          </div>}
        </div>
      </div>

      {/* Modals */}
      {showModal === 'shift' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="font-tech text-lg mb-6">SHIFT CONTROL</h3>
            
            {shiftError && <div className="text-red-500 text-xs mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded">{shiftError}</div>}

            {!currentShift ? (
              <div className="flex flex-col gap-4">
                <div className="status-label">Opening Cash (THB)</div>
                <input 
                  type="number" 
                  className="input-glow" 
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                  placeholder="0.00"
                />
                <button 
                  className="btn-primary" 
                  onClick={handleOpenShift}
                  disabled={shiftLoading}
                >
                  {shiftLoading ? 'OPENING...' : 'OPEN NEW SHIFT'}
                </button>
                <div className="text-[10px] text-slate-500 text-center italic">Start your business day with initial drawer cash.</div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2 text-xs mb-4 bg-slate-800/50 p-3 rounded border border-white/5">
                  <div className="text-slate-400">Shift ID:</div>
                  <div className="text-right font-mono">{currentShift.shift_id.slice(0,8)}...</div>
                  <div className="text-slate-400">Opened At:</div>
                  <div className="text-right">{new Date(currentShift.opened_at).toLocaleString()}</div>
                  <div className="text-slate-400">Opening Cash:</div>
                  <div className="text-right">{formatCurrency(parseFloat(currentShift.opening_cash))}</div>
                </div>

                <div className="status-label">Counted Cash (THB)</div>
                <input 
                  type="number" 
                  className="input-glow" 
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  placeholder="0.00"
                />
                
                {/* Variance Preview */}
                <div className="flex justify-between items-center text-sm px-2">
                  <span className="text-slate-400">Estimated Variance:</span>
                  <span className={parseFloat(actualCashInput) - parseFloat(currentShift.opening_cash) >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {formatCurrency(parseFloat(actualCashInput) - parseFloat(currentShift.opening_cash))}
                  </span>
                </div>

                <button 
                  className="payment-btn active" 
                  onClick={handleCloseShift}
                  disabled={shiftLoading}
                  style={{borderColor: '#ff3e3e', color: '#ff3e3e', marginTop: '10px'}}
                >
                  {shiftLoading ? 'CLOSING...' : 'CLOSE CURRENT SHIFT'}
                </button>
                <div className="text-[10px] text-slate-500 text-center italic">Closing will reconcile actual cash with sales data.</div>
              </div>
            )}
            <button className="mt-6 text-xs text-slate-500 underline block w-full text-center" onClick={() => setShowModal(null)}>CANCEL</button>
          </div>
        </div>
      )}

      {showModal === 'void' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="font-tech text-lg mb-6">VOID / REFUND REQUEST</h3>
            <div className="flex flex-col gap-4">
              <input type="text" className="input-glow" placeholder="Ticket ID / UUID..." />
              <select className="input-glow">
                <option>Reason: Wrong item</option>
                <option>Reason: Customer changed mind</option>
                <option>Reason: Damage/Spoiled</option>
              </select>
              <div className="flex gap-2">
                 <button className="btn-primary style={{flex: 1}} opacity-50" disabled>REQUEST VOID (N/A)</button>
              </div>
              <div className="text-[10px] text-slate-500 text-center italic">Void requests require owner approval flow (Nakarin ERP).</div>
              <button className="mt-4 text-xs text-slate-500 underline" onClick={() => setShowModal(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'ticket_success' && lastTicket && (
        <div className={`modal-overlay ${isScreenshotMode ? 'capture-modal-overlay' : ''}`} onClick={() => setShowModal(null)}>
          {isScreenshotMode ? (
            <div className="modal receipt-modal success-receipt" onClick={e => e.stopPropagation()}>
              <div className="receipt-header">
                <span className="receipt-kicker">Sale completed</span>
                <h3>Ticket Committed</h3>
                <p>Ticket No: <strong>{lastTicket.ticket_no}</strong></p>
              </div>
              <div className="receipt-total-row">
                <span>Total</span>
                <strong>{formatCurrency(parseFloat(lastTicket.total_amount))}</strong>
              </div>
              <div className="receipt-meta-grid">
                <div><span>Payment</span><strong>QR Pay</strong></div>
                <div><span>Shift</span><strong>Open</strong></div>
              </div>
              <div className="receipt-chip-row">
                <span className="state-chip green">COMPLETED</span>
                <span className="state-chip green">INVENTORY UPDATED</span>
                <span className="state-chip green">SHIFT OPEN</span>
                <span className="state-chip green">LEDGER RECORDED</span>
              </div>
              <div className="receipt-lines">
                {RECEIPT_LINE_ITEMS.map(line => (
                  <div key={line.name} className="receipt-line">
                    <div><strong>{line.name}</strong><span>Qty {line.qty}</span></div>
                    <span>{line.total}</span>
                  </div>
                ))}
              </div>
              <div className="receipt-actions">
                <button className="btn-primary" onClick={() => setShowModal(null)}>New Order</button>
                <button className="btn-secondary" onClick={() => {
                  if (lastTicket) {
                    fetchReceipt(lastTicket.ticket_id);
                    setShowModal('receipt_preview');
                  }
                }}>View Receipt</button>
              </div>
            </div>
          ) : (
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 border border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full shadow-[0_0_15px_#22c55e]"></div>
                </div>
                <h3 className="font-tech text-xl text-green-500">TICKET COMMITTED</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm bg-slate-800/50 p-4 rounded border border-white/5 mb-6">
                <div className="text-slate-400">Ticket No:</div>
                <div className="text-right font-mono font-bold text-orange-500">{lastTicket.ticket_no}</div>
                <div className="text-slate-400">Total Amount:</div>
                <div className="text-right font-bold">{formatCurrency(parseFloat(lastTicket.total_amount))}</div>
                <div className="text-slate-400">Status:</div>
                <div className="text-right"><span className="px-2 py-0.5 bg-green-500/20 text-green-500 rounded text-[10px]">{lastTicket.status}</span></div>
                <div className="text-slate-400">ID:</div>
                <div className="text-right text-[10px] font-mono text-slate-500">{lastTicket.ticket_id}</div>
              </div>

              <button className="btn-primary w-full" onClick={() => setShowModal(null)}>NEW ORDER</button>
            </div>
          )}
        </div>
      )}

      {showModal === 'void_confirm' && lastTicket && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="font-tech text-lg mb-6 uppercase tracking-wider">Void Ticket Confirmation</h3>
            <div className="grid grid-cols-2 gap-2 text-xs mb-6 bg-slate-800/50 p-4 rounded border border-white/5">
              <div className="text-slate-400">Ticket No:</div>
              <div className="text-right font-mono font-bold text-orange-500">{lastTicket.ticket_no}</div>
              <div className="text-slate-400">Amount:</div>
              <div className="text-right font-bold">{formatCurrency(parseFloat(lastTicket.total_amount))}</div>
              <div className="text-slate-400">Status:</div>
              <div className="text-right text-green-500 font-bold">{lastTicket.status}</div>
            </div>

            <div className="status-label">Reason for Void</div>
            <input 
              type="text" 
              className="input-glow w-full mb-6" 
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Cashier correction"
            />

            <div className="flex gap-4">
              <button className="payment-btn" style={{flex: 1}} onClick={() => setShowModal(null)}>CANCEL</button>
              <button 
                className="btn-primary" 
                style={{flex: 2, background: 'linear-gradient(135deg, #ff3e3e, #8b0000)'}}
                onClick={() => handleVoid()}
                disabled={voidLoading}
              >
                {voidLoading ? 'VOIDING...' : 'CONFIRM VOID'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'void_success_real' && lastTicket && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 border border-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-red-500 rounded-full shadow-[0_0_15px_#ff3e3e]"></div>
              </div>
              <h3 className="font-tech text-xl text-red-500">TICKET VOIDED</h3>
            </div>
            
            <div className="text-sm text-center text-slate-300 mb-6 bg-slate-800/50 p-4 rounded border border-white/5">
              Ticket <strong>{lastTicket.ticket_no}</strong> has been successfully voided. 
              Inventory has been restored and the ledger has been updated.
            </div>

            <button className="btn-primary w-full" onClick={() => setShowModal(null)}>DISMISS</button>
          </div>
        </div>
      )}

      {showModal === 'error' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 border border-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 font-bold text-2xl">!</div>
              <h3 className="font-tech text-xl text-red-500">CHECKOUT ERROR</h3>
            </div>
            <div className="text-center text-slate-300 text-sm mb-6 bg-red-500/10 p-4 rounded border border-red-500/20">
              {checkoutError}
            </div>
            <button className="btn-primary w-full" onClick={() => setShowModal(null)}>DISMISS</button>
          </div>
        </div>
      )}

      {showModal === 'void_success' && lastTicket && (
        <div className={`modal-overlay ${isScreenshotMode ? 'capture-modal-overlay' : ''}`} onClick={() => setShowModal(null)}>
          <div className="modal receipt-modal void-receipt" onClick={e => e.stopPropagation()}>
            <div className="receipt-header">
              <span className="receipt-kicker amber">Controlled correction</span>
              <h3>Audit-Safe Void Flow</h3>
              <p>Ticket: <strong>{lastTicket.ticket_no}</strong></p>
            </div>
            <div className="receipt-meta-grid void-meta-grid">
              <div><span>Status</span><strong>VOIDED</strong></div>
              <div><span>Reason</span><strong>Cashier correction</strong></div>
            </div>
            <div className="receipt-chip-row">
              <span className="state-chip amber">STOCK RESTORED</span>
              <span className="state-chip amber">LEDGER UPDATED</span>
              <span className="state-chip amber">AUDIT LOGGED</span>
            </div>
            <div className="void-note">Every correction is traceable.</div>
            <div className="receipt-actions">
              <button className="btn-primary" onClick={() => setShowModal(null)}>Back to Register</button>
              <button className="btn-secondary" onClick={() => {
                if (lastTicket) {
                  fetchReceipt(lastTicket.ticket_id);
                  setShowModal('receipt_preview');
                }
              }}>View Receipt</button>
            </div>
          </div>
        </div>
      )}
      {showModal === 'summary' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" style={{width: '600px'}} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-tech text-xl text-glow uppercase">Shift Summary</h3>
              <div className={`px-3 py-1 rounded text-[10px] font-bold ${shiftSummary?.status === 'OPEN' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                {shiftSummary?.status || 'UNKNOWN'}
              </div>
            </div>

            {summaryLoading && <div className="text-center py-10 text-slate-500">Loading metrics...</div>}
            {summaryError && <div className="bg-red-500/10 border border-red-500/20 p-4 text-red-500 text-sm rounded mb-6">{summaryError}</div>}

            {shiftSummary && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/40 p-3 rounded border border-white/5">
                    <div className="status-label">Opening Cash</div>
                    <div className="text-lg font-bold font-mono">{formatCurrency(parseFloat(shiftSummary.opening_cash))}</div>
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded border border-white/5">
                    <div className="status-label">Expected Cash</div>
                    <div className="text-lg font-bold font-mono text-orange-500">{formatCurrency(parseFloat(shiftSummary.expected_cash))}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="status-label">Net Sales</div>
                    <div className="text-md font-bold text-green-400">{formatCurrency(parseFloat(shiftSummary.net_sales))}</div>
                  </div>
                  <div className="text-center border-x border-white/10">
                    <div className="status-label">Voided</div>
                    <div className="text-md font-bold text-red-400">{formatCurrency(parseFloat(shiftSummary.voided_sales))}</div>
                  </div>
                  <div className="text-center">
                    <div className="status-label">Tickets</div>
                    <div className="text-md font-bold text-blue-400">{shiftSummary.confirmed_ticket_count}</div>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 border border-white/5">
                  <div className="status-label mb-3">Revenue Mix</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Cash Sales</span>
                      <span className="font-mono">{formatCurrency(parseFloat(shiftSummary.cash_sales))}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">PromptPay / QR</span>
                      <span className="font-mono">{formatCurrency(parseFloat(shiftSummary.qr_sales))}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Credit Card</span>
                      <span className="font-mono">{formatCurrency(parseFloat(shiftSummary.credit_sales))}</span>
                    </div>
                  </div>
                </div>

                {shiftSummary.top_items.length > 0 && (
                  <div>
                    <div className="status-label mb-3">Top Products</div>
                    <div className="space-y-2">
                      {shiftSummary.top_items.map(item => (
                        <div key={item.name} className="flex justify-between items-center bg-white/5 p-2 rounded text-[11px]">
                          <div className="flex flex-col">
                            <span className="font-bold">{item.name}</span>
                            <span className="text-slate-500">Qty: {item.quantity}</span>
                          </div>
                          <span className="font-mono text-gold-500">{formatCurrency(parseFloat(item.total))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button className="btn-primary w-full mt-8" onClick={() => setShowModal(null)}>CLOSE SUMMARY</button>
          </div>
        </div>
      )}

      {showModal === 'receipt_preview' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal receipt-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="receipt-print-area">
              <div className="receipt-print-paper">
                {receiptLoading && <div className="text-center py-10 text-slate-500">Loading receipt...</div>}
                {receiptError && <div className="text-center py-10 text-red-500">{receiptError}</div>}
                
                {receiptData && (
                  <>
                    <div className="print-header">
                      <h2 className="print-biz-name">{receiptData.business_name}</h2>
                      <p>TAX INVOICE / RECEIPT</p>
                      <p className="print-ticket-no">#{receiptData.ticket_no}</p>
                    </div>

                    <div className="print-meta">
                      <div className="flex justify-between"><span>Date:</span> <span>{new Date(receiptData.created_at).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Cashier:</span> <span>{receiptData.employee_id}</span></div>
                    </div>

                    <div className="print-divider"></div>

                    <div className="print-items">
                      {receiptData.items.map((item, idx) => (
                        <div key={idx} className="print-item">
                          <div className="print-item-name">{item.name}</div>
                          <div className="flex justify-between text-[10px]">
                            <span>{item.qty} x {formatCurrency(parseFloat(item.unit_price))}</span>
                            <span>{formatCurrency(parseFloat(item.line_total))}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="print-divider"></div>

                    <div className="print-summary">
                      <div className="flex justify-between"><span>Subtotal:</span> <span>{formatCurrency(parseFloat(receiptData.subtotal))}</span></div>
                      <div className="flex justify-between"><span>VAT (7%):</span> <span>{formatCurrency(parseFloat(receiptData.vat_amount))}</span></div>
                      <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-black/5">
                        <span>TOTAL:</span> 
                        <span>{formatCurrency(parseFloat(receiptData.total_amount))}</span>
                      </div>
                    </div>

                    <div className="print-footer">
                      <p>Payment: {receiptData.payment.method}</p>
                      {receiptData.is_voided && (
                        <div className="print-void-stamp">VOIDED</div>
                      )}
                      <p className="mt-4 text-[8px]">Thank you for your business</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-8 print-hidden">
              <button className="btn-secondary" style={{flex: 1}} onClick={() => setShowModal(null)}>CLOSE</button>
              <button className="btn-primary" style={{flex: 2}} onClick={handlePrint}>PRINT RECEIPT</button>
            </div>
          </div>
        </div>
      )}

      {/* Cashier Login Overlay */}
      {!currentCashier && !isScreenshotMode && (
        <div className="cashier-login-overlay">
          <div className="login-card">
            <h2 className="font-tech text-2xl text-orange-500 mb-2">POS SYSTEM</h2>
            <p className="text-slate-400 text-xs mb-8 tracking-widest">SECURE ACCESS REQUIRED</p>
            
            {loginError && <div className="bg-red-500/10 border border-red-500/20 p-3 rounded text-red-500 text-xs mb-4">{loginError}</div>}

            <div className="cashier-select-grid">
              {employees.map(emp => (
                <div 
                  key={emp.id} 
                  className={`cashier-option ${selectedCashierId === emp.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCashierId(emp.id)}
                >
                  <span className="cashier-name">{emp.display_name}</span>
                  <span className="cashier-role">{emp.role}</span>
                </div>
              ))}
              {employees.length === 0 && <div className="text-slate-600 text-xs py-10">No active employees found</div>}
            </div>

            {selectedCashierId && (
              <div className="pin-input-container">
                <div className="pin-display">
                  {pin.split('').map((_, i) => <span key={i}>*</span>)}
                </div>
                <div className="pin-pad">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <button key={n} className="pin-btn" onClick={() => setPin(p => (p + n).slice(0, 6))}>{n}</button>
                  ))}
                  <button className="pin-btn clear" onClick={() => setPin('')}>C</button>
                  <button className="pin-btn" onClick={() => setPin(p => (p + '0').slice(0, 6))}>0</button>
                  <button 
                    className="pin-btn submit" 
                    onClick={handleCashierLogin}
                    disabled={loginLoading || pin.length < 4}
                  >
                    {loginLoading ? '...' : 'ENTER'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manager Override Modal */}
      {showOverrideModal && (
        <div className="cashier-login-overlay" style={{ zIndex: 1100 }}>
          <div className="login-card">
            <h2 className="font-tech text-xl text-orange-500 mb-2">MANAGER OVERRIDE</h2>
            <p className="text-slate-400 text-[10px] mb-6 tracking-widest uppercase">Authorization required for void / refund</p>
            
            {overrideError && <div className="bg-red-500/10 border border-red-500/20 p-3 rounded text-red-500 text-xs mb-4">{overrideError}</div>}

            <div className="cashier-select-grid">
              {employees.filter(e => AUTHORIZED_VOID_ROLES.includes(e.role.toUpperCase())).map(emp => (
                <div 
                  key={emp.id} 
                  className={`cashier-option ${overrideManagerId === emp.id ? 'selected' : ''}`}
                  onClick={() => setOverrideManagerId(emp.id)}
                >
                  <span className="cashier-name">{emp.display_name}</span>
                  <span className="cashier-role">{emp.role}</span>
                </div>
              ))}
              {employees.filter(e => AUTHORIZED_VOID_ROLES.includes(e.role.toUpperCase())).length === 0 && 
                <div className="text-slate-600 text-xs py-10">No authorized managers available</div>
              }
            </div>

            <div className="status-label mt-6 mb-2">VOID REASON</div>
            <input 
              type="text" 
              className="input-glow w-full mb-6" 
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Manager override required"
            />

            {overrideManagerId && (
              <div className="pin-input-container">
                <div className="pin-display">
                  {overridePin.split('').map((_, i) => <span key={i}>*</span>)}
                </div>
                <div className="pin-pad">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <button key={n} className="pin-btn" onClick={() => setOverridePin(p => (p + n).slice(0, 6))}>{n}</button>
                  ))}
                  <button className="pin-btn clear" onClick={() => setOverridePin('')}>C</button>
                  <button className="pin-btn" onClick={() => setOverridePin(p => (p + '0').slice(0, 6))}>0</button>
                  <button 
                    className="pin-btn submit" 
                    onClick={handleManagerOverride}
                    disabled={overrideLoading || overridePin.length < 4}
                  >
                    {overrideLoading ? '...' : 'APPROVE'}
                  </button>
                </div>
              </div>
            )}
            
            <button 
              className="cancel-override"
              onClick={() => {
                setShowOverrideModal(false);
                setOverridePin('');
                setOverrideError(null);
              }}
            >
              CANCEL OVERRIDE
            </button>
          </div>
        </div>
      )}
      {showModal === 'staff' && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(null);
          setEditingEmployee(null);
          setIsAddingEmployee(false);
          setIsResettingPin(false);
          setManagementError(null);
        }}>
          <div className="modal" style={{maxWidth: '800px', width: '90%'}} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-tech text-lg uppercase tracking-wider">Staff Management</h3>
              {!isAddingEmployee && !editingEmployee && (
                <button className="action-btn-sm" onClick={() => {
                  setIsAddingEmployee(true);
                  setStaffForm({ display_name: '', role: 'CASHIER', pin_code: '' });
                }}>+ NEW EMPLOYEE</button>
              )}
            </div>

            {managementError && <div className="bg-red-500/10 border border-red-500/20 p-3 rounded text-red-500 text-xs mb-4">{managementError}</div>}

            {isAddingEmployee || (editingEmployee && !isResettingPin) ? (
              <div className="staff-form-grid">
                <div className="meta-label">Display Name</div>
                <input 
                  type="text" 
                  className="input-glow" 
                  value={staffForm.display_name}
                  onChange={e => setStaffForm({...staffForm, display_name: e.target.value})}
                  placeholder="Employee Full Name"
                />
                <div className="meta-label">Role</div>
                <select 
                  className="input-glow"
                  value={staffForm.role}
                  onChange={e => setStaffForm({...staffForm, role: e.target.value})}
                >
                  <option value="CASHIER">CASHIER</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="SUPERVISOR">SUPERVISOR</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OWNER">OWNER</option>
                </select>
                {isAddingEmployee && (
                  <>
                    <div className="meta-label">Initial PIN</div>
                    <input 
                      type="password" 
                      className="input-glow" 
                      value={staffForm.pin_code}
                      onChange={e => setStaffForm({...staffForm, pin_code: e.target.value})}
                      placeholder="4-6 digits"
                    />
                  </>
                )}
                <div className="flex gap-4 mt-4">
                  <button className="btn-secondary flex-1" onClick={() => {
                    setIsAddingEmployee(false);
                    setEditingEmployee(null);
                  }}>CANCEL</button>
                  <button className="btn-primary flex-1" onClick={isAddingEmployee ? handleCreateEmployee : handleUpdateEmployee} disabled={managementLoading}>
                    {managementLoading ? 'SAVING...' : 'SAVE EMPLOYEE'}
                  </button>
                </div>
              </div>
            ) : isResettingPin && editingEmployee ? (
              <div className="staff-form-grid">
                <div className="meta-label">New PIN for {editingEmployee.display_name}</div>
                <input 
                  type="password" 
                  className="input-glow" 
                  value={newPinInput}
                  onChange={e => setNewPinInput(e.target.value)}
                  placeholder="4-6 digits"
                />
                <div className="flex gap-4 mt-4">
                  <button className="btn-secondary flex-1" onClick={() => {
                    setIsResettingPin(false);
                    setEditingEmployee(null);
                    setNewPinInput('');
                  }}>CANCEL</button>
                  <button className="btn-primary flex-1" onClick={() => handleResetPin(editingEmployee.id)} disabled={managementLoading}>
                    {managementLoading ? 'RESETTING...' : 'CONFIRM RESET'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp.id}>
                        <td>{emp.display_name}</td>
                        <td><span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-white/5">{emp.role}</span></td>
                        <td>
                          <span className={`status-pill ${emp.is_active ? 'active' : 'inactive'}`}>
                            {emp.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td>
                          <button className="action-btn-sm" onClick={() => {
                            setEditingEmployee(emp);
                            setStaffForm({ display_name: emp.display_name, role: emp.role, pin_code: '' });
                          }}>EDIT</button>
                          <button className="action-btn-sm" onClick={() => {
                            setEditingEmployee(emp);
                            setIsResettingPin(true);
                          }}>PIN</button>
                          {emp.is_active && emp.id !== currentCashier?.id && (
                            <button className="action-btn-sm danger" onClick={() => handleDeactivateEmployee(emp.id)}>OFF</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button className="mt-8 text-xs text-slate-500 underline block w-full text-center" onClick={() => setShowModal(null)}>CLOSE MANAGEMENT</button>
          </div>
        </div>
      )}
      {showModal === 'audit' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" style={{maxWidth: '1000px', width: '95%'}} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-tech text-lg uppercase tracking-wider">Operational Audit Log</h3>
              <div className="flex gap-4">
                <select 
                  className="input-glow text-xs"
                  value={auditLimit}
                  onChange={e => {
                    const newLimit = Number(e.target.value);
                    setAuditLimit(newLimit);
                    fetchAuditLogs(newLimit);
                  }}
                >
                  <option value={25}>25 ROWS</option>
                  <option value={50}>50 ROWS</option>
                  <option value={100}>100 ROWS</option>
                </select>
                <button className="action-btn-sm" onClick={() => fetchAuditLogs()}>REFRESH</button>
              </div>
            </div>

            {auditError && <div className="bg-red-500/10 border border-red-500/20 p-3 rounded text-red-500 text-xs mb-4">{auditError}</div>}

            <div className="overflow-x-auto max-h-[60vh]">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>Actor</th>
                    <th>Target</th>
                    <th>Reason</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {isAuditLoading && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500">LOADING LOGS...</td>
                    </tr>
                  )}
                  {!isAuditLoading && auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500">NO AUDIT LOGS FOUND</td>
                    </tr>
                  )}
                  {auditLogs.map(log => (
                    <React.Fragment key={log.id}>
                      <tr className="cursor-pointer hover:bg-white/5" onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}>
                        <td className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                        <td><span className={`status-pill ${getEventColor(log.event_type)}`}>{log.event_type}</span></td>
                        <td className="text-[10px]">{employees.find(e => e.id === log.actor_employee_id)?.display_name || log.actor_employee_id || '-'}</td>
                        <td className="text-[10px]">{log.target_type} ({log.target_id?.slice(0,8)})</td>
                        <td className="text-[10px] truncate max-w-[150px]">{log.reason || '-'}</td>
                        <td><button className="text-[9px] underline">{expandedLogId === log.id ? 'HIDE' : 'VIEW'}</button></td>
                      </tr>
                      {expandedLogId === log.id && (
                        <tr>
                          <td colSpan={6} className="bg-black/20 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-[10px]">
                              <div>
                                <div className="meta-label">Metadata</div>
                                <pre className="font-mono text-slate-400 bg-black/40 p-2 rounded max-h-[200px] overflow-auto">
                                  {JSON.stringify(sanitizeMetadata(log.metadata), null, 2)}
                                </pre>
                              </div>
                              <div className="text-left">
                                <div className="meta-label">Context</div>
                                <div className="space-y-1">
                                  <div><span className="text-slate-500">Log ID:</span> {log.id}</div>
                                  <div><span className="text-slate-500">Target ID:</span> {log.target_id}</div>
                                  <div><span className="text-slate-500">Actor ID:</span> {log.actor_employee_id || 'System'}</div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="mt-8 text-xs text-slate-500 underline block w-full text-center" onClick={() => setShowModal(null)}>CLOSE LOG</button>
          </div>
        </div>
      )}
      {showModal === 'history' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" style={{maxWidth: '1200px', width: '95%'}} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-tech text-lg uppercase tracking-wider">Ticket & Sales History</h3>
              <div className="flex gap-4 items-center">
                <input 
                  type="text" 
                  placeholder="SEARCH TICKET NO..." 
                  className="input-glow text-xs py-1 px-3 w-48"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchTicketHistory()}
                />
                <select 
                  className="input-glow text-xs"
                  value={historyStatus}
                  onChange={e => {
                    const newStatus = e.target.value;
                    setHistoryStatus(newStatus);
                    fetchTicketHistory(historyLimit, newStatus);
                  }}
                >
                  <option value="ALL">ALL STATUS</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="VOIDED">VOIDED</option>
                </select>
                <select 
                  className="input-glow text-xs"
                  value={historyLimit}
                  onChange={e => {
                    const newLimit = Number(e.target.value);
                    setHistoryLimit(newLimit);
                    fetchTicketHistory(newLimit);
                  }}
                >
                  <option value={25}>25 ROWS</option>
                  <option value={50}>50 ROWS</option>
                  <option value={100}>100 ROWS</option>
                </select>
                <button className="action-btn-sm" onClick={() => fetchTicketHistory()}>REFRESH</button>
              </div>
            </div>

            {historyError && <div className="bg-red-500/10 border border-red-500/20 p-3 rounded text-red-500 text-xs mb-4">{historyError}</div>}

            <div className="overflow-x-auto max-h-[65vh]">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th>Ticket No</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Cashier</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isHistoryLoading && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">LOADING HISTORY...</td>
                    </tr>
                  )}
                  {!isHistoryLoading && ticketHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">NO TICKETS FOUND</td>
                    </tr>
                  )}
                  {ticketHistory.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-white/5">
                      <td className="text-[10px] text-slate-500">{new Date(ticket.created_at).toLocaleString()}</td>
                      <td className="font-mono text-xs">{ticket.ticket_no}</td>
                      <td>
                        <span className={`status-pill ${ticket.status === 'CONFIRMED' ? 'active' : 'inactive'}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="font-bold">{formatCurrency(parseFloat(ticket.total_amount))}</td>
                      <td className="text-[10px]">{ticket.payment_method || '-'}</td>
                      <td className="text-[10px]">{employees.find(e => e.id === ticket.created_by)?.display_name || ticket.created_by?.slice(0,8) || 'System'}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="text-[9px] underline text-orange-500" onClick={() => {
                            fetchReceipt(ticket.id);
                            setShowModal('receipt_preview');
                          }}>VIEW</button>
                          {ticket.status === 'CONFIRMED' && AUTHORIZED_VOID_ROLES.includes(currentCashier?.role.toUpperCase() || '') && (
                            <button className="text-[9px] underline text-red-500" onClick={() => {
                              setLastTicket({
                                ticket_id: ticket.id,
                                ticket_no: ticket.ticket_no,
                                total_amount: ticket.total_amount,
                                status: ticket.status
                              });
                              setShowModal('void_confirm');
                            }}>VOID</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="mt-8 text-xs text-slate-500 underline block w-full text-center" onClick={() => setShowModal(null)}>CLOSE HISTORY</button>
          </div>
        </div>
      )}
      {showModal === 'daily_report' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" style={{maxWidth: '1200px', width: '95%'}} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-tech text-lg uppercase tracking-wider">Daily Sales Report</h3>
              <div className="flex gap-4 items-center">
                <input 
                  type="date" 
                  className="input-glow text-xs py-1 px-3"
                  value={dailyReportDate}
                  onChange={e => {
                    setDailyReportDate(e.target.value);
                    fetchDailyReport(e.target.value);
                  }}
                />
                <button className="action-btn-sm" onClick={() => fetchDailyReport()}>REFRESH</button>
              </div>
            </div>

            {reportError && <div className="bg-red-500/10 border border-red-500/20 p-3 rounded text-red-500 text-xs mb-4">{reportError}</div>}

            {isReportLoading ? (
              <div className="py-20 text-center text-slate-500">GENERATING REPORT...</div>
            ) : dailyReport ? (
              <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2">
                {/* Summary Grid */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white/5 p-4 rounded border border-white/10">
                    <div className="text-[10px] text-slate-400 uppercase mb-1">Confirmed Tickets</div>
                    <div className="text-xl font-bold">{dailyReport.confirmed_ticket_count}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded border border-white/10">
                    <div className="text-[10px] text-slate-400 uppercase mb-1">Gross Sales</div>
                    <div className="text-xl font-bold text-orange-500">{formatCurrency(parseFloat(dailyReport.gross_sales))}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded border border-white/10">
                    <div className="text-[10px] text-slate-400 uppercase mb-1">Voided Sales</div>
                    <div className="text-xl font-bold text-red-500">{formatCurrency(parseFloat(dailyReport.voided_sales))}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded border border-white/10">
                    <div className="text-[10px] text-slate-400 uppercase mb-1">Net Sales</div>
                    <div className="text-xl font-bold text-green-500">{formatCurrency(parseFloat(dailyReport.net_sales))}</div>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase tracking-widest text-slate-400">Payment Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-white/5 rounded border border-white/5">
                        <span className="text-xs">CASH</span>
                        <span className="text-xs font-mono">{formatCurrency(parseFloat(dailyReport.cash_sales))}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-white/5 rounded border border-white/5">
                        <span className="text-xs">PROMPTPAY / QR</span>
                        <span className="text-xs font-mono">{formatCurrency(parseFloat(dailyReport.qr_sales))}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-white/5 rounded border border-white/5">
                        <span className="text-xs">CREDIT CARD</span>
                        <span className="text-xs font-mono">{formatCurrency(parseFloat(dailyReport.credit_sales))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs uppercase tracking-widest text-slate-400">Inventory Top Items</h4>
                    <div className="overflow-x-auto">
                      <table className="staff-table">
                        <thead>
                          <tr>
                            <th>Item Name</th>
                            <th>Qty</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyReport.top_items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="text-[10px]">{item.name}</td>
                              <td className="text-[10px]">{item.quantity}</td>
                              <td className="text-[10px] font-mono">{formatCurrency(parseFloat(item.total))}</td>
                            </tr>
                          ))}
                          {dailyReport.top_items.length === 0 && (
                            <tr><td colSpan={3} className="text-center py-4 text-slate-500 text-[10px]">NO ITEMS SOLD</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Cashier Performance */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-widest text-slate-400">Cashier Summary</h4>
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Ticket Count</th>
                        <th>Net Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyReport.cashier_summary.map(cashier => (
                        <tr key={cashier.employee_id}>
                          <td className="text-xs">{cashier.display_name}</td>
                          <td className="text-xs">{cashier.ticket_count}</td>
                          <td className="text-xs font-bold">{formatCurrency(parseFloat(cashier.net_sales))}</td>
                        </tr>
                      ))}
                      {dailyReport.cashier_summary.length === 0 && (
                        <tr><td colSpan={3} className="text-center py-4 text-slate-500 text-[10px]">NO CASHIER DATA</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="text-[9px] text-slate-600 italic">
                  Report generated for {dailyReport.date}. Includes {dailyReport.shifts_included} shifts.
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-500 uppercase tracking-widest">Select a date to view report</div>
            )}

            <button className="mt-8 text-xs text-slate-500 underline block w-full text-center" onClick={() => setShowModal(null)}>CLOSE REPORT</button>
          </div>
        </div>
      )}
      {showModal === 'inventory' && (
        <div className="modal-overlay" onClick={() => { setShowModal(null); setSelectedInventoryProduct(null); }}>
          <div className="modal" style={{maxWidth: '1200px', width: '95%'}} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-tech text-lg uppercase tracking-wider">Inventory Management</h3>
              <div className="flex gap-4 w-1/3">
                <input 
                  type="text" 
                  className="input-glow text-xs" 
                  placeholder="SEARCH PRODUCT..." 
                  value={inventorySearch}
                  onChange={e => setInventorySearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') searchProducts(inventorySearch); }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 h-[70vh]">
              {/* Product Info & Adjust */}
              <div className="space-y-6 flex flex-col">
                <div className="bg-white/5 p-6 rounded border border-white/10 flex-1 overflow-y-auto">
                  {selectedInventoryProduct ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-bold text-orange-500 mb-1">{selectedInventoryProduct.name}</h4>
                        <div className="text-[10px] text-slate-500 font-mono">{selectedInventoryProduct.sku} | {selectedInventoryProduct.barcode}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/20 p-3 rounded">
                          <div className="text-[9px] text-slate-500 uppercase mb-1">On Hand</div>
                          <div className="text-xl font-bold">{parseStockQty(selectedInventoryProduct.on_hand_qty) ?? '0'}</div>
                          {selectedInventoryProduct.on_hand_qty !== undefined && (
                            <div className={`text-[9px] mt-1 ${getStockBadge(Number(selectedInventoryProduct.on_hand_qty)).className}`}>
                              {getStockBadge(Number(selectedInventoryProduct.on_hand_qty)).label}
                            </div>
                          )}
                        </div>
                        <div className="bg-black/20 p-3 rounded">
                          <div className="text-[9px] text-slate-500 uppercase mb-1">Price</div>
                          <div className="text-xl font-bold font-mono">{formatCurrency(parseFloat(selectedInventoryProduct.unit_price))}</div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <h5 className="text-[10px] uppercase tracking-widest text-slate-400 mb-4">Stock Adjustment</h5>
                        <div className="space-y-4">
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="text-[9px] text-slate-500 block mb-1">QUANTITY DELTA (+/-)</label>
                              <input 
                                type="number" 
                                className="input-glow text-xs"
                                value={adjustQtyDelta}
                                onChange={e => setAdjustQtyDelta(e.target.value)}
                                placeholder="e.g. 10 or -5"
                              />
                            </div>
                            <div className="flex-[2]">
                              <label className="text-[9px] text-slate-500 block mb-1">REASON</label>
                              <input 
                                type="text" 
                                className="input-glow text-xs"
                                value={adjustReason}
                                onChange={e => setAdjustReason(e.target.value)}
                                placeholder="Restock, Damage, Correction..."
                              />
                            </div>
                          </div>
                          
                          {inventoryError && <div className="text-[10px] text-red-500 italic">{inventoryError}</div>}
                          
                          <button 
                            className="payment-btn w-full" 
                            disabled={isInventoryLoading}
                            onClick={handleAdjustInventory}
                          >
                            {isInventoryLoading ? 'PROCESSING...' : 'APPLY ADJUSTMENT'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs text-center space-y-4">
                      <div className="opacity-50">Select a product to adjust inventory levels.</div>
                      <div className="grid grid-cols-2 gap-2 w-full">
                        {products.map(p => (
                          <div 
                            key={p.product_id} 
                            className="p-2 bg-white/5 border border-white/5 rounded cursor-pointer hover:bg-white/10 text-[10px] truncate"
                            onClick={() => {
                              setSelectedInventoryProduct(p);
                              fetchStockLedger(p.product_id);
                            }}
                          >
                            {p.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Ledger */}
              <div className="flex flex-col space-y-4">
                <h4 className="text-xs uppercase tracking-widest text-slate-400">Stock History (Ledger)</h4>
                <div className="flex-1 overflow-y-auto bg-black/20 rounded border border-white/5">
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Delta</th>
                        <th>Reason</th>
                        <th>Actor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryLedger.map(entry => (
                        <tr key={entry.id}>
                          <td className="text-[9px] font-mono whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</td>
                          <td className={`text-[9px] font-bold ${parseFloat(entry.qty_change) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {parseFloat(entry.qty_change) > 0 ? '+' : ''}{entry.qty_change}
                          </td>
                          <td className="text-[9px] max-w-[150px] truncate">{entry.reason}</td>
                          <td className="text-[9px] text-slate-400">{entry.actor_name || 'SYSTEM'}</td>
                        </tr>
                      ))}
                      {inventoryLedger.length === 0 && (
                        <tr><td colSpan={4} className="text-center py-20 text-slate-600 text-[10px] uppercase">No history available</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <button className="mt-6 text-xs text-slate-500 underline block w-full text-center" onClick={() => { setShowModal(null); setSelectedInventoryProduct(null); }}>CLOSE INVENTORY</button>
          </div>
        </div>
      )}
      {showModal === 'catalog' && (
        <div className="modal-overlay" onClick={() => { setShowModal(null); setEditingProduct(null); setIsAddingProduct(false); }}>
          <div className="modal" style={{maxWidth: '1200px', width: '95%'}} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-tech text-lg uppercase tracking-wider">Product Catalog</h3>
              <div className="flex gap-4 w-1/3">
                <input 
                  type="text" 
                  className="input-glow text-xs" 
                  placeholder="SEARCH CATALOG..." 
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') searchProducts(catalogSearch); }}
                />
                <button className="payment-btn text-[10px] px-4" onClick={() => {
                  setIsAddingProduct(true);
                  setEditingProduct(null);
                  setProductFormData({
                    sku: '', barcode: '', name: '', category_name: '', uom: 'pcs', unit_price: '', on_hand_qty: '0', allow_negative_stock: false
                  });
                }}>ADD NEW</button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8 h-[70vh]">
              {/* Product List */}
              <div className="col-span-2 flex flex-col space-y-4">
                <div className="flex-1 overflow-y-auto bg-black/20 rounded border border-white/5">
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.product_id}>
                          <td className="text-[9px] font-mono">{p.sku}</td>
                          <td className="text-[10px] font-bold">{p.name}</td>
                          <td className="text-[9px] text-slate-400">{p.category_name}</td>
                          <td className="text-[10px] font-mono">{formatCurrency(parseFloat(p.unit_price))}</td>
                          <td className="text-[10px]">{p.on_hand_qty} {p.uom}</td>
                          <td>
                            <button className="text-[9px] text-orange-500 underline" onClick={() => {
                              setEditingProduct(p);
                              setIsAddingProduct(false);
                              setProductFormData({
                                sku: p.sku,
                                barcode: p.barcode || '',
                                name: p.name,
                                category_name: p.category_name || '',
                                uom: p.uom || 'pcs',
                                unit_price: p.unit_price,
                                on_hand_qty: String(p.on_hand_qty),
                                allow_negative_stock: allowsNegativeStock(p)
                              });
                            }}>EDIT</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Side */}
              <div className="bg-white/5 p-6 rounded border border-white/10 overflow-y-auto">
                {(isAddingProduct || editingProduct) ? (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">
                      {isAddingProduct ? 'Create New Product' : 'Edit Product'}
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">SKU (Unique Identifier)</label>
                        <input 
                          type="text" 
                          className="input-glow text-xs" 
                          disabled={!isAddingProduct}
                          value={productFormData.sku}
                          onChange={e => setProductFormData({...productFormData, sku: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">BARCODE</label>
                        <input 
                          type="text" 
                          className="input-glow text-xs"
                          value={productFormData.barcode}
                          onChange={e => setProductFormData({...productFormData, barcode: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">PRODUCT NAME</label>
                        <input 
                          type="text" 
                          className="input-glow text-xs"
                          value={productFormData.name}
                          onChange={e => setProductFormData({...productFormData, name: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-1">CATEGORY</label>
                          <input 
                            type="text" 
                            className="input-glow text-xs"
                            value={productFormData.category_name}
                            onChange={e => setProductFormData({...productFormData, category_name: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-1">UOM</label>
                          <input 
                            type="text" 
                            className="input-glow text-xs"
                            value={productFormData.uom}
                            onChange={e => setProductFormData({...productFormData, uom: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-1">UNIT PRICE</label>
                          <input 
                            type="number" 
                            className="input-glow text-xs font-mono"
                            value={productFormData.unit_price}
                            onChange={e => setProductFormData({...productFormData, unit_price: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-1">INITIAL STOCK</label>
                          <input 
                            type="number" 
                            className="input-glow text-xs font-mono"
                            disabled={!isAddingProduct}
                            value={productFormData.on_hand_qty}
                            onChange={e => setProductFormData({...productFormData, on_hand_qty: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 py-2">
                        <input 
                          type="checkbox" 
                          id="allow_neg"
                          checked={productFormData.allow_negative_stock}
                          onChange={e => setProductFormData({...productFormData, allow_negative_stock: e.target.checked})}
                        />
                        <label htmlFor="allow_neg" className="text-[10px] text-slate-400">ALLOW NEGATIVE STOCK</label>
                      </div>
                    </div>

                    {catalogError && <div className="text-[10px] text-red-500 italic">{catalogError}</div>}

                    <div className="pt-4 flex flex-col gap-2">
                      <button 
                        className="payment-btn w-full" 
                        disabled={isCatalogLoading}
                        onClick={isAddingProduct ? handleCreateProduct : handleUpdateProduct}
                      >
                        {isCatalogLoading ? 'SAVING...' : (isAddingProduct ? 'CREATE PRODUCT' : 'SAVE CHANGES')}
                      </button>
                      
                      {editingProduct && (
                        <button 
                          className="payment-btn w-full bg-red-900/20 border-red-900/50 text-red-500"
                          onClick={() => handleDeactivateProduct(editingProduct.product_id)}
                        >
                          DEACTIVATE
                        </button>
                      )}
                      
                      <button className="text-[10px] text-slate-500 underline mt-2" onClick={() => {
                        setEditingProduct(null);
                        setIsAddingProduct(false);
                      }}>CANCEL</button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs text-center">
                    <div className="opacity-50">Select a product to edit or click 'ADD NEW' to expand the catalog.</div>
                  </div>
                )}
              </div>
            </div>

            <button className="mt-6 text-xs text-slate-500 underline block w-full text-center" onClick={() => { setShowModal(null); setEditingProduct(null); setIsAddingProduct(false); }}>CLOSE CATALOG</button>
          </div>
        </div>
      )}
      {showModal === 'lowstock' && (
        <div className="modal-overlay" onClick={() => { setShowModal(null); setEditingReorderProduct(null); }}>
          <div className="modal" style={{maxWidth: '1200px', width: '95%'}} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h3 className="font-tech text-lg uppercase tracking-wider">Inventory Low Stock Dashboard</h3>
                {isLowStockLoading && <div className="text-[10px] text-orange-500 animate-pulse">REFRESHING...</div>}
              </div>
              <button className="payment-btn text-[10px] px-4" onClick={fetchLowStock} disabled={isLowStockLoading}>REFRESH LIST</button>
            </div>

            <div className="grid grid-cols-4 gap-8 h-[70vh]">
              {/* Alert List */}
              <div className="col-span-3 flex flex-col space-y-4">
                <div className="flex-1 overflow-y-auto bg-black/20 rounded border border-white/5">
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>On Hand</th>
                        <th>Threshold</th>
                        <th>Reorder</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.length === 0 && !isLowStockLoading && (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-500 text-xs italic">
                            All products are above reorder thresholds. Inventory is healthy.
                          </td>
                        </tr>
                      )}
                      {lowStockItems.map(item => (
                        <tr key={item.product_id} className={item.stock_status === 'OUT_OF_STOCK' ? 'bg-red-500/5' : ''}>
                          <td>
                            <span className={`px-2 py-0.5 rounded-[2px] text-[8px] font-bold uppercase tracking-widest ${
                              item.stock_status === 'OUT_OF_STOCK' ? 'bg-red-500 text-white' : 
                              item.stock_status === 'LOW_STOCK' ? 'bg-orange-500 text-black' : 'bg-green-500 text-white'
                            }`}>
                              {item.stock_status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="text-[10px] font-bold">{item.name}</td>
                          <td className="text-[9px] font-mono text-slate-400">{item.sku}</td>
                          <td className={`text-[10px] font-mono ${parseFloat(item.on_hand_qty) <= 0 ? 'text-red-500' : ''}`}>
                            {item.on_hand_qty} {item.uom}
                          </td>
                          <td className="text-[10px] font-mono text-slate-400">{item.reorder_point}</td>
                          <td className="text-[10px] font-mono text-slate-400">{item.reorder_qty}</td>
                          <td className="flex gap-2">
                            <button className="text-[9px] text-blue-400 underline" onClick={() => {
                              setEditingReorderProduct(item);
                              setReorderFormData({
                                reorder_point: item.reorder_point,
                                reorder_qty: item.reorder_qty
                              });
                            }}>SETTINGS</button>
                            <button className="text-[9px] text-orange-500 underline" onClick={() => {
                              // Link to inventory modal for this product
                              const prod = products.find(p => p.product_id === item.product_id);
                              if (prod) {
                                setSelectedInventoryProduct(prod);
                                setShowModal('inventory');
                                fetchStockLedger(prod.product_id);
                              } else {
                                alert('Product not found in current view. Please use Inventory Management.');
                              }
                            }}>RESTOCK</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Settings Editor */}
              <div className="bg-white/5 p-6 rounded border border-white/10 overflow-y-auto">
                {editingReorderProduct ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] text-orange-500 font-tech uppercase mb-1">Editing Thresholds</h4>
                      <div className="text-xs font-bold truncate">{editingReorderProduct.name}</div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">REORDER POINT (Alert Threshold)</label>
                        <input 
                          type="number" 
                          className="input-glow text-xs font-mono"
                          value={reorderFormData.reorder_point}
                          onChange={e => setReorderFormData({...reorderFormData, reorder_point: e.target.value})}
                        />
                        <div className="text-[8px] text-slate-500 mt-1 italic leading-tight">
                          System will alert when stock level falls to or below this point.
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">REORDER QUANTITY (Target)</label>
                        <input 
                          type="number" 
                          className="input-glow text-xs font-mono"
                          value={reorderFormData.reorder_qty}
                          onChange={e => setReorderFormData({...reorderFormData, reorder_qty: e.target.value})}
                        />
                        <div className="text-[8px] text-slate-500 mt-1 italic leading-tight">
                          Suggested quantity to order when restock is triggered.
                        </div>
                      </div>
                    </div>

                    {lowStockError && <div className="text-[10px] text-red-500 italic">{lowStockError}</div>}

                    <div className="flex flex-col gap-2">
                      <button 
                        className="payment-btn w-full" 
                        disabled={isLowStockLoading}
                        onClick={handleUpdateReorderSettings}
                      >
                        {isLowStockLoading ? 'SAVING...' : 'UPDATE SETTINGS'}
                      </button>
                      <button className="text-[10px] text-slate-500 underline" onClick={() => setEditingReorderProduct(null)}>CANCEL</button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs text-center">
                    <div className="opacity-50">Select a product's 'SETTINGS' to adjust its inventory alert thresholds.</div>
                  </div>
                )}
              </div>
            </div>

            <button className="mt-6 text-xs text-slate-500 underline block w-full text-center" onClick={() => { setShowModal(null); setEditingReorderProduct(null); }}>CLOSE DASHBOARD</button>
          </div>
        </div>
      )}
    </div>
  );
};

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

export const POSRegister: React.FC = () => {
  const [query, setQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isVat, setIsVat] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'PROMPTPAY' | 'CREDIT'>('CASH');
  const [serviceStatus, setServiceStatus] = useState({ 
    backend: 'checking', 
    db: 'checking', 
    catalog: 'unknown' 
  });
  const [isMock, setIsMock] = useState(true);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [cartWarning, setCartWarning] = useState<{ product_id: string; message: string } | null>(null);

  // Shift Management State
  const [currentShift, setCurrentShift] = useState<ShiftData | null>(null);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [employeeId] = useState(() => {
    let id = localStorage.getItem('dude_pos_dev_employee_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('dude_pos_dev_employee_id', id);
    }
    return id;
  }); // TODO: Replace with real auth/user management

  const [openingCashInput, setOpeningCashInput] = useState('0');
  const [actualCashInput, setActualCashInput] = useState('0');

  // Checkout State
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [lastTicket, setLastTicket] = useState<{
    ticket_id: string;
    ticket_no: string;
    total_amount: string;
    status: string;
  } | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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

  const fetchCurrentShift = async () => {
    setShiftLoading(true);
    try {
      const res = await fetch(`/ag_pos_api/shifts/current?employee_id=${employeeId}`);
      const data = await res.json();
      if (data.success && data.shift) {
        setCurrentShift(normalizeShift(data.shift));
        setActualCashInput(data.shift.opening_cash); // Default actual cash to opening for convenience
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

  useEffect(() => {
    checkHealth();
    fetchCurrentShift();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenShift = async () => {
    setShiftLoading(true);
    setShiftError(null);
    try {
      const res = await fetch('/ag_pos_api/shifts/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          opening_cash: parseFloat(openingCashInput)
        })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentShift(normalizeShift(data.shift));
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
    const timer = setTimeout(() => searchProducts(query, barcode), 300);
    return () => clearTimeout(timer);
  }, [query, barcode, searchProducts]);

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
          }
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
    <div className="pos-container">
      {/* Main Panel */}
      <div className="main-panel">
        <div className="pos-header">
          <div className="flex flex-col">
            <h2 className="font-tech text-xl text-glow text-orange-500">POS REGISTER v0.2</h2>
            <div className={`text-[9px] font-bold tracking-widest mt-1 ${isMock ? 'text-yellow-500' : 'text-green-500'}`}>
              {isMock ? '● MOCK CATALOG MODE' : '● LIVE PRODUCT CATALOG MODE'}
            </div>
          </div>
          <div className="status-group">
            <div className={`status-badge ${serviceStatus.backend}`} title="ag_pos service status">
              <div className="status-dot"></div>
              Backend: {serviceStatus.backend}
            </div>
            <div className={`status-badge ${serviceStatus.db}`} title="PostgreSQL connection status">
              <div className="status-dot"></div>
              DB: {serviceStatus.db}
            </div>
            <div className={`status-badge ${currentShift ? 'ok' : 'error'}`} title="Current shift status">
              <div className="status-dot"></div>
              Shift: {currentShift ? 'OPEN' : 'NO SHIFT'}
            </div>
          </div>
        </div>

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

        <div className="mt-auto pt-10 flex gap-4">
          <button className="payment-btn" style={{flex: 1}} onClick={() => setShowModal('shift')}>SHIFT CONTROL</button>
          <button className="payment-btn" style={{flex: 1}} onClick={() => setShowModal('void')}>VOID / REFUND</button>
        </div>
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
                <div className="flex flex-col items-center">
                  <span className="text-xs w-4 text-center">{item.quantity}</span>
                  {!allowsNegativeStock(item) && parseStockQty(item.on_hand_qty) !== null && item.quantity >= (parseStockQty(item.on_hand_qty) ?? 0) && (
                    <span className="text-[8px] text-red-500 font-bold leading-none mt-1">MAX</span>
                  )}
                </div>
                <button 
                  className="btn-icon" 
                  onClick={() => updateQuantity(item.product_id, 1)}
                >+</button>
              </div>
            </div>
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
          <div className="text-[9px] text-center text-slate-600 mt-2">
            Real ticket commitment enabled. All sales are logged to ag_pos database.
          </div>
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
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
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
    </div>
  );
};

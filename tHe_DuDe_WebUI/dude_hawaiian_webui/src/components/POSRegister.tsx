import React, { useState, useEffect, useCallback } from 'react';
import '../pos_register.css';

interface Product {
  product_id: string;
  name: string;
  sku: string;
  barcode: string | null;
  unit_price: string;
  is_active: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

const MOCK_PRODUCTS: Product[] = [
  { product_id: 'm1', name: 'น้ำแข็งหลอดเล็ก 5kg (MOCK)', sku: 'ICE-S-05', barcode: '885001', unit_price: '25.00', is_active: true },
  { product_id: 'm2', name: 'น้ำแข็งหลอดใหญ่ 10kg (MOCK)', sku: 'ICE-L-10', barcode: '885002', unit_price: '45.00', is_active: true },
  { product_id: 'm3', name: 'น้ำดื่ม Dude Pure 600ml (MOCK)', sku: 'WAT-600', barcode: '885003', unit_price: '10.00', is_active: true },
  { product_id: 'm4', name: 'น้ำแข็งป่นถุงกลาง (MOCK)', sku: 'ICE-P-08', barcode: '885004', unit_price: '35.00', is_active: true },
];

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

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

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
        setProducts(data.items);
        setIsMock(false);
      } else if (data.status === 'product_source_missing' || !data.success) {
        setIsMock(true);
        // Fallback to mock data if q or bc matches
        const filteredMock = MOCK_PRODUCTS.filter(p => 
          (q && (p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))) || 
          (bc && p.barcode === bc) ||
          (!q && !bc)
        );
        setProducts(filteredMock);
      }
    } catch {
      setIsMock(true);
      setProducts(MOCK_PRODUCTS);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(query, barcode), 300);
    return () => clearTimeout(timer);
  }, [query, barcode, searchProducts]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.product_id);
      if (existing) {
        return prev.map(item => 
          item.product_id === product.product_id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
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
          {products.map(product => (
            <div key={product.product_id} className="product-card" onClick={() => addToCart(product)}>
              <div className="text-sm font-bold truncate">{product.name}</div>
              <div className="text-[10px] text-slate-500">{product.sku}</div>
              <div className="product-price">{formatCurrency(parseFloat(product.unit_price))}</div>
            </div>
          ))}
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
          {cart.map(item => (
            <div key={item.product_id} className="cart-item">
              <div>
                <div className="text-xs font-bold">{item.name}</div>
                <div className="text-[10px] text-slate-400">
                  {formatCurrency(parseFloat(item.unit_price))} x {item.quantity}
                </div>
              </div>
              <div className="quantity-ctrl">
                <button className="btn-icon" onClick={() => updateQuantity(item.product_id, -1)}>-</button>
                <span className="text-xs w-4 text-center">{item.quantity}</span>
                <button className="btn-icon" onClick={() => updateQuantity(item.product_id, 1)}>+</button>
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
            className="btn-primary opacity-50 cursor-not-allowed" 
            onClick={() => alert('Checkout is NOT IMPLEMENTED (Infrastructure Only)')}
            disabled
          >
            COMPLETE ORDER (N/A)
          </button>
          <div className="text-[9px] text-center text-slate-600 mt-2">
            Real ticket commitment requires POS-010 implementation.
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal === 'shift' && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="font-tech text-lg mb-6">SHIFT CONTROL</h3>
            <div className="flex flex-col gap-4">
              <button className="btn-primary opacity-50" disabled>OPEN NEW SHIFT (N/A)</button>
              <button className="payment-btn opacity-50" disabled>CLOSE CURRENT SHIFT (N/A)</button>
              <div className="text-[10px] text-slate-500 text-center italic">Shift logic is pending business rule confirmation.</div>
              <button className="mt-4 text-xs text-slate-500 underline" onClick={() => setShowModal(null)}>CLOSE</button>
            </div>
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
    </div>
  );
};

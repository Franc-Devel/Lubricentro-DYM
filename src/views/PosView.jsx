import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Printer,
  Car,
  User,
  BadgePercent,
  CreditCard,
  Banknote,
  Building,
  RotateCcw,
} from 'lucide-react';
import Modal from '../components/Modal';

export function PosView() {
  const { terminal, user, showToast } = useAuth();

  // Search & Products
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Cart
  const [cart, setCart] = useState([]);
  const [discountPct, setDiscountPct] = useState(0);

  // Vehicle & Customer
  const [patente, setPatente] = useState('');
  const [clientInfo, setClientInfo] = useState(null);

  // Sellers
  const [vendors, setVendors] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');

  // Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  const searchInputRef = useRef(null);

  // Load vendors on mount
  useEffect(() => {
    fetch('/api/admin/vendors')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setVendors(data);
      })
      .catch(() => {});
  }, []);

  // Live product search with debounce
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSearchResults(data.slice(0, 8)); // Top 8 matches
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Lookup client by plate
  const handlePlateBlur = async () => {
    if (!patente.trim()) {
      setClientInfo(null);
      return;
    }
    try {
      const res = await fetch(`/api/clients/plate/${encodeURIComponent(patente.trim().toUpperCase())}`);
      if (res.ok) {
        const data = await res.json();
        setClientInfo(data);
        showToast(`Vehículo asociado: ${data.vehiculo || data.nombre_cliente}`, 'info');
      } else {
        setClientInfo(null);
      }
    } catch {
      setClientInfo(null);
    }
  };

  // Add product to cart
  const addToCart = (product) => {
    if (product.stock <= 0) {
      showToast(`¡Sin stock disponible para "${product.name}"!`, 'error');
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Stock máximo alcanzado (${product.stock} u.)`, 'warning');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [
          ...prevCart,
          {
            productId: product.id,
            code: product.code,
            name: product.name,
            presentation: product.presentation,
            price: Number(product.price),
            stock: product.stock,
            quantity: 1,
          },
        ];
      }
    });

    setSearchTerm('');
    setSearchResults([]);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // Update quantity in cart
  const updateQuantity = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.stock) {
              showToast(`Solo hay ${item.stock} unidades en stock.`, 'warning');
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPct(0);
    setPatente('');
    setClientInfo(null);
  };

  // Totals calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = subtotal * (Number(discountPct || 0) / 100);
  const total = Math.max(0, subtotal - discountAmount);

  const cashChange =
    paymentMethod === 'Efectivo' && cashReceived
      ? Math.max(0, Number(cashReceived) - total)
      : 0;

  // Process payment
  const handleConfirmPayment = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'Efectivo' && cashReceived && Number(cashReceived) < total) {
      showToast('El monto recibido en efectivo es menor al total a cobrar.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart,
          paymentMethod,
          cajaId: terminal,
          patente: patente.trim().toUpperCase(),
          clienteId: clientInfo?.id || null,
          vendedorId: selectedVendorId ? Number(selectedVendorId) : null,
          descGralPct: Number(discountPct || 0),
          usuario: user?.nombre || 'Cajero',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Fallo al registrar la venta.', 'error');
        setIsProcessing(false);
        return;
      }

      showToast(`¡Venta registrada con éxito! Total: ${formatCurrency(total)}`, 'success');
      setLastSale({
        ...data,
        clientName: clientInfo?.nombre_cliente || 'Consumidor Final',
        cajero: user?.nombre || 'Cajero',
        cashReceived: paymentMethod === 'Efectivo' ? Number(cashReceived) : total,
        change: cashChange,
      });

      setPaymentModalOpen(false);
      setReceiptModalOpen(true);
      clearCart();
    } catch (err) {
      showToast('Error de conexión al procesar la venta.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="page-view-container" style={{ padding: '16px 20px', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '18px', height: 'calc(100vh - 100px)' }}>
        
        {/* LEFT COLUMN: Search & Shopping Cart Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', minWidth: 0 }}>
          
          {/* Search Bar & Auto-Complete */}
          <div className="card" style={{ padding: '14px 18px', position: 'relative' }}>
            <div className="input-with-icon" style={{ width: '100%' }}>
              <Search size={18} />
              <input
                ref={searchInputRef}
                type="text"
                className="form-input"
                placeholder="Buscar por código de barras o nombre de producto (Ej: Elaion, WO-120, 20W50)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            {/* Results dropdown */}
            {searchResults.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '6px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 50,
                  maxHeight: '320px',
                  overflowY: 'auto',
                }}
              >
                {searchResults.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 229, 255, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                        {prod.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Cód: <span style={{ color: 'var(--cyan-primary)' }}>{prod.code}</span> | {prod.presentation || 'Presentación estándar'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                        {formatCurrency(prod.price)}
                      </div>
                      <span
                        className={`badge ${prod.stock < 5 ? 'badge-amber' : 'badge-emerald'}`}
                        style={{ fontSize: '10px' }}
                      >
                        Stock: {prod.stock} u.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} color="var(--cyan-primary)" />
                <h3 style={{ fontSize: '15px' }}>Artículos en el Carrito ({cart.length})</h3>
              </div>
              {cart.length > 0 && (
                <button onClick={clearCart} className="btn btn-secondary btn-sm" style={{ color: '#fca5a5' }}>
                  <RotateCcw size={14} /> Vaciar
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    gap: '10px',
                  }}
                >
                  <ShoppingCart size={40} strokeWidth={1.5} />
                  <p style={{ fontSize: '14px' }}>El carrito está vacío</p>
                  <p style={{ fontSize: '12px' }}>Escanea un código de barras o busca un producto arriba</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th>Precio Unit.</th>
                      <th style={{ textAlign: 'center' }}>Cantidad</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.productId}>
                        <td style={{ color: 'var(--cyan-primary)', fontWeight: 600, fontSize: '12px' }}>
                          {item.code}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.name}</div>
                          {item.presentation && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {item.presentation}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(item.price)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'var(--bg-input)',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            <button
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="btn btn-secondary btn-icon"
                              style={{ width: '22px', height: '22px' }}
                            >
                              <Minus size={12} />
                            </button>
                            <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="btn btn-secondary btn-icon"
                              style={{ width: '22px', height: '22px' }}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                        <td>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="btn btn-secondary btn-icon"
                            style={{ width: '28px', height: '28px', color: '#fca5a5' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Customer, Seller, Discount & Checkout Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
          
          {/* Metadata Card: Plate & Seller */}
          <div className="card" style={{ padding: '16px' }}>
            <h4 className="card-title" style={{ fontSize: '13px', marginBottom: '12px' }}>
              <Car size={16} color="var(--cyan-primary)" /> Datos del Servicio
            </h4>

            <div className="form-group">
              <label className="form-label">Patente de Vehículo (Opcional)</label>
              <div className="input-with-icon">
                <Car size={15} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: AE123BC o AA123BB"
                  value={patente}
                  onChange={(e) => setPatente(e.target.value.toUpperCase())}
                  onBlur={handlePlateBlur}
                />
              </div>
              {clientInfo && (
                <div style={{ fontSize: '11px', color: 'var(--emerald-primary)', marginTop: '4px', fontWeight: 600 }}>
                  ✓ {clientInfo.nombre_cliente} ({clientInfo.vehiculo || 'Sin modelo'})
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Vendedor Asignado</label>
              <div className="input-with-icon">
                <User size={15} />
                <select
                  className="form-select"
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                >
                  <option value="">Seleccionar vendedor...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.codigo} - {v.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Discount & Totals Card */}
          <div
            className="card"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '20px',
              background: 'linear-gradient(180deg, var(--bg-card) 0%, rgba(0, 229, 255, 0.04) 100%)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
            }}
          >
            <div>
              <div className="form-group">
                <label className="form-label">Descuento General (%)</label>
                <div className="input-with-icon">
                  <BadgePercent size={16} />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    placeholder="0"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(Math.max(0, Math.min(100, Number(e.target.value))))}
                  />
                </div>
              </div>

              {/* Summary Breakdown */}
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Subtotal Bruto:</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fca5a5' }}>
                    <span>Descuento ({discountPct}%):</span>
                    <span style={{ fontWeight: 600 }}>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div
                  style={{
                    height: '1px',
                    background: 'var(--border-subtle)',
                    margin: '8px 0',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    TOTAL A COBRAR:
                  </span>
                  <span
                    style={{
                      fontSize: '28px',
                      fontWeight: 800,
                      color: 'var(--cyan-primary)',
                      textShadow: '0 0 20px rgba(0, 229, 255, 0.4)',
                    }}
                  >
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '20px' }}
              disabled={cart.length === 0}
            >
              <CheckCircle2 size={20} />
              <span>COBRAR ({cart.length} ítems)</span>
            </button>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Confirmar Cobro de Venta"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 229, 255, 0.08)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monto Total a Cobrar</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--cyan-primary)' }}>
              {formatCurrency(total)}
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              Método de Pago
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {['Efectivo', 'Débito', 'Crédito', 'Transferencia', 'Cta Cte'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`btn ${paymentMethod === method ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '10px 6px', fontSize: '12px' }}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Received & Change */}
          {paymentMethod === 'Efectivo' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Monto Recibido</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  autoFocus
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  background: 'var(--bg-input)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Vuelto a entregar:</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--emerald-primary)' }}>
                  {formatCurrency(cashChange)}
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setPaymentModalOpen(false)}>
              Volver
            </button>
            <button
              className="btn btn-success"
              onClick={handleConfirmPayment}
              disabled={isProcessing}
            >
              {isProcessing ? 'Procesando...' : 'Confirmar Cobro'}
            </button>
          </div>
        </div>
      </Modal>

      {/* RECEIPT / PRINT MODAL */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="🧾 Comprobante de Venta Emitido"
      >
        {lastSale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Printable Ticket Box */}
            <div
              id="printable-ticket"
              style={{
                background: '#fff',
                color: '#000',
                padding: '24px',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.4',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>LUBRICENTRO DYM</h3>
                <p style={{ margin: '2px 0' }}>Av. Principal 1234 - Tel: (381) 456-7890</p>
                <p style={{ margin: '2px 0' }}>TICKET DE VENTA OFICIAL</p>
              </div>

              <div style={{ padding: '8px 0', borderBottom: '1px dashed #000' }}>
                <div>N° Comprobante: {lastSale.id.substring(0, 13)}</div>
                <div>Fecha: {lastSale.date}</div>
                <div>Cajero: {lastSale.cajero} | Terminal: {terminal}</div>
                <div>Cliente: {lastSale.clientName}</div>
                {lastSale.patente && <div>Vehículo / Patente: {lastSale.patente}</div>}
              </div>

              <div style={{ padding: '8px 0', borderBottom: '1px dashed #000' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>Ítem</span>
                  <span style={{ textAlign: 'center' }}>Cant</span>
                  <span style={{ textAlign: 'right' }}>Total</span>
                </div>
                {lastSale.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', margin: '2px 0' }}>
                    <span>{item.name}</span>
                    <span style={{ textAlign: 'center' }}>{item.quantity}</span>
                    <span style={{ textAlign: 'right' }}>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '8px 0', textAlign: 'right' }}>
                {lastSale.discountPct > 0 && (
                  <div>Descuento aplicado: {lastSale.discountPct}%</div>
                )}
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  TOTAL: {formatCurrency(lastSale.total)}
                </div>
                <div>Forma de Pago: {lastSale.paymentMethod}</div>
                {lastSale.paymentMethod === 'Efectivo' && (
                  <>
                    <div>Abonó con: {formatCurrency(lastSale.cashReceived)}</div>
                    <div>Su Vuelto: {formatCurrency(lastSale.change)}</div>
                  </>
                )}
              </div>

              <div style={{ textAlign: 'center', paddingTop: '10px', borderTop: '1px dashed #000' }}>
                ¡Gracias por su visita!
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={() => window.print()}
              >
                <Printer size={16} /> Imprimir Ticket
              </button>
              <button
                className="btn btn-success"
                onClick={() => setReceiptModalOpen(false)}
              >
                Nueva Venta
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PosView;

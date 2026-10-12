import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  History,
  Search,
  Eye,
  RotateCcw,
  Calendar,
  CreditCard,
  Car,
  AlertTriangle,
  FileText,
  User,
} from 'lucide-react';
import Modal from '../components/Modal';

export function HistorialVentasView() {
  const { user, isEncargado, showToast, terminal } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('Todas');
  const [boxFilter, setBoxFilter] = useState('');

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  // Refund / Cancellation Modal
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [saleToRefund, setSaleToRefund] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  const loadSales = async () => {
    try {
      setLoading(true);
      let url = `/api/sales?filter=${encodeURIComponent(methodFilter)}`;
      if (dateFilter) url += `&date=${encodeURIComponent(dateFilter)}`;
      if (boxFilter) url += `&cajaId=${encodeURIComponent(boxFilter)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setSales(data);
    } catch {
      showToast('Error al cargar historial de ventas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [dateFilter, methodFilter, boxFilter]);

  const handleOpenDetail = async (saleId) => {
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      const data = await res.json();
      setSelectedSale(data);
      setDetailModalOpen(true);
    } catch {
      showToast('Error cargando el detalle de la venta', 'error');
    }
  };

  const handleOpenRefundModal = (sale) => {
    if (!isEncargado) {
      showToast('Acceso denegado: Se requiere rol de Administrador o Encargado.', 'error');
      return;
    }
    setSaleToRefund(sale);
    setRefundReason('');
    setRefundModalOpen(true);
  };

  const handleConfirmRefund = async (e) => {
    e.preventDefault();
    if (!refundReason.trim()) {
      showToast('El motivo de anulación es obligatorio.', 'warning');
      return;
    }

    setIsRefunding(true);
    try {
      const res = await fetch(`/api/sales/${saleToRefund.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: refundReason.trim(),
          terminal: terminal,
          usuario: user?.nombre || 'Sistema',
          userRole: user?.rol || 'Cajero',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'No se pudo anular el comprobante', 'error');
        return;
      }

      showToast(`Comprobante anulado. Se repusieron los artículos al stock.`, 'success');
      setRefundModalOpen(false);
      loadSales();
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="page-view-container">
      {/* Filters Card */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} color="var(--cyan-primary)" />
              <input
                type="date"
                className="form-input"
                style={{ width: '160px', padding: '7px 10px' }}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="btn btn-secondary btn-sm"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Limpiar Fecha
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={15} color="var(--cyan-primary)" />
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '160px', padding: '7px 10px' }}
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="Todas">Todos los Medios</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Débito">Débito</option>
                <option value="Crédito">Crédito</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Cta Cte">Cuenta Corriente</option>
              </select>
            </div>

            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '130px', padding: '7px 10px' }}
              value={boxFilter}
              onChange={(e) => setBoxFilter(e.target.value)}
            >
              <option value="">Todas Cajas</option>
              <option value="Caja_1">Caja_1</option>
              <option value="Caja_2">Caja_2</option>
              <option value="Caja_Admin">Caja_Admin</option>
            </select>
          </div>

          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Mostrando <strong>{sales.length}</strong> comprobantes
          </span>
        </div>
      </div>

      {/* Sales Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Venta</th>
              <th>Fecha y Hora</th>
              <th style={{ textAlign: 'right' }}>Total Facturado</th>
              <th>Medio de Pago</th>
              <th>Terminal</th>
              <th>Vehículo / Cliente</th>
              <th>Vendedor</th>
              <th style={{ textAlign: 'center' }}>Ítems</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Cargando comprobantes...
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No se encontraron ventas registradas con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              sales.map((s) => (
                <tr key={s.id}>
                  <td style={{ color: 'var(--cyan-primary)', fontWeight: 600, fontSize: '12px' }}>
                    {s.id.substring(0, 10)}...
                  </td>
                  <td>{formatDate(s.date)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                    {formatCurrency(s.total)}
                  </td>
                  <td>
                    <span className="badge badge-cyan" style={{ fontSize: '11px' }}>
                      {s.payment_method}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.caja_id}</td>
                  <td>
                    {s.patente_vehiculo ? (
                      <div>
                        <strong style={{ color: 'var(--cyan-primary)' }}>{s.patente_vehiculo}</strong>
                        {s.nombre_cliente && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.nombre_cliente}</div>}
                      </div>
                    ) : (
                      s.nombre_cliente || '-'
                    )}
                  </td>
                  <td>{s.vendedor_nombre || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-emerald">{s.cantidad_items || 1} u.</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenDetail(s.id)}
                        className="btn btn-secondary btn-icon"
                        style={{ width: '28px', height: '28px' }}
                        title="Ver Detalle"
                      >
                        <Eye size={13} />
                      </button>

                      {isEncargado && (
                        <button
                          onClick={() => handleOpenRefundModal(s)}
                          className="btn btn-secondary btn-icon"
                          style={{ width: '28px', height: '28px', color: '#fca5a5' }}
                          title="Anular Comprobante y Reponer Stock"
                        >
                          <RotateCcw size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* SALE DETAIL MODAL */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="🧾 Detalle de Comprobante">
        {selectedSale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                padding: '12px',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
              }}
            >
              <div><strong>N° Comprobante:</strong> {selectedSale.id}</div>
              <div><strong>Fecha:</strong> {formatDate(selectedSale.date)}</div>
              <div><strong>Terminal:</strong> {selectedSale.caja_id}</div>
              <div><strong>Medio de Pago:</strong> {selectedSale.payment_method}</div>
              <div><strong>Vehículo:</strong> {selectedSale.patente_vehiculo || 'No especificado'}</div>
              <div><strong>Cliente:</strong> {selectedSale.nombre_cliente || 'Consumidor Final'}</div>
            </div>

            <div className="table-wrapper" style={{ maxHeight: '240px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Artículo</th>
                    <th style={{ textAlign: 'center' }}>Cant</th>
                    <th style={{ textAlign: 'right' }}>Precio Unit.</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items?.map((it) => (
                    <tr key={it.id}>
                      <td style={{ fontWeight: 600 }}>{it.name}</td>
                      <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(it.price)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatCurrency(it.price * it.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700 }}>TOTAL FACTURADO:</span>
              <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--cyan-primary)' }}>
                {formatCurrency(selectedSale.total)}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* ANULAR / DEVOLVER VENTA MODAL */}
      <Modal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        title="⚠️ Anulación de Comprobante de Venta"
      >
        {saleToRefund && (
          <form onSubmit={handleConfirmRefund} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(169,111,53,0.3)',
                fontSize: '12px',
                color: '#fca5a5',
              }}
            >
              Esta acción dará de baja la venta <strong>N° {saleToRefund.id.substring(0, 10)}</strong> por un total de{' '}
              <strong>{formatCurrency(saleToRefund.total)}</strong>. Todos los artículos vendidos se reintegrarán de inmediato al stock disponible y quedará registrado en la auditoría del sistema.
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Motivo de la Anulación (Obligatorio)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Ej: Error en método de pago ingresado / Devolución de mercadería / Ticket duplicado..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setRefundModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-danger" disabled={isRefunding}>
                {isRefunding ? 'Procesando...' : 'Confirmar Anulación y Reposición'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default HistorialVentasView;

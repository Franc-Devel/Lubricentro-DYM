import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  CircleDollarSign,
  Lock,
  Unlock,
  Coins,
  History,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import Modal from '../components/Modal';

export function CajaView({ cashStatus, refreshCashStatus }) {
  const { terminal, user, showToast } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Open Modal
  const [openModalVisible, setOpenModalVisible] = useState(false);
  const [operator, setOperator] = useState(user?.nombre || 'Cajero');
  const [initialAmount, setInitialAmount] = useState('');

  // Close / Arqueo Modal
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [declaredAmount, setDeclaredAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBoxOpen = cashStatus?.isOpen;
  const currentSession = cashStatus?.session;

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cash/sessions');
      const data = await res.json();
      if (Array.isArray(data)) setSessions(data);
    } catch {
      showToast('Error cargando historial de cajas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleOpenCash = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/cash/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cajaId: terminal,
          operator: operator.trim(),
          initialAmount: Number(initialAmount) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'No se pudo abrir la caja', 'error');
        return;
      }

      showToast(`Caja ${terminal} abierta con éxito. Fondo: ${formatCurrency(Number(initialAmount))}`, 'success');
      setOpenModalVisible(false);
      refreshCashStatus();
      loadSessions();
    } catch {
      showToast('Error de red al abrir caja', 'error');
    }
  };

  const handleCloseCash = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cash/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cajaId: terminal,
          declaredAmount: Number(declaredAmount) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Error al cerrar caja', 'error');
        setIsSubmitting(false);
        return;
      }

      const diff = data.diferencia;
      const diffText =
        diff === 0
          ? 'Arqueo exacto sin diferencias'
          : diff > 0
          ? `Sobrante de ${formatCurrency(diff)}`
          : `Faltante de ${formatCurrency(Math.abs(diff))}`;

      showToast(`Caja cerrada correctamente. ${diffText}`, diff < 0 ? 'warning' : 'success');
      setCloseModalVisible(false);
      setDeclaredAmount('');
      refreshCashStatus();
      loadSessions();
    } catch {
      showToast('Error al cerrar caja', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const expectedAmount = currentSession ? currentSession.monto_esperado_actual || currentSession.monto_inicial : 0;
  const differencePreview = declaredAmount !== '' ? Number(declaredAmount) - expectedAmount : 0;

  return (
    <div className="page-view-container">
      {/* Current Box Status Card */}
      <div
        className="card"
        style={{
          padding: '24px',
          background: isBoxOpen
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, var(--bg-card) 100%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, var(--bg-card) 100%)',
          border: isBoxOpen ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className={`badge ${isBoxOpen ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '13px', padding: '6px 14px' }}>
                {isBoxOpen ? '🟢 CAJA ABIERTA' : '🟠 CAJA CERRADA'}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Terminal: <strong style={{ color: 'var(--text-primary)' }}>{terminal}</strong>
              </span>
            </div>

            {isBoxOpen && currentSession ? (
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Operador / Cajero:</div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{currentSession.operador}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Apertura:</div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{formatDate(currentSession.fecha_apertura)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fondo Inicial:</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(currentSession.monto_inicial)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ventas Efectivo en Sesión:</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--emerald-primary)' }}>
                    +{formatCurrency(currentSession.ventas_efectivo)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Efectivo Total Esperado:</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyan-primary)' }}>
                    {formatCurrency(currentSession.monto_esperado_actual)}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
                No hay una sesión activa en esta terminal. Abre la caja para comenzar a procesar cobros y registrar ventas.
              </p>
            )}
          </div>

          <div>
            {isBoxOpen ? (
              <button
                onClick={() => setCloseModalVisible(true)}
                className="btn btn-primary btn-lg"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#2B211A' }}
              >
                <Lock size={18} /> Realizar Arqueo & Cerrar Caja
              </button>
            ) : (
              <button
                onClick={() => {
                  setOperator(user?.nombre || 'Cajero');
                  setInitialAmount('');
                  setOpenModalVisible(true);
                }}
                className="btn btn-success btn-lg"
              >
                <Unlock size={18} /> + Abrir Sesión de Caja
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Historical Sessions Table */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 className="card-title" style={{ fontSize: '15px', marginBottom: '14px' }}>
          <History size={16} color="var(--cyan-primary)" /> Registro de Sesiones de Caja Anteriores ({sessions.length})
        </h3>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Terminal</th>
                <th>Operador</th>
                <th>Fecha Apertura</th>
                <th>Fecha Cierre</th>
                <th style={{ textAlign: 'right' }}>Fondo Inicial</th>
                <th style={{ textAlign: 'right' }}>Monto Esperado</th>
                <th style={{ textAlign: 'right' }}>Declarado Físico</th>
                <th style={{ textAlign: 'right' }}>Diferencia</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Cargando historial de sesiones...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No hay sesiones de caja registradas.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700, color: 'var(--cyan-primary)' }}>{s.caja_id}</td>
                    <td>{s.operador}</td>
                    <td>{formatDate(s.fecha_apertura)}</td>
                    <td>{s.fecha_cierre ? formatDate(s.fecha_cierre) : 'En curso'}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(s.monto_inicial)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(s.monto_esperado || 0)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {formatCurrency(s.monto_final_declarado || 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {s.diferencia === null || s.diferencia === undefined ? (
                        '-'
                      ) : s.diferencia === 0 ? (
                        <span style={{ color: 'var(--emerald-primary)', fontWeight: 700 }}>$0,00</span>
                      ) : s.diferencia > 0 ? (
                        <span style={{ color: 'var(--cyan-primary)', fontWeight: 700 }}>
                          +{formatCurrency(s.diferencia)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--rose-primary)', fontWeight: 700 }}>
                          {formatCurrency(s.diferencia)}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${s.estado === 'Abierta' ? 'badge-emerald' : 'badge-cyan'}`}>
                        {s.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OPEN CASH MODAL */}
      <Modal isOpen={openModalVisible} onClose={() => setOpenModalVisible(false)} title={`Apertura de ${terminal}`}>
        <form onSubmit={handleOpenCash} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nombre del Operador / Cajero</label>
            <input
              type="text"
              className="form-input"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Fondo Inicial de Caja (Monto en Efectivo)</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              placeholder="0.00"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpenModalVisible(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-success">
              Confirmar Apertura
            </button>
          </div>
        </form>
      </Modal>

      {/* ARQUEO & CLOSE CASH MODAL */}
      <Modal
        isOpen={closeModalVisible}
        onClose={() => setCloseModalVisible(false)}
        title={`🔒 Cierre y Arqueo de Caja | ${terminal}`}
      >
        <form onSubmit={handleCloseCash} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(169,111,53,0.08)',
              border: '1px solid rgba(169,111,53,0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Monto Esperado en Sistema:</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyan-primary)' }}>
                {formatCurrency(expectedAmount)}
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right' }}>
              Fondo inicial: {formatCurrency(currentSession?.monto_inicial || 0)} <br />
              Ventas efectivo: +{formatCurrency(currentSession?.ventas_efectivo || 0)}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Monto Físico Contado en Caja (Declarado)</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              placeholder="Ingresa el conteo físico de billetes..."
              value={declaredAmount}
              onChange={(e) => setDeclaredAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          {declaredAmount !== '' && (
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background:
                  differencePreview === 0
                    ? 'rgba(16, 185, 129, 0.12)'
                    : differencePreview > 0
                    ? 'rgba(0, 229, 255, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${
                  differencePreview === 0
                    ? 'var(--emerald-primary)'
                    : differencePreview > 0
                    ? 'var(--cyan-primary)'
                    : 'var(--rose-primary)'
                }`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Diferencia de Arqueo:</span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color:
                    differencePreview === 0
                      ? 'var(--emerald-primary)'
                      : differencePreview > 0
                      ? 'var(--cyan-primary)'
                      : 'var(--rose-primary)',
                }}
              >
                {differencePreview === 0
                  ? 'Sin Diferencia (Cuadre Exacto)'
                  : differencePreview > 0
                  ? `Sobrante: +${formatCurrency(differencePreview)}`
                  : `Faltante: ${formatCurrency(differencePreview)}`}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCloseModalVisible(false)}>
              Volver
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : 'Confirmar Cierre de Caja'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CajaView;

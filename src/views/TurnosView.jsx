import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Car,
  User,
  Phone,
  Wrench,
  CheckCircle,
  XCircle,
  AlertCircle,
  CheckSquare,
} from 'lucide-react';
import Modal from '../components/Modal';

export function TurnosView() {
  const { showToast } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Todos');

  // New Turno Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    client: '',
    phone: '',
    vehicle: '',
    date: new Date().toISOString().substring(0, 10),
    time: '10:00',
    description: '',
    mecanico: '',
    checklist: [],
  });

  const availableChecklistItems = [
    'Cambio de Aceite de Motor',
    'Filtro de Aceite',
    'Filtro de Aire',
    'Filtro de Combustible',
    'Filtro de Habitáculo',
    'Revisión de Nivel de Frenos',
    'Engrase General',
  ];

  const loadTurnos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (Array.isArray(data)) setTurnos(data);
    } catch {
      showToast('Error al cargar los turnos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTurnos();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Turno marcado como: ${newStatus}`, 'success');
        loadTurnos();
      }
    } catch {
      showToast('Error al actualizar estado del turno', 'error');
    }
  };

  const toggleChecklistItem = (item) => {
    setFormData((prev) => {
      const exists = prev.checklist.includes(item);
      return {
        ...prev,
        checklist: exists ? prev.checklist.filter((i) => i !== item) : [...prev.checklist, item],
      };
    });
  };

  const handleCreateTurno = async (e) => {
    e.preventDefault();
    if (!formData.client.trim() || !formData.date) {
      showToast('El cliente y la fecha son obligatorios.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          checklist: formData.checklist.join(', '),
        }),
      });

      if (res.ok) {
        showToast('Turno agendado exitosamente', 'success');
        setModalOpen(false);
        loadTurnos();
      } else {
        showToast('No se pudo guardar el turno', 'error');
      }
    } catch {
      showToast('Error de red al guardar turno', 'error');
    }
  };

  const filteredTurnos =
    statusFilter === 'Todos'
      ? turnos
      : turnos.filter((t) => t.status?.toLowerCase() === statusFilter.toLowerCase());

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completado':
        return <span className="badge badge-emerald">✓ Completado</span>;
      case 'en proceso':
        return <span className="badge badge-cyan">⚡ En Proceso</span>;
      case 'cancelado':
        return <span className="badge badge-rose">✕ Cancelado</span>;
      default:
        return <span className="badge badge-amber">⏳ Pendiente</span>;
    }
  };

  return (
    <div className="page-view-container">
      {/* Header controls */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px', whiteSpace: 'nowrap' }}>
              Filtrar por Estado:
            </span>
            {['Todos', 'Pendiente', 'En Proceso', 'Completado', 'Cancelado'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                style={{ whiteSpace: 'nowrap' }}
              >
                {st}
              </button>
            ))}
          </div>

          <button onClick={() => setModalOpen(true)} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
            <Plus size={16} /> + Agendar Turno
          </button>
        </div>
      </div>

      {/* Grid of Turnos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Cargando agenda de turnos...
        </div>
      ) : filteredTurnos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <CalendarIcon size={36} style={{ margin: '0 auto 12px auto' }} />
          <p>No hay turnos registrados con el filtro actual.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredTurnos.map((t) => (
            <div
              key={t.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '18px',
                borderLeft:
                  t.status === 'Completado'
                    ? '4px solid var(--emerald-primary)'
                    : t.status === 'Cancelado'
                    ? '4px solid var(--rose-primary)'
                    : '4px solid var(--cyan-primary)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyan-primary)', fontWeight: 700 }}>
                    <Clock size={15} />
                    <span>{t.date} - {t.time} hs</span>
                  </div>
                  {getStatusBadge(t.status)}
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{t.client}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {t.vehicle && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Car size={14} color="var(--text-muted)" />
                      <span>{t.vehicle}</span>
                    </div>
                  )}

                  {t.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} color="var(--text-muted)" />
                      <span>{t.phone}</span>
                    </div>
                  )}

                  {t.mecanico && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Wrench size={14} color="var(--text-muted)" />
                      <span>Mecánico: <strong style={{ color: 'var(--text-primary)' }}>{t.mecanico}</strong></span>
                    </div>
                  )}

                  {t.description && (
                    <p style={{ marginTop: '6px', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                      "{t.description}"
                    </p>
                  )}

                  {t.checklist && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontWeight: 600, fontSize: '11px', color: 'var(--cyan-primary)', marginBottom: '4px' }}>
                        Servicios a realizar:
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {t.checklist}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Actions */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                {t.status !== 'Completado' && (
                  <button
                    onClick={() => handleStatusChange(t.id, 'Completado')}
                    className="btn btn-success btn-sm"
                    style={{ flex: 1 }}
                  >
                    <CheckCircle size={13} /> Listo
                  </button>
                )}

                {t.status !== 'En Proceso' && t.status !== 'Completado' && (
                  <button
                    onClick={() => handleStatusChange(t.id, 'En Proceso')}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    En Taller
                  </button>
                )}

                {t.status !== 'Cancelado' && (
                  <button
                    onClick={() => handleStatusChange(t.id, 'Cancelado')}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#fca5a5' }}
                  >
                    <XCircle size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NEW TURNO MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="📅 Agendar Nuevo Turno de Taller">
        <form onSubmit={handleCreateTurno} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cliente</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nombre completo"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Teléfono</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: 381-5554321"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Vehículo / Patente</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: VW Gol Trend (AE123BC)"
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fecha</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Hora</label>
              <input
                type="time"
                className="form-input"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Mecánico Asignado</label>
            <input
              type="text"
              className="form-input"
              placeholder="Nombre del técnico responsable"
              value={formData.mecanico}
              onChange={(e) => setFormData({ ...formData, mecanico: e.target.value })}
            />
          </div>

          {/* Interactive Checklist */}
          <div>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              Checklist de Trabajos Solicitados
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {availableChecklistItems.map((item) => {
                const checked = formData.checklist.includes(item);
                return (
                  <div
                    key={item}
                    onClick={() => toggleChecklistItem(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: checked ? 'rgba(0, 229, 255, 0.12)' : 'var(--bg-input)',
                      border: `1px solid ${checked ? 'var(--cyan-primary)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: checked ? 600 : 400,
                      color: checked ? 'var(--cyan-primary)' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <CheckSquare size={15} color={checked ? 'var(--cyan-primary)' : 'var(--text-muted)'} />
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Observaciones Adicionales</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Detalles sobre ruidos, tipo de aceite preferido, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Agendar Turno
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TurnosView;

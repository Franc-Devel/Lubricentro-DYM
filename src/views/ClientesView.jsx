import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Users, Car, Search, Plus, Edit2, History, Phone, Shield, FileText } from 'lucide-react';
import Modal from '../components/Modal';

export function ClientesView() {
  const { showToast } = useAuth();
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Client Modal (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    patente: '',
    dni: '',
    nombre: '',
    telefono: '',
    vehiculo: '',
    observaciones: '',
  });

  // Maintenance History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryPlate, setSelectedHistoryPlate] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadClients = async (term = '') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/clients?search=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (Array.isArray(data)) setClients(data);
    } catch {
      showToast('Error al cargar clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadClients(searchTerm);
  };

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({
      patente: '',
      dni: '',
      nombre: '',
      telefono: '',
      vehiculo: '',
      observaciones: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setFormData({
      patente: client.patente,
      dni: client.dni || '',
      nombre: client.nombre_cliente,
      telefono: client.telefono || '',
      vehiculo: client.vehiculo || '',
      observaciones: client.observaciones || '',
    });
    setModalOpen(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!formData.patente.trim() || !formData.nombre.trim()) {
      showToast('La patente y el nombre son obligatorios', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast('Cliente guardado exitosamente (datos sensibles cifrados con AES)', 'success');
        setModalOpen(false);
        loadClients(searchTerm);
      } else {
        showToast('Error al guardar el cliente', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    }
  };

  const handleViewHistory = async (plate) => {
    setSelectedHistoryPlate(plate);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/clients/plate/${encodeURIComponent(plate)}/history`);
      const data = await res.json();
      if (Array.isArray(data)) setHistoryData(data);
    } catch {
      showToast('Error al cargar historial del vehículo', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="page-view-container">
      {/* Header action bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', flex: '1 1 320px', maxWidth: '540px' }}>
            <div className="input-with-icon" style={{ flex: '1 1 220px', minWidth: '180px' }}>
              <Search size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por patente, nombre, DNI o modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              Buscar
            </button>
          </form>

          <button onClick={openCreateModal} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
            <Plus size={16} /> + Registrar Cliente & Vehículo
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Patente</th>
              <th>Cliente</th>
              <th>Vehículo Asociado</th>
              <th>Teléfono</th>
              <th>DNI</th>
              <th>Observaciones</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Cargando directorio de clientes...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No se encontraron clientes registrados.
                </td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: '#041017',
                        border: '1px solid var(--cyan-primary)',
                        color: 'var(--cyan-primary)',
                        fontWeight: 800,
                        fontSize: '12px',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {c.patente}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{c.nombre_cliente}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.vehiculo || '-'}</td>
                  <td>{c.telefono || '-'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{c.dni || '-'}</td>
                  <td style={{ color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.observaciones || '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => handleViewHistory(c.patente)}
                        className="btn btn-primary btn-sm"
                        title="Ver Historial de Servicios de este Vehículo"
                      >
                        <History size={13} /> Historial
                      </button>
                      <button
                        onClick={() => openEditModal(c)}
                        className="btn btn-secondary btn-icon"
                        style={{ width: '28px', height: '28px' }}
                        title="Editar"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT CLIENT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClient ? 'Editar Ficha de Cliente' : 'Alta de Cliente y Vehículo'}
      >
        <form onSubmit={handleSaveClient} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Patente (Única)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: AE123BC"
                value={formData.patente}
                onChange={(e) => setFormData({ ...formData, patente: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nombre del Cliente</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nombre y apellido"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">DNI (Se cifra en base de datos)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: 32111222"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Teléfono (Se cifra en base de datos)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: 381-4567890"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Modelo de Vehículo</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: VW Gol Trend 1.6 / Chevrolet Corsa Classic"
              value={formData.vehiculo}
              onChange={(e) => setFormData({ ...formData, vehiculo: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Observaciones del Cliente o Vehículo</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Ej: Aceite sintético 5W40 habitual, cambio de filtro en cada service..."
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Cliente
            </button>
          </div>
        </form>
      </Modal>

      {/* MAINTENANCE HISTORY MODAL */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`🔧 Historial de Mantenimiento | Patente ${selectedHistoryPlate}`}
        maxWidth="680px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {historyLoading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
              Consultando registro de servicios...
            </p>
          ) : historyData.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
              <Car size={36} style={{ margin: '0 auto 10px auto' }} />
              <p>No se registran ventas ni servicios previos para este vehículo.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
              {historyData.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cyan-primary)' }}>
                      Fecha: {formatDate(s.date)}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                      {formatCurrency(s.total)} ({s.payment_method})
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Terminal: {s.caja_id} | Comprobante N° {s.id.substring(0, 10)}
                  </div>

                  <div style={{ padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Ítems instalados / facturados:
                    </div>
                    {s.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', margin: '2px 0' }}>
                        <span>• {item.quantity}x {item.name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default ClientesView;

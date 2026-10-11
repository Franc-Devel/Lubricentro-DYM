import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  ShieldAlert,
  BarChart,
  Truck,
  Users,
  UserCheck,
  FileClock,
  Plus,
  Trash2,
  KeyRound,
  ShoppingBag,
} from 'lucide-react';
import Modal from '../components/Modal';

export function AdminView() {
  const { showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('cajas');

  // Summary by box
  const [boxSummary, setBoxSummary] = useState({});

  // Vendors
  const [vendors, setVendors] = useState([]);
  const [vendorModal, setVendorModal] = useState(false);
  const [newVendor, setNewVendor] = useState({ codigo: '', nombre: '' });

  // Suppliers & Purchases
  const [suppliers, setSuppliers] = useState([]);
  const [supplierModal, setSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ nombre: '', contacto: '', telefono: '', productos_asociados: '' });

  // Purchase Order modal (auto-stock increment)
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [newItemProductId, setNewItemProductId] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);

  // Users
  const [users, setUsers] = useState([]);
  const [userModal, setUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ usuario: '', password: '', nombre: '', rol: 'Cajero' });
  const [resetModal, setResetModal] = useState(false);
  const [userToReset, setUserToReset] = useState(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);

  // Loaders
  const loadBoxSummary = () => {
    fetch('/api/cash/summary-by-box')
      .then((res) => res.json())
      .then((data) => setBoxSummary(data))
      .catch(() => {});
  };

  const loadVendors = () => {
    fetch('/api/admin/vendors')
      .then((res) => res.json())
      .then((data) => setVendors(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const loadSuppliers = () => {
    fetch('/api/admin/suppliers')
      .then((res) => res.json())
      .then((data) => setSuppliers(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const loadUsers = () => {
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const loadAuditLogs = () => {
    fetch('/api/admin/audit-logs')
      .then((res) => res.json())
      .then((data) => setAuditLogs(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const loadProducts = () => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProductsList(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadBoxSummary();
    loadVendors();
    loadSuppliers();
    loadUsers();
    loadAuditLogs();
    loadProducts();
  }, []);

  // Handle create vendor
  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVendor),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Error al crear vendedor', 'error');
        return;
      }
      showToast('Vendedor creado exitosamente', 'success');
      setVendorModal(false);
      setNewVendor({ codigo: '', nombre: '' });
      loadVendors();
    } catch {
      showToast('Error de red', 'error');
    }
  };

  const handleDeleteVendor = async (id) => {
    if (!window.confirm('¿Eliminar vendedor?')) return;
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Vendedor eliminado', 'info');
        loadVendors();
      }
    } catch {
      showToast('Error', 'error');
    }
  };

  // Handle create supplier
  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSupplier),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Error al guardar proveedor', 'error');
        return;
      }
      showToast('Proveedor registrado con éxito', 'success');
      setSupplierModal(false);
      setNewSupplier({ nombre: '', contacto: '', telefono: '', productos_asociados: '' });
      loadSuppliers();
    } catch {
      showToast('Error de red', 'error');
    }
  };

  // Handle Purchase Order (auto increment stock)
  const handleAddPurchaseItem = () => {
    if (!newItemProductId || !newItemCost || !newItemQty) return;
    const prod = productsList.find((p) => String(p.id) === String(newItemProductId));
    if (!prod) return;

    setPurchaseItems((prev) => [
      ...prev,
      {
        producto_id: prod.id,
        name: prod.name,
        cost_price: Number(newItemCost),
        quantity: parseInt(newItemQty),
      },
    ]);
    setNewItemProductId('');
    setNewItemCost('');
    setNewItemQty(1);
  };

  const handleConfirmPurchase = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId || purchaseItems.length === 0) {
      showToast('Selecciona un proveedor y al menos un producto a ingresar.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/admin/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedorId: Number(selectedSupplierId),
          numeroFactura: invoiceNumber.trim(),
          items: purchaseItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Error al registrar la compra', 'error');
        return;
      }

      showToast(`¡Compra registrada! Se incrementó el inventario de ${purchaseItems.length} artículos.`, 'success');
      setPurchaseModal(false);
      setPurchaseItems([]);
      setInvoiceNumber('');
      loadAuditLogs();
      loadProducts();
    } catch {
      showToast('Error de red', 'error');
    }
  };

  // Handle create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Error al registrar usuario', 'error');
        return;
      }
      showToast('Usuario creado exitosamente', 'success');
      setUserModal(false);
      setNewUser({ usuario: '', password: '', nombre: '', rol: 'Cajero' });
      loadUsers();
    } catch {
      showToast('Error de red', 'error');
    }
  };

  const handleDeleteUser = async (id, uname) => {
    if (uname === 'admin') {
      showToast('No se puede eliminar el usuario administrador principal.', 'error');
      return;
    }
    if (!window.confirm(`¿Dar de baja al usuario "${uname}"?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Usuario eliminado', 'info');
        loadUsers();
      }
    } catch {
      showToast('Error al eliminar usuario', 'error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/users/${userToReset.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: resetPasswordVal }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Error al restablecer contraseña', 'error');
        return;
      }
      showToast('Contraseña restablecida con éxito', 'success');
      setResetModal(false);
      setResetPasswordVal('');
    } catch {
      showToast('Error de conexión', 'error');
    }
  };

  return (
    <div className="page-view-container">
      {/* Navigation Tabs */}
      <div className="card" style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('cajas')}
            className={`btn ${activeTab === 'cajas' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <BarChart size={16} /> Contabilidad y Cajas
          </button>
          <button
            onClick={() => setActiveTab('compras')}
            className={`btn ${activeTab === 'compras' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Truck size={16} /> Proveedores y Compras
          </button>
          <button
            onClick={() => setActiveTab('vendedores')}
            className={`btn ${activeTab === 'vendedores' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Users size={16} /> Vendedores
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`btn ${activeTab === 'usuarios' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <UserCheck size={16} /> Usuarios del Sistema
          </button>
          <button
            onClick={() => setActiveTab('auditoria')}
            className={`btn ${activeTab === 'auditoria' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <FileClock size={16} /> Auditoría
          </button>
        </div>
      </div>

      {/* TAB 1: CONTABILIDAD Y CAJAS */}
      {activeTab === 'cajas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 className="card-title" style={{ fontSize: '16px', marginBottom: '16px' }}>
              📊 Facturación Total Acumulada por Terminal de Caja
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {Object.entries(boxSummary).map(([box, data]) => (
                <div
                  key={box}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyan-primary)' }}>{box}</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
                    {formatCurrency(data.facturacion_total)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {data.total_ventas} transacciones históricas registradas
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROVEEDORES & COMPRAS */}
      {activeTab === 'compras' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 className="card-title" style={{ fontSize: '15px' }}>
                Directorio de Proveedores ({suppliers.length})
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setPurchaseItems([]);
                    setPurchaseModal(true);
                  }}
                  className="btn btn-primary"
                >
                  <ShoppingBag size={16} /> + Registrar Factura Compra (Incrementar Stock)
                </button>
                <button onClick={() => setSupplierModal(true)} className="btn btn-secondary">
                  <Plus size={16} /> + Nuevo Proveedor
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Razón Social / Nombre</th>
                    <th>Contacto</th>
                    <th>Teléfono</th>
                    <th>Productos / Marcas</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700 }}>{s.nombre}</td>
                      <td>{s.contacto || '-'}</td>
                      <td>{s.telefono || '-'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{s.productos_asociados || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteSupplier(s.id)}
                          className="btn btn-secondary btn-icon"
                          style={{ width: '28px', height: '28px', color: '#fca5a5' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VENDEDORES */}
      {activeTab === 'vendedores' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 className="card-title" style={{ fontSize: '15px' }}>
              Gestión de Vendedores ({vendors.length})
            </h3>
            <button onClick={() => setVendorModal(true)} className="btn btn-primary">
              <Plus size={16} /> + Nuevo Vendedor
            </button>
          </div>

          <div className="table-wrapper" style={{ maxWidth: '600px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre Completo</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 700, color: 'var(--cyan-primary)' }}>{v.codigo}</td>
                    <td>{v.nombre}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteVendor(v.id)}
                        className="btn btn-secondary btn-icon"
                        style={{ width: '28px', height: '28px', color: '#fca5a5' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 className="card-title" style={{ fontSize: '15px' }}>
              Usuarios del Sistema & Permisos
            </h3>
            <button onClick={() => setUserModal(true)} className="btn btn-primary">
              <Plus size={16} /> + Registrar Usuario
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre Completo</th>
                  <th>Rol</th>
                  <th>Sesión Activa En</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700, color: 'var(--cyan-primary)' }}>{u.usuario}</td>
                    <td>{u.nombre_completo}</td>
                    <td>
                      <span className={`badge ${u.rol === 'Admin' ? 'badge-rose' : 'badge-cyan'}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td>{u.sesion_activa_en || <span style={{ color: 'var(--text-muted)' }}>Desconectado</span>}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setUserToReset(u);
                            setResetPasswordVal('');
                            setResetModal(true);
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          <KeyRound size={13} /> Blanquear Clave
                        </button>
                        {u.usuario !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.usuario)}
                            className="btn btn-secondary btn-icon"
                            style={{ width: '28px', height: '28px', color: '#fca5a5' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUDITORIA */}
      {activeTab === 'auditoria' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 className="card-title" style={{ fontSize: '15px', marginBottom: '14px' }}>
            Registro de Auditoría de Operaciones Críticas (Últimas 200)
          </h3>
          <div className="table-wrapper" style={{ maxHeight: '450px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Terminal</th>
                  <th>Acción</th>
                  <th>Detalles de la Operación</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>{formatDate(log.fecha_hora)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--cyan-primary)' }}>{log.terminal}</td>
                    <td>
                      <span className="badge badge-amber">{log.accion}</span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{log.detalle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR COMPRA PROVEEDOR CON INCREMENTO DE STOCK */}
      <Modal isOpen={purchaseModal} onClose={() => setPurchaseModal(false)} title="📦 Factura de Compra a Proveedor (Ingreso de Stock)" maxWidth="680px">
        <form onSubmit={handleConfirmPurchase} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Proveedor</label>
              <select
                className="form-select"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                required
              >
                <option value="">Seleccionar proveedor...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">N° de Factura / Remito</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: A-0001-00045892"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Add Item Line */}
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyan-primary)' }}>
              Agregar Artículo a la Factura
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', alignItems: 'flex-end' }}>
              <div>
                <label className="form-label">Producto</label>
                <select
                  className="form-select"
                  value={newItemProductId}
                  onChange={(e) => {
                    setNewItemProductId(e.target.value);
                    const p = productsList.find((x) => String(x.id) === e.target.value);
                    if (p) setNewItemCost(p.cost_price || '');
                  }}
                >
                  <option value="">Selecciona un producto...</option>
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock actual: {p.stock} u.)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Costo Unit.</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                />
              </div>
              <button type="button" onClick={handleAddPurchaseItem} className="btn btn-secondary" style={{ height: '38px' }}>
                + Agregar
              </button>
            </div>
          </div>

          {/* Added items list */}
          <div className="table-wrapper" style={{ maxHeight: '180px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ textAlign: 'right' }}>Costo</th>
                  <th style={{ textAlign: 'center' }}>Cant. a Sumar</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {purchaseItems.map((item, i) => (
                  <tr key={i}>
                    <td>{item.name}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.cost_price)}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--emerald-primary)' }}>
                      +{item.quantity} u.
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {formatCurrency(item.cost_price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setPurchaseModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-success" disabled={purchaseItems.length === 0}>
              Confirmar Ingreso de Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: NUEVO PROVEEDOR */}
      <Modal isOpen={supplierModal} onClose={() => setSupplierModal(false)} title="Alta de Proveedor">
        <form onSubmit={handleCreateSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Razón Social</label>
            <input
              type="text"
              className="form-input"
              value={newSupplier.nombre}
              onChange={(e) => setNewSupplier({ ...newSupplier, nombre: e.target.value })}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Contacto / Representante</label>
            <input
              type="text"
              className="form-input"
              value={newSupplier.contacto}
              onChange={(e) => setNewSupplier({ ...newSupplier, contacto: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Teléfono</label>
            <input
              type="text"
              className="form-input"
              value={newSupplier.telefono}
              onChange={(e) => setNewSupplier({ ...newSupplier, telefono: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Marcas o Productos que Provee</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: YPF, Shell, Filtros WEGA..."
              value={newSupplier.productos_asociados}
              onChange={(e) => setNewSupplier({ ...newSupplier, productos_asociados: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setSupplierModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Proveedor
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: NUEVO VENDEDOR */}
      <Modal isOpen={vendorModal} onClose={() => setVendorModal(false)} title="Nuevo Vendedor">
        <form onSubmit={handleCreateVendor} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Código de Vendedor (Ej: VEN01)</label>
            <input
              type="text"
              className="form-input"
              value={newVendor.codigo}
              onChange={(e) => setNewVendor({ ...newVendor, codigo: e.target.value })}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nombre Completo</label>
            <input
              type="text"
              className="form-input"
              value={newVendor.nombre}
              onChange={(e) => setNewVendor({ ...newVendor, nombre: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setVendorModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Vendedor
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: NUEVO USUARIO */}
      <Modal isOpen={userModal} onClose={() => setUserModal(false)} title="Registrar Usuario del Sistema">
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nombre de Usuario (Login)</label>
            <input
              type="text"
              className="form-input"
              value={newUser.usuario}
              onChange={(e) => setNewUser({ ...newUser, usuario: e.target.value })}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nombre Completo</label>
            <input
              type="text"
              className="form-input"
              value={newUser.nombre}
              onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Rol</label>
            <select
              className="form-select"
              value={newUser.rol}
              onChange={(e) => setNewUser({ ...newUser, rol: e.target.value })}
            >
              <option value="Cajero">Cajero</option>
              <option value="Encargado">Encargado</option>
              <option value="Admin">Administrador</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Contraseña (Mínimo 12 caracteres, mayúscula, minúscula, número y símbolo)</label>
            <input
              type="password"
              className="form-input"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setUserModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Crear Usuario
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RESET PASSWORD */}
      <Modal isOpen={resetModal} onClose={() => setResetModal(false)} title={`Blanquear Contraseña | ${userToReset?.usuario}`}>
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Ingresa la nueva contraseña segura para <strong>{userToReset?.nombre_completo}</strong>:
          </p>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nueva Contraseña</label>
            <input
              type="password"
              className="form-input"
              placeholder="Mínimo 12 caracteres con mayúscula, número y símbolo"
              value={resetPasswordVal}
              onChange={(e) => setResetPasswordVal(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setResetModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Nueva Clave
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminView;

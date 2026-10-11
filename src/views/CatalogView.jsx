import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Building2,
  Download,
  AlertTriangle,
  Layers,
  Filter,
} from 'lucide-react';
import Modal from '../components/Modal';

export function CatalogView() {
  const { showToast } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    presentation: '',
    price: '',
    cost_price: '',
    stock: '',
    categoria_id: '',
  });

  // Branch Stock Modal
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchSearch, setBranchSearch] = useState('');
  const [branchResults, setBranchResults] = useState([]);

  // General Catalog Modal
  const [generalModalOpen, setGeneralModalOpen] = useState(false);
  const [generalSearch, setGeneralSearch] = useState('');
  const [generalProducts, setGeneralProducts] = useState([]);
  const [importStock, setImportStock] = useState(10);

  // Load products & categories
  const loadProducts = async () => {
    try {
      setLoading(true);
      let url = `/api/products?lowStockOnly=${lowStockOnly}`;
      if (selectedCategory) url += `&categoryId=${selectedCategory}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (e) {
      showToast('Error cargando el catálogo', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, lowStockOnly]);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts();
  };

  // Open Modal for Create or Edit
  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      code: '',
      name: '',
      presentation: '',
      price: '',
      cost_price: '',
      stock: '',
      categoria_id: categories[0]?.id || '',
    });
    setProductModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      code: prod.code,
      name: prod.name,
      presentation: prod.presentation || '',
      price: prod.price,
      cost_price: prod.cost_price || '',
      stock: prod.stock,
      categoria_id: prod.categoria_id || '',
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || formData.price === '') {
      showToast('Código, nombre y precio son obligatorios.', 'warning');
      return;
    }

    try {
      const isEditing = Boolean(editingProduct);
      const url = isEditing ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Error al guardar el producto', 'error');
        return;
      }

      showToast(isEditing ? 'Producto actualizado' : 'Producto creado exitosamente', 'success');
      setProductModalOpen(false);
      loadProducts();
    } catch {
      showToast('Error de conexión', 'error');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de eliminar el producto "${name}"?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Producto eliminado', 'info');
        loadProducts();
      } else {
        showToast('No se pudo eliminar el artículo', 'error');
      }
    } catch {
      showToast('Error de red', 'error');
    }
  };

  // Check branch availability
  const handleSearchBranches = async () => {
    if (!branchSearch.trim()) return;
    try {
      const res = await fetch(`/api/catalog-branches/stock?term=${encodeURIComponent(branchSearch)}`);
      const data = await res.json();
      if (Array.isArray(data)) setBranchResults(data);
    } catch {
      showToast('Error al consultar stock de sucursales', 'error');
    }
  };

  // Search General Catalog
  const handleSearchGeneral = async () => {
    try {
      const res = await fetch(`/api/catalog-general?search=${encodeURIComponent(generalSearch)}`);
      const data = await res.json();
      if (Array.isArray(data)) setGeneralProducts(data);
    } catch {
      showToast('Error buscando en el catálogo general', 'error');
    }
  };

  const handleImportProduct = async (item) => {
    try {
      const res = await fetch('/api/catalog-general/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item,
          sucursal: 'Sucursal A',
          stockInicial: Number(importStock) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Error al importar', 'error');
        return;
      }
      showToast(`Producto "${item.name}" importado con éxito`, 'success');
      loadProducts();
    } catch {
      showToast('Error de conexión', 'error');
    }
  };

  return (
    <div className="page-view-container">
      {/* Top action header */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Filters Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', flex: '1 1 540px', alignItems: 'center' }}>
            <div className="input-with-icon" style={{ flex: '1 1 200px', minWidth: '180px' }}>
              <Search size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por código o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '170px', flex: '0 1 auto' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`btn ${lowStockOnly ? 'btn-danger' : 'btn-secondary'}`}
              title="Filtrar stock crítico (< 5 u.)"
              style={{ whiteSpace: 'nowrap' }}
            >
              <AlertTriangle size={15} />
              <span>Stock Crítico</span>
            </button>

            <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              Filtrar
            </button>
          </form>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => {
                setBranchModalOpen(true);
                setBranchSearch('');
                setBranchResults([]);
              }}
              className="btn btn-secondary"
              style={{ whiteSpace: 'nowrap' }}
            >
              <Building2 size={16} /> Sucursales
            </button>

            <button
              onClick={() => {
                setGeneralModalOpen(true);
                handleSearchGeneral();
              }}
              className="btn btn-secondary"
              style={{ whiteSpace: 'nowrap' }}
            >
              <Download size={16} /> Red Catálogo
            </button>

            <button onClick={openCreateModal} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              <Plus size={16} /> + Nuevo Artículo
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Presentación</th>
              <th>Categoría</th>
              <th style={{ textAlign: 'right' }}>Precio Venta</th>
              <th style={{ textAlign: 'right' }}>Costo</th>
              <th style={{ textAlign: 'center' }}>Stock</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Cargando inventario...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No se encontraron productos con los filtros especificados.
                </td>
              </tr>
            ) : (
              products.map((prod) => (
                <tr key={prod.id}>
                  <td style={{ fontWeight: 600, color: 'var(--cyan-primary)', fontSize: '12px' }}>
                    {prod.code}
                  </td>
                  <td style={{ fontWeight: 600 }}>{prod.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{prod.presentation || '-'}</td>
                  <td>
                    <span className="badge badge-cyan" style={{ fontSize: '10px' }}>
                      {prod.categoria_nombre || 'General'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(prod.price)}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                    {formatCurrency(prod.cost_price || 0)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className={`badge ${
                        prod.stock <= 0 ? 'badge-rose' : prod.stock < 5 ? 'badge-amber' : 'badge-emerald'
                      }`}
                    >
                      {prod.stock} u.
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => openEditModal(prod)}
                        className="btn btn-secondary btn-icon"
                        style={{ width: '28px', height: '28px' }}
                        title="Editar"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        className="btn btn-secondary btn-icon"
                        style={{ width: '28px', height: '28px', color: '#fca5a5' }}
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Alta de Nuevo Producto'}
      >
        <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Código</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: ELA-F50"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nombre / Descripción</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Aceite YPF Elaion F50 5W40"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Presentación / Envase</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Bidón 4 Litros"
                value={formData.presentation}
                onChange={(e) => setFormData({ ...formData, presentation: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Categoría</label>
              <select
                className="form-select"
                value={formData.categoria_id}
                onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
              >
                <option value="">Sin Categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Precio de Venta</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Precio de Costo</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="0.00"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Stock Actual</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setProductModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Producto
            </button>
          </div>
        </form>
      </Modal>

      {/* BRANCH AVAILABILITY MODAL */}
      <Modal
        isOpen={branchModalOpen}
        onClose={() => setBranchModalOpen(false)}
        title="🏢 Consulta de Stock en Toda la Red de Sucursales"
        maxWidth="680px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por código o producto (Ej: Elaion, 20W50)..."
              value={branchSearch}
              onChange={(e) => setBranchSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchBranches()}
            />
            <button className="btn btn-primary" onClick={handleSearchBranches}>
              Consultar
            </button>
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {branchResults.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                Ingresa un término para ver las existencias agrupadas por sucursal.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código Base</th>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Disponibilidad en Red</th>
                  </tr>
                </thead>
                <tbody>
                  {branchResults.map((r, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--cyan-primary)', fontWeight: 600 }}>{r.codigo_base}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.presentation}</div>
                      </td>
                      <td>{formatCurrency(r.price)}</td>
                      <td>
                        <span className="badge badge-cyan">{r.disponibilidad}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Modal>

      {/* GENERAL CATALOG IMPORT MODAL */}
      <Modal
        isOpen={generalModalOpen}
        onClose={() => setGeneralModalOpen(false)}
        title="🌐 Catálogo General de Lubricentro (Red Central)"
        maxWidth="720px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar en catálogo maestro (Ej: Motul, Total, Castrol)..."
              value={generalSearch}
              onChange={(e) => setGeneralSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchGeneral()}
            />
            <button className="btn btn-secondary" onClick={handleSearchGeneral}>
              Buscar
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '12px' }}>Stock inicial:</span>
              <input
                type="number"
                className="form-input"
                style={{ width: '70px', padding: '6px 8px' }}
                value={importStock}
                onChange={(e) => setImportStock(e.target.value)}
              />
            </div>
          </div>

          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {generalProducts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                No hay productos que coincidan en el catálogo general.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio Sugerido</th>
                    <th style={{ textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {generalProducts.map((item) => (
                    <tr key={item.id}>
                      <td style={{ color: 'var(--cyan-primary)', fontWeight: 600 }}>{item.code}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.presentation}</div>
                      </td>
                      <td>{item.category_name || 'General'}</td>
                      <td>{formatCurrency(item.suggested_price || 0)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleImportProduct(item)}
                          className="btn btn-success btn-sm"
                          title="Importar al inventario local"
                        >
                          <Download size={13} /> Importar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CatalogView;

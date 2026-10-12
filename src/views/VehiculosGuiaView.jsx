import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Car, Bike, ShieldCheck, Droplet, Wind, Fuel, Sparkles, Plus, Search, X } from 'lucide-react';
import Modal from '../components/Modal';

export function VehiculosGuiaView() {
  const { showToast } = useAuth();

  const [selectedType, setSelectedType] = useState('Autos y Camionetas');
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(false);

  // Live Vehicle Search Bar state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  // All specs list for directory table
  const [allSpecs, setAllSpecs] = useState([]);
  const [searchTable, setSearchTable] = useState('');

  // New Ficha Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'Autos y Camionetas',
    marca: '',
    modelo: '',
    aceite: '',
    filtro_aceite: '',
    filtro_aire: '',
    filtro_combustible: '',
    filtro_habitaculo: 'N/A',
  });

  // Load all specs for search & table view
  const loadAllSpecs = () => {
    fetch('/api/vehicles/all')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          data = data.filter(value => value && typeof value === "object" && typeof value.marca === "string" && typeof value.modelo === "string");
          setAllSpecs(data);
          if (data.length > 0 && !spec) {
            setSpec(data[0]);
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAllSpecs();
  }, []);

  // Live search filtering across all specs
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchDropdownOpen(false);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const matches = allSpecs.filter((s) => {
      const brandStr = (s.marca || '').toLowerCase();
      const modelStr = (s.modelo || '').toLowerCase();
      const aceiteStr = (s.aceite || '').toLowerCase();
      return brandStr.includes(term) || modelStr.includes(term) || aceiteStr.includes(term);
    });

    setSearchResults(matches);
    setSearchDropdownOpen(true);
  }, [searchTerm, allSpecs]);

  // Load brands when type changes
  useEffect(() => {
    fetch(`/api/vehicles/brands?type=${encodeURIComponent(selectedType)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          data = data.filter(value => typeof value === "string");
          setBrands(data);
          if (data.length > 0) {
            setSelectedBrand(data[0]);
          } else {
            setSelectedBrand('');
            setModels([]);
          }
        }
      })
      .catch(() => {});
  }, [selectedType]);

  // Load models when brand changes
  useEffect(() => {
    if (!selectedBrand) return;
    fetch(`/api/vehicles/models?type=${encodeURIComponent(selectedType)}&brand=${encodeURIComponent(selectedBrand)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          data = data.filter(value => typeof value === "string");
          setModels(data);
          if (data.length > 0) {
            setSelectedModel(data[0]);
          } else {
            setSelectedModel('');
          }
        }
      })
      .catch(() => {});
  }, [selectedType, selectedBrand]);

  // Load spec when model changes manually from dropdown
  const handleSelectModelDropdown = (modelName) => {
    setSelectedModel(modelName);
    if (!selectedType || !selectedBrand || !modelName) return;
    setLoading(true);
    fetch(
      `/api/vehicles/specs?type=${encodeURIComponent(selectedType)}&brand=${encodeURIComponent(selectedBrand)}&model=${encodeURIComponent(modelName)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && !Array.isArray(data) && typeof data === "object" && typeof data.modelo === "string") setSpec(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleSelectVehicleFromSearch = (v) => {
    setSpec(v);
    if (v.tipo) setSelectedType(v.tipo);
    if (v.marca) setSelectedBrand(v.marca);
    if (v.modelo) setSelectedModel(v.modelo);
    setSearchDropdownOpen(false);
    setSearchTerm(`${v.marca} ${v.modelo}`);
  };

  const handleSaveFicha = async (e) => {
    e.preventDefault();
    if (!formData.marca.trim() || !formData.modelo.trim()) {
      showToast('Marca y modelo son obligatorios', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/vehicles/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        showToast('Ficha técnica guardada permanentemente', 'success');
        setModalOpen(false);
        loadAllSpecs();
      } else {
        showToast('Error al guardar la ficha técnica', 'error');
      }
    } catch {
      showToast('Error de red', 'error');
    }
  };

  const filteredSpecsTable = allSpecs.filter((s) => {
    const term = searchTable.toLowerCase();
    return (
      (s.marca || '').toLowerCase().includes(term) ||
      (s.modelo || '').toLowerCase().includes(term) ||
      (s.aceite || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* 1. TOP HEADER BAR */}
      <div className="card" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Car size={22} style={{ color: 'var(--cyan-primary)' }} />
              Guía Técnica de Vehículos
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Consulta rápida de capacidad de aceite, viscosidad y códigos de filtros por modelo
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: 'rgba(247,241,230,0.85)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setSelectedType('Autos y Camionetas')}
                className={`btn ${selectedType === 'Autos y Camionetas' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <Car size={15} /> Autos y Camionetas
              </button>
              <button
                onClick={() => setSelectedType('Motos')}
                className={`btn ${selectedType === 'Motos' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <Bike size={15} /> Motos
              </button>
            </div>

            <button onClick={() => setModalOpen(true)} className="btn btn-primary" style={{ padding: '10px 18px' }}>
              <Plus size={16} /> Registrar Ficha
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN SEARCH & FILTER HERO CARD */}
      <div
        className="card"
        style={{
          padding: '24px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(169,111,53,0.9) 0%, rgba(169,111,53,0.95) 100%)',
          border: '1px solid rgba(169,111,53,0.35)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>

          {/* Main Search Input Box */}
          <div style={{ position: 'relative', width: '100%' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyan-primary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
              🔍 Búsqueda Rápida por Modelo o Marca
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={22}
                style={{
                  position: 'absolute',
                  left: '16px',
                  color: 'var(--cyan-primary)',
                  zIndex: 2,
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                className="form-input"
                style={{
                  width: '100%',
                  height: '52px',
                  fontSize: '16px',
                  paddingLeft: '50px',
                  paddingRight: searchTerm ? '50px' : '16px',
                  borderRadius: '12px',
                  background: 'rgba(169,111,53,0.95)',
                  border: '1.5px solid var(--cyan-primary)',
                  boxShadow: '0 0 20px rgba(169,111,53,0.15)',
                  color: '#2B211A',
                }}
                placeholder="Escriba el vehículo que busca... (Ej: Trend, Hilux, Cronos, 208, Amarok, Corsa, Titan)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setSearchDropdownOpen(true);
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSearchDropdownOpen(false);
                  }}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Auto-complete Dropdown Results */}
            {searchDropdownOpen && searchResults.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  background: '#F7F1E6',
                  border: '1.5px solid var(--cyan-primary)',
                  borderRadius: '12px',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.9)',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    padding: '10px 16px',
                    background: 'rgba(169,111,53,0.12)',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--cyan-primary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>MODELOS ENCONTRADOS ({searchResults.length})</span>
                  <span>Haga clic para cargar la ficha</span>
                </div>
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectVehicleFromSearch(item)}
                    style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 229, 255, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#2B211A' }}>
                        {item.marca} - {item.modelo}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--cyan-primary)', marginTop: '3px' }}>
                        🛢️ Aceite: <strong>{item.aceite}</strong> | Filtro: <strong>{item.filtro_aceite}</strong>
                      </div>
                    </div>
                    <span className="badge badge-cyan" style={{ fontSize: '11px', padding: '4px 10px' }}>
                      {item.tipo}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Secondary Dropdown Selector (Brand & Model) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Filtrar por Marca ({brands.length} disponibles)
              </label>
              <select
                className="form-select"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                style={{ height: '42px', fontSize: '13px' }}
              >
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Filtrar por Modelo ({models.length} disponibles)
              </label>
              <select
                className="form-select"
                value={selectedModel}
                onChange={(e) => handleSelectModelDropdown(e.target.value)}
                style={{ height: '42px', fontSize: '13px' }}
              >
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* 3. HERO FICHA TÉCNICA CARD */}
      <div className="card" style={{ padding: '28px', background: 'rgba(169,111,53,0.9)' }}>
        {!spec ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Car size={48} style={{ margin: '0 auto 14px auto', opacity: 0.5 }} />
            <p style={{ fontSize: '15px' }}>Seleccione o busque un vehículo para desplegar su ficha técnica.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Header of selected vehicle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '8px', fontSize: '11px' }}>
                  {spec.tipo}
                </span>
                <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#2B211A', letterSpacing: '0.02em', margin: 0 }}>
                  {spec.marca} - {spec.modelo}
                </h2>
              </div>
              <div
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: 'rgba(71,102,79,0.1)',
                  border: '1px solid rgba(169,111,53,0.3)',
                  color: '#6ee7b7',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                ✓ Ficha Técnica Verificada
              </div>
            </div>

            {/* Spec Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>

              {/* Aceite */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '14px',
                  background: 'rgba(169,111,53,0.08)',
                  border: '1px solid rgba(169,111,53,0.3)',
                  boxShadow: '0 4px 15px rgba(169,111,53,0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyan-primary)', marginBottom: '10px' }}>
                  <Droplet size={20} />
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aceite de Motor</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#2B211A' }}>{spec.aceite || 'No especificado'}</div>
              </div>

              {/* Filtro Aceite */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '14px',
                  background: 'rgba(71,102,79,0.08)',
                  border: '1px solid rgba(169,111,53,0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--emerald-primary)', marginBottom: '10px' }}>
                  <ShieldCheck size={20} />
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtro de Aceite</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#2B211A' }}>{spec.filtro_aceite || 'N/A'}</div>
              </div>

              {/* Filtro Aire */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '14px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(169,111,53,0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--amber-primary)', marginBottom: '10px' }}>
                  <Wind size={20} />
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtro de Aire</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#2B211A' }}>{spec.filtro_aire || 'N/A'}</div>
              </div>

              {/* Filtro Combustible */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '14px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(169,111,53,0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5', marginBottom: '10px' }}>
                  <Fuel size={20} />
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtro de Combustible</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#2B211A' }}>{spec.filtro_combustible || 'N/A'}</div>
              </div>

              {/* Filtro Habitáculo */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '14px',
                  background: 'rgba(169,111,53,0.08)',
                  border: '1px solid rgba(169,111,53,0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--purple-primary)', marginBottom: '10px' }}>
                  <Sparkles size={20} />
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtro Habitáculo</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#2B211A' }}>{spec.filtro_habitaculo || 'N/A'}</div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* 4. COMPLETE DIRECTORY TABLE AT BOTTOM */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 className="card-title" style={{ fontSize: '16px', margin: 0 }}>
            Base de Datos Completa ({allSpecs.length} Fichas Registradas)
          </h3>
          <div style={{ position: 'relative', width: '280px' }}>
            <div className="input-with-icon">
              <Search size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Filtrar tabla por modelo o marca..."
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-wrapper" style={{ maxHeight: '320px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Aceite</th>
                <th>Filtro Aceite</th>
                <th>Filtro Aire</th>
                <th>Filtro Combustible</th>
                <th>Habitáculo</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpecsTable.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setSpec(s)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <span className="badge badge-cyan" style={{ fontSize: '10px' }}>
                      {s.tipo}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{s.marca}</td>
                  <td style={{ fontWeight: 700, color: '#2B211A' }}>{s.modelo}</td>
                  <td style={{ color: 'var(--cyan-primary)', fontWeight: 600 }}>{s.aceite}</td>
                  <td>{s.filtro_aceite}</td>
                  <td>{s.filtro_aire}</td>
                  <td>{s.filtro_combustible}</td>
                  <td>{s.filtro_habitaculo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW FICHA MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="📝 Nueva Ficha Técnica de Vehículo">
        <form onSubmit={handleSaveFicha} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tipo</label>
              <select
                className="form-select"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              >
                <option value="Autos y Camionetas">Autos y Camionetas</option>
                <option value="Motos">Motos</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Marca</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Toyota"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Modelo</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Hilux 2.8 D-4D"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Aceite Recomendado</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: 5W30 Sintético (7.5L)"
                value={formData.aceite}
                onChange={(e) => setFormData({ ...formData, aceite: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Filtro de Aceite</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: WEGA WO-154"
                value={formData.filtro_aceite}
                onChange={(e) => setFormData({ ...formData, filtro_aceite: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Filtro de Aire</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: WEGA FAP-3289"
                value={formData.filtro_aire}
                onChange={(e) => setFormData({ ...formData, filtro_aire: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Filtro de Combustible</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: WEGA FCD-0798"
                value={formData.filtro_combustible}
                onChange={(e) => setFormData({ ...formData, filtro_combustible: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Filtro Habitáculo</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: WEGA AKX-1998"
                value={formData.filtro_habitaculo}
                onChange={(e) => setFormData({ ...formData, filtro_habitaculo: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Ficha Técnica
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default VehiculosGuiaView;

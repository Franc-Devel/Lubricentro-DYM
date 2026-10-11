import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wrench, Lock, User, Monitor, Eye, EyeOff, ShieldCheck, AlertCircle, Shield, CheckCircle2 } from 'lucide-react';
import Modal from '../components/Modal';

export function LoginView() {
  const { login, quickDemoLogin, terminal, setTerminal, showToast } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  
  // Dual login conflict modal state
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');

  // Creator Admin Terminal Modal state
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [creatorKey, setCreatorKey] = useState('');
  const [creatorVerified, setCreatorVerified] = useState(false);
  const [pendingTerminal, setPendingTerminal] = useState(terminal);
  const [customTerminal, setCustomTerminal] = useState('');
  const [adminModalError, setAdminModalError] = useState('');

  const handleDemoLogin = async (role) => {
    setLoading(true);
    setErrorMessage('');
    const res = await quickDemoLogin(role);
    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.message);
    }
  };

  const handleSubmit = async (e, force = false) => {
    if (e) e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Por favor ingrese su nombre de usuario.');
      return;
    }
    if (!password) {
      setErrorMessage('Por favor ingrese su contraseña.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const res = await login(username, password, terminal, force);
    setLoading(false);

    if (!res.success) {
      if (res.sessionConflict) {
        setConflictMessage(res.message);
        setConflictModalOpen(true);
      } else {
        setErrorMessage(res.message);
      }
    } else {
      setConflictModalOpen(false);
    }
  };

  const handleForceLogin = () => {
    handleSubmit(null, true);
  };

  const handleOpenAdminModal = () => {
    setCreatorKey('');
    setCreatorVerified(false);
    setPendingTerminal(terminal);
    setCustomTerminal('');
    setAdminModalError('');
    setAdminModalOpen(true);
  };

  const handleVerifyCreatorKey = (e) => {
    if (e) e.preventDefault();
    if (creatorKey === 'omega2026') {
      setCreatorVerified(true);
      setAdminModalError('');
    } else {
      setAdminModalError('Clave de creador incorrecta. Acceso denegado.');
    }
  };

  const handleSaveTerminal = () => {
    const finalTerminal = customTerminal.trim() ? customTerminal.trim() : pendingTerminal;
    if (!finalTerminal) {
      setAdminModalError('Por favor seleccione o ingrese el nombre de la terminal.');
      return;
    }
    setTerminal(finalTerminal);
    localStorage.setItem('lubri_terminal', finalTerminal);
    if (showToast) {
      showToast(`Terminal configurada correctamente como: ${finalTerminal}`, 'success');
    }
    setAdminModalOpen(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        minHeight: '100vh',
        padding: '24px 16px',
        background: 'radial-gradient(ellipse at 50% 30%, #0d1522 0%, #050508 100%)',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Cyber background lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(0, 229, 255, 0.07) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px, 20px 20px',
          pointerEvents: 'none',
        }}
      />

      {/* Top Bar Terminal Indicator & Admin Trigger */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(0, 229, 255, 0.08)',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            color: 'var(--cyan-primary)',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <Monitor size={14} />
          <span>Terminal: <strong>{terminal}</strong></span>
        </div>

        <button
          onClick={handleOpenAdminModal}
          className="btn"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Configuración de Terminal para el Creador (Clave Omega)"
        >
          <Shield size={14} style={{ color: 'var(--amber-primary)' }} />
          <span>Admin</span>
        </button>
      </div>

      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '32px 28px',
          background: 'rgba(14, 14, 22, 0.88)',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(0, 229, 255, 0.12)',
          zIndex: 10,
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            className="brand-badge"
            style={{
              width: '52px',
              height: '52px',
              margin: '0 auto 12px auto',
              borderRadius: '14px',
            }}
          >
            <Wrench size={26} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '0.04em', margin: 0 }}>
            LUBRICENTRO DYM
          </h2>
          <span
            style={{
              display: 'inline-block',
              marginTop: '4px',
              fontSize: '12px',
              color: 'var(--cyan-primary)',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Control Central & Terminal POS
          </span>
        </div>

        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '12px',
              marginBottom: '18px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Demo Mode / Quick Role Selector Card */}
        <div
          style={{
            background: 'rgba(0, 229, 255, 0.04)',
            border: '1px solid rgba(0, 229, 255, 0.22)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '18px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--cyan-primary)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'block',
              }}
            >
              ⚡ Modo Prueba / Demostración Interactiva
            </span>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              ¿Cómo deseas iniciar la experiencia en el sistema?
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Admin Role Card */}
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontWeight: 700, fontSize: '13px' }}>
                    <ShieldCheck size={16} />
                    <span>Administrador</span>
                  </div>
                  <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(245, 158, 11, 0.2)', color: '#fef3c7', borderRadius: '8px', fontWeight: 600 }}>
                    Total
                  </span>
                </div>
                <ul style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 14px 0', paddingLeft: '16px', lineHeight: 1.5 }}>
                  <li>Dashboard KPIs de facturación</li>
                  <li>Arqueo de caja y auditoría</li>
                  <li>Gestión de stock y precios</li>
                </ul>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('admin')}
                className="btn"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '12px',
                  padding: '9px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Accediendo...' : '👑 Entrar como Admin'}
              </button>
            </div>

            {/* Normal User / Cajero Card */}
            <div
              style={{
                background: 'rgba(0, 229, 255, 0.08)',
                border: '1px solid rgba(0, 229, 255, 0.35)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyan-primary)', fontWeight: 700, fontSize: '13px' }}>
                    <User size={16} />
                    <span>Usuario Normal</span>
                  </div>
                  <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(0, 229, 255, 0.2)', color: '#e0f2fe', borderRadius: '8px', fontWeight: 600 }}>
                    Cajero
                  </span>
                </div>
                <ul style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 14px 0', paddingLeft: '16px', lineHeight: 1.5 }}>
                  <li>Terminal de cobro y ventas POS</li>
                  <li>Agenda y turnos de taller</li>
                  <li>Guía técnica de vehículos y aceites</li>
                </ul>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('cajero')}
                className="btn"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #00e5ff, #0099ff)',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '12px',
                  padding: '9px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Accediendo...' : '👤 Entrar como Cajero'}
              </button>
            </div>
          </div>
        </div>

        {/* Toggle Manual Form */}
        <div style={{ textAlign: 'center', margin: '10px 0 14px 0' }}>
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '4px',
            }}
          >
            {showManualForm ? '▲ Ocultar formulario manual' : '▼ O iniciar con credenciales manuales'}
          </button>
        </div>

        {showManualForm && (
          <form onSubmit={(e) => handleSubmit(e, false)} style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Usuario del Sistema</label>
              <div className="input-with-icon">
                <User size={16} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: admin o vendedor"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Lock size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '12px', padding: '10px' }}
              disabled={loading}
            >
              <ShieldCheck size={18} />
              <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
            </button>
          </form>
        )}

        <div
          style={{
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: 1.4,
          }}
        >
          Base de datos SQLite local conectada (519 productos, 113 ventas ficticias cargadas).
        </div>
      </div>

      {/* Dual Login Conflict Modal */}
      <Modal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        title="⚠️ Conflicto de Sesión Detectado"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {conflictMessage}
          </p>
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '12px',
              color: '#fbbf24',
            }}
          >
            Si continúas, la sesión abierta en el otro equipo será desconectada de inmediato por el guardián de seguridad.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setConflictModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              className="btn btn-danger"
              onClick={handleForceLogin}
              disabled={loading}
            >
              Forzar y Entrar Aquí
            </button>
          </div>
        </div>
      </Modal>

      {/* Creator Admin Terminal Configuration Modal */}
      <Modal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        title="🛡️ Configuración de Terminal (Modo Creador)"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!creatorVerified ? (
            <form onSubmit={handleVerifyCreatorKey} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Esta sección está reservada exclusivamente para el creador del proyecto. Ingrese su clave de seguridad para configurar la terminal de trabajo de este equipo.
              </p>

              {adminModalError && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    fontSize: '12px',
                  }}
                >
                  {adminModalError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Clave del Creador</label>
                <div className="input-with-icon">
                  <Lock size={16} />
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Ingrese clave (omega2026)"
                    value={creatorKey}
                    onChange={(e) => setCreatorKey(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAdminModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Acceder
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#6ee7b7',
                  fontSize: '12px',
                }}
              >
                <CheckCircle2 size={16} />
                <span>Acceso Autorizado Creador (Omega Active)</span>
              </div>

              <div className="form-group">
                <label className="form-label">Seleccionar Terminal de Trabajo</label>
                <div className="input-with-icon">
                  <Monitor size={16} />
                  <select
                    className="form-select"
                    value={pendingTerminal}
                    onChange={(e) => {
                      setPendingTerminal(e.target.value);
                      setCustomTerminal('');
                    }}
                  >
                    <option value="Caja_1">Caja Principal (Caja_1)</option>
                    <option value="Caja_2">Caja Secundaria (Caja_2)</option>
                    <option value="Caja_Admin">Terminal Gerencial (Caja_Admin)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">O Escriba Nombre de Terminal Personalizada</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Caja_Taller, POS_Entrada..."
                  value={customTerminal}
                  onChange={(e) => setCustomTerminal(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAdminModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveTerminal}
                >
                  Guardar Terminal
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default LoginView;


import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, Monitor, CheckCircle, AlertCircle } from 'lucide-react';

export function Navbar({ currentView, cashStatus }) {
  const { terminal, isAdmin, switchDemoRole } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getViewTitle = () => {
    switch (currentView) {
      case 'pos':
        return 'Terminal de Ventas & Facturación';
      case 'catalog':
        return 'Inventario & Catálogo de Productos';
      case 'turnos':
        return 'Agenda de Turnos & Taller';
      case 'vehiculos':
        return 'Guía Técnica de Vehículos (Aceites & Filtros)';
      case 'clientes':
        return 'Directorio de Clientes & CRM Vehicular';
      case 'caja':
        return 'Control de Caja & Arqueo';
      case 'historial':
        return 'Historial de Ventas & Comprobantes';
      case 'dashboard':
        return 'Panel de Indicadores Clave (KPIs)';
      case 'admin':
        return 'Panel Administrativo & Contable';
      default:
        return 'Lubricentro DYM';
    }
  };

  const isBoxOpen = cashStatus?.isOpen;

  return (
    <header className="top-navbar">
      <div className="navbar-title-group">
        <h1>{getViewTitle()}</h1>
      </div>

      <div className="navbar-actions">
        {/* Dynamic Demo Role Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            borderRadius: '20px',
            padding: '2px 4px',
            gap: '4px',
          }}
          title="Alternar entre rol Administrador y Usuario Normal en tiempo real"
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '8px', fontWeight: 600 }}>
            Modo:
          </span>
          <button
            type="button"
            onClick={() => switchDemoRole('admin')}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              fontSize: '11px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: isAdmin ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
              color: isAdmin ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            👑 Admin
          </button>
          <button
            type="button"
            onClick={() => switchDemoRole('cajero')}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              fontSize: '11px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: !isAdmin ? 'linear-gradient(135deg, #00e5ff, #0099ff)' : 'transparent',
              color: !isAdmin ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            👤 Normal
          </button>
        </div>
        {/* Terminal Pill */}
        <div className="terminal-pill">
          <Monitor size={14} color="var(--cyan-primary)" />
          <span>{terminal}</span>
        </div>

        {/* Cash box status */}
        <div className={`terminal-pill ${isBoxOpen ? 'open' : 'closed'}`}>
          <div className="pulse-dot"></div>
          <span>{isBoxOpen ? 'Caja Abierta' : 'Caja Cerrada'}</span>
        </div>

        {/* Live Clock */}
        <div className="terminal-pill" style={{ color: 'var(--text-secondary)' }}>
          <Clock size={14} />
          <span>
            {time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;

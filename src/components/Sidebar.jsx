import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart,
  Package,
  Calendar,
  Car,
  Users,
  CircleDollarSign,
  History,
  LayoutDashboard,
  ShieldAlert,
  LogOut,
  Wrench,
} from 'lucide-react';

export function Sidebar({ currentView, setCurrentView }) {
  const { user, logout, isAdmin, isEncargado } = useAuth();

  const navItems = [
    { id: 'pos', label: 'Terminal Ventas', icon: ShoppingCart },
    { id: 'catalog', label: 'Stock & Catálogo', icon: Package },
    { id: 'turnos', label: 'Agenda Turnos', icon: Calendar },
    { id: 'vehiculos', label: 'Guía Vehículos', icon: Car },
    { id: 'clientes', label: 'Clientes & CRM', icon: Users },
    { id: 'caja', label: 'Caja & Arqueo', icon: CircleDollarSign },
    { id: 'historial', label: 'Historial Ventas', icon: History },
  ];

  if (isEncargado) {
    navItems.push({ id: 'dashboard', label: 'Dashboard KPIs', icon: LayoutDashboard });
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.substring(0, 2).toUpperCase();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-badge"><img src={`${import.meta.env.BASE_URL}fauvor/symbol.png`} alt="FAUVOR" width="30" height="44" /></div>
        <div className="brand-info">
          <h2>FAUVOR Taller</h2>
          <span>Control Central</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-title">Operaciones</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {isAdmin && (
          <>
            <span className="nav-section-title">Administración</span>
            <button
              className={`nav-item admin-zone ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentView('admin')}
            >
              <ShieldAlert size={18} />
              <span>Panel Admin</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-pill">
          <div className="user-avatar-text">
            <div className="avatar-circle">
              {getInitials(user?.nombre)}
            </div>
            <div>
              <div className="user-meta-name">{user?.nombre || 'Usuario'}</div>
              <div className="user-meta-role">{user?.rol || 'Cajero'}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-secondary btn-icon"
            style={{ width: '30px', height: '30px', border: 'none', background: 'transparent' }}
            title="Cerrar sesión"
          >
            <LogOut size={16} color="#ef4444" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

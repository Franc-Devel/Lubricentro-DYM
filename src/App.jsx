import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import LoginView from './views/LoginView';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ToastContainer from './components/Toast';

import PosView from './views/PosView';
import CatalogView from './views/CatalogView';
import TurnosView from './views/TurnosView';
import VehiculosGuiaView from './views/VehiculosGuiaView';
import ClientesView from './views/ClientesView';
import CajaView from './views/CajaView';
import HistorialVentasView from './views/HistorialVentasView';
import DashboardView from './views/DashboardView';
import AdminView from './views/AdminView';

export function App() {
  const { user, terminal, isAdmin, isEncargado } = useAuth();
  const [currentView, setCurrentView] = useState('pos');
  const [cashStatus, setCashStatus] = useState(null);

  // Redirigir a POS si se cambia de rol a usuario normal estando en vistas administrativas
  useEffect(() => {
    if (!isAdmin && currentView === 'admin') {
      setCurrentView('pos');
    }
    if (!isEncargado && currentView === 'dashboard') {
      setCurrentView('pos');
    }
  }, [isAdmin, isEncargado, currentView]);

  // Poll / refresh cash status
  const refreshCashStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/cash/status?cajaId=${terminal}`);
      const data = await res.json();
      setCashStatus(data);
    } catch {
      // Ignored if offline
    }
  }, [user, terminal]);

  useEffect(() => {
    refreshCashStatus();
    const interval = setInterval(refreshCashStatus, 30000);
    return () => clearInterval(interval);
  }, [refreshCashStatus]);

  if (!user) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'pos':
        return <PosView />;
      case 'catalog':
        return <CatalogView />;
      case 'turnos':
        return <TurnosView />;
      case 'vehiculos':
        return <VehiculosGuiaView />;
      case 'clientes':
        return <ClientesView />;
      case 'caja':
        return <CajaView cashStatus={cashStatus} refreshCashStatus={refreshCashStatus} />;
      case 'historial':
        return <HistorialVentasView />;
      case 'dashboard':
        return <DashboardView />;
      case 'admin':
        return <AdminView />;
      default:
        return <PosView />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="main-layout">
        <Navbar currentView={currentView} cashStatus={cashStatus} />
        <main style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {renderView()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;

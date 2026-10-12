import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import {
  TrendingUp,
  Receipt,
  AlertTriangle,
  Package,
  Award,
  Calendar,
  BarChart3,
} from 'lucide-react';

export function DashboardView() {
  const { showToast } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/kpis')
      .then((res) => res.json())
      .then((data) => setKpis(data))
      .catch(() => showToast('Error al cargar métricas del panel', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-view-container" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        Calculando métricas gerenciales en tiempo real...
      </div>
    );
  }

  if (!kpis) return null;

  const weeklyData = kpis.grafico_semanal || { fechas: [], totales: [] };
  const maxTotal = Math.max(...weeklyData.totales, 1000);

  return (
    <div className="page-view-container">
      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>

        {/* Card 1: Facturación Hoy */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(169,111,53,0.12) 0%, var(--bg-card) 100%)',
            border: '1px solid rgba(169,111,53,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>FACTURACIÓN HOY</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(169,111,53,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cyan-primary)',
              }}
            >
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cyan-primary)' }}>
            {formatCurrency(kpis.ventas_hoy)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Cobrado en todas las cajas hoy
          </div>
        </div>

        {/* Card 2: Cantidad Ventas Hoy */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, var(--bg-card) 100%)',
            border: '1px solid rgba(169,111,53,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>TICKETS EMITIDOS</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--emerald-primary)',
              }}
            >
              <Receipt size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--emerald-primary)' }}>
            {kpis.cant_ventas_hoy}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Transacciones registradas hoy
          </div>
        </div>

        {/* Card 3: Stock Crítico */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, var(--bg-card) 100%)',
            border: '1px solid rgba(169,111,53,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>STOCK CRÍTICO</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--amber-primary)',
              }}
            >
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--amber-primary)' }}>
            {kpis.stock_critico}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Artículos con menos de 5 unidades
          </div>
        </div>

        {/* Card 4: Total Productos */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(169,111,53,0.12) 0%, var(--bg-card) 100%)',
            border: '1px solid rgba(169,111,53,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>CATÁLOGO ACTIVO</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(169,111,53,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--purple-primary)',
              }}
            >
              <Package size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {kpis.total_productos}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Productos en base de datos local
          </div>
        </div>
      </div>

      {/* Chart and Top Products Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px' }}>

        {/* Weekly Revenue Bar Chart */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 className="card-title" style={{ fontSize: '15px' }}>
              <BarChart3 size={18} color="var(--cyan-primary)" /> Facturación de los Últimos 7 Días
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Evolución diaria</span>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', minHeight: '180px', paddingBottom: '10px' }}>
            {weeklyData.fechas.map((fecha, idx) => {
              const amount = weeklyData.totales[idx] || 0;
              const heightPct = Math.max(8, Math.round((amount / maxTotal) * 100));
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {amount > 0 ? `$${Math.round(amount / 1000)}k` : '$0'}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${heightPct}%`,
                      background:
                        amount > 0
                          ? 'linear-gradient(180deg, var(--cyan-primary) 0%, rgba(0, 229, 255, 0.25) 100%)'
                          : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px 4px 0 0',
                      boxShadow: amount > 0 ? '0 0 12px rgba(0, 229, 255, 0.3)' : 'none',
                      transition: 'height 0.4s ease',
                    }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {fecha}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Products Table */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 className="card-title" style={{ fontSize: '15px' }}>
              <Award size={18} color="var(--amber-primary)" /> Productos Más Vendidos
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Top de facturación</span>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ textAlign: 'center' }}>Unidades</th>
                  <th style={{ textAlign: 'right' }}>Recaudado</th>
                </tr>
              </thead>
              <tbody>
                {kpis.top_productos?.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.name}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-cyan">{p.total_vendido} u.</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatCurrency(p.recaudacion)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;

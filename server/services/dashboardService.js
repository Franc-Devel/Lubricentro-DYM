import db from '../db.js';

export class DashboardService {
  static getKpis() {
    const today = new Date().toISOString().substring(0, 10);

    // 1. Today's sales total & count
    const todaySalesRow = db
      .prepare(
        `SELECT SUM(total) as ventas_hoy, COUNT(id) as cant_ventas_hoy 
         FROM ventas 
         WHERE DATE(date) = DATE(?) AND borrado_logico = 0`
      )
      .get(today);

    // 2. Critical stock count (< 5 items)
    const stockCriticoRow = db
      .prepare('SELECT COUNT(id) as count FROM productos WHERE stock < 5 AND borrado_logico = 0')
      .get();

    // 3. Total active products
    const totalProductosRow = db
      .prepare('SELECT COUNT(id) as count FROM productos WHERE borrado_logico = 0')
      .get();

    // 4. Last 7 days chart data
    const weeklyDates = [];
    const weeklyTotals = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

      const row = db
        .prepare(
          `SELECT SUM(total) as total 
           FROM ventas 
           WHERE DATE(date) = DATE(?) AND borrado_logico = 0`
        )
        .get(dateStr);

      weeklyDates.push(dayLabel);
      weeklyTotals.push(row?.total || 0);
    }

    // 5. Top 5 selling products
    const topProducts = db
      .prepare(
        `SELECT iv.name, SUM(iv.quantity) as total_vendido, SUM(iv.price * iv.quantity) as recaudacion
         FROM items_venta iv
         JOIN ventas v ON iv.venta_id = v.id
         WHERE v.borrado_logico = 0
         GROUP BY iv.producto_id, iv.name
         ORDER BY total_vendido DESC
         LIMIT 5`
      )
      .all();

    return {
      ventas_hoy: todaySalesRow?.ventas_hoy || 0,
      cant_ventas_hoy: todaySalesRow?.cant_ventas_hoy || 0,
      stock_critico: stockCriticoRow?.count || 0,
      total_productos: totalProductosRow?.count || 0,
      grafico_semanal: {
        fechas: weeklyDates,
        totales: weeklyTotals,
      },
      top_productos: topProducts,
    };
  }
}

export default DashboardService;

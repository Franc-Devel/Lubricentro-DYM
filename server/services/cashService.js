import db from '../db.js';

export class CashService {
  static getCashStatus(cajaId = 'Caja_1') {
    const active = db
      .prepare('SELECT * FROM sesiones_caja WHERE caja_id = ? AND estado = "Abierta" AND borrado_logico = 0')
      .get(cajaId);

    if (!active) {
      return { isOpen: false, session: null };
    }

    // Calculate current cash sales in active session
    const cashSalesRow = db
      .prepare(
        `SELECT SUM(total) as total 
         FROM ventas 
         WHERE caja_id = ? AND payment_method = 'Efectivo' AND date >= ? AND borrado_logico = 0`
      )
      .get(cajaId, active.fecha_apertura);

    const cashSales = cashSalesRow?.total || 0;
    const expected = active.monto_inicial + cashSales;

    return {
      isOpen: true,
      session: {
        ...active,
        ventas_efectivo: cashSales,
        monto_esperado_actual: expected,
      },
    };
  }

  static openCash(cajaId, operator = 'Cajero', initialAmount = 0) {
    const existing = db
      .prepare('SELECT id FROM sesiones_caja WHERE caja_id = ? AND estado = "Abierta" AND borrado_logico = 0')
      .get(cajaId);

    if (existing) {
      throw new Error(`La terminal ${cajaId} ya tiene una sesión abierta.`);
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const result = db
      .prepare(
        `INSERT INTO sesiones_caja 
         (caja_id, operador, monto_inicial, monto_final_declarado, monto_esperado, diferencia, estado, fecha_apertura, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
         VALUES (?, ?, ?, 0, 0, 0, 'Abierta', ?, 0, ?, ?, 0)`
      )
      .run(cajaId, operator, Number(initialAmount), now, now, now);

    return {
      id: result.lastInsertRowid,
      caja_id: cajaId,
      operador: operator,
      monto_inicial: Number(initialAmount),
      estado: 'Abierta',
      fecha_apertura: now,
    };
  }

  static closeCash(cajaId, declaredAmount = 0) {
    const session = db
      .prepare('SELECT * FROM sesiones_caja WHERE caja_id = ? AND estado = "Abierta" AND borrado_logico = 0')
      .get(cajaId);

    if (!session) {
      throw new Error(`No hay sesión de caja abierta para la terminal ${cajaId}.`);
    }

    const cashSalesRow = db
      .prepare(
        `SELECT SUM(total) as total 
         FROM ventas 
         WHERE caja_id = ? AND payment_method = 'Efectivo' AND date >= ? AND borrado_logico = 0`
      )
      .get(cajaId, session.fecha_apertura);

    const cashSales = cashSalesRow?.total || 0;
    const expectedAmount = session.monto_inicial + cashSales;
    const difference = Number(declaredAmount) - expectedAmount;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.prepare(
      `UPDATE sesiones_caja 
       SET monto_final_declarado = ?, monto_esperado = ?, diferencia = ?, estado = 'Cerrada', fecha_cierre = ?, fecha_actualizacion = ?, sincronizado = 0 
       WHERE id = ?`
    ).run(Number(declaredAmount), expectedAmount, difference, now, now, session.id);

    return {
      id: session.id,
      caja_id: cajaId,
      operador: session.operador,
      monto_inicial: session.monto_inicial,
      ventas_efectivo: cashSales,
      monto_esperado: expectedAmount,
      monto_declarado: Number(declaredAmount),
      diferencia: difference,
      fecha_apertura: session.fecha_apertura,
      fecha_cierre: now,
      estado: 'Cerrada',
    };
  }

  static getAllCashSessions() {
    return db
      .prepare('SELECT * FROM sesiones_caja WHERE borrado_logico = 0 ORDER BY fecha_apertura DESC LIMIT 100')
      .all();
  }

  static getCashSessionsByDate(dateStr) {
    if (!dateStr) return this.getAllCashSessions();
    return db
      .prepare(
        `SELECT * FROM sesiones_caja 
         WHERE DATE(fecha_apertura) = DATE(?) AND borrado_logico = 0 
         ORDER BY fecha_apertura DESC`
      )
      .all(dateStr);
  }

  static getBillingSummaryByBox() {
    const summary = {};
    const rows = db
      .prepare(
        `SELECT caja_id, COUNT(id) as total_ventas, SUM(total) as facturacion_total 
         FROM ventas 
         WHERE borrado_logico = 0 
         GROUP BY caja_id`
      )
      .all();

    for (const row of rows) {
      summary[row.caja_id] = {
        total_ventas: row.total_ventas,
        facturacion_total: row.facturacion_total || 0,
      };
    }
    return summary;
  }
}

export default CashService;

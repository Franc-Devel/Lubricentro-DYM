import crypto from 'crypto';
import db from '../db.js';

export class SalesService {
  static createSale({
    cartItems,
    paymentMethod = 'Efectivo',
    cajaId = 'Caja_1',
    patente = '',
    clienteId = null,
    vendedorId = null,
    descGralPct = 0,
    usuario = 'Cajero',
  }) {
    if (!cartItems || cartItems.length === 0) {
      throw new Error('El carrito de compras está vacío.');
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Atomic transaction for sale creation, stock decrement, and audit log
    const processTransaction = db.transaction(() => {
      // 1. Strict pre-validation of available stock
      for (const item of cartItems) {
        const prod = db
          .prepare('SELECT id, name, stock FROM productos WHERE id = ? AND borrado_logico = 0')
          .get(item.productId || item.id);

        if (!prod) {
          throw new Error(`El producto "${item.name}" no existe o fue dado de baja.`);
        }
        if (prod.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para "${prod.name}". Stock actual: ${prod.stock}, Solicitado: ${item.quantity}`
          );
        }
      }

      // 2. Calculations
      const subtotalBruto = cartItems.reduce(
        (sum, item) => sum + Number(item.price) * parseInt(item.quantity),
        0
      );
      const discountAmount = subtotalBruto * (Number(descGralPct || 0) / 100);
      const totalFinal = Math.max(0, subtotalBruto - discountAmount);
      const ventaId = crypto.randomUUID();

      // 3. Insert Venta record
      db.prepare(
        `INSERT INTO ventas 
         (id, date, total, payment_method, caja_id, patente_vehiculo, cliente_id, vendedor_id, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)`
      ).run(
        ventaId,
        now,
        totalFinal,
        paymentMethod,
        cajaId,
        (patente || '').trim().toUpperCase(),
        clienteId || null,
        vendedorId || null,
        now,
        now
      );

      // 4. Insert Items and decrement stock
      const insertItemStmt = db.prepare(
        `INSERT INTO items_venta 
         (venta_id, producto_id, name, price, quantity, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0)`
      );

      const updateStockStmt = db.prepare(
        `UPDATE productos 
         SET stock = MAX(0, stock - ?), fecha_actualizacion = ?, sincronizado = 0 
         WHERE id = ?`
      );

      for (const item of cartItems) {
        const prodId = item.productId || item.id;
        insertItemStmt.run(ventaId, prodId, item.name, Number(item.price), parseInt(item.quantity), now, now);
        updateStockStmt.run(parseInt(item.quantity), now, prodId);
      }

      // 5. Audit Log
      db.prepare(
        `INSERT INTO auditoria_logs 
         (fecha_hora, terminal, accion, detalle, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
         VALUES (?, ?, 'VENTA_REGISTRADA', ?, 0, ?, ?, 0)`
      ).run(
        now,
        cajaId,
        `Venta ID: ${ventaId} | Total: $${totalFinal.toFixed(2)} | Medio: ${paymentMethod} | Ítems: ${cartItems.length} | Usuario: ${usuario}`,
        now,
        now
      );

      return {
        id: ventaId,
        date: now,
        total: totalFinal,
        subtotal: subtotalBruto,
        discountPct: descGralPct,
        paymentMethod,
        cajaId,
        patente: (patente || '').trim().toUpperCase(),
        items: cartItems,
      };
    });

    return processTransaction();
  }

  static getSales({ filter = 'Todas', date = null, cajaId = null, limit = 100, offset = 0 } = {}) {
    let query = `
      SELECT v.*, 
             c.nombre_cliente, 
             c.vehiculo,
             ven.nombre as vendedor_nombre,
             (SELECT COUNT(*) FROM items_venta iv WHERE iv.venta_id = v.id) as cantidad_items
      FROM ventas v
      LEFT JOIN clientes_vehiculos c ON v.cliente_id = c.id
      LEFT JOIN vendedores ven ON v.vendedor_id = ven.id
      WHERE v.borrado_logico = 0
    `;
    const params = [];

    if (date) {
      query += ` AND DATE(v.date) = DATE(?)`;
      params.push(date);
    }

    if (cajaId) {
      query += ` AND v.caja_id = ?`;
      params.push(cajaId);
    }

    if (filter && filter !== 'Todas') {
      query += ` AND v.payment_method = ?`;
      params.push(filter);
    }

    query += ` ORDER BY v.date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  }

  static getSaleDetail(saleId) {
    const sale = db
      .prepare(
        `SELECT v.*, 
                c.nombre_cliente, 
                c.telefono as cliente_telefono,
                c.vehiculo,
                ven.nombre as vendedor_nombre
         FROM ventas v
         LEFT JOIN clientes_vehiculos c ON v.cliente_id = c.id
         LEFT JOIN vendedores ven ON v.vendedor_id = ven.id
         WHERE v.id = ?`
      )
      .get(saleId);

    if (!sale) return null;

    const items = db.prepare('SELECT * FROM items_venta WHERE venta_id = ?').all(saleId);
    return { ...sale, items };
  }

  static refundSale(saleId, reason, terminal = 'Caja_1', usuario = 'Sistema', userRole = 'Cajero') {
    if (!['Admin', 'Encargado'].includes(userRole)) {
      throw new Error('Acceso denegado: Se requiere rol de Administrador o Encargado para anular comprobantes.');
    }

    if (!reason || !reason.trim()) {
      throw new Error('El motivo de anulación es obligatorio.');
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const transaction = db.transaction(() => {
      const sale = db.prepare('SELECT * FROM ventas WHERE id = ? AND borrado_logico = 0').get(saleId);
      if (!sale) {
        throw new Error('No se encontró el comprobante especificado o ya fue anulado.');
      }

      // Mark sale as cancelled/logically deleted
      db.prepare(
        'UPDATE ventas SET borrado_logico = 1, fecha_actualizacion = ?, sincronizado = 0 WHERE id = ?'
      ).run(now, saleId);

      // Restore product stock
      const items = db.prepare('SELECT * FROM items_venta WHERE venta_id = ?').all(saleId);
      const updateStockStmt = db.prepare(
        'UPDATE productos SET stock = stock + ?, fecha_actualizacion = ?, sincronizado = 0 WHERE id = ?'
      );

      const itemsSummary = [];
      for (const item of items) {
        updateStockStmt.run(item.quantity, now, item.producto_id);
        itemsSummary.push(`${item.quantity}x ${item.name}`);
      }

      // Audit Log
      const auditDetail = `ANULACIÓN N° ${saleId} | Motivo: ${reason.trim()} | Total revertido: $${sale.total.toFixed(2)} | Ítems devueltos: ${itemsSummary.join(', ')} | Responsable: ${usuario} (${userRole})`;

      db.prepare(
        `INSERT INTO auditoria_logs 
         (fecha_hora, terminal, accion, detalle, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
         VALUES (?, ?, 'ANULACION_VENTA', ?, 0, ?, ?, 0)`
      ).run(now, terminal, auditDetail, now, now);

      return { success: true, saleId, restoredItemsCount: items.length };
    });

    return transaction();
  }
}

export default SalesService;

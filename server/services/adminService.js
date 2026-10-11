import crypto from 'crypto';
import db from '../db.js';
import { validatePassword, hashPassword } from '../security.js';

export class AdminService {
  // --- VENDORS ---
  static getVendors() {
    return db.prepare('SELECT * FROM vendedores WHERE borrado_logico = 0 ORDER BY nombre ASC').all();
  }

  static createVendor(codigo, nombre) {
    if (!codigo || !nombre) throw new Error('Código y nombre del vendedor son obligatorios.');
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const existing = db.prepare('SELECT id FROM vendedores WHERE codigo = ? AND borrado_logico = 0').get(codigo.trim());
    if (existing) throw new Error(`El código de vendedor "${codigo}" ya está registrado.`);

    const result = db
      .prepare(
        `INSERT INTO vendedores (codigo, nombre, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
         VALUES (?, ?, 0, ?, ?, 0)`
      )
      .run(codigo.trim().toUpperCase(), nombre.trim(), now, now);

    return { id: result.lastInsertRowid, codigo, nombre };
  }

  static deleteVendor(id) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare('UPDATE vendedores SET borrado_logico = 1, fecha_actualizacion = ?, sincronizado = 0 WHERE id = ?').run(now, id);
    return { success: true, id };
  }

  // --- SUPPLIERS ---
  static getSuppliers() {
    return db.prepare('SELECT * FROM proveedores WHERE borrado_logico = 0 ORDER BY nombre ASC').all();
  }

  static createSupplier({ nombre, contacto = '', telefono = '', productos_asociados = '' }) {
    if (!nombre) throw new Error('El nombre del proveedor es obligatorio.');
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const result = db
      .prepare(
        `INSERT INTO proveedores (nombre, contacto, telefono, productos_asociados, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
         VALUES (?, ?, ?, ?, 0, ?, ?, 0)`
      )
      .run(nombre.trim(), contacto.trim(), telefono.trim(), productos_asociados.trim(), now, now);

    return { id: result.lastInsertRowid, nombre, contacto, telefono, productos_asociados };
  }

  static deleteSupplier(id) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare('UPDATE proveedores SET borrado_logico = 1, fecha_actualizacion = ?, sincronizado = 0 WHERE id = ?').run(now, id);
    return { success: true, id };
  }

  // --- SUPPLIER PURCHASES (AUTO-STOCK INCREMENT) ---
  static recordPurchase({ proveedorId, numeroFactura = '', items = [] }) {
    if (!items || items.length === 0) {
      throw new Error('No hay ítems en la orden de compra.');
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const compraId = crypto.randomUUID();

    const transaction = db.transaction(() => {
      const totalCompra = items.reduce(
        (sum, item) => sum + Number(item.cost_price) * parseInt(item.quantity),
        0
      );

      // 1. Insert Compra
      db.prepare(
        `INSERT INTO compras 
         (id, date, proveedor_id, numero_factura, total, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0)`
      ).run(compraId, now, proveedorId, (numeroFactura || '').trim(), totalCompra, now, now);

      // 2. Insert Items and increase stock
      const insertItemStmt = db.prepare(
        `INSERT INTO items_compra 
         (compra_id, producto_id, name, cost_price, quantity, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0)`
      );

      const updateStockStmt = db.prepare(
        `UPDATE productos 
         SET stock = stock + ?, cost_price = ?, fecha_actualizacion = ?, sincronizado = 0 
         WHERE id = ?`
      );

      for (const item of items) {
        insertItemStmt.run(compraId, item.producto_id, item.name, Number(item.cost_price), parseInt(item.quantity), now, now);
        updateStockStmt.run(parseInt(item.quantity), Number(item.cost_price), now, item.producto_id);
      }

      // 3. Audit log
      db.prepare(
        `INSERT INTO auditoria_logs 
         (fecha_hora, terminal, accion, detalle, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
         VALUES (?, 'Caja_Admin', 'COMPRA_PROVEEDOR', ?, 0, ?, ?, 0)`
      ).run(now, `Factura: ${numeroFactura || 'S/N'} | Total: $${totalCompra.toFixed(2)} | Ítems: ${items.length}`, now, now);

      return { id: compraId, total: totalCompra, itemsCount: items.length };
    });

    return transaction();
  }

  // --- SYSTEM USERS ---
  static getSystemUsers() {
    return db
      .prepare(
        `SELECT id, usuario, nombre_completo, rol, sesion_activa_en, intentos_fallidos, bloqueado_hasta 
         FROM usuarios_sistema 
         WHERE borrado_logico = 0 
         ORDER BY id ASC`
      )
      .all();
  }

  static createSystemUser({ usuario, password, nombre, rol = 'Cajero' }) {
    if (!usuario || !password || !nombre) {
      throw new Error('Todos los campos son obligatorios.');
    }

    validatePassword(password, usuario);

    const existing = db
      .prepare('SELECT id FROM usuarios_sistema WHERE usuario = ? AND borrado_logico = 0')
      .get(usuario.trim());
    if (existing) {
      throw new Error(`El nombre de usuario "${usuario}" ya está en uso.`);
    }

    const hashed = hashPassword(password);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const result = db
      .prepare(
        `INSERT INTO usuarios_sistema 
         (usuario, password_hash, nombre_completo, rol, intentos_fallidos, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
         VALUES (?, ?, ?, ?, 0, 0, ?, ?, 0)`
      )
      .run(usuario.trim(), hashed, nombre.trim(), rol, now, now);

    return { id: result.lastInsertRowid, usuario, nombre, rol };
  }

  static deleteSystemUser(id) {
    const user = db.prepare('SELECT usuario FROM usuarios_sistema WHERE id = ?').get(id);
    if (!user) throw new Error('Usuario no encontrado.');
    if (user.usuario === 'admin') {
      throw new Error('No se puede eliminar al usuario administrador principal.');
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare('UPDATE usuarios_sistema SET borrado_logico = 1, fecha_actualizacion = ?, sincronizado = 0 WHERE id = ?').run(now, id);
    return { success: true, id };
  }

  static resetUserPassword(id, newPassword) {
    const user = db.prepare('SELECT usuario FROM usuarios_sistema WHERE id = ?').get(id);
    if (!user) throw new Error('Usuario no encontrado.');

    validatePassword(newPassword, user.usuario);
    const hashed = hashPassword(newPassword);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.prepare(
      `UPDATE usuarios_sistema 
       SET password_hash = ?, intentos_fallidos = 0, bloqueado_hasta = NULL, fecha_actualizacion = ?, sincronizado = 0 
       WHERE id = ?`
    ).run(hashed, now, id);

    return { success: true, id };
  }

  // --- AUDIT LOGS ---
  static getAuditLogs(limit = 200) {
    return db
      .prepare('SELECT * FROM auditoria_logs WHERE borrado_logico = 0 ORDER BY fecha_hora DESC LIMIT ?')
      .all(limit);
  }

  // --- SETTINGS ---
  static getSettings() {
    const config = db.prepare('SELECT * FROM configuraciones LIMIT 1').get();
    if (config) return config;
    return {
      theme_color: '#00e5ff',
      font_size: 12,
      caja_terminal: 'Caja_1',
    };
  }

  static updateSettings({ theme_color = '#00e5ff', font_size = 12, caja_terminal = 'Caja_1' }) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const existing = db.prepare('SELECT id FROM configuraciones LIMIT 1').get();

    if (existing) {
      db.prepare(
        `UPDATE configuraciones 
         SET theme_color = ?, font_size = ?, caja_terminal = ?, fecha_actualizacion = ?, sincronizado = 0 
         WHERE id = ?`
      ).run(theme_color, font_size, caja_terminal, now, existing.id);
    } else {
      db.prepare(
        `INSERT INTO configuraciones 
         (theme_color, font_size, caja_terminal, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
         VALUES (?, ?, ?, 0, ?, ?, 0)`
      ).run(theme_color, font_size, caja_terminal, now, now);
    }

    return this.getSettings();
  }
}

export default AdminService;

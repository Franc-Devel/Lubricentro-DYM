import db from '../db.js';
import { decryptField, encryptField, hashField } from '../security.js';

export class ClientService {
  static getClients(searchTerm = '') {
    const rawClients = db
      .prepare('SELECT * FROM clientes_vehiculos WHERE borrado_logico = 0 ORDER BY nombre_cliente ASC')
      .all();

    const decrypted = rawClients.map((c) => ({
      ...c,
      dni: decryptField(c.dni),
      telefono: decryptField(c.telefono),
    }));

    if (!searchTerm || !searchTerm.trim()) {
      return decrypted;
    }

    const term = searchTerm.trim().toLowerCase();
    return decrypted.filter((c) => {
      const matchPatente = (c.patente || '').toLowerCase().includes(term);
      const matchNombre = (c.nombre_cliente || '').toLowerCase().includes(term);
      const matchVehiculo = (c.vehiculo || '').toLowerCase().includes(term);
      const matchDni = (c.dni || '').toLowerCase().includes(term);
      const matchTel = (c.telefono || '').toLowerCase().includes(term);
      return matchPatente || matchNombre || matchVehiculo || matchDni || matchTel;
    });
  }

  static getClientByPlate(plate) {
    if (!plate) return null;
    const cleanPlate = plate.trim().toUpperCase();
    const client = db
      .prepare('SELECT * FROM clientes_vehiculos WHERE patente = ? AND borrado_logico = 0')
      .get(cleanPlate);

    if (!client) return null;

    return {
      ...client,
      dni: decryptField(client.dni),
      telefono: decryptField(client.telefono),
    };
  }

  static getClientById(id) {
    const client = db
      .prepare('SELECT * FROM clientes_vehiculos WHERE id = ? AND borrado_logico = 0')
      .get(id);

    if (!client) return null;

    return {
      ...client,
      dni: decryptField(client.dni),
      telefono: decryptField(client.telefono),
    };
  }

  static saveClient({
    patente,
    dni = '',
    nombre,
    telefono = '',
    vehiculo = '',
    observaciones = '',
  }) {
    if (!patente || !patente.trim()) {
      throw new Error('La patente del vehículo es obligatoria.');
    }
    if (!nombre || !nombre.trim()) {
      throw new Error('El nombre del cliente es obligatorio.');
    }

    const cleanPlate = patente.trim().toUpperCase();
    const encryptedDni = encryptField(dni.trim());
    const dniHash = hashField(dni.trim());
    const encryptedTel = encryptField(telefono.trim());
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const existing = db
      .prepare('SELECT id FROM clientes_vehiculos WHERE patente = ?')
      .get(cleanPlate);

    if (existing) {
      db.prepare(
        `UPDATE clientes_vehiculos 
         SET dni = ?, dni_hash = ?, nombre_cliente = ?, telefono = ?, vehiculo = ?, observaciones = ?, fecha_actualizacion = ?, sincronizado = 0, borrado_logico = 0
         WHERE id = ?`
      ).run(
        encryptedDni,
        dniHash,
        nombre.trim(),
        encryptedTel,
        vehiculo.trim(),
        observaciones.trim(),
        now,
        existing.id
      );
      return this.getClientById(existing.id);
    } else {
      const result = db.prepare(
        `INSERT INTO clientes_vehiculos 
         (patente, dni, dni_hash, nombre_cliente, telefono, vehiculo, observaciones, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)`
      ).run(
        cleanPlate,
        encryptedDni,
        dniHash,
        nombre.trim(),
        encryptedTel,
        vehiculo.trim(),
        observaciones.trim(),
        now,
        now
      );
      return this.getClientById(result.lastInsertRowid);
    }
  }

  static getMaintenanceHistory(patente) {
    if (!patente) return [];
    const cleanPlate = patente.trim().toUpperCase();

    const sales = db
      .prepare(
        `SELECT v.id, v.date, v.total, v.payment_method, v.caja_id 
         FROM ventas v 
         WHERE v.patente_vehiculo = ? AND v.borrado_logico = 0 
         ORDER BY v.date DESC`
      )
      .all(cleanPlate);

    const history = [];
    const getItemsStmt = db.prepare('SELECT name, price, quantity FROM items_venta WHERE venta_id = ?');

    for (const sale of sales) {
      const items = getItemsStmt.all(sale.id);
      history.push({
        id: sale.id,
        date: sale.date,
        total: sale.total,
        payment_method: sale.payment_method,
        caja_id: sale.caja_id,
        items: items,
      });
    }

    return history;
  }
}

export default ClientService;

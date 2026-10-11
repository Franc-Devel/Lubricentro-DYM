import db from '../db.js';

export class AppointmentService {
  static getAppointments() {
    return db
      .prepare('SELECT * FROM turnos WHERE borrado_logico = 0 ORDER BY date DESC, time ASC')
      .all();
  }

  static createAppointment({
    client,
    phone = '',
    vehicle = '',
    date,
    time = '09:00',
    description = '',
    mecanico = '',
    checklist = '',
  }) {
    if (!client || !client.trim()) {
      throw new Error('El nombre del cliente es obligatorio.');
    }
    if (!date) {
      throw new Error('La fecha del turno es obligatoria.');
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const result = db
      .prepare(
        `INSERT INTO turnos 
         (client, phone, vehicle, date, time, description, status, mecanico, checklist, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
         VALUES (?, ?, ?, ?, ?, ?, 'Pendiente', ?, ?, 0, ?, ?, 0)`
      )
      .run(
        client.trim(),
        (phone || '').trim(),
        (vehicle || '').trim(),
        date,
        time,
        (description || '').trim(),
        (mecanico || '').trim(),
        (checklist || '').trim(),
        now,
        now
      );

    return {
      id: result.lastInsertRowid,
      client,
      phone,
      vehicle,
      date,
      time,
      description,
      status: 'Pendiente',
      mecanico,
      checklist,
    };
  }

  static updateAppointmentStatus(id, newStatus) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare(
      'UPDATE turnos SET status = ?, fecha_actualizacion = ?, sincronizado = 0 WHERE id = ?'
    ).run(newStatus, now, id);
    return { success: true, id, status: newStatus };
  }

  static updateAppointment(id, data) {
    const { client, phone, vehicle, date, time, description, mecanico, checklist, status } = data;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare(
      `UPDATE turnos 
       SET client = ?, phone = ?, vehicle = ?, date = ?, time = ?, description = ?, mecanico = ?, checklist = ?, status = ?, fecha_actualizacion = ?, sincronizado = 0
       WHERE id = ?`
    ).run(
      client.trim(),
      (phone || '').trim(),
      (vehicle || '').trim(),
      date,
      time,
      (description || '').trim(),
      (mecanico || '').trim(),
      (checklist || '').trim(),
      status || 'Pendiente',
      now,
      id
    );
    return { id, ...data };
  }

  static deleteAppointment(id) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare('UPDATE turnos SET borrado_logico = 1, fecha_actualizacion = ?, sincronizado = 0 WHERE id = ?').run(now, id);
    return { success: true, id };
  }
}

export default AppointmentService;

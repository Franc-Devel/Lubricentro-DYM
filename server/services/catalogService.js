import db from '../db.js';

export class CatalogService {
  static getProducts({ search = '', categoryId = null, lowStockOnly = false } = {}) {
    let query = `
      SELECT p.*, c.name as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.borrado_logico = 0
    `;
    const params = [];

    if (categoryId) {
      query += ` AND p.categoria_id = ?`;
      params.push(categoryId);
    }

    if (lowStockOnly) {
      query += ` AND p.stock < 5`;
    }

    query += ` ORDER BY p.name ASC`;
    const allProducts = db.prepare(query).all(...params);

    if (!search || !search.trim()) {
      return allProducts;
    }

    const keywords = search.trim().toLowerCase().split(/\s+/);
    return allProducts.filter((p) => {
      const target = `${p.code || ''} ${p.name || ''} ${p.presentation || ''}`.toLowerCase();
      return keywords.every((kw) => target.includes(kw));
    });
  }

  static getProduct(id) {
    return db
      .prepare(
        `SELECT p.*, c.name as categoria_nombre 
         FROM productos p 
         LEFT JOIN categorias c ON p.categoria_id = c.id 
         WHERE p.id = ? AND p.borrado_logico = 0`
      )
      .get(id);
  }

  static findProductByCode(code) {
    if (!code) return null;
    return db
      .prepare(
        `SELECT p.*, c.name as categoria_nombre 
         FROM productos p 
         LEFT JOIN categorias c ON p.categoria_id = c.id 
         WHERE p.code = ? AND p.borrado_logico = 0`
      )
      .get(code.trim());
  }

  static addProduct(data) {
    const { code, name, presentation = '', price, cost_price = 0, stock = 0, categoria_id = null, sucursal = 'Sucursal A' } = data;
    if (!code || !name || price === undefined) {
      throw new Error('Código, descripción y precio son obligatorios.');
    }

    const existing = db.prepare('SELECT id FROM productos WHERE code = ? AND borrado_logico = 0').get(code.trim());
    if (existing) {
      throw new Error(`Ya existe un producto registrado con el código: ${code}`);
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const result = db.prepare(
      `INSERT INTO productos 
       (code, name, presentation, price, cost_price, stock, sucursal, categoria_id, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)`
    ).run(code.trim(), name.trim(), presentation.trim(), Number(price), Number(cost_price), parseInt(stock) || 0, sucursal, categoria_id || null, now, now);

    return { id: result.lastInsertRowid, ...data };
  }

  static updateProduct(id, data) {
    const { code, name, presentation = '', price, cost_price = 0, stock = 0, categoria_id = null, sucursal = 'Sucursal A' } = data;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.prepare(
      `UPDATE productos 
       SET code = ?, name = ?, presentation = ?, price = ?, cost_price = ?, stock = ?, sucursal = ?, categoria_id = ?, fecha_actualizacion = ?, sincronizado = 0
       WHERE id = ?`
    ).run(code.trim(), name.trim(), presentation.trim(), Number(price), Number(cost_price), parseInt(stock) || 0, sucursal, categoria_id || null, now, id);

    return this.getProduct(id);
  }

  static deleteProduct(id) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare(
      `UPDATE productos SET borrado_logico = 1, fecha_actualizacion = ?, sincronizado = 0 WHERE id = ?`
    ).run(now, id);
    return { success: true, id };
  }

  static getCategories() {
    return db.prepare('SELECT * FROM categorias WHERE borrado_logico = 0 ORDER BY name ASC').all();
  }

  static addCategory(name, slug = '') {
    if (!name) throw new Error('El nombre de la categoría es obligatorio.');
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const realSlug = slug || name.toLowerCase().replace(/\s+/g, '-');
    const result = db.prepare(
      `INSERT INTO categorias (name, slug, sincronizado, fecha_creacion, fecha_actualizacion, borrado_logico)
       VALUES (?, ?, 0, ?, ?, 0)`
    ).run(name.trim(), realSlug, now, now);
    return { id: result.lastInsertRowid, name, slug: realSlug };
  }

  static updateCategory(id, name, slug = '') {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const realSlug = slug || name.toLowerCase().replace(/\s+/g, '-');
    db.prepare(
      `UPDATE categorias SET name = ?, slug = ?, fecha_actualizacion = ?, sincronizado = 0 WHERE id = ?`
    ).run(name.trim(), realSlug, now, id);
    return { id, name, slug: realSlug };
  }

  static deleteCategory(id) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare(`UPDATE categorias SET borrado_logico = 1, fecha_actualizacion = ?, sincronizado = 0 WHERE id = ?`).run(now, id);
    return { success: true, id };
  }

  static searchGeneralCatalog(term = '') {
    if (!term || !term.trim()) {
      return db.prepare('SELECT * FROM catalogo_general WHERE borrado_logico = 0 LIMIT 100').all();
    }
    const kw = `%${term.trim()}%`;
    return db
      .prepare(
        `SELECT * FROM catalogo_general 
         WHERE borrado_logico = 0 AND (name LIKE ? OR code LIKE ?) 
         LIMIT 100`
      )
      .all(kw, kw);
  }

  static importFromGeneralCatalog(itemGlobal, sucursalActual = 'Sucursal A', stockInicial = 10) {
    const existing = db.prepare('SELECT id FROM productos WHERE code = ? AND borrado_logico = 0').get(itemGlobal.code);
    if (existing) {
      throw new Error(`El producto con código ${itemGlobal.code} ya existe en el inventario local.`);
    }

    return this.addProduct({
      code: itemGlobal.code,
      name: itemGlobal.name,
      presentation: itemGlobal.presentation || '',
      price: itemGlobal.suggested_price || 0,
      cost_price: 0,
      stock: stockInicial,
      sucursal: sucursalActual,
    });
  }

  static checkOtherBranchesStock(term) {
    if (!term || !term.trim()) return [];
    const kw = `%${term.trim()}%`;
    return db
      .prepare(
        `SELECT 
           SUBSTR(code, 1, MAX(1, LENGTH(code)-2)) AS codigo_base,
           name,
           presentation,
           price,
           GROUP_CONCAT(sucursal || ': ' || stock || 'u.', ' | ') AS disponibilidad
         FROM productos
         WHERE (name LIKE ? OR code LIKE ?) AND borrado_logico = 0
         GROUP BY codigo_base, name, presentation, price`
      )
      .all(kw, kw);
  }
}

export default CatalogService;

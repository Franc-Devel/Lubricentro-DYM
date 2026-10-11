import db from '../db.js';

const MAPEO_MARCAS_COMUNES = {
  // Volkswagen
  volvawen: 'volkswagen',
  vw: 'volkswagen',
  volwagen: 'volkswagen',
  volkswagon: 'volkswagen',
  volswagen: 'volkswagen',
  volkwagen: 'volkswagen',
  wolksvagen: 'volkswagen',
  // Chevrolet
  chevrotlet: 'chevrolet',
  chevrolete: 'chevrolet',
  chevi: 'chevrolet',
  chevorlet: 'chevrolet',
  // Fiat
  fayiat: 'fiat',
  fiatt: 'fiat',
  fyat: 'fiat',
  // Renault
  reno: 'renault',
  renoult: 'renault',
  // Toyota
  toyta: 'toyota',
  tayota: 'toyota',
  toiota: 'toyota',
  // Ford
  for: 'ford',
  fort: 'ford',
  // Honda
  hoda: 'honda',
  onda: 'honda',
  // Peugeot
  peugeott: 'peugeot',
  peujot: 'peugeot',
  pejot: 'peugeot',
  // Motos
  yamaha: 'yamaha',
  iamaha: 'yamaha',
  bajaj: 'bajaj',
  bayay: 'bajaj',
  zanella: 'zanella',
  sanella: 'zanella',
  motomel: 'motomel',
  corven: 'corven',
};

const DEFAULT_VEHICLES = [
  {
    tipo: 'Autos y Camionetas',
    marca: 'Volkswagen',
    modelo: 'Gol Trend 1.6 8V (2008-2022)',
    aceite: '5W40 Sintético (4.0 Litros)',
    filtro_aceite: 'WEGA WO-340 / MANN W 712/53',
    filtro_aire: 'WEGA FAP-4044 / MANN C 29 015',
    filtro_combustible: 'WEGA FCI-1660 / MANN WK 58/3',
    filtro_habitaculo: 'WEGA AKX-35323'
  },
  {
    tipo: 'Autos y Camionetas',
    marca: 'Volkswagen',
    modelo: 'Gol / Power 1.6 8V',
    aceite: '10W40 Semi-Sintético (3.5 Litros)',
    filtro_aceite: 'WEGA WO-340 / MANN W 712/53',
    filtro_aire: 'WEGA FAP-4001 / MANN C 28 136',
    filtro_combustible: 'WEGA FCI-1660 / MANN WK 58/3',
    filtro_habitaculo: 'N/A'
  },
  {
    tipo: 'Autos y Camionetas',
    marca: 'Volkswagen',
    modelo: 'Amarok 2.0 TDI (140hp/180hp)',
    aceite: '5W30 Sintético VW 507.00 (7.0 Litros)',
    filtro_aceite: 'WEGA WOE-680 / MANN HU 7008 z',
    filtro_aire: 'WEGA FAP-4050 / MANN C 31 014',
    filtro_combustible: 'WEGA FCD-0789 / MANN WK 820/17',
    filtro_habitaculo: 'WEGA AKX-35360'
  },
  {
    tipo: 'Autos y Camionetas',
    marca: 'Volkswagen',
    modelo: 'Fox / CrossFox / Suran 1.6 8V',
    aceite: '5W40 Sintético / 10W40 Semi (4.0 Litros)',
    filtro_aceite: 'WEGA WO-340',
    filtro_aire: 'WEGA FAP-4044',
    filtro_combustible: 'WEGA FCI-1660',
    filtro_habitaculo: 'WEGA AKX-35323'
  },
  {
    tipo: 'Autos y Camionetas',
    marca: 'Toyota',
    modelo: 'Hilux 2.8 D-4D (2016-2024)',
    aceite: '5W30 Sintético (7.5 Litros)',
    filtro_aceite: 'WEGA WO-154 / MANN W 712/83',
    filtro_aire: 'WEGA FAP-3289 / MANN C 26 017',
    filtro_combustible: 'WEGA FCD-0798',
    filtro_habitaculo: 'WEGA AKX-1998'
  },
  {
    tipo: 'Autos y Camionetas',
    marca: 'Toyota',
    modelo: 'Corolla 1.8 16V / 2.0 VVTi',
    aceite: '5W30 Sintético (4.2 Litros)',
    filtro_aceite: 'WEGA WOE-120 / MANN HU 6006 z',
    filtro_aire: 'WEGA FAP-3211',
    filtro_combustible: 'N/A (Interno)',
    filtro_habitaculo: 'WEGA AKX-1998'
  },
  {
    tipo: 'Autos y Camionetas',
    marca: 'Ford',
    modelo: 'Ranger 2.2 / 3.2 TDCi (Puma)',
    aceite: '5W30 Sintético Ford WSS-M2C913-D (8.6 Litros)',
    filtro_aceite: 'WEGA WOE-312 / MANN HU 7002 z',
    filtro_aire: 'WEGA FAP-2839',
    filtro_combustible: 'WEGA FCD-0914',
    filtro_habitaculo: 'WEGA AKX-1980'
  },
  {
    tipo: 'Autos y Camionetas',
    marca: 'Ford',
    modelo: 'EcoSport / Fiesta 1.6 Sigma',
    aceite: '5W30 Sintético (4.1 Litros)',
    filtro_aceite: 'WEGA WO-180',
    filtro_aire: 'WEGA FAP-2834',
    filtro_combustible: 'WEGA FCI-1660',
    filtro_habitaculo: 'WEGA AKX-1979'
  },
  {
    tipo: 'Autos y Camionetas',
    marca: 'Chevrolet',
    modelo: 'Corsa / Classic 1.4 8V',
    aceite: '10W40 Semi-Sintético (3.5 Litros)',
    filtro_aceite: 'WEGA WO-130 / MANN W 712/22',
    filtro_aire: 'WEGA FAP-3205',
    filtro_combustible: 'WEGA FCI-1660',
    filtro_habitaculo: 'WEGA AKX-3522'
  },
  {
    tipo: 'Autos y Camionetas',
    marca: 'Chevrolet',
    modelo: 'Onix / Prisma 1.4 SPE/4',
    aceite: '5W30 Sintético (3.75 Litros)',
    filtro_aceite: 'WEGA WO-130',
    filtro_aire: 'WEGA FAP-3277',
    filtro_combustible: 'WEGA FCI-1660',
    filtro_habitaculo: 'WEGA AKX-3528'
  },
  {
    tipo: 'Autos y Camionetas',
    marca: 'Peugeot',
    modelo: '208 1.6 16V VTi',
    aceite: '5W30 Sintético (3.25 Litros)',
    filtro_aceite: 'WEGA WOE-710 / MANN HU 711/51 x',
    filtro_aire: 'WEGA FAP-2018',
    filtro_combustible: 'WEGA FCI-1660',
    filtro_habitaculo: 'WEGA AKX-3531'
  },
  {
    tipo: 'Autos y Camionetas',
    marca: 'Peugeot',
    modelo: '206 / 207 1.4 8V / 1.6 16V',
    aceite: '10W40 Semi-Sintético (3.2 Litros)',
    filtro_aceite: 'WEGA WOE-710',
    filtro_aire: 'WEGA FAP-2009',
    filtro_combustible: 'WEGA FCI-1660',
    filtro_habitaculo: 'WEGA AKX-3515'
  },
  {
    tipo: 'Autos y Camionetas',
    marca: 'Renault',
    modelo: 'Kangoo / Sandero 1.6 16V (K4M / H4M)',
    aceite: '10W40 Semi-Sintético (4.9 Litros)',
    filtro_aceite: 'WEGA WO-200 / MANN W 75/3',
    filtro_aire: 'WEGA FAP-4871',
    filtro_combustible: 'WEGA FCI-1660',
    filtro_habitaculo: 'WEGA AKX-3524'
  },
  {
    tipo: 'Autos y Camionetas',
    marca: 'Fiat',
    modelo: 'Cronos 1.3 Firefly',
    aceite: '0W20 Sintético (2.7 Litros)',
    filtro_aceite: 'WEGA WOE-730',
    filtro_aire: 'WEGA FAP-2226',
    filtro_combustible: 'N/A',
    filtro_habitaculo: 'WEGA AKX-3538'
  },
  {
    tipo: 'Autos y Camionetas',
    marca: 'Fiat',
    modelo: 'Palio / Uno 1.4 Fire',
    aceite: '10W40 Semi-Sintético (2.7 Litros)',
    filtro_aceite: 'WEGA WO-120 / MANN W 610/82',
    filtro_aire: 'WEGA FAP-2207',
    filtro_combustible: 'WEGA FCI-1660',
    filtro_habitaculo: 'N/A'
  },
  {
    tipo: 'Motos',
    marca: 'Honda',
    modelo: 'CG 150 Titan / Fan 150',
    aceite: '10W30 Mineral/Semi 4T JASO MA2 (1.0 Litro)',
    filtro_aceite: 'Tamiz interno de malla',
    filtro_aire: 'WEGA JAP-0023',
    filtro_combustible: 'Universal 6mm',
    filtro_habitaculo: 'N/A'
  },
  {
    tipo: 'Motos',
    marca: 'Honda',
    modelo: 'Wave 110 S',
    aceite: '10W30 Mineral 4T (0.8 Litros)',
    filtro_aceite: 'Tamiz interno',
    filtro_aire: 'Espuma lavable original',
    filtro_combustible: 'Universal 6mm',
    filtro_habitaculo: 'N/A'
  },
  {
    tipo: 'Motos',
    marca: 'Gilera',
    modelo: 'Smash 110 / 125',
    aceite: '20W50 Mineral 4T JASO MA2 (0.8 Litros)',
    filtro_aceite: 'Tamiz de malla interno',
    filtro_aire: 'Espuma lavable',
    filtro_combustible: 'Universal 6mm',
    filtro_habitaculo: 'N/A'
  },
  {
    tipo: 'Motos',
    marca: 'Yamaha',
    modelo: 'YBR 125 / FZ 16 / FZ 2.0',
    aceite: '20W50 Mineral / 10W40 Semi 4T (1.0 Litro)',
    filtro_aceite: 'WEGA JOF-0001 (FZ) / Tamiz interno (YBR)',
    filtro_aire: 'WEGA JAP-0004',
    filtro_combustible: 'Universal 6mm',
    filtro_habitaculo: 'N/A'
  }
];

export function seedDefaultVehicles() {
  try {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    for (const v of DEFAULT_VEHICLES) {
      const existing = db
        .prepare('SELECT id FROM fichas_vehiculos WHERE marca LIKE ? AND modelo LIKE ?')
        .get(`%${v.marca}%`, `%${v.modelo.split(' ')[0]}%`);

      if (!existing) {
        db.prepare(`
          INSERT INTO fichas_vehiculos 
          (tipo, marca, modelo, aceite, filtro_aceite, filtro_aire, filtro_combustible, filtro_habitaculo, fecha_actualizacion, sincronizado)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `).run(
          v.tipo,
          v.marca,
          v.modelo,
          v.aceite,
          v.filtro_aceite,
          v.filtro_aire,
          v.filtro_combustible,
          v.filtro_habitaculo,
          now
        );
      }
    }
  } catch (err) {
    console.error('Error seeding default vehicles:', err);
  }
}

// Seed on module load
seedDefaultVehicles();

export function normalizarMarca(marcaIngresada = '', marcasDisponibles = []) {
  if (!marcaIngresada) return '';
  const limpia = marcaIngresada.trim().toLowerCase();
  if (MAPEO_MARCAS_COMUNES[limpia]) {
    return MAPEO_MARCAS_COMUNES[limpia];
  }
  for (const m of marcasDisponibles) {
    if (m && m.toLowerCase() === limpia) return m;
  }
  return marcaIngresada.trim();
}

export class VehiculoService {
  static getTypes() {
    const rows = db.prepare("SELECT DISTINCT tipo FROM fichas_vehiculos WHERE tipo IS NOT NULL AND tipo != '' AND tipo != 'Sin datos'").all();
    return rows.map((r) => r.tipo);
  }

  static getBrandsByType(tipo) {
    const rows = db
      .prepare("SELECT DISTINCT marca FROM fichas_vehiculos WHERE tipo = ? AND marca IS NOT NULL AND marca != '' AND marca != '2. Seleccionar Marca'")
      .all(tipo);
    return rows.map((r) => r.marca);
  }

  static getModelsByTypeAndBrand(tipo, marca) {
    const rows = db
      .prepare(
        "SELECT DISTINCT modelo FROM fichas_vehiculos WHERE tipo = ? AND marca LIKE ? AND modelo IS NOT NULL AND modelo != ''"
      )
      .all(tipo, `%${marca}%`);
    return rows.map((r) => r.modelo);
  }

  static getFicha(tipo, marca, modelo) {
    const normalized = normalizarMarca(marca);
    return (
      db
        .prepare(
          `SELECT * FROM fichas_vehiculos 
           WHERE tipo LIKE ? AND (marca LIKE ? OR marca LIKE ?) AND modelo LIKE ? 
           LIMIT 1`
        )
        .get(`%${tipo}%`, `%${marca}%`, `%${normalized}%`, `%${modelo}%`) || null
    );
  }

  static searchVehicles(query) {
    if (!query || !query.trim()) {
      return this.getAllFichas();
    }
    const term = `%${query.trim()}%`;
    return db.prepare(`
      SELECT * FROM fichas_vehiculos 
      WHERE tipo LIKE ? OR marca LIKE ? OR modelo LIKE ? OR aceite LIKE ? OR filtro_aceite LIKE ? OR filtro_aire LIKE ?
      ORDER BY marca ASC, modelo ASC
      LIMIT 50
    `).all(term, term, term, term, term, term);
  }

  static getAllFichas() {
    return db.prepare("SELECT * FROM fichas_vehiculos WHERE marca != '2. Seleccionar Marca' ORDER BY tipo ASC, marca ASC, modelo ASC").all();
  }

  static saveFicha(data) {
    const {
      tipo,
      marca,
      modelo,
      aceite = 'No especificado',
      filtro_aceite = 'N/A',
      filtro_aire = 'N/A',
      filtro_combustible = 'N/A',
      filtro_habitaculo = 'N/A',
    } = data;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const existing = db
      .prepare('SELECT id FROM fichas_vehiculos WHERE tipo = ? AND marca = ? AND modelo = ?')
      .get(tipo, marca, modelo);

    if (existing) {
      db.prepare(
        `UPDATE fichas_vehiculos 
         SET aceite = ?, filtro_aceite = ?, filtro_aire = ?, filtro_combustible = ?, filtro_habitaculo = ?, fecha_actualizacion = ?, sincronizado = 0 
         WHERE id = ?`
      ).run(aceite, filtro_aceite, filtro_aire, filtro_combustible, filtro_habitaculo, now, existing.id);
      return { id: existing.id, ...data };
    } else {
      const result = db
        .prepare(
          `INSERT INTO fichas_vehiculos 
           (tipo, marca, modelo, aceite, filtro_aceite, filtro_aire, filtro_combustible, filtro_habitaculo, fecha_actualizacion, sincronizado)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
        )
        .run(tipo, marca, modelo, aceite, filtro_aceite, filtro_aire, filtro_combustible, filtro_habitaculo, now);
      return { id: result.lastInsertRowid, ...data };
    }
  }
}

export default VehiculoService;


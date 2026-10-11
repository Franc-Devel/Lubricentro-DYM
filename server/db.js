import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dbPath = path.join(projectRoot, 'bunker_local.db');

export const db = new Database(dbPath, {
  // verbose: console.log
});

// Configure pragmas for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log(`[Database] Conectado exitosamente a base de datos SQL local: ${dbPath}`);

export default db;

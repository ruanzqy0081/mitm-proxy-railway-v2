import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/licenses.db');
const db = new sqlite3.Database(dbPath);
const dbRun = promisify(db.run.bind(db));
async function initDatabase() {
    try {
        // Criar tabela de licenças
        await dbRun(`
      CREATE TABLE IF NOT EXISTS licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        udid TEXT UNIQUE NOT NULL,
        device_name TEXT,
        duration_days INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        last_used DATETIME
      )
    `);
        // Criar tabela de logs
        await dbRun(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        udid TEXT NOT NULL,
        action TEXT NOT NULL,
        status TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (udid) REFERENCES licenses(udid)
      )
    `);
        // Criar índices
        await dbRun(`CREATE INDEX IF NOT EXISTS idx_udid ON licenses(udid)`);
        await dbRun(`CREATE INDEX IF NOT EXISTS idx_expires_at ON licenses(expires_at)`);
        await dbRun(`CREATE INDEX IF NOT EXISTS idx_is_active ON licenses(is_active)`);
        console.log('✅ Banco de dados inicializado com sucesso!');
        db.close();
    }
    catch (error) {
        console.error('❌ Erro ao inicializar banco de dados:', error);
        process.exit(1);
    }
}
initDatabase();
//# sourceMappingURL=init.js.map
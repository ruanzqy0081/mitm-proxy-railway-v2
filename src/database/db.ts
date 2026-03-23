import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/licenses.db');

const db = new sqlite3.Database(dbPath);

// Promisify database methods
export const dbGet = (query: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (query: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

export const dbRun = (query: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Funções de negócio
export async function addLicense(udid: string, deviceName: string, durationDays: number) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  const result = await dbRun(
    `INSERT INTO licenses (udid, device_name, duration_days, expires_at, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [udid, deviceName, durationDays, expiresAt.toISOString()]
  );

  await logAction(udid, 'LICENSE_CREATED', 'success');
  return result;
}

export async function checkLicense(udid: string) {
  const license = await dbGet(
    `SELECT * FROM licenses WHERE udid = ? AND is_active = 1`,
    [udid]
  );

  if (!license) {
    await logAction(udid, 'CHECK_LICENSE', 'not_found');
    return null;
  }

  const expiresAt = new Date(license.expires_at);
  const now = new Date();

  if (expiresAt < now) {
    await dbRun(`UPDATE licenses SET is_active = 0 WHERE udid = ?`, [udid]);
    await logAction(udid, 'CHECK_LICENSE', 'expired');
    return null;
  }

  // Atualizar last_used
  await dbRun(`UPDATE licenses SET last_used = ? WHERE udid = ?`, [now.toISOString(), udid]);
  await logAction(udid, 'CHECK_LICENSE', 'success');

  return {
    udid: license.udid,
    deviceName: license.device_name,
    expiresAt: license.expires_at,
    daysRemaining: Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  };
}

export async function renewLicense(udid: string, durationDays: number) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  const result = await dbRun(
    `UPDATE licenses SET expires_at = ?, duration_days = ?, is_active = 1 WHERE udid = ?`,
    [expiresAt.toISOString(), durationDays, udid]
  );

  await logAction(udid, 'LICENSE_RENEWED', 'success');
  return result;
}

export async function getAllLicenses() {
  return await dbAll(
    `SELECT udid, device_name, duration_days, created_at, expires_at, is_active, last_used
     FROM licenses ORDER BY created_at DESC`
  );
}

export async function deleteLicense(udid: string) {
  const result = await dbRun(`DELETE FROM licenses WHERE udid = ?`, [udid]);
  await logAction(udid, 'LICENSE_DELETED', 'success');
  return result;
}

export async function logAction(udid: string, action: string, status: string) {
  await dbRun(
    `INSERT INTO logs (udid, action, status) VALUES (?, ?, ?)`,
    [udid, action, status]
  );
}

export async function getLogs(limit: number = 100) {
  return await dbAll(
    `SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?`,
    [limit]
  );
}

export async function cleanupExpiredLicenses() {
  const now = new Date().toISOString();
  const result = await dbRun(
    `UPDATE licenses SET is_active = 0 WHERE expires_at < ? AND is_active = 1`,
    [now]
  );
  console.log(`🧹 Limpeza: ${result.changes} licenças expiradas marcadas como inativas`);
  return result;
}

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  getDb,
  addLicense,
  checkLicense,
  renewLicense,
  getAllLicenses,
  deleteLicense,
  getLogs,
  cleanupExpiredLicenses
} from './database/db.js';

// Inicializar o banco de dados ao iniciar o aplicativo
// Isso garantirá que as tabelas sejam criadas se o banco for em memória ou um novo arquivo
getDb();

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; // Não usado diretamente na Vercel, mas mantido para consistência
const ADMIN_KEY = process.env.ADMIN_KEY || 'your-secret-admin-key-change-this';

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de autenticação para admin
const requireAdminKey = (req: Request, res: Response, next: Function) => {
  const adminKey = req.headers['x-admin-key'] || req.query.admin_key;
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: 'Acesso negado. Admin key inválida.' });
  }
  next();
};

// ============ ENDPOINTS PÚBLICOS (para o Proxy) ============

/**
 * GET /check-license?udid=<UDID>
 * Verifica se um UDID tem licença ativa
 */
app.get('/check-license', async (req: Request, res: Response) => {
  try {
    const { udid } = req.query;

    if (!udid || typeof udid !== 'string') {
      return res.status(400).json({ error: 'UDID é obrigatório' });
    }

    const license = await checkLicense(udid);

    if (!license) {
      return res.status(403).json({ error: 'Licença não encontrada ou expirada' });
    }

    return res.json({
      status: 'authorized',
      udid: license.udid,
      deviceName: license.deviceName,
      expiresAt: license.expiresAt,
      daysRemaining: license.daysRemaining
    });
  } catch (error) {
    console.error('Erro ao verificar licença:', error);
    res.status(500).json({ error: 'Erro ao verificar licença' });
  }
});

/**
 * GET /
 * Status do servidor
 */
app.get('/', async (req: Request, res: Response) => {
  try {
    const licenses = await getAllLicenses();
    const activeLicenses = licenses.filter(l => l.is_active);

    res.json({
      status: 'online',
      message: 'MITM Proxy License Server',
      totalLicenses: licenses.length,
      activeLicenses: activeLicenses.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter status' });
  }
});

// ============ ENDPOINTS DE ADMIN ============

/**
 * POST /admin/add-license
 * Adicionar nova licença
 * Headers: X-Admin-Key: <ADMIN_KEY>
 */
app.post('/admin/add-license', requireAdminKey, async (req: Request, res: Response) => {
  try {
    const { udid, deviceName, durationDays } = req.body;

    if (!udid || !durationDays) {
      return res.status(400).json({ error: 'UDID e durationDays são obrigatórios' });
    }

    if (![1, 3, 7, 30].includes(durationDays)) {
      return res.status(400).json({ error: 'durationDays deve ser 1, 3, 7 ou 30' });
    }

    const result = await addLicense(udid, deviceName || 'Unknown Device', durationDays);

    res.json({
      status: 'success',
      message: `Licença adicionada para ${durationDays} dias`,
      udid,
      result
    });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'UDID já existe. Use /admin/renew-license para renovar.' });
    }
    console.error('Erro ao adicionar licença:', error);
    res.status(500).json({ error: 'Erro ao adicionar licença' });
  }
});

/**
 * POST /admin/renew-license
 * Renovar licença existente
 * Headers: X-Admin-Key: <ADMIN_KEY>
 */
app.post('/admin/renew-license', requireAdminKey, async (req: Request, res: Response) => {
  try {
    const { udid, durationDays } = req.body;

    if (!udid || !durationDays) {
      return res.status(400).json({ error: 'UDID e durationDays são obrigatórios' });
    }

    if (![1, 3, 7, 30].includes(durationDays)) {
      return res.status(400).json({ error: 'durationDays deve ser 1, 3, 7 ou 30' });
    }

    const result = await renewLicense(udid, durationDays);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'UDID não encontrado' });
    }

    res.json({
      status: 'success',
      message: `Licença renovada para ${durationDays} dias`,
      udid
    });
  } catch (error) {
    console.error('Erro ao renovar licença:', error);
    res.status(500).json({ error: 'Erro ao renovar licença' });
  }
});

/**
 * GET /admin/licenses
 * Listar todas as licenças
 * Headers: X-Admin-Key: <ADMIN_KEY>
 */
app.get('/admin/licenses', requireAdminKey, async (req: Request, res: Response) => {
  try {
    const licenses = await getAllLicenses();
    res.json({
      status: 'success',
      total: licenses.length,
      licenses
    });
  } catch (error) {
    console.error('Erro ao listar licenças:', error);
    res.status(500).json({ error: 'Erro ao listar licenças' });
  }
});

/**
 * DELETE /admin/delete-license?udid=<UDID>
 * Deletar licença
 * Headers: X-Admin-Key: <ADMIN_KEY>
 */
app.delete('/admin/delete-license', requireAdminKey, async (req: Request, res: Response) => {
  try {
    const { udid } = req.query;

    if (!udid || typeof udid !== 'string') {
      return res.status(400).json({ error: 'UDID é obrigatório' });
    }

    const result = await deleteLicense(udid);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'UDID não encontrado' });
    }

    res.json({
      status: 'success',
      message: 'Licença deletada',
      udid
    });
  } catch (error) {
    console.error('Erro ao deletar licença:', error);
    res.status(500).json({ error: 'Erro ao deletar licença' });
  }
});

/**
 * GET /admin/logs
 * Ver logs de ações
 * Headers: X-Admin-Key: <ADMIN_KEY>
 */
app.get('/admin/logs', requireAdminKey, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await getLogs(limit);
    res.json({
      status: 'success',
      total: logs.length,
      logs
    });
  } catch (error) {
    console.error('Erro ao obter logs:', error);
    res.status(500).json({ error: 'Erro ao obter logs' });
  }
});

/**
 * POST /admin/cleanup
 * Limpar licenças expiradas
 * Headers: X-Admin-Key: <ADMIN_KEY>
 */
app.post('/admin/cleanup', requireAdminKey, async (req: Request, res: Response) => {
  try {
    const result = await cleanupExpiredLicenses();
    res.json({
      status: 'success',
      message: 'Limpeza concluída',
      result
    });
  } catch (error) {
    console.error('Erro ao fazer limpeza:', error);
    res.status(500).json({ error: 'Erro ao fazer limpeza' });
  }
});


export default app;

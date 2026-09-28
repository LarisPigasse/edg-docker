// src/modules/auth/controllers/SessionController.ts

import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { redisService } from '../../../core/services/RedisService';
import { logger } from '../../../services/logger';

export class SessionController {
  constructor(
    private sessionModel: any,
    private accountModel: any
  ) {}

  /**
   * GET /api/auth/sessions
   * Lista tutte le sessioni attive (solo root)
   */
  async listSessions(req: Request, res: Response): Promise<void> {
    try {
      const sessions = await this.sessionModel.findAll({
        where: {
          isRevoked: false,
          expiresAt: { [Op.gt]: new Date() },
        },
        include: [
          {
            model: this.accountModel,
            as: 'account',
            attributes: ['id', 'email', 'accountType', 'roleId'],
            include: [
              {
                model: (this.accountModel as any).sequelize.models.Role,
                as: 'role',
                attributes: ['name'],
              },
            ],
          },
        ],
        order: [['lastActivityAt', 'DESC']],
      });

      // Formatta response
      const formatted = sessions.map((s: any) => ({
        id: s.id,
        user: {
          id: s.account?.id,
          email: s.account?.email,
          role: s.account?.role?.name || 'Unknown',
        },
        device: {
          ip: s.ipAddress,
          device: s.device,
          os: s.os,
          browser: s.browser,
        },
        geo: {
          country: s.geoCountry,
          region: s.geoRegion,
          city: s.geoCity,
          timezone: s.geoTimezone,
        },
        createdAt: s.createdAt,
        lastActivityAt: s.lastActivityAt,
        expiresAt: s.expiresAt,
      }));

      res.json({
        success: true,
        data: formatted,
        total: formatted.length,
      });
    } catch (error: any) {
      console.error('[SessionController] listSessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel caricamento delle sessioni',
      });
    }
  }

  /**
   * DELETE /api/auth/sessions/:sessionId
   * Revoca sessione specifica (solo root)
   */
  async revokeSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const session = await this.sessionModel.findByPk(sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          message: 'Sessione non trovata',
        });
        return;
      }

      // Previeni revoca della propria sessione corrente
      const currentSessionId = (req as any).sessionId;
      if (session.id === currentSessionId) {
        res.status(400).json({
          success: false,
          message: 'Non puoi revocare la tua sessione corrente',
        });
        return;
      }

      await session.update({ isRevoked: true });

      // Blacklist Redis → blocco immediato dell'access token ancora valido
      await redisService.blockSession(session.id);

      logger.audit(
        'auth.session_revoked',
        `Sessione #${session.id} revocata (account #${session.accountId})`,
        { id: (req as any).accountId, email: (req as any).account?.email, tenantId: (req as any).account?.tenantId },
        { sessionId: session.id, targetAccountId: session.accountId }
      );

      res.json({
        success: true,
        message: 'Sessione revocata',
      });
    } catch (error: any) {
      console.error('[SessionController] revokeSession error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nella revoca della sessione',
      });
    }
  }

  /**
   * POST /api/auth/users/:userId/block
   * Blocca utente (temporaneo o permanente) + revoca tutte le sessioni
   */
  async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { duration, reason } = req.body; // duration: '1h' | '24h' | '7d' | 'permanent'

      const account = await this.accountModel.findByPk(userId);

      if (!account) {
        res.status(404).json({
          success: false,
          message: 'Utente non trovato',
        });
        return;
      }

      // Previeni auto-blocco
      const currentUserId = (req as any).user?.accountId;
      if (account.id === currentUserId) {
        res.status(400).json({
          success: false,
          message: 'Non puoi bloccare te stesso',
        });
        return;
      }

      // Calcola scadenza blocco
      let blockedUntil: Date | null = null;
      if (duration && duration !== 'permanent') {
        const hours: Record<string, number> = {
          '1h': 1,
          '24h': 24,
          '7d': 168,
        };
        const h = hours[duration] || 24;
        blockedUntil = new Date(Date.now() + h * 60 * 60 * 1000);
      }

      // Blocca account
      await account.update({
        isActive: false,
        blockedUntil,
        blockReason: reason || 'Bloccato da amministratore',
      });

      // Revoca tutte le sessioni attive
      await this.sessionModel.update({ isRevoked: true }, { where: { accountId: account.id, isRevoked: false } });

      // Blacklist Redis → blocco immediato degli access token ancora validi
      await redisService.blockAccount(account.id);

      logger.audit(
        'auth.account_blocked',
        `Account bloccato: ${account.email}` + (blockedUntil ? ` fino a ${blockedUntil.toISOString()}` : ' (permanente)'),
        { id: currentUserId, email: (req as any).account?.email, tenantId: (req as any).account?.tenantId },
        { targetAccountId: account.id, targetEmail: account.email, reason: reason || null, blockedUntil }
      );

      res.json({
        success: true,
        message: blockedUntil ? `Utente bloccato fino a ${blockedUntil.toISOString()}` : 'Utente bloccato permanentemente',
      });
    } catch (error: any) {
      console.error('[SessionController] blockUser error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel blocco utente',
      });
    }
  }

  /**
   * DELETE /api/auth/users/:userId/unblock
   * Sblocca utente
   */
  async unblockUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const account = await this.accountModel.findByPk(userId);

      if (!account) {
        res.status(404).json({
          success: false,
          message: 'Utente non trovato',
        });
        return;
      }

      await account.update({
        isActive: true,
        blockedUntil: null,
        blockReason: null,
      });

      logger.audit(
        'auth.account_unblocked',
        `Account sbloccato: ${account.email}`,
        { id: (req as any).accountId, email: (req as any).account?.email, tenantId: (req as any).account?.tenantId },
        { targetAccountId: account.id, targetEmail: account.email }
      );

      res.json({
        success: true,
        message: 'Utente sbloccato',
      });
    } catch (error: any) {
      console.error('[SessionController] unblockUser error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nello sblocco utente',
      });
    }
  }

  /**
   * GET /api/auth/blocked-users
   * Lista utenti bloccati (solo root)
   */
  async listBlockedUsers(req: Request, res: Response): Promise<void> {
    try {
      const blockedAccounts = await this.accountModel.findAll({
        where: {
          isActive: false,
          [Op.or]: [{ blockedUntil: { [Op.ne]: null } }, { blockReason: { [Op.ne]: null } }],
        },
        include: [
          {
            model: (this.accountModel as any).sequelize.models.Role,
            as: 'role',
            attributes: ['name'],
          },
        ],
        order: [['updatedAt', 'DESC']],
      });

      // Formatta response
      const formatted = blockedAccounts.map((account: any) => ({
        id: account.id,
        email: account.email,
        role: account.role?.name || 'Unknown',
        blockedUntil: account.blockedUntil,
        blockReason: account.blockReason,
        blockedAt: account.updatedAt,
      }));

      res.json({
        success: true,
        data: formatted,
        total: formatted.length,
      });
    } catch (error: any) {
      console.error('[SessionController] listBlockedUsers error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel caricamento degli utenti bloccati',
      });
    }
  }
}

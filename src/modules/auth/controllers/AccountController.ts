// src/modules/auth/controllers/AccountController.ts
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { redisService } from '../../../core/services/RedisService';

/**
 * Controller per gestione admin degli account
 * Richiede permesso sistema.accounts (root only)
 *
 * NOTA: I modelli vengono passati al constructor, non importati
 */
export class AccountController {
  private Account: any;
  private Role: any;
  private Session: any;

  constructor(Account: any, Role: any, Session?: any) {
    this.Account = Account;
    this.Role = Role;
    this.Session = Session;
  }

  /**
   * GET /auth/accounts
   * Lista account con paginazione e filtri
   */
  async listAccounts(req: Request, res: Response): Promise<void> {
    try {
      const { page = '0', limit = '50', search = '', roleId, accountType, status } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = pageNum * limitNum;

      const where: any = {};

      if (search && typeof search === 'string') {
        where.email = { [Op.like]: `%${search}%` };
      }

      if (roleId) {
        where.roleId = parseInt(roleId as string, 10);
      }

      if (accountType && accountType !== 'all') {
        where.accountType = accountType;
      }

      if (status && status !== 'all') {
        switch (status) {
          case 'active':
            where.isActive = true;
            where[Op.or] = [{ blockedUntil: null }, { blockedUntil: { [Op.lt]: new Date() } }];
            break;
          case 'inactive':
            where.isActive = false;
            where[Op.or] = [{ blockedUntil: null }, { blockedUntil: { [Op.lt]: new Date() } }];
            break;
          case 'blocked':
            where[Op.or] = [{ blockedUntil: { [Op.gt]: new Date() } }, { blockReason: { [Op.ne]: null } }];
            break;
        }
      }

      const { count, rows } = await this.Account.findAndCountAll({
        where,
        include: [
          {
            model: this.Role,
            as: 'role',
            attributes: ['id', 'name'],
          },
        ],
        attributes: {
          exclude: ['password', 'refreshToken', 'passwordResetToken', 'passwordResetExpires'],
        },
        order: [['createdAt', 'DESC']],
        limit: limitNum,
        offset,
      });

      const totalPages = Math.ceil(count / limitNum);

      res.json({
        success: true,
        data: {
          accounts: rows,
          pagination: {
            total: count,
            page: pageNum,
            limit: limitNum,
            totalPages,
            hasMore: pageNum < totalPages - 1,
          },
        },
      });
    } catch (error) {
      console.error('[AccountController] listAccounts error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore durante recupero account',
      });
    }
  }

  /**
   * GET /auth/accounts/:id
   * Dettaglio singolo account
   */
  async getAccountById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const account = await this.Account.findByPk(id, {
        include: [
          {
            model: this.Role,
            as: 'role',
            attributes: ['id', 'name'],
          },
        ],
        attributes: {
          exclude: ['password', 'refreshToken', 'passwordResetToken', 'passwordResetExpires'],
        },
      });

      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Account non trovato',
        });
        return;
      }

      res.json({
        success: true,
        data: account,
      });
    } catch (error) {
      console.error('[AccountController] getAccountById error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore durante recupero account',
      });
    }
  }

  /**
   * PUT /auth/accounts/:id
   * Aggiorna account esistente
   */
  async updateAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { email, roleId, accountType, entityId, isActive } = req.body;

      const account = await this.Account.findByPk(id);

      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Account non trovato',
        });
        return;
      }

      const currentUserId = (req as any).accountId;
      if (account.id === currentUserId && roleId && account.roleId !== roleId) {
        res.status(403).json({
          success: false,
          error: 'Non puoi modificare il tuo ruolo',
        });
        return;
      }

      if (email) account.email = email;
      if (roleId) account.roleId = roleId;
      if (accountType) account.accountType = accountType;
      if (entityId !== undefined) account.entityId = entityId;
      if (isActive !== undefined) account.isActive = isActive;

      await account.save();

      const updated = await this.Account.findByPk(id, {
        include: [
          {
            model: this.Role,
            as: 'role',
            attributes: ['id', 'name'],
          },
        ],
        attributes: {
          exclude: ['password', 'refreshToken', 'passwordResetToken', 'passwordResetExpires'],
        },
      });

      res.json({
        success: true,
        data: updated,
        message: 'Account aggiornato con successo',
      });
    } catch (error) {
      console.error('[AccountController] updateAccount error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore durante aggiornamento account',
      });
    }
  }

  /**
   * DELETE /auth/accounts/:id
   * Soft delete - setta isActive = false
   */
  async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const account = await this.Account.findByPk(id);

      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Account non trovato',
        });
        return;
      }

      const currentUserId = (req as any).accountId;
      if (account.id === currentUserId) {
        res.status(403).json({
          success: false,
          error: 'Non puoi eliminare il tuo account',
        });
        return;
      }

      account.isActive = false;
      await account.save();

      // Revoca tutte le sessioni attive → invalida i refresh token
      await this.Session.update({ isRevoked: true }, { where: { accountId: account.id, isRevoked: false } });

      // Blacklist Redis → blocco immediato degli access token ancora validi
      await redisService.blockAccount(account.id);

      res.json({
        success: true,
        message: 'Account disattivato con successo',
      });
    } catch (error) {
      console.error('[AccountController] deleteAccount error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore durante eliminazione account',
      });
    }
  }

  /**
   * POST /auth/accounts/:id/activate
   * Riattiva account disattivato
   */
  async activateAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const account = await this.Account.findByPk(id);

      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Account non trovato',
        });
        return;
      }

      account.isActive = true;
      await account.save();

      // Rimuove dalla blacklist Redis se presente
      await redisService.unblockAccount(account.id);

      res.json({
        success: true,
        message: 'Account riattivato con successo',
      });
    } catch (error) {
      console.error('[AccountController] activateAccount error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore durante riattivazione account',
      });
    }
  }

  /**
   * DELETE /auth/accounts/:id/hard
   * Eliminazione fisica — solo se l'account non ha mai effettuato login.
   * Richiede permesso root.
   */
  async hardDeleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const account = await this.Account.findByPk(id);

      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Account non trovato',
        });
        return;
      }

      // Protezione: non eliminare il proprio account
      const currentUserId = (req as any).accountId;
      if (account.id === currentUserId) {
        res.status(403).json({
          success: false,
          error: 'Non puoi eliminare il tuo account',
        });
        return;
      }

      // Criterio: l'account non deve aver mai effettuato login
      if (account.lastLogin !== null) {
        res.status(403).json({
          success: false,
          error: 'Impossibile eliminare un account che ha già effettuato almeno un login',
        });
        return;
      }

      await account.destroy();

      res.json({
        success: true,
        message: 'Account eliminato definitivamente',
      });
    } catch (error) {
      console.error('[AccountController] hardDeleteAccount error:', error);
      res.status(500).json({
        success: false,
        error: "Errore durante l'eliminazione dell'account",
      });
    }
  }

  /**
   * GET /auth/accounts/roles
   * Lista tutti i ruoli disponibili
   */
  async getRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await this.Role.findAll({
        attributes: ['id', 'name'],
        order: [['id', 'ASC']],
      });

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      console.error('[AccountController] getRoles error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore durante recupero ruoli',
      });
    }
  }

  /**
   * GET /auth/accounts/stats
   * Statistiche overview account
   */
  async getAccountStats(req: Request, res: Response): Promise<void> {
    try {
      const total = await this.Account.count();

      const active = await this.Account.count({
        where: { isActive: true },
      });

      const blocked = await this.Account.count({
        where: {
          [Op.or]: [{ blockedUntil: { [Op.gt]: new Date() } }, { blockReason: { [Op.ne]: null } }],
        },
      });

      const byRole = await this.Account.findAll({
        attributes: ['roleId', [this.Account.sequelize!.fn('COUNT', '*'), 'count']],
        include: [
          {
            model: this.Role,
            as: 'role',
            attributes: ['name'],
          },
        ],
        group: ['roleId', 'role.id'],
        raw: false,
      });

      res.json({
        success: true,
        data: {
          total,
          active,
          inactive: total - active,
          blocked,
          byRole: byRole.map((item: any) => ({
            role: item.role?.name || 'Unknown',
            count: parseInt(item.getDataValue('count'), 10),
          })),
        },
      });
    } catch (error) {
      console.error('[AccountController] getAccountStats error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore durante recupero statistiche',
      });
    }
  }
}

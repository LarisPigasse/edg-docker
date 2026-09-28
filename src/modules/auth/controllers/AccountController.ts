// src/modules/auth/controllers/AccountController.ts
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { redisService } from '../../../core/services/RedisService';
import {
  successResponse,
  createdResponse,
  badRequest,
  notFound,
  forbidden,
  conflict,
  serverError,
  buildPaginationMeta,
  parsePagination,
} from '../utils/response';
import { PasswordUtils } from '../utils/password';
import { logger } from '../../../services/logger';

const ACCOUNT_INCLUDE_ROLE = { attributes: ['id', 'name'] };
const ACCOUNT_INCLUDE_TENANT = { attributes: ['id', 'name', 'slug'] };
const ACCOUNT_EXCLUDE = { exclude: ['password', 'refreshToken', 'passwordResetToken', 'passwordResetExpires'] };

/**
 * Ruoli non assegnabili per certi accountType: regola di business, non
 * derivabile dal solo permesso. Oggi solo root → mai su un account cliente
 * (un cliente è un utente esterno, non deve poter avere accesso admin al
 * sistema). Tabella pensata per crescere: basta aggiungere una voce.
 */
const ROLE_ACCOUNT_TYPE_RESTRICTIONS: Record<string, string[]> = {
  root: ['cliente'],
};

/**
 * Ruoli il cui account deve appartenere al tenant di sistema (isSystem:
 * true) — mai a un tenant qualunque. Oggi solo root: riflette l'invariante
 * già seedata in root-account.seed.ts (tenantId: systemTenant.id), qui
 * anche imposta a livello di API. Non è solo ordine: ADR009 lega a
 * tenantId i moduli attivi per il tenant (vedi moduleGuard sul gateway),
 * quindi un root legato a un tenant normale rischierebbe di vedersi negare
 * moduli per cui le sue permissions dicono '*' ma il tenant no.
 */
const ROLES_REQUIRING_SYSTEM_TENANT: string[] = ['root'];

/**
 * Controller per gestione admin degli account (menu "SISTEMA" su pro-frontend).
 * Tutte le route sono dietro requireRoot() — vedi routes/account.routes.ts.
 *
 * Risposte allineate allo stesso ApiResponse<T> di Tenant/system-service
 * (utils/response.ts), così il frontend riusa lo stesso client/hook generico
 * (createResourceApi + useEntityCrud) usato per Tenant — nessun formato ad hoc.
 *
 * NOTA: I modelli vengono passati al constructor, non importati.
 */
export class AccountController {
  private Account: any;
  private Role: any;
  private RolePermission: any;
  private Session: any;
  private Tenant: any;

  constructor(Account: any, Role: any, Session?: any, Tenant?: any, RolePermission?: any) {
    this.Account = Account;
    this.Role = Role;
    this.Session = Session;
    this.Tenant = Tenant;
    this.RolePermission = RolePermission;
  }

  private auditActor(req: Request): string {
    const account = (req as unknown as { account?: { email?: string; accountId?: number } }).account;
    return account?.email ?? `account#${(req as any).accountId ?? '?'}`;
  }

  /**
   * Verifica la combinazione ruolo/accountType/tenant contro
   * ROLE_ACCOUNT_TYPE_RESTRICTIONS e ROLES_REQUIRING_SYSTEM_TENANT. Ritorna
   * il messaggio di errore da mostrare se qualcosa non è ammesso, altrimenti
   * null. Un'unica query sul ruolo, condivisa da entrambe le regole.
   */
  private async checkRoleAssignmentRestrictions(
    roleId: number,
    accountType: string,
    tenantId: number | null
  ): Promise<string | null> {
    const role = await this.Role.findByPk(roleId, { attributes: ['name'] });
    if (!role) return null; // ruolo inesistente: gestito altrove (FK/validazione)

    const forbiddenTypes = ROLE_ACCOUNT_TYPE_RESTRICTIONS[role.name];
    if (forbiddenTypes?.includes(accountType)) {
      return `Il ruolo "${role.name}" non può essere assegnato a un account di tipo "${accountType}"`;
    }

    if (ROLES_REQUIRING_SYSTEM_TENANT.includes(role.name)) {
      const tenant = tenantId ? await this.Tenant.findByPk(tenantId, { attributes: ['isSystem'] }) : null;
      if (!tenant?.isSystem) {
        return `Il ruolo "${role.name}" può essere assegnato solo al tenant di sistema`;
      }
    }

    return null;
  }

  /** Proiezione comune a list/get/create/update: ruolo e tenant inclusi, campi sensibili esclusi. */
  private get includeRoleAndTenant() {
    return [
      { model: this.Role, as: 'role', ...ACCOUNT_INCLUDE_ROLE },
      { model: this.Tenant, as: 'tenant', ...ACCOUNT_INCLUDE_TENANT },
    ];
  }

  /** Ricarica un account con la stessa proiezione usata ovunque in questo controller. */
  private async reload(id: number | string) {
    return this.Account.findByPk(id, {
      include: this.includeRoleAndTenant,
      attributes: ACCOUNT_EXCLUDE,
    });
  }

  /**
   * Attiva/disattiva un account con gli stessi effetti collaterali di sicurezza
   * ovunque venga richiesto (toggle, activate, delete): un solo punto che
   * revoca le sessioni e aggiorna la blacklist Redis, per non duplicare la
   * logica in tre handler diversi.
   */
  private async setActive(account: any, isActive: boolean): Promise<void> {
    account.isActive = isActive;
    await account.save();

    if (isActive) {
      await redisService.unblockAccount(account.id);
    } else {
      await this.Session.update({ isRevoked: true }, { where: { accountId: account.id, isRevoked: false } });
      await redisService.blockAccount(account.id);
    }
  }

  /**
   * GET /auth/accounts
   * Lista account con paginazione e filtri
   */
  async listAccounts(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, offset } = parsePagination(req.query);
      const { search = '', roleId, accountType, tenantId, active } = req.query;

      const where: any = {};

      if (search && typeof search === 'string') {
        where.email = { [Op.like]: `%${search}%` };
      }

      if (roleId) {
        where.roleId = parseInt(roleId as string, 10);
      }

      if (tenantId) {
        where.tenantId = parseInt(tenantId as string, 10);
      }

      if (accountType && accountType !== 'all') {
        where.accountType = accountType;
      }

      // Stessa convenzione di crudFactory (vedi utils/crudFactory.ts):
      // 'all' = nessun filtro, altrimenti isActive = active !== 'false', default true.
      if (active === 'all') {
        // nessun filtro su isActive
      } else if (active !== undefined) {
        where.isActive = active !== 'false';
      } else {
        where.isActive = true;
      }

      const { count, rows } = await this.Account.findAndCountAll({
        where,
        include: this.includeRoleAndTenant,
        attributes: ACCOUNT_EXCLUDE,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      successResponse(res, rows, undefined, buildPaginationMeta(count, page, limit));
    } catch (error) {
      console.error('[AccountController] listAccounts error:', error);
      serverError(res, 'Errore durante recupero account');
    }
  }

  /**
   * GET /auth/accounts/:id
   * Dettaglio singolo account
   */
  async getAccountById(req: Request, res: Response): Promise<void> {
    try {
      const account = await this.reload(req.params.id);
      if (!account) {
        notFound(res, 'Account');
        return;
      }
      successResponse(res, account);
    } catch (error) {
      console.error('[AccountController] getAccountById error:', error);
      serverError(res, 'Errore durante recupero account');
    }
  }

  /**
   * POST /auth/accounts
   * Crea un nuovo account. La password arriva già scelta dal chiamante
   * (root vede una password generata automaticamente, modificabile, prima
   * di salvare — vedi TenantFormModal/AccountFormModal sul frontend).
   */
  async createAccount(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, roleId, tenantId, accountType, entityId } = req.body;

      const passwordCheck = PasswordUtils.validate(password);
      if (!passwordCheck.valid) {
        badRequest(
          res,
          'Password non valida',
          passwordCheck.errors.map(message => ({ field: 'password', message }))
        );
        return;
      }

      const roleViolation = await this.checkRoleAssignmentRestrictions(roleId, accountType, tenantId ?? null);
      if (roleViolation) {
        badRequest(res, roleViolation);
        return;
      }

      const hash = await PasswordUtils.hash(password);
      const record = await this.Account.create({
        email,
        password: hash,
        roleId,
        tenantId,
        accountType,
        entityId: entityId ?? null,
        isActive: true,
        // Account provisionato direttamente da root, non da autoregistrazione:
        // non serve il giro di verifica email.
        isVerified: true,
      });

      console.log(`✅ [Account] #${record.id} (${email}) creato da ${this.auditActor(req)}`);
      const created = await this.reload(record.id);
      createdResponse(res, created, 'Account creato con successo');
    } catch (error: any) {
      if (error?.name === 'SequelizeUniqueConstraintError') {
        conflict(res, 'Email già in uso');
        return;
      }
      if (error?.name === 'SequelizeForeignKeyConstraintError') {
        badRequest(res, 'Ruolo o tenant non validi');
        return;
      }
      console.error('[AccountController] createAccount error:', error);
      serverError(res, "Errore durante la creazione dell'account");
    }
  }

  /**
   * PUT /auth/accounts/:id
   * Aggiorna dati anagrafici/ruolo/tenant e, opzionalmente, la password.
   * Lo stato attivo/disattivo NON si cambia da qui — solo con
   * PATCH /:id/toggle, che applica anche gli effetti di sicurezza
   * (revoca sessioni, blacklist Redis).
   */
  async updateAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { email, password, roleId, accountType, entityId, tenantId } = req.body;

      const account = await this.Account.findByPk(id);
      if (!account) {
        notFound(res, 'Account');
        return;
      }

      const currentUserId = (req as any).accountId;
      const isSelf = account.id === currentUserId;

      if (isSelf && roleId && account.roleId !== roleId) {
        forbidden(res, 'Non puoi modificare il tuo ruolo');
        return;
      }

      if (roleId !== undefined || accountType !== undefined || tenantId !== undefined) {
        const effectiveRoleId = roleId ?? account.roleId;
        const effectiveAccountType = accountType ?? account.accountType;
        const effectiveTenantId = tenantId !== undefined ? tenantId : account.tenantId;
        const roleViolation = await this.checkRoleAssignmentRestrictions(effectiveRoleId, effectiveAccountType, effectiveTenantId);
        if (roleViolation) {
          badRequest(res, roleViolation);
          return;
        }
      }

      if (password) {
        if (isSelf) {
          forbidden(res, 'Per cambiare la tua password usa "Cambia password" dal tuo profilo');
          return;
        }
        const passwordCheck = PasswordUtils.validate(password);
        if (!passwordCheck.valid) {
          badRequest(
            res,
            'Password non valida',
            passwordCheck.errors.map(message => ({ field: 'password', message }))
          );
          return;
        }
        account.password = await PasswordUtils.hash(password);
        console.log(`🔑 [Account] #${account.id} password reimpostata da ${this.auditActor(req)}`);
      }

      if (email) account.email = email;
      if (roleId) account.roleId = roleId;
      if (accountType) account.accountType = accountType;
      if (entityId !== undefined) account.entityId = entityId;
      if (tenantId !== undefined) account.tenantId = tenantId; // ADR009: riassegnazione tenant (root only, cambio effettivo dal prossimo login/refresh)

      await account.save();

      console.log(`✅ [Account] #${account.id} aggiornato da ${this.auditActor(req)}`);
      const updated = await this.reload(id);
      successResponse(res, updated, 'Account aggiornato con successo');
    } catch (error: any) {
      if (error?.name === 'SequelizeUniqueConstraintError') {
        conflict(res, 'Email già in uso');
        return;
      }
      console.error('[AccountController] updateAccount error:', error);
      serverError(res, "Errore durante l'aggiornamento dell'account");
    }
  }

  /**
   * PATCH /auth/accounts/:id/toggle
   * Attiva/disattiva l'account — stesso endpoint unificato usato da Tenant e
   * dalle tabelle di system-service, riusabile dal generico useEntityCrud sul
   * frontend. Alla disattivazione: revoca sessioni + blacklist Redis (stessa
   * logica già in uso su delete/activate — vedi setActive).
   */
  async toggleActive(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const account = await this.Account.findByPk(id);
      if (!account) {
        notFound(res, 'Account');
        return;
      }

      const currentUserId = (req as any).accountId;
      if (account.isActive && account.id === currentUserId) {
        forbidden(res, 'Non puoi disattivare il tuo account');
        return;
      }

      const wasActive = account.isActive;
      await this.setActive(account, !wasActive);

      console.log(`✅ [Account] #${account.id} → ${!wasActive ? 'attivato' : 'disattivato'} da ${this.auditActor(req)}`);
      const updated = await this.reload(id);
      successResponse(res, updated, `Account ${!wasActive ? 'attivato' : 'disattivato'}`);
    } catch (error) {
      console.error('[AccountController] toggleActive error:', error);
      serverError(res, 'Errore durante il cambio di stato');
    }
  }

  /**
   * DELETE /auth/accounts/:id
   * Soft delete - setta isActive = false (stessi effetti di toggleActive).
   * Mantenuto per compatibilità: il frontend generico usa questo endpoint
   * come "elimina" (coerente con removeResource di crudFactory).
   */
  async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const account = await this.Account.findByPk(id);
      if (!account) {
        notFound(res, 'Account');
        return;
      }

      const currentUserId = (req as any).accountId;
      if (account.id === currentUserId) {
        forbidden(res, 'Non puoi eliminare il tuo account');
        return;
      }

      await this.setActive(account, false);

      console.log(`⚠️  [Account] #${account.id} disattivato da ${this.auditActor(req)}`);
      successResponse(res, null, 'Account disattivato con successo');
    } catch (error) {
      console.error('[AccountController] deleteAccount error:', error);
      serverError(res, "Errore durante l'eliminazione dell'account");
    }
  }

  /**
   * POST /auth/accounts/:id/activate
   * Riattiva account disattivato (stessi effetti di toggleActive).
   */
  async activateAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const account = await this.Account.findByPk(id);
      if (!account) {
        notFound(res, 'Account');
        return;
      }

      await this.setActive(account, true);

      console.log(`✅ [Account] #${account.id} riattivato da ${this.auditActor(req)}`);
      successResponse(res, null, 'Account riattivato con successo');
    } catch (error) {
      console.error('[AccountController] activateAccount error:', error);
      serverError(res, 'Errore durante riattivazione account');
    }
  }

  /**
   * DELETE /auth/accounts/:id/hard
   * Eliminazione fisica — solo se l'account non è mai stato collegato a
   * un'entità operativa (entityId nullo): un account creato per errore e mai
   * realmente usato, non solo mai loggato.
   */
  async hardDeleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const account = await this.Account.findByPk(id);
      if (!account) {
        notFound(res, 'Account');
        return;
      }

      const currentUserId = (req as any).accountId;
      if (account.id === currentUserId) {
        forbidden(res, 'Non puoi eliminare il tuo account');
        return;
      }

      if (account.entityId !== null) {
        forbidden(res, "Impossibile eliminare un account già collegato a un'entità operativa (operatore, cliente, ...)");
        return;
      }

      await account.destroy();
      console.log(`✅ [Account] #${id} eliminato definitivamente da ${this.auditActor(req)}`);
      successResponse(res, null, 'Account eliminato definitivamente');
    } catch (error) {
      console.error('[AccountController] hardDeleteAccount error:', error);
      serverError(res, "Errore durante l'eliminazione dell'account");
    }
  }

  /**
   * GET /auth/accounts/roles
   * Lista tutti i ruoli disponibili (per il selettore Ruolo del form Account)
   */
  async getRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await this.Role.findAll({
        attributes: ['id', 'name', 'description', 'isSystem'],
        include: this.RolePermission
          ? [{ model: this.RolePermission, as: 'permissions', attributes: ['permission'] }]
          : [],
        order: [['id', 'ASC']],
      });
      successResponse(res, roles);
    } catch (error) {
      console.error('[AccountController] getRoles error:', error);
      serverError(res, 'Errore durante recupero ruoli');
    }
  }

  /**
   * PUT /auth/accounts/roles/:id/permissions
   * Sostituisce integralmente l'elenco permessi di un ruolo esistente.
   *
   * Regole di sicurezza (difesa in profondita, verificate anche qui oltre
   * che nascoste in UI):
   * - il ruolo 'root' non e' modificabile da questa API (i suoi permessi
   *   restano fissi a ['*'] come da seed);
   * - il permesso jolly '*' non puo' essere assegnato ad alcun ruolo
   *   diverso da 'root', nemmeno tramite chiamata diretta all'API.
   */
  async updateRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.id, 10);
      const { permissions } = req.body as { permissions: string[] };

      const role = await this.Role.findByPk(roleId);
      if (!role) {
        notFound(res, 'Ruolo non trovato');
        return;
      }

      if (role.name === 'root') {
        forbidden(res, 'I permessi del ruolo root non sono modificabili');
        return;
      }

      if (permissions.includes('*')) {
        forbidden(res, "Il permesso jolly '*' e' riservato al ruolo root");
        return;
      }

      if (!this.RolePermission) {
        serverError(res, 'Gestione permessi non disponibile');
        return;
      }

      await this.RolePermission.destroy({ where: { roleId } });
      if (permissions.length > 0) {
        await this.RolePermission.bulkCreate(
          permissions.map((permission) => ({ roleId, permission }))
        );
      }

      const updatedRole = await this.Role.findByPk(roleId, {
        attributes: ['id', 'name', 'description', 'isSystem'],
        include: [{ model: this.RolePermission, as: 'permissions', attributes: ['permission'] }],
      });

      logger.audit(
        'auth.role_permissions_updated',
        `Permessi ruolo "${role.name}" aggiornati`,
        { id: (req as any).accountId, email: (req as any).account?.email, tenantId: (req as any).account?.tenantId },
        { roleId: role.id, roleName: role.name, permissions }
      );

      successResponse(res, updatedRole, 'Permessi ruolo aggiornati');
    } catch (error) {
      console.error('[AccountController] updateRolePermissions error:', error);
      serverError(res, 'Errore durante aggiornamento permessi ruolo');
    }
  }

  /**
   * GET /auth/accounts/stats
   * Statistiche overview account
   */
  async getAccountStats(req: Request, res: Response): Promise<void> {
    try {
      const total = await this.Account.count();
      const active = await this.Account.count({ where: { isActive: true } });
      const blocked = await this.Account.count({
        where: { [Op.or]: [{ blockedUntil: { [Op.gt]: new Date() } }, { blockReason: { [Op.ne]: null } }] },
      });

      const byRole = await this.Account.findAll({
        attributes: ['roleId', [this.Account.sequelize!.fn('COUNT', '*'), 'count']],
        include: [{ model: this.Role, as: 'role', attributes: ['name'] }],
        group: ['roleId', 'role.id'],
        raw: false,
      });

      successResponse(res, {
        total,
        active,
        inactive: total - active,
        blocked,
        byRole: byRole.map((item: any) => ({
          role: item.role?.name || 'Unknown',
          count: parseInt(item.getDataValue('count'), 10),
        })),
      });
    } catch (error) {
      console.error('[AccountController] getAccountStats error:', error);
      serverError(res, 'Errore durante recupero statistiche');
    }
  }
}

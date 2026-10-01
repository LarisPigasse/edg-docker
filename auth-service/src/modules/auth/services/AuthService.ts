// src/modules/auth/services/AuthService.ts
import { Op } from 'sequelize';
import {
  AccountAttributes,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  AccountType,
  AuthTokenPayload,
} from '../types/auth.types';
import { PasswordUtils, ValidationUtils, TokenUtils } from '../utils';
import { TokenService } from './TokenService';
import { ModuleService } from './ModuleService';
import { emailServiceClient } from '../../../clients/EmailServiceClient';
import { parseUserAgent } from '../utils/deviceDetection';
import { geolocateIP } from '../utils/geolocation';
import { logger } from '../../../services/logger';

export class AuthService {
  private tokenService: TokenService;

  constructor(
    private accountModel: any,
    private sessionModel: any,
    private resetTokenModel: any,
    private roleModel: any,
    private rolePermissionModel: any, // ✅ AGGIUNTO: model RolePermission
    private moduleService: ModuleService, // ADR047: moduli in vigore del tenant (sostituisce la lettura diretta di tenant_modules)
    private tenantModel: any // ✅ NUOVO: model Tenant, solo per leggere il nome (pagina profilo)
  ) {
    this.tokenService = new TokenService();
  }

  /**
   * Registrazione nuovo account
   */
  async register(data: RegisterRequest): Promise<AccountAttributes> {
    // Validazioni
    if (!ValidationUtils.isValidEmail(data.email)) {
      throw new Error('Email non valida');
    }

    if (data.entityId && !ValidationUtils.isValidUUID(data.entityId)) {
      throw new Error('EntityId non valido');
    }

    const passwordValidation = PasswordUtils.validate(data.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Validazione roleId
    if (!ValidationUtils.isValidRoleId(data.roleId)) {
      throw new Error('RoleId non valido');
    }

    // Verifica che il ruolo esista
    const roleExists = await this.roleModel.findByPk(data.roleId);
    if (!roleExists) {
      throw new Error('Ruolo non trovato');
    }

    // Verifica email univoca per account
    const existing = await this.accountModel.findOne({
      where: {
        email: data.email,
      },
    });
    if (existing) {
      throw new Error('Account già esistente con questa email');
    }

    // Hash password
    const passwordHash = await PasswordUtils.hash(data.password);

    // Crea account
    const account = await this.accountModel.create({
      email: data.email,
      password: passwordHash,
      accountType: data.accountType || 'indefinito',
      entityId: data.entityId || null,
      roleId: data.roleId,
      isActive: true,
      isVerified: false,
    });

    // Rimuovi password dall'output
    const accountData = account.toJSON();
    delete accountData.password;

    return accountData;
  }

  /**
   * Login account
   */
  async login(data: LoginRequest, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const account = await this.accountModel.findOne({
      where: {
        email: data.email,
      },
      include: [
        {
          model: this.roleModel,
          as: 'role',
          include: [
            {
              model: this.rolePermissionModel, // ✅ FIXED
              as: 'permissions',
            },
          ],
        },
      ],
    });

    if (!account) {
      logger.warn(
        'auth.login_failed',
        `Login fallito: email non trovata (${data.email})`,
        { ip: ipAddress, userAgent, reason: 'email_non_trovata' }
      );
      throw new Error('Credenziali non valide');
    }

    // Verifica stato account
    if (!account.isActive) {
      logger.warn(
        'auth.login_failed',
        `Login fallito: account disattivato (${data.email})`,
        { ip: ipAddress, userAgent, reason: 'account_disattivato' },
        undefined,
        { id: account.id, email: account.email, tenantId: account.tenantId }
      );
      throw new Error('Account disattivato');
    }

    // Verifica password
    const isPasswordValid = await PasswordUtils.verify(data.password, account.password);

    if (!isPasswordValid) {
      logger.warn(
        'auth.login_failed',
        `Login fallito: password errata (${data.email})`,
        { ip: ipAddress, userAgent, reason: 'password_errata' },
        undefined,
        { id: account.id, email: account.email, tenantId: account.tenantId }
      );
      throw new Error('Credenziali non valide');
    }

    // Estrai permessi dal ruolo e moduli attivi del tenant
    const permissions = await this.loadAccountPermissions(account.id);
    const modules = await this.loadTenantModules(account.tenantId);
    const tenantName = await this.loadTenantName(account.tenantId);

    const refreshToken = this.tokenService.generateRefreshToken();

    // Device detection e geolocation
    const deviceInfo = parseUserAgent(userAgent);
    const geoInfo = await geolocateIP(ipAddress);

    // Crea sessione con info estese
    const session = await this.sessionModel.create({
      accountId: account.id,
      refreshToken,
      expiresAt: this.tokenService.getRefreshTokenExpiry(),
      ipAddress,
      userAgent,
      device: deviceInfo.device,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      geoCountry: geoInfo.country,
      geoRegion: geoInfo.region,
      geoCity: geoInfo.city,
      geoTimezone: geoInfo.timezone,
      lastActivityAt: new Date(),
      isRevoked: false,
    });

    // Genera token con permissions e sessionId
    const accessToken = this.tokenService.generateAccessToken({
      accountId: account.id,
      email: account.email,
      accountType: account.accountType,
      tenantId: account.tenantId,
      roleId: account.roleId,
      permissions,
      modules,
      sessionId: session.id,
    });

    // Aggiorna ultimo login
    await account.update({ lastLogin: new Date() });

    logger.audit(
      'auth.login_success',
      `Login riuscito: ${account.email}`,
      { id: account.id, email: account.email, tenantId: account.tenantId },
      { ip: ipAddress, userAgent, sessionId: session.id, roleId: account.roleId }
    );

    return {
      accessToken,
      refreshToken,
      account: {
        id: account.id,
        email: account.email,
        accountType: account.accountType,
        tenantId: account.tenantId, // ✅ NUOVO (ADR009)
        roleId: account.roleId,
        permissions, // ✅ AGGIUNTO: Permessi inclusi nella response
        roleName: account.role?.name, // ✅ AGGIUNTO: Nome del ruolo incluso nella response
        modules, // ✅ NUOVO (ADR009): moduli attivi del tenant, solo per UX frontend
        tenantName, // ✅ NUOVO: nome del tenant, solo per la pagina profilo
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    // ✅ FIXED: Usa rolePermissionModel direttamente
    const session = await this.sessionModel.findOne({
      where: { refreshToken },
      include: [
        {
          model: this.accountModel,
          as: 'account',
          include: [
            {
              model: this.roleModel,
              as: 'role',
              include: [
                {
                  model: this.rolePermissionModel, // ✅ FIXED
                  as: 'permissions',
                },
              ],
            },
          ],
        },
      ],
    });

    if (!session) {
      throw new Error('Refresh token non valido');
    }

    // Verifica sessione
    if (session.isRevoked) {
      throw new Error('Sessione revocata');
    }

    if (TokenUtils.isExpired(session.expiresAt)) {
      throw new Error('Sessione scaduta');
    }

    const account = session.account;

    if (!account.isActive) {
      throw new Error('Account disattivato');
    }

    // Carica permessi e moduli del tenant
    const permissions = await this.loadAccountPermissions(account.id);
    const modules = await this.loadTenantModules(account.tenantId);
    const tenantName = await this.loadTenantName(account.tenantId);

    // Genera nuovo access token con permissions e modules
    const accessToken = this.tokenService.generateAccessToken({
      accountId: account.id,
      email: account.email,
      accountType: account.accountType,
      tenantId: account.tenantId,
      roleId: account.roleId,
      permissions,
      modules,
      sessionId: session.id,
    });

    // Aggiorna ultima attività e IP/UA se cambiati
    await session.update({
      ipAddress: ipAddress || session.ipAddress,
      userAgent: userAgent || session.userAgent,
      lastActivityAt: new Date(),
    });

    return {
      accessToken,
      refreshToken: session.refreshToken,
      account: {
        id: account.id,
        email: account.email,
        accountType: account.accountType,
        tenantId: account.tenantId, // ✅ NUOVO (ADR009)
        roleId: account.roleId,
        permissions, // ✅ AGGIUNTO: Permessi inclusi nella response
        roleName: account.role?.name, // ✅ AGGIUNTO: Nome del ruolo incluso nella response
        modules, // ✅ NUOVO (ADR009): moduli attivi del tenant, solo per UX frontend
        tenantName, // ✅ NUOVO: nome del tenant, solo per la pagina profilo
      },
    };
  }

  /**
   * Logout (revoca sessione)
   */
  async logout(refreshToken: string): Promise<void> {
    const session = await this.sessionModel.findOne({
      where: { refreshToken },
    });

    if (session) {
      await session.update({ isRevoked: true });
      const account = await this.accountModel.findByPk(session.accountId);
      if (account) {
        logger.audit('auth.logout', `Logout: ${account.email}`, { id: account.id, email: account.email, tenantId: account.tenantId }, { sessionId: session.id });
      }
    }
  }

  /**
   * Logout da tutti i dispositivi
   */
  async logoutAll(accountId: number): Promise<void> {
    await this.sessionModel.update({ isRevoked: true }, { where: { accountId, isRevoked: false } });
  }

  /**
   * Richiesta reset password
   */
  async requestPasswordReset(email: string, ipAddress?: string, userAgent?: string): Promise<string> {
    const account = await this.accountModel.findOne({
      where: { email },
    });

    if (!account) {
      // Non rivelare se l'account esiste (sicurezza)
      // Ma genera comunque un token fake per timing attack prevention
      TokenUtils.generateResetToken();
      logger.auditFailure('auth.password_reset_requested', `Reset password richiesto per email inesistente (${email})`, null, {
        email,
        ip: ipAddress,
        userAgent,
        reason: 'email_non_trovata',
      });
      return "Se l'account esiste, riceverai un'email con il link di reset";
    }

    // Genera token
    const token = TokenUtils.generateResetToken();
    const expiresAt = TokenUtils.calculateExpiry('1h'); // 1 ora

    // Salva token
    await this.resetTokenModel.create({
      token,
      accountId: account.id,
      expiresAt,
      used: false,
      ipAddress,
      userAgent,
    });

    logger.audit('auth.password_reset_requested', `Reset password richiesto: ${account.email}`, { id: account.id, email: account.email, tenantId: account.tenantId }, {
      ip: ipAddress,
      userAgent,
    });

    // Invia email con token
    try {
      await emailServiceClient.sendPasswordReset(account.email, token);
    } catch (error) {
      console.error('[AUTH] Errore invio email reset password:', error);
      // Non blocchiamo l'operazione se l'invio email fallisce
      // Il token è comunque stato salvato
    }

    return "Se l'account esiste, riceverai un'email con il link di reset";
  }

  /**
   * Conferma reset password
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    // Trova token
    const resetToken = await this.resetTokenModel.findOne({
      where: { token, used: false },
      include: ['account'],
    });

    if (!resetToken) {
      logger.auditFailure('auth.password_reset_completed', 'Reset password rifiutato: token non valido o già utilizzato', null, {
        reason: 'token_non_valido',
      });
      throw new Error('Token non valido o già utilizzato');
    }

    const resetAccount = resetToken.account;
    const resetActor = { id: resetAccount.id, email: resetAccount.email, tenantId: resetAccount.tenantId };

    if (TokenUtils.isExpired(resetToken.expiresAt)) {
      logger.auditFailure('auth.password_reset_completed', `Reset password rifiutato: token scaduto (${resetAccount.email})`, resetActor, {
        reason: 'token_scaduto',
      });
      throw new Error('Token scaduto');
    }

    // Valida nuova password
    const passwordValidation = PasswordUtils.validate(newPassword);
    if (!passwordValidation.valid) {
      logger.auditFailure('auth.password_reset_completed', `Reset password rifiutato: password non valida (${resetAccount.email})`, resetActor, {
        reason: 'password_non_valida',
      });
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Hash nuova password
    const passwordHash = await PasswordUtils.hash(newPassword);

    // Aggiorna password
    await resetToken.account.update({ password: passwordHash });

    // Marca token come usato
    await resetToken.update({ used: true });

    logger.audit('auth.password_reset_completed', `Password reimpostata tramite reset: ${resetAccount.email}`, resetActor);

    // Revoca tutte le sessioni attive (per sicurezza)
    await this.logoutAll(resetToken.accountId);
  }

  /**
   * Verifica account (email verification)
   */
  async verifyAccount(accountId: number): Promise<void> {
    await this.accountModel.update({ isVerified: true }, { where: { id: accountId } });
  }

  /**
   * Cambia password (utente autenticato)
   */
  async changePassword(accountId: number, oldPassword: string, newPassword: string): Promise<void> {
    const account = await this.accountModel.findByPk(accountId);

    if (!account) {
      throw new Error('Account non trovato');
    }

    // Verifica password attuale
    const isValid = await PasswordUtils.verify(oldPassword, account.password);
    if (!isValid) {
      logger.auditFailure('auth.password_changed', `Cambio password rifiutato: password attuale errata (${account.email})`, { id: account.id, email: account.email, tenantId: account.tenantId }, {
        reason: 'password_attuale_errata',
      });
      throw new Error('Password attuale non corretta');
    }

    // Valida nuova password
    const validation = PasswordUtils.validate(newPassword);
    if (!validation.valid) {
      logger.auditFailure('auth.password_changed', `Cambio password rifiutato: nuova password non valida (${account.email})`, { id: account.id, email: account.email, tenantId: account.tenantId }, {
        reason: 'password_non_valida',
      });
      throw new Error(validation.errors.join(', '));
    }

    // Hash e aggiorna
    const passwordHash = await PasswordUtils.hash(newPassword);
    await account.update({ password: passwordHash });

    logger.audit('auth.password_changed', `Password modificata: ${account.email}`, { id: account.id, email: account.email, tenantId: account.tenantId });

    // Revoca tutte le sessioni (opzionale)
    await this.logoutAll(accountId);
  }

  /**
   * Cleanup sessioni e token scaduti
   */
  async cleanupExpired(): Promise<{ sessions: number; resetTokens: number }> {
    const now = new Date();

    // Elimina sessioni scadute
    const sessions = await this.sessionModel.destroy({
      where: {
        expiresAt: { [Op.lt]: now },
      },
    });

    // Elimina reset token scaduti
    const resetTokens = await this.resetTokenModel.destroy({
      where: {
        expiresAt: { [Op.lt]: now },
      },
    });

    return { sessions, resetTokens };
  }

  // ============================================================================
  // HELPER METHODS PER RBAC
  // ============================================================================

  /**
   * Moduli in vigore del tenant, da mettere nel JWT (ADR009, ADR047).
   * Le regole stanno in ModuleService: tenant di sistema -> ['*'], altrimenti
   * solo attivazioni in prova o attive, nel periodo, con le dipendenze.
   */
  private async loadTenantModules(tenantId: number): Promise<string[]> {
    return this.moduleService.resolveTenantModules(tenantId);
  }

  /**
   * Carica il nome del tenant, solo per la visualizzazione nella pagina profilo.
   * Non è un dato di sicurezza: l'autorizzazione si basa esclusivamente su tenantId/modules.
   */
  private async loadTenantName(tenantId: number): Promise<string | null> {
    if (!tenantId) {
      return null;
    }

    const tenant = await this.tenantModel.findByPk(tenantId);

    return tenant?.name ?? null;
  }

  /**
   * Carica i permessi di un account dal suo ruolo
   * ✅ FIXED: Usa rolePermissionModel direttamente
   */
  private async loadAccountPermissions(accountId: number): Promise<string[]> {
    const account = await this.accountModel.findByPk(accountId, {
      include: [
        {
          model: this.roleModel,
          as: 'role',
          include: [
            {
              model: this.rolePermissionModel, // ✅ FIXED
              as: 'permissions',
            },
          ],
        },
      ],
    });

    if (!account || !account.role || !account.role.permissions) {
      return [];
    }

    // Estrai array di permessi
    const permissions = account.role.permissions || [];
    return permissions.map((p: any) => p.permission);
  }
}

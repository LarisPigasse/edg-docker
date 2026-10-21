// src/modules/auth/services/AssistenzaService.ts
// =============================================================================
// Accesso assistito (ADR085, docs/piattaforma/accesso-assistito.md)
// =============================================================================
// Il personale EDG (permesso 'sistema.assistenza') entra nel tenant di un
// cliente dal proprio account:
//   1. apri()     crea la sessione e un codice monouso (Redis, 64 secondi)
//   2. scambia()  app-frontend cambia il codice con il token assistito
//   3. chiudi()   uscita, chiusura da EDG; la scadenza si calcola
// Il token assistito e' un JWT normale: in Preparazione accountId = operatore,
// tenantId = cliente, permessi dell'admin limitati ai moduli in vigore,
// systemTenant false, campo `assistenza` con le due identita'.
// =============================================================================
import crypto from 'crypto';
import { Op } from 'sequelize';
import { TokenService } from './TokenService';
import { ModuleService } from './ModuleService';
import { redisService } from '../../../core/services/RedisService';
import { logger, type LogActor } from '../../../services/logger';
import type { LoginResponseAccount } from '../types/auth.types';
import type { AssistenzaClaim, AssistenzaView, ModoAssistenza, MotivoFine } from '../types/assistenza.types';
import {
  DURATA_ASSISTENZA_MINUTI,
  RUOLO_PREPARAZIONE,
  VALIDITA_CODICE_SECONDI,
  nomeAccount,
  permessiPreparazione,
  secondiRimasti,
  statoAssistenza,
} from '../utils/assistenza';

/** Regola violata: stato HTTP e messaggio pronto per l'utente */
export class AssistenzaError extends Error {
  constructor(
    public readonly status: 400 | 403 | 404 | 409 | 410 | 503,
    message: string
  ) {
    super(message);
    this.name = 'AssistenzaError';
  }
}

export const isAssistenzaError = (err: unknown): err is AssistenzaError => err instanceof AssistenzaError;

export interface AperturaInput {
  tenantId: number;
  modo: ModoAssistenza;
  motivo: string;
}

export interface Provenienza {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface Apertura {
  codice: string;
  codiceValidoSecondi: number;
  sessione: AssistenzaView;
}

export interface Ingresso {
  accessToken: string;
  scade: string;
  account: LoginResponseAccount;
  assistenza: AssistenzaClaim;
}

const ORA = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });

const ACCOUNT_ATTRS = ['id', 'email', 'firstName', 'lastName', 'accountType', 'isActive'];

export class AssistenzaService {
  private tokenService = new TokenService();

  constructor(
    private assistedSessionModel: any,
    private accountModel: any,
    private roleModel: any,
    private rolePermissionModel: any,
    private tenantModel: any,
    private moduleService: ModuleService
  ) {}

  // ===========================================================================
  // APERTURA (pro-frontend, personale EDG)
  // ===========================================================================

  async apri(operatore: LogActor, input: AperturaInput, provenienza: Provenienza): Promise<Apertura> {
    if (input.modo !== 'preparazione') {
      throw new AssistenzaError(400, 'La modalità Assistenza non è ancora disponibile');
    }

    const tenant = await this.tenantModel.findByPk(input.tenantId, { attributes: ['id', 'name', 'isSystem', 'isActive'] });
    if (!tenant) throw new AssistenzaError(404, 'Tenant non trovato');
    if (tenant.isSystem) throw new AssistenzaError(400, 'Nel tenant di sistema non serve l’accesso assistito');
    if (!tenant.isActive) throw new AssistenzaError(400, `Il tenant «${tenant.name}» non è attivo`);

    const moduli = await this.moduleService.resolveTenantModules(tenant.id);
    if ((await this.permessiPerTenant(moduli)).length === 0) {
      throw new AssistenzaError(400, `Il tenant «${tenant.name}» non ha moduli in vigore da preparare`);
    }

    await this.chiudiScadute();
    const aperta = await this.assistedSessionModel.findOne({
      where: { operatorAccountId: operatore.id, endedAt: null },
      include: [{ model: this.tenantModel, as: 'tenant', attributes: ['id', 'name'] }],
    });
    if (aperta) {
      throw new AssistenzaError(
        409,
        `Hai già una sessione aperta nel tenant «${aperta.tenant?.name ?? aperta.tenantId}» fino alle ${ORA.format(aperta.expiresAt)}: chiudila prima`
      );
    }

    // Senza Redis il codice non puo' essere monouso: meglio non aprire
    if (!redisService.isAvailable()) {
      throw new AssistenzaError(503, 'Accesso assistito non disponibile in questo momento: riprova tra poco');
    }

    const adesso = new Date();
    const sessione = await this.assistedSessionModel.create({
      operatorAccountId: operatore.id,
      tenantId: tenant.id,
      modo: input.modo,
      motivo: input.motivo,
      startedAt: adesso,
      expiresAt: new Date(adesso.getTime() + DURATA_ASSISTENZA_MINUTI * 60_000),
      ipAddress: provenienza.ipAddress?.slice(0, 45) ?? null,
      userAgent: provenienza.userAgent?.slice(0, 512) ?? null,
    });

    const codice = crypto.randomBytes(32).toString('base64url');
    const salvato = await redisService.saveAssistCode(codice, sessione.id, VALIDITA_CODICE_SECONDI);
    if (!salvato) {
      await sessione.update({ endedAt: new Date(), endReason: 'chiusa', endedByAccountId: operatore.id });
      throw new AssistenzaError(503, 'Accesso assistito non disponibile in questo momento: riprova tra poco');
    }

    logger.audit(
      'auth.assistenza_aperta',
      `Accesso assistito aperto nel tenant «${tenant.name}» (${input.modo}): ${input.motivo}`,
      operatore,
      { sessione: sessione.id, tenantId: tenant.id, tenant: tenant.name, modo: input.modo, motivo: input.motivo, scade: sessione.expiresAt },
      'SECURITY'
    );

    const completa = await this.trova(sessione.id);
    return { codice, codiceValidoSecondi: VALIDITA_CODICE_SECONDI, sessione: this.vista(completa) };
  }

  // ===========================================================================
  // SCAMBIO DEL CODICE (app-frontend, rotta pubblica: il codice e' la credenziale)
  // ===========================================================================

  async scambia(codice: string, provenienza: Provenienza): Promise<Ingresso> {
    const sessionId = await redisService.takeAssistCode(codice);
    if (!sessionId) {
      logger.auditFailure('auth.assistenza_codice', 'Codice di accesso assistito non valido, scaduto o già usato', null, { ip: provenienza.ipAddress }, 'SECURITY');
      throw new AssistenzaError(410, 'Il collegamento non è più valido: riapri l’accesso assistito da EDG Pro');
    }

    const sessione = await this.trova(sessionId);
    if (!sessione || statoAssistenza(sessione) !== 'aperta') {
      throw new AssistenzaError(410, 'La sessione di assistenza è già terminata');
    }

    const operatore = sessione.operatore;
    const tenant = sessione.tenant;
    if (!operatore?.isActive) throw new AssistenzaError(403, 'Il tuo account non è attivo');
    if (!tenant) throw new AssistenzaError(404, 'Tenant non trovato');

    const moduli = await this.moduleService.resolveTenantModules(tenant.id);
    const ruolo = await this.ruoloPreparazione();
    const permissions = permessiPreparazione(this.permessiDelRuolo(ruolo), moduli);
    if (permissions.length === 0) {
      throw new AssistenzaError(400, `Il tenant «${tenant.name}» non ha più moduli in vigore da preparare`);
    }

    const assistenza: AssistenzaClaim = {
      id: sessione.id,
      modo: sessione.modo,
      operatore: { id: operatore.id, email: operatore.email, nome: nomeAccount(operatore) },
      tenant: { id: tenant.id, nome: tenant.name },
      perConto: null,
      scade: sessione.expiresAt.toISOString(),
    };

    const accessToken = this.tokenService.generateAccessToken(
      {
        accountId: operatore.id,
        email: operatore.email,
        accountType: operatore.accountType,
        tenantId: tenant.id,
        roleId: ruolo.id,
        permissions,
        modules: moduli,
        systemTenant: false,
        assistenza,
      },
      secondiRimasti(sessione.expiresAt)
    );

    logger.audit(
      'auth.assistenza_entrata',
      `Ingresso nel tenant «${tenant.name}» con l'accesso assistito`,
      { id: operatore.id, email: operatore.email, tenantId: tenant.id },
      { sessione: sessione.id, ip: provenienza.ipAddress, userAgent: provenienza.userAgent, permissions },
      'SECURITY'
    );

    return {
      accessToken,
      scade: assistenza.scade,
      assistenza,
      account: {
        id: operatore.id,
        email: operatore.email,
        firstName: operatore.firstName ?? null,
        lastName: operatore.lastName ?? null,
        accountType: operatore.accountType,
        tenantId: tenant.id,
        roleId: ruolo.id,
        roleName: ruolo.name,
        permissions,
        modules: moduli,
        tenantName: tenant.name,
      },
    };
  }

  // ===========================================================================
  // CHIUSURA
  // ===========================================================================

  /** Uscita dalla scheda assistita (token assistito) */
  async esci(claim: AssistenzaClaim | undefined, chi: LogActor): Promise<AssistenzaView> {
    if (!claim?.id) throw new AssistenzaError(400, 'Non sei in una sessione di assistenza');
    return this.chiudi(claim.id, 'uscita', chi);
  }

  /** Chiusura da EDG (pagina Assistenze di pro-frontend) */
  async chiudiDaEdg(id: number, chi: LogActor): Promise<AssistenzaView> {
    return this.chiudi(id, 'chiusa', chi);
  }

  private async chiudi(id: number, motivo: MotivoFine, chi: LogActor): Promise<AssistenzaView> {
    const sessione = await this.trova(id);
    if (!sessione) throw new AssistenzaError(404, 'Sessione di assistenza non trovata');
    if (statoAssistenza(sessione) !== 'aperta') throw new AssistenzaError(409, 'La sessione di assistenza è già terminata');

    const restano = secondiRimasti(sessione.expiresAt);
    await sessione.update({ endedAt: new Date(), endReason: motivo, endedByAccountId: chi.id });
    // Margine di 64 s sulla durata residua del token, poi la chiave non serve
    await redisService.blockAssistSession(sessione.id, restano + 64);

    logger.audit(
      'auth.assistenza_chiusa',
      `Accesso assistito nel tenant «${sessione.tenant?.name ?? sessione.tenantId}» chiuso (${motivo})`,
      chi,
      { sessione: sessione.id, tenantId: sessione.tenantId, motivo, operatore: sessione.operatorAccountId },
      'SECURITY'
    );

    return this.vista(sessione);
  }

  // ===========================================================================
  // ELENCO (pro-frontend)
  // ===========================================================================

  async elenco(filtro: { aperte?: boolean; limit?: number }): Promise<AssistenzaView[]> {
    await this.chiudiScadute();
    const righe = await this.assistedSessionModel.findAll({
      where: filtro.aperte ? { endedAt: null } : {},
      include: this.include(),
      order: [['startedAt', 'DESC']],
      limit: filtro.limit ?? 64,
    });
    return righe.map((r: any) => this.vista(r));
  }

  // ===========================================================================
  // SUPPORTO
  // ===========================================================================

  /** Le sessioni scadute si segnano come tali (non c'e' un evento di scadenza) */
  private async chiudiScadute(): Promise<void> {
    await this.assistedSessionModel.update(
      { endedAt: this.assistedSessionModel.sequelize.col('expiresAt'), endReason: 'scaduta' },
      { where: { endedAt: null, expiresAt: { [Op.lte]: new Date() } } }
    );
  }

  private include() {
    return [
      { model: this.accountModel, as: 'operatore', attributes: ACCOUNT_ATTRS },
      { model: this.tenantModel, as: 'tenant', attributes: ['id', 'name', 'isActive', 'isSystem'] },
    ];
  }

  private trova(id: number): Promise<any> {
    return this.assistedSessionModel.findByPk(id, { include: this.include() });
  }

  private async ruoloPreparazione(): Promise<any> {
    const ruolo = await this.roleModel.findOne({
      where: { name: RUOLO_PREPARAZIONE },
      include: [{ model: this.rolePermissionModel, as: 'permissions' }],
    });
    if (!ruolo) throw new AssistenzaError(503, `Ruolo '${RUOLO_PREPARAZIONE}' non trovato`);
    return ruolo;
  }

  private permessiDelRuolo(ruolo: any): string[] {
    return (ruolo.permissions ?? []).map((p: any) => p.permission);
  }

  private async permessiPerTenant(moduli: string[]): Promise<string[]> {
    return permessiPreparazione(this.permessiDelRuolo(await this.ruoloPreparazione()), moduli);
  }

  private vista(s: any): AssistenzaView {
    return {
      id: s.id,
      uuid: s.uuid,
      modo: s.modo,
      stato: statoAssistenza(s),
      motivo: s.motivo,
      operatore: s.operatore ? { id: s.operatore.id, email: s.operatore.email, nome: nomeAccount(s.operatore) } : null,
      tenant: s.tenant ? { id: s.tenant.id, nome: s.tenant.name } : null,
      inizio: new Date(s.startedAt).toISOString(),
      scade: new Date(s.expiresAt).toISOString(),
      fine: s.endedAt ? new Date(s.endedAt).toISOString() : null,
      chiusaDa: s.endedByAccountId ?? null,
    };
  }
}

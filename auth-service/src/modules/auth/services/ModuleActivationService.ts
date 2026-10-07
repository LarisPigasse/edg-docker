// src/modules/auth/services/ModuleActivationService.ts
// =============================================================================
// Attivazioni dei moduli per tenant (ADR047) — gestite da admin e root
// =============================================================================
// Una sola riga per coppia tenant/modulo (tabella tenant_modules). Regole:
//   - mai sul tenant di sistema: ha gia' tutti i moduli, dal codice
//   - mai su un modulo dismesso
//   - le dipendenze devono essere gia' in vigore per il tenant
//   - la prova ha sempre una fine: se non indicata, inizio + trialDays
//   - in prova o attivo, la fine (se c'e') deve essere futura e dopo l'inizio
//   - 'scaduto' lo decide solo il processo di scadenza; riattivando un modulo
//     scaduto si azzera expiredAt (il conto dei 64 giorni si ferma)
// =============================================================================
import { Op } from 'sequelize';
import { ModuleError } from './ModuleError';
import { ModuleService } from './ModuleService';
import { addDays, dataPurgeDate, hasActivationEnded, isActivationInForce } from './moduleRules';
import { logger } from '../../../services/logger';
import { CUSTOMER_MODULE_STATUS, GRANTING_STATUSES, type ActivationStatus } from '../types/module.types';

export interface ActivationInput {
  module?: string;
  status?: ActivationStatus;
  startsAt?: Date;
  endsAt?: Date | null;
  config?: Record<string, unknown> | null;
  notes?: string | null;
}

/** Riga del catalogo con lo stato dell'attivazione per un tenant */
export interface TenantModuleView {
  module: Record<string, unknown>;
  activation: Record<string, unknown> | null;
  inForce: boolean;
  purgeAt: Date | null;
}

export class ModuleActivationService {
  constructor(
    private moduleModel: any,
    private tenantModuleModel: any,
    private tenantModel: any,
    private moduleService: ModuleService
  ) {}

  /**
   * Tutto il catalogo visto da un tenant: per ogni modulo l'eventuale
   * attivazione, se e' in vigore adesso (dipendenze comprese) e, se scaduto,
   * quando verranno eliminati i dati.
   */
  async listForTenant(tenantId: number): Promise<{ tenant: Record<string, unknown>; modules: TenantModuleView[] }> {
    const tenant = await this.findTenant(tenantId);
    const [catalog, activations, inForce] = await Promise.all([
      this.moduleModel.findAll({ order: [['product', 'ASC'], ['name', 'ASC']] }),
      this.tenantModuleModel.findAll({ where: { tenantId } }),
      this.moduleService.resolveTenantModules(tenantId),
    ]);

    const byKey = new Map<string, any>(activations.map((a: any) => [a.module, a]));
    const allModules = tenant.isSystem; // il tenant di sistema ha tutto, dal codice

    const modules: TenantModuleView[] = catalog.map((m: any) => {
      const a = byKey.get(m.key) ?? null;
      return {
        module: m.get({ plain: true }),
        activation: a ? a.get({ plain: true }) : null,
        inForce: allModules || inForce.includes(m.key),
        purgeAt: a?.status === 'scaduto' && a.expiredAt ? dataPurgeDate(a.expiredAt) : null,
      };
    });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        // Il settore sta sull'anagrafica del cliente collegato (ADR059)
        clienteUuid: tenant.clienteUuid ?? null,
        isSystem: tenant.isSystem,
        isActive: tenant.isActive,
        allModules,
      },
      modules,
    };
  }

  /** Nuova attivazione (prova o attivo) */
  async activate(tenantId: number, input: ActivationInput, grantedBy: number | null): Promise<any> {
    await this.findTenant(tenantId, { rejectSystem: true });
    const key = input.module as string;
    const catalog = await this.findModule(key);

    if (await this.tenantModuleModel.findOne({ where: { tenantId, module: key } })) {
      throw new ModuleError(409, `Il modulo '${catalog.name}' è già presente per questo tenant: modificalo invece di riattivarlo`);
    }

    const status: ActivationStatus = input.status ?? 'prova';
    const startsAt = input.startsAt ?? new Date();
    const endsAt = this.resolveEnd(status, startsAt, input.endsAt ?? null, catalog.trialDays);

    this.checkPeriod(status, startsAt, endsAt);
    this.checkGrantable(catalog);
    await this.checkDependenciesInForce(tenantId, catalog);

    return this.tenantModuleModel.create({
      tenantId,
      module: key,
      status,
      startsAt,
      endsAt,
      config: input.config ?? null,
      notes: input.notes ?? null,
      grantedBy,
    });
  }

  /**
   * Modifica un'attivazione: stato (prova/attivo/sospeso), periodo, config, note.
   * Restituisce prima e dopo per l'audit e i moduli che il tenant ha perso come
   * effetto collaterale (es. sospendendo 'spedizioni' cade anche 'tracking').
   */
  async update(
    tenantId: number,
    key: string,
    input: ActivationInput
  ): Promise<{ before: any; after: any; lostModules: string[] }> {
    await this.findTenant(tenantId, { rejectSystem: true });
    const catalog = await this.findModule(key);
    const record = await this.tenantModuleModel.findOne({ where: { tenantId, module: key } });
    if (!record) throw new ModuleError(404, `Il modulo '${catalog.name}' non è attivato per questo tenant`);

    const status: ActivationStatus = input.status ?? record.status;
    const startsAt: Date = input.startsAt ?? record.startsAt;
    const requestedEnd = input.endsAt !== undefined ? input.endsAt : record.endsAt;
    // Passando a prova senza una fine valida, la prova riparte da adesso
    const trialStart = status === 'prova' && !requestedEnd ? new Date(Math.max(Date.now(), startsAt.getTime())) : startsAt;
    const endsAt = this.resolveEnd(status, trialStart, requestedEnd, catalog.trialDays);

    const granting = GRANTING_STATUSES.includes(status);
    if (granting) {
      this.checkPeriod(status, startsAt, endsAt);
      this.checkGrantable(catalog);
      await this.checkDependenciesInForce(tenantId, catalog);
    }

    // clone: senza, get({ plain: true }) restituisce dataValues stesso, che update() modifica
    const before = record.get({ plain: true, clone: true });
    const modulesBefore = await this.moduleService.resolveTenantModules(tenantId);

    await record.update({
      status,
      startsAt,
      endsAt,
      // Riattivando un modulo scaduto si ferma il conto dei 64 giorni
      expiredAt: granting ? null : record.expiredAt,
      ...(input.config !== undefined && { config: input.config }),
      ...(input.notes !== undefined && { notes: input.notes }),
    });

    const modulesAfter = await this.moduleService.resolveTenantModules(tenantId);
    const lostModules = modulesBefore.filter(m => m !== key && !modulesAfter.includes(m));

    return { before, after: record, lostModules };
  }

  /**
   * Processo di scadenza (job 'auth.module-expiry'): porta a 'scaduto' le
   * attivazioni in prova o attive con la fine passata. expiredAt = fine del
   * periodo (non l'ora del processo), cosi' i 64 giorni di conservazione dei
   * dati partono dal momento giusto anche se il processo gira in ritardo.
   * L'accesso e' gia' cessato da solo (il JWT filtra per data): qui si rende
   * coerente lo stato e si fa partire il conto per l'eliminazione dei dati.
   */
  async expireEnded(now: Date = new Date()): Promise<number> {
    const ended = await this.tenantModuleModel.findAll({
      where: { status: { [Op.in]: GRANTING_STATUSES }, endsAt: { [Op.lte]: now } },
    });

    let count = 0;
    for (const record of ended) {
      if (!hasActivationEnded(record, now)) continue;
      const precedente = record.get({ plain: true, clone: true });
      await record.update({ status: 'scaduto', expiredAt: record.endsAt });
      count++;
      logger.info(
        'module.expire',
        `Modulo '${record.module}' del tenant #${record.tenantId}: ${precedente.status} → scaduto (dati conservati fino al ${dataPurgeDate(record.endsAt).toISOString().slice(0, 10)})`,
        { tenantId: record.tenantId, module: record.module, statoPrecedente: precedente.status, endsAt: record.endsAt },
        'DATA'
      );
    }
    return count;
  }

  // ---------------------------------------------------------------------------
  // Regole
  // ---------------------------------------------------------------------------

  private async findTenant(tenantId: number, opts: { rejectSystem?: boolean } = {}): Promise<any> {
    const tenant = await this.tenantModel.findByPk(tenantId);
    if (!tenant) throw new ModuleError(404, 'Tenant non trovato');
    if (opts.rejectSystem && tenant.isSystem) {
      throw new ModuleError(409, 'Il tenant di sistema ha già tutti i moduli: non servono attivazioni');
    }
    return tenant;
  }

  private async findModule(key: string): Promise<any> {
    const catalog = await this.moduleModel.findOne({ where: { key } });
    if (!catalog) throw new ModuleError(404, `Modulo '${key}' non trovato nel catalogo`);
    return catalog;
  }

  /** Fine effettiva: per la prova, se assente, inizio + durata predefinita del modulo */
  private resolveEnd(status: ActivationStatus, startsAt: Date, endsAt: Date | null, trialDays: number): Date | null {
    if (status === 'prova' && !endsAt) return addDays(startsAt, trialDays);
    return endsAt;
  }

  private checkPeriod(status: ActivationStatus, startsAt: Date, endsAt: Date | null): void {
    if (!endsAt) return;
    if (!isActivationInForce({ status, startsAt: new Date(0), endsAt }, new Date())) {
      throw new ModuleError(400, 'La data di fine è già passata');
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new ModuleError(400, 'La data di fine deve essere successiva alla data di inizio');
    }
  }

  /** Ai clienti si danno solo moduli disponibili: mai in sviluppo, mai dismessi */
  private checkGrantable(catalog: any): void {
    if (catalog.status === 'dismesso') {
      throw new ModuleError(409, `Il modulo '${catalog.name}' è dismesso: non si può attivare`);
    }
    if (catalog.status !== CUSTOMER_MODULE_STATUS) {
      throw new ModuleError(409, `Il modulo '${catalog.name}' è in sviluppo: si potrà attivare quando sarà disponibile`);
    }
  }

  private async checkDependenciesInForce(tenantId: number, catalog: any): Promise<void> {
    const deps: string[] = Array.isArray(catalog.dependencies) ? catalog.dependencies : [];
    if (deps.length === 0) return;
    const inForce = await this.moduleService.resolveTenantModules(tenantId);
    const missing = deps.filter(d => !inForce.includes(d));
    if (missing.length > 0) {
      throw new ModuleError(409, `Il modulo '${catalog.name}' richiede prima: ${missing.join(', ')}`);
    }
  }
}

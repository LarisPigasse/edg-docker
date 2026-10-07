// src/modules/auth/services/ModuleService.ts
// =============================================================================
// Gestione moduli (ADR047): quali moduli ha un tenant, adesso
// =============================================================================
// Unico punto che decide i moduli da mettere nel JWT. Il gateway li usa come
// unico controllo vero (ADR009); il frontend solo per menu e rotte.
//
// Regole (in ordine):
//   1. tenant inesistente o disattivato  -> nessun modulo
//   2. tenant di sistema (EDG)           -> ['*'], tutti i moduli (dal codice)
//   3. altrimenti le attivazioni in vigore (prova|attivo, periodo in corso)
//      su moduli 'disponibile' (mai in sviluppo ne' dismessi), con tutte le
//      dipendenze soddisfatte.
// =============================================================================
import { Op } from 'sequelize';
import { ALL_MODULES, CUSTOMER_MODULE_STATUS, GRANTING_STATUSES } from '../types/module.types';
import { isActivationInForce, resolveDependencies } from './moduleRules';

export class ModuleService {
  constructor(
    private moduleModel: any,
    private tenantModuleModel: any,
    private tenantModel: any
  ) {}

  /** Moduli da mettere nel JWT per il tenant indicato */
  async resolveTenantModules(tenantId: number | null | undefined, now: Date = new Date()): Promise<string[]> {
    if (!tenantId) return [];

    const tenant = await this.tenantModel.findByPk(tenantId, { attributes: ['id', 'isSystem', 'isActive'] });
    if (!tenant || !tenant.isActive) return [];
    if (tenant.isSystem) return [ALL_MODULES];

    // Prefiltro in SQL (stato e periodo), verifica finale con la stessa regola
    // usata ovunque (isActivationInForce), cosi' non esistono due definizioni.
    const activations = await this.tenantModuleModel.findAll({
      where: {
        tenantId,
        status: { [Op.in]: GRANTING_STATUSES },
        startsAt: { [Op.lte]: now },
        [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gt]: now } }],
      },
      include: [
        {
          model: this.moduleModel,
          as: 'catalog',
          required: true,
          attributes: ['key', 'dependencies', 'status'],
          where: { status: CUSTOMER_MODULE_STATUS },
        },
      ],
    });

    const candidates = new Map<string, readonly string[]>();
    for (const a of activations) {
      if (!isActivationInForce(a, now)) continue;
      const deps = a.catalog?.dependencies;
      candidates.set(a.module, Array.isArray(deps) ? deps : []);
    }

    return resolveDependencies(candidates);
  }
}

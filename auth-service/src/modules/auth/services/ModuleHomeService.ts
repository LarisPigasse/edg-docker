// src/modules/auth/services/ModuleHomeService.ts
// =============================================================================
// Home dell'utente (fase 4, ADR055-056): i moduli come li vede chi entra
// =============================================================================
// Per QUALUNQUE account autenticato, non solo il personale EDG. Il filtro e'
// tutto qui, nel backend: i moduli riservati non arrivano mai al browser di chi
// non ne ha diritto. Le regole sono pure, in moduleRules.ts (homeStatus,
// hasAnyModulePermission); qui solo la lettura dei dati.
// =============================================================================
import { Op } from 'sequelize';
import type { HomeModule } from '../types/module.types';
import { ModuleService } from './ModuleService';
import { hasAnyModulePermission, homeStatus } from './moduleRules';

/** Chi chiede: dal JWT (via gateway) */
export interface HomeAccount {
  tenantId: number | null | undefined;
  permissions: readonly string[];
}

export class ModuleHomeService {
  constructor(
    private moduleModel: any,
    private tenantModuleModel: any,
    private tenantModel: any,
    private moduleService: ModuleService
  ) {}

  /** Moduli da mostrare nella home dell'account, per prodotto e nome */
  async listForAccount(account: HomeAccount, now: Date = new Date()): Promise<HomeModule[]> {
    const { tenantId, permissions } = account;
    if (!tenantId) return [];

    const tenant = await this.tenantModel.findByPk(tenantId, { attributes: ['id', 'isSystem', 'isActive'] });
    if (!tenant || !tenant.isActive) return [];
    const systemTenant = Boolean(tenant.isSystem);

    const [catalog, activations, inForce] = await Promise.all([
      this.moduleModel.findAll({
        where: { status: { [Op.ne]: 'dismesso' } },
        order: [
          ['product', 'ASC'],
          ['name', 'ASC'],
        ],
      }),
      systemTenant ? ([] as any[]) : this.tenantModuleModel.findAll({ where: { tenantId } }),
      systemTenant ? ([] as string[]) : this.moduleService.resolveTenantModules(tenantId, now),
    ]);

    const byKey = new Map<string, any>(activations.map((a: any) => [a.module, a]));
    const home: HomeModule[] = [];

    for (const m of catalog) {
      if (!hasAnyModulePermission(permissions, m.key)) continue;
      const activation = byKey.get(m.key) ?? null;
      const status = homeStatus({ module: m, activation, inForce: inForce.includes(m.key), systemTenant }, now);
      if (!status) continue;

      home.push({
        key: m.key,
        name: m.name,
        description: m.description ?? null,
        product: m.product,
        version: m.version,
        branding: m.branding ?? null,
        status,
        endsAt: (status === 'prova' || status === 'attivo') && activation?.endsAt ? activation.endsAt : null,
      });
    }

    return home;
  }
}

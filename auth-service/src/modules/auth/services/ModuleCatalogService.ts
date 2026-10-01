// src/modules/auth/services/ModuleCatalogService.ts
// =============================================================================
// Catalogo dei moduli (ADR047) — gestito da root
// =============================================================================
// Il modulo nasce nel codice, il catalogo lo descrive e lo accende. Regole:
//   - la chiave e' stabile: si sceglie alla creazione e non cambia piu'
//   - le dipendenze devono esistere, non includere il modulo stesso e non
//     formare cicli
//   - un modulo gia' attivato almeno una volta non si elimina: si dismette
// =============================================================================
import { literal } from 'sequelize';
import { ModuleError } from './ModuleError';
import { findDependencyCycle } from './moduleRules';
import type { ModuleStatus } from '../types/module.types';

export interface CatalogInput {
  key?: string;
  name?: string;
  description?: string | null;
  product?: string;
  dependencies?: string[];
  status?: ModuleStatus;
  trialDays?: number;
}

/** Numero di attivazioni (di qualunque stato) di ogni modulo */
const ACTIVATION_COUNT = literal('(SELECT COUNT(*) FROM `tenant_modules` tm WHERE tm.`module` = `Module`.`key`)');

export class ModuleCatalogService {
  constructor(private moduleModel: any) {}

  /** Tutto il catalogo, raggruppabile per prodotto, con il numero di attivazioni */
  async list(): Promise<any[]> {
    return this.moduleModel.findAll({
      attributes: { include: [[ACTIVATION_COUNT, 'activationCount']] },
      order: [
        ['product', 'ASC'],
        ['name', 'ASC'],
      ],
    });
  }

  async get(key: string): Promise<any> {
    const record = await this.moduleModel.findOne({
      where: { key },
      attributes: { include: [[ACTIVATION_COUNT, 'activationCount']] },
    });
    if (!record) throw new ModuleError(404, `Modulo '${key}' non trovato`);
    return record;
  }

  async create(input: CatalogInput): Promise<any> {
    const key = input.key as string;
    if (await this.moduleModel.findOne({ where: { key } })) {
      throw new ModuleError(409, `Esiste già un modulo con chiave '${key}'`);
    }
    await this.checkDependencies(key, input.dependencies ?? []);
    return this.moduleModel.create({ ...input, dependencies: input.dependencies ?? [] });
  }

  /** Aggiorna un modulo; la chiave non si cambia mai. Restituisce prima e dopo per l'audit */
  async update(key: string, input: CatalogInput): Promise<{ before: any; after: any }> {
    const record = await this.moduleModel.findOne({ where: { key } });
    if (!record) throw new ModuleError(404, `Modulo '${key}' non trovato`);

    if (input.dependencies) await this.checkDependencies(key, input.dependencies);

    // clone: senza, get({ plain: true }) restituisce dataValues stesso, che update() modifica
    const before = record.get({ plain: true, clone: true });
    const { key: _ignored, ...changes } = input;
    await record.update(changes);
    return { before, after: record };
  }

  /** Elimina solo un modulo mai attivato; altrimenti va dismesso */
  async remove(key: string): Promise<any> {
    const record = await this.get(key);
    const count = Number(record.get('activationCount') ?? 0);
    if (count > 0) {
      throw new ModuleError(
        409,
        `Il modulo '${key}' ha già ${count === 1 ? 'un\'attivazione' : `${count} attivazioni`}: non si elimina, impostalo come dismesso`
      );
    }
    const dependents = (await this.moduleModel.findAll({ attributes: ['key', 'dependencies'] })).filter((m: any) =>
      (m.dependencies ?? []).includes(key)
    );
    if (dependents.length > 0) {
      throw new ModuleError(
        409,
        `Il modulo '${key}' è richiesto da: ${dependents.map((m: any) => m.key).join(', ')}`
      );
    }
    // clone: senza, get({ plain: true }) restituisce dataValues stesso, che update() modifica
    const before = record.get({ plain: true, clone: true });
    await record.destroy();
    return before;
  }

  // ---------------------------------------------------------------------------
  // Regole sulle dipendenze
  // ---------------------------------------------------------------------------

  private async checkDependencies(key: string, dependencies: string[]): Promise<void> {
    if (dependencies.includes(key)) {
      throw new ModuleError(400, 'Un modulo non può dipendere da se stesso');
    }

    const all = await this.moduleModel.findAll({ attributes: ['key', 'dependencies'] });
    const known = new Set<string>(all.map((m: any) => m.key));
    const missing = dependencies.filter(d => !known.has(d));
    if (missing.length > 0) {
      throw new ModuleError(400, `Dipendenze inesistenti nel catalogo: ${missing.join(', ')}`);
    }

    // Grafo con la modifica gia' applicata, poi ricerca di un ciclo
    const graph = new Map<string, readonly string[]>(all.map((m: any) => [m.key, m.dependencies ?? []]));
    graph.set(key, dependencies);
    const cycle = findDependencyCycle(graph, key);
    if (cycle) {
      throw new ModuleError(400, `Dipendenza circolare: ${cycle.join(' → ')}`);
    }
  }
}

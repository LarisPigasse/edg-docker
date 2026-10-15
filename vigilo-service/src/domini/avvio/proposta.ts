// =============================================================================
// Procedura di avvio — la proposta dei modelli scelti (passo 2 di 3.5)
// =============================================================================
// Legge solo dalle tabelle (la libreria madre arriva dai file con la
// sincronizzazione): le voci dei modelli, una volta sola anche se stanno in
// piu' modelli, preselezionate se lo sono in almeno uno, con cio' che il
// cliente ha gia' (riconosciuto dalla chiave di libreria).
// =============================================================================
import { Op, type Transaction } from 'sequelize';
import type { Contesto } from '../../core/contesto';
import { ValidationError } from '../../core/utils/errors';
import { Categoria, Controllo, LibreriaCategoria, LibreriaControllo, ModelloSettore, ModelloVoce } from '../modelli';

export interface Voce<L> {
  lib: L;
  preselezionata: boolean;
  /** Chiavi dei modelli scelti che la propongono */
  modelli: string[];
}

export interface Proposta {
  modelli: ModelloSettore[];
  categorie: Voce<LibreriaCategoria>[];
  controlli: Voce<LibreriaControllo>[];
  /** Tutte le categorie di libreria che il cliente ha gia', per chiave */
  categorieDelTenant: Map<string, Categoria>;
  /** I controlli proposti che il cliente ha gia', per chiave */
  controlliDelTenant: Map<string, Controllo>;
}

/** I modelli richiesti, nell'ordine della libreria; 400 se uno non esiste */
async function modelliDa(chiavi: string[], transaction?: Transaction): Promise<ModelloSettore[]> {
  if (!chiavi.length) return [];
  const modelli = await ModelloSettore.findAll({ where: { chiave: chiavi }, order: [['ordine', 'ASC']], transaction });
  const sconosciuti = chiavi.filter(k => !modelli.some(m => m.chiave === k));
  if (sconosciuti.length) throw new ValidationError(`Modelli di settore sconosciuti: ${sconosciuti.join(', ')}`);
  return modelli;
}

/** Le voci dei modelli raccolte per chiave */
function raccogli(voci: ModelloVoce[], tipo: 'categoria' | 'controllo') {
  const perChiave = new Map<string, { preselezionata: boolean; modelli: string[] }>();
  for (const v of voci.filter(v => v.tipoVoce === tipo)) {
    const r = perChiave.get(v.chiaveVoce) ?? { preselezionata: false, modelli: [] };
    r.preselezionata ||= v.preselezionata;
    r.modelli.push(v.chiaveModello);
    perChiave.set(v.chiaveVoce, r);
  }
  return perChiave;
}

function unisci<L extends { chiave: string }>(righe: L[], perChiave: ReturnType<typeof raccogli>): Voce<L>[] {
  return righe.map(lib => ({ lib, ...perChiave.get(lib.chiave)! }));
}

// Query in sequenza: possono girare dentro la transazione dell'avvio (L052)
export async function costruisciProposta(ctx: Contesto, chiaviModelli: string[], transaction?: Transaction): Promise<Proposta> {
  const modelli = await modelliDa(chiaviModelli, transaction);
  const voci = modelli.length
    ? await ModelloVoce.findAll({ where: { chiaveModello: modelli.map(m => m.chiave) }, transaction })
    : [];
  const cat = raccogli(voci, 'categoria');
  const ctrl = raccogli(voci, 'controllo');

  const libCategorie = cat.size
    ? await LibreriaCategoria.findAll({ where: { chiave: [...cat.keys()], ritirata: false }, order: [['ordine', 'ASC']], transaction })
    : [];
  const libControlli = ctrl.size
    ? await LibreriaControllo.findAll({ where: { chiave: [...ctrl.keys()], ritirato: false }, order: [['ordine', 'ASC']], transaction })
    : [];
  const categorieDelTenant = await Categoria.findAll({
    where: { idTenant: ctx.idTenant, chiaveLibreria: { [Op.ne]: null } },
    transaction,
  });
  const controlliDelTenant = libControlli.length
    ? await Controllo.findAll({
        where: { idTenant: ctx.idTenant, chiaveLibreria: libControlli.map(c => c.chiave) },
        attributes: ['idControllo', 'uuidControllo', 'chiaveLibreria', 'nome'],
        transaction,
      })
    : [];

  return {
    modelli,
    categorie: unisci(libCategorie, cat),
    controlli: unisci(libControlli, ctrl),
    categorieDelTenant: new Map(categorieDelTenant.map(c => [c.chiaveLibreria!, c])),
    controlliDelTenant: new Map(controlliDelTenant.map(c => [c.chiaveLibreria!, c])),
  };
}

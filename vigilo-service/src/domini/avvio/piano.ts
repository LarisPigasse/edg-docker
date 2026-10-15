// =============================================================================
// Procedura di avvio — il piano (03-libreria-avvio 3.5), senza database
// =============================================================================
// Dalle voci proposte dai modelli scelti, da quelle che il cliente ha gia' e
// dalle sue scelte decide che cosa copiare e che cosa scrivere nel registro:
//   proposta, non presente, scelta     -> si copia, decisione "incluso"
//   proposta, non presente, non scelta -> decisione "escluso"
//   proposta, gia' presente            -> niente (si copia una volta sola)
// Errori: voci scelte che i modelli non propongono; controlli le cui
// categorie non ci saranno (ne' scelte ne' gia' presenti).
// =============================================================================

export interface CategoriaProposta {
  chiave: string;
}

export interface ControlloProposto {
  chiave: string;
  /** Chiavi delle categorie di libreria; vuoto = tutti i soggetti del tipo */
  categorie: readonly string[];
}

export interface IngressoPiano {
  categorie: readonly CategoriaProposta[];
  controlli: readonly ControlloProposto[];
  /** Chiavi di libreria delle categorie che il cliente ha gia' (tutte, non solo le proposte) */
  categorieDelTenant: ReadonlySet<string>;
  controlliDelTenant: ReadonlySet<string>;
  scelte: { categorie: readonly string[]; controlli: readonly string[] };
}

export interface ControlloDaCreare {
  chiave: string;
  /** Le sue categorie che esisteranno dopo l'avvio (create ora o gia' presenti) */
  categorie: string[];
}

export interface PianoAvvio {
  categorie: { crea: string[]; escluse: string[]; giaPresenti: string[] };
  controlli: { crea: ControlloDaCreare[]; esclusi: string[]; giaPresenti: string[] };
  errori: { nonProposte: string[]; senzaCategoria: string[] };
}

export function pianoAvvio(i: IngressoPiano): PianoAvvio {
  const sceltiCat = new Set(i.scelte.categorie);
  const sceltiCtrl = new Set(i.scelte.controlli);
  const propCat = new Set(i.categorie.map(c => c.chiave));
  const propCtrl = new Set(i.controlli.map(c => c.chiave));

  const piano: PianoAvvio = {
    categorie: { crea: [], escluse: [], giaPresenti: [] },
    controlli: { crea: [], esclusi: [], giaPresenti: [] },
    errori: {
      nonProposte: [...i.scelte.categorie.filter(k => !propCat.has(k)), ...i.scelte.controlli.filter(k => !propCtrl.has(k))],
      senzaCategoria: [],
    },
  };

  for (const { chiave } of i.categorie) {
    if (i.categorieDelTenant.has(chiave)) piano.categorie.giaPresenti.push(chiave);
    else if (sceltiCat.has(chiave)) piano.categorie.crea.push(chiave);
    else piano.categorie.escluse.push(chiave);
  }

  const disponibili = new Set([...i.categorieDelTenant, ...piano.categorie.crea]);
  for (const c of i.controlli) {
    if (i.controlliDelTenant.has(c.chiave)) piano.controlli.giaPresenti.push(c.chiave);
    else if (!sceltiCtrl.has(c.chiave)) piano.controlli.esclusi.push(c.chiave);
    else {
      const categorie = c.categorie.filter(k => disponibili.has(k));
      if (c.categorie.length && !categorie.length) piano.errori.senzaCategoria.push(c.chiave);
      else piano.controlli.crea.push({ chiave: c.chiave, categorie });
    }
  }
  return piano;
}

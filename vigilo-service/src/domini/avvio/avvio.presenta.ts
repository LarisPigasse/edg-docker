// =============================================================================
// Procedura di avvio — come escono dalle API
// =============================================================================
// La proposta e' raggruppata per tipo di soggetto (nell'ordine di
// TIPI_SOGGETTO) come la mostra il passo 2; ogni controllo porta le sue frasi
// pronte e ogni voce dice se il cliente la ha gia' (uuid della sua copia).
// =============================================================================
import { frasiControllo } from '../controlli/controllo.presenta';
import type { LibreriaCategoria, LibreriaControllo, ModelloSettore } from '../modelli';
import { TIPI_SOGGETTO, type TipoSoggetto } from '../valori';
import type { Proposta, Voce } from './proposta';

const presentaModello = (m: ModelloSettore) => ({
  chiave: m.chiave,
  nome: m.nome,
  descrizione: m.descrizione ?? null,
  icona: m.icona ?? null,
  versione: m.versione,
});

function presentaCategoria(v: Voce<LibreriaCategoria>, p: Proposta) {
  const c = v.lib;
  return {
    chiave: c.chiave,
    nome: c.nome,
    descrizione: c.descrizione ?? null,
    icona: c.icona ?? null,
    contatori: c.contatori,
    preselezionata: v.preselezionata,
    modelli: v.modelli,
    presente: p.categorieDelTenant.get(c.chiave)?.uuidCategoria ?? null,
  };
}

function presentaControllo(v: Voce<LibreriaControllo>, p: Proposta) {
  const c = v.lib;
  return {
    chiave: c.chiave,
    codice: c.codice ?? null,
    nome: c.nome,
    descrizione: c.descrizione ?? null,
    natura: c.natura,
    automatico: c.automatico,
    rinnovo: c.rinnovo,
    riferimentoNormativo: c.riferimentoNormativo ?? null,
    /** Chiavi delle categorie della libreria; vuoto = tutti i soggetti del tipo */
    categorie: c.categorie,
    frasi: frasiControllo(c),
    preselezionata: v.preselezionata,
    modelli: v.modelli,
    presente: p.controlliDelTenant.get(c.chiave)?.uuidControllo ?? null,
  };
}

const conta = <T>(voci: T[], f: (v: T) => boolean) => voci.filter(f).length;

export function presentaProposta(p: Proposta) {
  const perTipo = (tipo: TipoSoggetto) => ({
    tipo,
    categorie: p.categorie.filter(v => v.lib.tipoSoggetto === tipo).map(v => presentaCategoria(v, p)),
    controlli: p.controlli.filter(v => v.lib.tipoSoggetto === tipo).map(v => presentaControllo(v, p)),
  });
  return {
    modelli: p.modelli.map(presentaModello),
    tipi: TIPI_SOGGETTO.map(perTipo).filter(t => t.categorie.length || t.controlli.length),
    /** Chiavi di tutte le categorie di libreria che il cliente ha gia' (anche fuori dalla proposta):
     *  un controllo resta includibile se ne ha almeno una */
    categorieDelCliente: [...p.categorieDelTenant.keys()],
    riepilogo: {
      categorie: p.categorie.length,
      controlli: p.controlli.length,
      preselezionate: {
        categorie: conta(p.categorie, v => v.preselezionata && !p.categorieDelTenant.has(v.lib.chiave)),
        controlli: conta(p.controlli, v => v.preselezionata && !p.controlliDelTenant.has(v.lib.chiave)),
      },
      giaPresenti: {
        categorie: conta(p.categorie, v => p.categorieDelTenant.has(v.lib.chiave)),
        controlli: conta(p.controlli, v => p.controlliDelTenant.has(v.lib.chiave)),
      },
    },
  };
}

export interface RiassuntoModello {
  modello: ModelloSettore;
  categorie: number;
  controlli: Partial<Record<TipoSoggetto, number>>;
  applicato: boolean;
}

/** Il riquadro di un modello nel passo 1 */
export const presentaRiquadro = (r: RiassuntoModello) => ({
  ...presentaModello(r.modello),
  ordine: r.modello.ordine,
  sempreProposto: r.modello.sempreProposto,
  /** Spuntato all'apertura: sempre proposto (poi anche il suggerito da EDG) */
  preselezionato: r.modello.sempreProposto,
  applicato: r.applicato,
  categorie: r.categorie,
  controlli: Object.values(r.controlli).reduce((a, n) => a + (n ?? 0), 0),
  controlliPerTipo: r.controlli,
});

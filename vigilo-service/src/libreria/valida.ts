// =============================================================================
// Libreria EDG — controlli di coerenza (funzione pura)
// =============================================================================
// Una libreria che non passa non si sincronizza: i clienti restano sulla
// versione precedente e l'errore va a log-service. Gli stessi controlli
// girano nei test, cosi' l'errore si vede prima del rilascio.
// =============================================================================
import { ANCORAGGI, UNITA_TEMPO, UNITA_USO, type Cadenza, type Durata } from '../regole';
import { DATE_SOGGETTO, NATURE, TIPI_SOGGETTO, type TipoSoggetto } from '../domini/valori';
import { CHIAVI_MODELLO, type Appartenenza, type Libreria, type VoceControllo } from './tipi';

const CHIAVE = /^[a-z]+\.[a-z0-9]+(-[a-z0-9]+)*$/;
const DESTINATARI = ['ufficio', 'referente', 'assegnatario', 'interessato', 'email'];

const interoPositivo = (n: unknown): boolean => Number.isInteger(n) && (n as number) > 0;
const durataValida = (d: Durata | null | undefined): boolean =>
  !!d && interoPositivo(d.valore) && (UNITA_TEMPO as readonly string[]).includes(d.unita);
const decrescenti = (xs: number[]): boolean => xs.every((x, i) => interoPositivo(x) && (i === 0 || x < xs[i - 1]));
const modelliDi = (a: Appartenenza): string[] => Object.keys(a);

export function validaLibreria(lib: Libreria): string[] {
  const errori: string[] = [];
  const errore = (dove: string, cosa: string) => errori.push(`${dove}: ${cosa}`);

  // --- chiavi uniche e ben formate ---------------------------------------------
  const uniche = (tipo: string, chiavi: string[]) => {
    const viste = new Set<string>();
    for (const k of chiavi) {
      if (viste.has(k)) errore(`${tipo} ${k}`, 'chiave ripetuta');
      viste.add(k);
    }
  };
  uniche('modello', lib.modelli.map(m => m.chiave));
  uniche('categoria', lib.categorie.map(c => c.chiave));
  uniche('controllo', lib.controlli.map(c => c.chiave));
  uniche('codice', lib.controlli.map(c => c.codice));

  for (const m of lib.modelli) {
    if (!CHIAVI_MODELLO.includes(m.chiave)) errore(`modello ${m.chiave}`, 'chiave sconosciuta');
    if (!interoPositivo(m.versione)) errore(`modello ${m.chiave}`, 'versione non valida');
  }

  // --- categorie -----------------------------------------------------------------
  const categorie = new Map(lib.categorie.map(c => [c.chiave, c]));
  for (const c of lib.categorie) {
    const dove = `categoria ${c.chiave}`;
    if (!CHIAVE.test(c.chiave) || !c.chiave.startsWith(`${c.tipoSoggetto}.`)) errore(dove, 'chiave non nella forma <tipo>.<nome>');
    if (!TIPI_SOGGETTO.includes(c.tipoSoggetto)) errore(dove, 'tipo di soggetto sconosciuto');
    if (!interoPositivo(c.versione)) errore(dove, 'versione non valida');
    if (c.versione > 1 && !c.novita?.trim()) errore(dove, 'dalla versione 2 serve la novità da mostrare al cliente');
    if (!modelliDi(c.modelli).length) errore(dove, 'non appartiene a nessun modello');
    for (const u of c.contatori ?? []) if (!(UNITA_USO as readonly string[]).includes(u)) errore(dove, `contatore ${u} sconosciuto`);
    uniche(`${dove} campo`, (c.campi ?? []).map(f => f.chiave));
  }

  // --- controlli -----------------------------------------------------------------
  for (const c of lib.controlli) {
    const dove = `controllo ${c.codice} ${c.chiave}`;
    if (!CHIAVE.test(c.chiave) || !c.chiave.startsWith(`${c.tipoSoggetto}.`)) errore(dove, 'chiave non nella forma <tipo>.<nome>');
    if (!TIPI_SOGGETTO.includes(c.tipoSoggetto)) errore(dove, 'tipo di soggetto sconosciuto');
    if (!NATURE.includes(c.natura)) errore(dove, `natura ${c.natura} sconosciuta`);
    if (!interoPositivo(c.versione)) errore(dove, 'versione non valida');
    if (c.versione > 1 && !c.novita?.trim()) errore(dove, 'dalla versione 2 serve la novità da mostrare al cliente');
    if (!modelliDi(c.modelli).length) errore(dove, 'non appartiene a nessun modello');

    const proprie = c.categorie.map(k => categorie.get(k));
    c.categorie.forEach((k, i) => {
      const cat = proprie[i];
      if (!cat) errore(dove, `categoria ${k} inesistente`);
      else if (cat.tipoSoggetto !== c.tipoSoggetto) errore(dove, `categoria ${k} di un altro tipo`);
    });
    // In ogni modello del controllo deve esserci almeno una sua categoria
    if (c.categorie.length) {
      for (const m of modelliDi(c.modelli)) {
        if (!proprie.some(cat => cat && m in cat.modelli)) errore(dove, `nel modello ${m} nessuna delle sue categorie`);
      }
    }

    controllaCadenza(c, c.tipoSoggetto, proprie, errore.bind(null, dove));

    if (!decrescenti(c.preavvisi.giorni)) errore(dove, 'preavvisi in giorni non decrescenti o non interi positivi');
    if (c.preavvisi.uso.length && !c.cadenza.uso) errore(dove, 'preavvisi a uso senza cadenza a uso');
    if (c.preavvisi.uso.length && !decrescenti(c.preavvisi.uso)) errore(dove, 'preavvisi a uso non decrescenti');
    if (!Number.isInteger(c.tolleranza.giorni) || c.tolleranza.giorni < 0) errore(dove, 'tolleranza in giorni non valida');
    if (c.tolleranza.uso && !c.cadenza.uso) errore(dove, 'tolleranza a uso senza cadenza a uso');

    if (!c.destinatari.length) errore(dove, 'nessun destinatario');
    for (const d of c.destinatari) {
      if (!DESTINATARI.includes(d.tipo)) errore(dove, `destinatario ${d.tipo} sconosciuto`);
      if (d.tipo === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) errore(dove, 'email del destinatario non valida');
    }
    if (c.rinnovo === 'tacito' && c.cadenza.ancoraggio !== 'scadenza') errore(dove, 'il rinnovo tacito vuole la cadenza dalla scadenza');
  }

  return errori;
}

function controllaCadenza(
  c: VoceControllo,
  tipo: TipoSoggetto,
  categorie: (Libreria['categorie'][number] | undefined)[],
  errore: (cosa: string) => void
): void {
  const k: Cadenza = c.cadenza;
  const date = DATE_SOGGETTO[tipo].map(d => d.chiave);
  if (k.tempo && !durataValida(k.tempo)) errore('durata della cadenza non valida');
  if (!(ANCORAGGI as readonly string[]).includes(k.ancoraggio)) errore(`ancoraggio ${k.ancoraggio} sconosciuto`);
  if (k.ancoraggio === 'finestra' && !durataValida(k.finestra)) errore('ancoraggio a finestra senza finestra valida');
  if (k.ancoraggio !== 'finestra' && k.finestra) errore('finestra senza ancoraggio a finestra');
  if (k.prima) {
    if (!durataValida(k.prima.tempo)) errore('prima scadenza con durata non valida');
    if (!date.includes(k.prima.da)) errore(`prima scadenza da "${k.prima.da}": non è una data di ${tipo}`);
  }
  if (k.fasce) {
    if (!k.tempo) errore('fasce senza cadenza a tempo');
    if (!date.includes(k.fasce.da)) errore(`fasce da "${k.fasce.da}": non è una data di ${tipo}`);
    if (!k.fasce.elenco.length) errore('fasce vuote');
    for (const f of k.fasce.elenco) if (!durataValida(f.oltre) || !durataValida(f.tempo)) errore('fascia non valida');
  }
  if (k.uso) {
    if (!interoPositivo(k.uso.valore) || !(UNITA_USO as readonly string[]).includes(k.uso.unita)) errore('cadenza a uso non valida');
    if (!categorie.length) errore('cadenza a uso senza categorie (servono i contatori)');
    for (const cat of categorie) {
      if (cat && !(cat.contatori ?? []).includes(k.uso.unita)) errore(`la categoria ${cat.chiave} non ha il contatore ${k.uso.unita}`);
    }
  }
}

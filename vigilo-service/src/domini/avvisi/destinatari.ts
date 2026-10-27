// =============================================================================
// A chi va un avviso (04-avvisi 4.3, ADR090) — regole pure
// =============================================================================
//   ufficio       account del tenant con vigilo.write o vigilo.read
//                 (vigilo.config comprende la lettura)
//   referente     la persona referente del soggetto
//   assegnatario  le persone che hanno il soggetto assegnato adesso
//   interessato   la persona stessa (scadenze di un soggetto persona)
//   email         indirizzi aggiuntivi del controllo
// Una persona riceve sul suo account se è collegata, altrimenti alla sua
// email (persone senza account, decisione 4 di 04-avvisi). Soggetto fermo:
// solo l'ufficio, salvo i controlli "avvisa anche se fermo".
// I filtri delle preferenze (B8d-1) tolgono solo chi riceve come ufficio:
// chi è anche referente, assegnatario o interessato riceve comunque.
// Limiti, errori e anteprima con i nomi per l'editor dei destinatari (B8d-3).
// =============================================================================
import type { Destinatario } from '../../regole';

export interface PersonaAvvisabile {
  idAccount: number | null;
  email: string | null;
}

export interface ContestoDestinatari {
  /** Destinatari effettivi della scadenza (controllo + ridefinizioni) */
  destinatari: Destinatario[];
  soggettoFermo: boolean;
  avvisaAncheSeFermo: boolean;
  /** Account dell'ufficio (già filtrati per permesso) */
  ufficio: number[];
  referente: PersonaAvvisabile | null;
  assegnatari: PersonaAvvisabile[];
  /** La persona stessa, se il soggetto è una persona */
  interessato: PersonaAvvisabile | null;
  /** Facoltativo: l'account dell'ufficio vuole questo avviso? (filtri delle preferenze) */
  filtroUfficio?: (idAccount: number) => boolean;
}

export interface Recapiti {
  /** Account che ricevono in app (e per email secondo le preferenze, B8c) */
  account: number[];
  /** Indirizzi senza account: solo email */
  email: string[];
}

const pulita = (e: string | null | undefined): string | null => {
  const v = e?.trim().toLowerCase();
  return v ? v : null;
};

export function risolviDestinatari(c: ContestoDestinatari): Recapiti {
  const account = new Set<number>();
  const email = new Set<string>();
  const persona = (p: PersonaAvvisabile | null) => {
    if (!p) return;
    if (p.idAccount) account.add(p.idAccount);
    else {
      const e = pulita(p.email);
      if (e) email.add(e);
    }
  };

  const soloUfficio = c.soggettoFermo && !c.avvisaAncheSeFermo;
  for (const d of c.destinatari) {
    if (d.tipo === 'ufficio') for (const id of c.ufficio) if (!c.filtroUfficio || c.filtroUfficio(id)) account.add(id);
    if (soloUfficio) continue;
    if (d.tipo === 'referente') persona(c.referente);
    if (d.tipo === 'assegnatario') c.assegnatari.forEach(persona);
    if (d.tipo === 'interessato') persona(c.interessato);
    if (d.tipo === 'email') {
      const e = pulita(d.email);
      if (e) email.add(e);
    }
  }
  return { account: [...account].sort((a, b) => a - b), email: [...email].sort() };
}

/** L'ufficio: chi può leggere o scrivere i dati di Vigilo del tenant */
export function ufficioDa(account: { id: number; capacita: { read: boolean; write: boolean } }[]): number[] {
  return account.filter(a => a.capacita.read || a.capacita.write).map(a => a.id);
}

// --- limiti ed errori dei destinatari di controlli e scadenze (B8d-3) ---

export const LIMITI_DESTINATARI = {
  /** Destinatari di un controllo o di una scadenza, al massimo */
  massimo: 16,
  /** Lunghezza massima di un indirizzo email */
  lunghezzaEmail: 256,
} as const;

const chiaveDi = (d: Destinatario): string => (d.tipo === 'email' ? `email:${pulita(d.email) ?? ''}` : d.tipo);

/** Gli errori di un elenco di destinatari (vuoto = valido), con parole per l'utente */
export function erroriDestinatari(lista: Destinatario[]): string[] {
  const errori: string[] = [];
  if (!lista.length) errori.push('Serve almeno un destinatario');
  if (lista.length > LIMITI_DESTINATARI.massimo) errori.push(`Al massimo ${LIMITI_DESTINATARI.massimo} destinatari`);
  const chiavi = lista.map(chiaveDi);
  if (new Set(chiavi).size !== chiavi.length) errori.push('Lo stesso destinatario compare due volte');
  if (lista.some(d => d.tipo === 'email' && d.email.length > LIMITI_DESTINATARI.lunghezzaEmail))
    errori.push(`Un indirizzo email può avere al massimo ${LIMITI_DESTINATARI.lunghezzaEmail} caratteri`);
  return errori;
}

// --- anteprima: chi riceve, con i nomi (B8d-3) ---

export interface PersonaNominata extends PersonaAvvisabile {
  nome: string;
}

export type RuoloPersona = 'referente' | 'assegnatario' | 'interessato';

/** Come arriva l'avviso: sul suo account (in app, ed email secondo le preferenze), per email, o per niente */
export type Recapito = 'app' | 'email' | 'nessuno';

export interface VoceAnteprima {
  ruolo: RuoloPersona | 'email';
  /** Il nome della persona; null se il ruolo è vuoto (es. nessun referente) o per un indirizzo */
  nome: string | null;
  email: string | null;
  recapito: Recapito;
}

export interface Anteprima {
  /** L'ufficio è fra i destinatari */
  ufficio: boolean;
  /** Soggetto fermo senza "avvisa anche se fermo": arriva solo all'ufficio */
  soloUfficio: boolean;
  voci: VoceAnteprima[];
}

export interface ContestoAnteprima {
  destinatari: Destinatario[];
  soggettoFermo: boolean;
  avvisaAncheSeFermo: boolean;
  referente: PersonaNominata | null;
  assegnatari: PersonaNominata[];
  /** La persona stessa, se il soggetto è una persona */
  interessato: PersonaNominata | null;
  /** Il soggetto è una persona (altrimenti "interessato" non vale) */
  soggettoPersona: boolean;
}

const recapitoDi = (p: PersonaAvvisabile): Recapito => (p.idAccount ? 'app' : pulita(p.email) ? 'email' : 'nessuno');
const voceDi = (ruolo: RuoloPersona, p: PersonaNominata | null): VoceAnteprima =>
  p ? { ruolo, nome: p.nome, email: p.idAccount ? null : pulita(p.email), recapito: recapitoDi(p) } : { ruolo, nome: null, email: null, recapito: 'nessuno' };

/** Chi riceve gli avvisi di una scadenza, con le stesse regole di risolviDestinatari */
export function anteprimaDestinatari(c: ContestoAnteprima): Anteprima {
  const soloUfficio = c.soggettoFermo && !c.avvisaAncheSeFermo;
  const voci: VoceAnteprima[] = [];
  if (!soloUfficio)
    for (const d of c.destinatari) {
      if (d.tipo === 'referente') voci.push(voceDi('referente', c.referente));
      if (d.tipo === 'assegnatario') voci.push(...(c.assegnatari.length ? c.assegnatari.map(p => voceDi('assegnatario', p)) : [voceDi('assegnatario', null)]));
      if (d.tipo === 'interessato' && c.soggettoPersona) voci.push(voceDi('interessato', c.interessato));
      if (d.tipo === 'email') voci.push({ ruolo: 'email', nome: null, email: pulita(d.email), recapito: 'email' });
    }
  return { ufficio: c.destinatari.some(d => d.tipo === 'ufficio'), soloUfficio, voci };
}

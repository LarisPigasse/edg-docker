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
    if (d.tipo === 'ufficio') c.ufficio.forEach(id => account.add(id));
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

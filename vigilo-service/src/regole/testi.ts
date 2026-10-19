// =============================================================================
// Testi leggibili (01-dominio 1.0: stati in parole e con le date)
// =============================================================================
// Una sola fonte per come si scrivono stati, cadenze, preavvisi e
// tolleranze: cruscotto, scheda, avvisi ed email dicono le stesse parole.
// =============================================================================
import { parti, type Giorno } from './date';
import type { Situazione } from './stato';
import type { Cadenza, Durata, Fascia, Preavvisi, Tolleranza, UnitaUso } from './tipi';

const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const MESI_LUNGHI = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
];

/** "30 set", con l'anno solo se diverso da quello di oggi ("12 mar 2027") */
export function dataBreve(g: Giorno, oggi: Giorno): string {
  const [a, m, d] = parti(g);
  const base = `${d} ${MESI[m - 1]}`;
  return a === parti(oggi)[0] ? base : `${base} ${a}`;
}

/**
 * La data con l'articolo giusto: "il 23 set", "l'8 ott", "l'11 ott",
 * "il 1° ott"; con `a` la preposizione articolata ("al 23", "all'8", "al 1°").
 */
export function conArticolo(g: Giorno, oggi: Giorno, a = false): string {
  const d = parti(g)[2];
  const breve = dataBreve(g, oggi);
  if (d === 1) return `${a ? 'al' : 'il'} 1°${breve.slice(1)}`;
  if (d === 8 || d === 11) return `${a ? "all'" : "l'"}${breve}`;
  return `${a ? 'al' : 'il'} ${breve}`;
}

/** "30 settembre 2027" */
export function dataLunga(g: Giorno): string {
  const [a, m, d] = parti(g);
  return `${d} ${MESI_LUNGHI[m - 1]} ${a}`;
}

/** 16000 -> "16.000" (sempre col punto delle migliaia) */
export function numero(n: number): string {
  const segno = n < 0 ? '-' : '';
  const intero = Math.round(Math.abs(n)).toString();
  return segno + intero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const conUnita = (n: number, u: UnitaUso) => `${numero(n)} ${u}`;

const giorniTesto = (n: number) => (n === 1 ? '1 giorno' : `${n} giorni`);

// -----------------------------------------------------------------------------
// Stato
// -----------------------------------------------------------------------------

/**
 * Il testo dello stato, come nel cruscotto:
 *   "tra 8 giorni · 30 ott", "scade oggi", "scaduta il 1 ott · rinnovabile fino al 16 ott",
 *   "scaduta da 8 giorni · 30 set", "mancano 640 km · stima 12 ott", "data da inserire",
 *   "lettura km da inserire" (soglia senza letture del contatore)
 */
export function testoStato(s: Situazione, scadeIl: Giorno | null, unita: UnitaUso | null, oggi: Giorno): string {
  if (s.stato === 'da-completare') return s.mancaLettura && unita ? `lettura ${unita} da inserire` : 'data da inserire';

  if (s.per === 'uso' && s.mancaUso !== null && unita) {
    const stima = s.stimataIl && s.mancaUso > 0 ? ` · stima ${dataBreve(s.stimataIl, oggi)}` : '';
    switch (s.stato) {
      case 'scaduta':
        return `superata di ${conUnita(-s.mancaUso, unita)}`;
      case 'in-tolleranza':
        return `superata di ${conUnita(-s.mancaUso, unita)} · tolleranza fino a ${conUnita(s.limiteUso!, unita)}`;
      case 'in-scadenza':
        return `mancano ${conUnita(s.mancaUso, unita)}${stima}`;
      default:
        return `in regola · mancano ${conUnita(s.mancaUso, unita)}`;
    }
  }

  if (!scadeIl || s.giorniAllaScadenza === null) return 'data da inserire';
  const d = s.giorniAllaScadenza;
  const quando = dataBreve(scadeIl, oggi);
  switch (s.stato) {
    case 'scaduta':
      return d === -1 ? `scaduta ieri · ${quando}` : `scaduta da ${giorniTesto(-d)} · ${quando}`;
    case 'in-tolleranza':
      return s.limiteIl === oggi
        ? `scaduta ${conArticolo(scadeIl, oggi)} · oggi l'ultimo giorno per rinnovare`
        : `scaduta ${conArticolo(scadeIl, oggi)} · rinnovabile fino ${conArticolo(s.limiteIl!, oggi, true)}`;
    case 'in-scadenza':
      if (d === 0) return 'scade oggi';
      if (d === 1) return `scade domani · ${quando}`;
      return `tra ${giorniTesto(d)} · ${quando}`;
    default:
      return `in regola · ${quando}`;
  }
}

// -----------------------------------------------------------------------------
// Impostazioni
// -----------------------------------------------------------------------------

const SINGOLARE: Record<Durata['unita'], string> = { giorni: 'giorno', mesi: 'mese', anni: 'anno' };

/** "un anno", "4 anni": dopo una preposizione ("prima dopo un anno") */
const UNO: Record<Durata['unita'], string> = { giorni: 'un giorno', mesi: 'un mese', anni: 'un anno' };
const unDurata = (d: Durata): string => (d.valore === 1 ? UNO[d.unita] : `${d.valore} ${d.unita}`);

/** "ogni 12 mesi", "ogni mese", "ogni anno" */
export function durata(d: Durata, prefisso = 'ogni'): string {
  return d.valore === 1 ? `${prefisso} ${SINGOLARE[d.unita]}` : `${prefisso} ${d.valore} ${d.unita}`;
}

/**
 * La cadenza in una frase:
 *   "ogni 12 mesi o 16.000 km, quello che arriva prima, dalla data di esecuzione"
 *   "prima dopo 4 anni dall'immatricolazione, poi ogni 24 mesi dalla scadenza precedente, a fine mese"
 *   "ogni 10 anni (eta' da 50 anni: ogni 5 anni) dalla scadenza precedente"
 *   "ogni 5 anni dalla scadenza precedente se fatto entro 12 mesi prima, altrimenti dalla data di esecuzione"
 * @param etichette i campi data del soggetto con la preposizione
 *                  (es. { immatricolazione: "dall'immatricolazione" }); senza: "da <chiave>"
 */
export function descriviCadenza(c: Cadenza, etichette: Record<string, string> = {}): string {
  if (!c.tempo && !c.uso) return 'una tantum';
  const pezzi: string[] = [];
  const da = (chiave: string) => etichette[chiave] ?? `da ${chiave}`;
  if (c.prima) {
    pezzi.push(`prima dopo ${unDurata(c.prima.tempo)} ${da(c.prima.da)}, poi`);
  }
  const tempo = c.tempo ? durata(c.tempo) + fasceTesto(c, da) : '';
  if (c.tempo && c.uso) {
    pezzi.push(`${tempo} o ${conUnita(c.uso.valore, c.uso.unita)}, quello che arriva prima,`);
  } else if (c.tempo) {
    pezzi.push(tempo);
  } else if (c.uso) {
    pezzi.push(`ogni ${conUnita(c.uso.valore, c.uso.unita)}`);
  }
  if (c.tempo) {
    pezzi.push(ancoraggioTesto(c));
  } else {
    pezzi.push("dall'ultima lettura registrata");
  }
  let frase = pezzi.join(' ');
  if (c.tempo && c.fineMese) frase += ', a fine mese';
  return frase;
}

/** Solo per ordinare le fasce */
const inGiorni = (d: Durata): number => d.valore * { giorni: 1, mesi: 30, anni: 365 }[d.unita];

/** "1 mese", "12 mesi" */
const quanto = (d: Durata): string => (d.valore === 1 ? `1 ${SINGOLARE[d.unita]}` : `${d.valore} ${d.unita}`);

/** " (eta' da 50 anni: ogni 5 anni; eta' da 70 anni: ogni 3 anni)" */
function fasceTesto(c: Cadenza, da: (chiave: string) => string): string {
  const f = c.fasce;
  if (!f || !f.elenco.length) return '';
  const soglia = (x: Fascia) =>
    f.da === 'nascita' ? `età da ${quanto(x.oltre)}` : `da ${quanto(x.oltre)} ${da(f.da)}`;
  const ordinate = [...f.elenco].sort((x, y) => inGiorni(x.oltre) - inGiorni(y.oltre));
  return ` (${ordinate.map(x => `${soglia(x)}: ${durata(x.tempo)}`).join('; ')})`;
}

function ancoraggioTesto(c: Cadenza): string {
  if (c.ancoraggio === 'scadenza') return 'dalla scadenza precedente';
  if (c.ancoraggio === 'finestra' && c.finestra) {
    return `dalla scadenza precedente se fatto entro ${quanto(c.finestra)} prima, altrimenti dalla data di esecuzione`;
  }
  return 'dalla data di esecuzione';
}

const elenco = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);

/** "avvisi a 32, 8 e 1 giorno e a 1.024 km": il nome si accorda con l'ultimo numero */
export function descriviPreavvisi(p: Preavvisi, unita: UnitaUso | null = null): string {
  const parti: string[] = [];
  const giorni = [...p.giorni].sort((a, b) => b - a);
  if (giorni.length) parti.push(`a ${elenco(giorni.map(String))} ${giorni[giorni.length - 1] === 1 ? 'giorno' : 'giorni'}`);
  const uso = [...p.uso].sort((a, b) => b - a);
  if (uso.length && unita) parti.push(`a ${elenco(uso.map(numero))} ${unita}`);
  return parti.length ? `avvisi ${parti.join(' e ')}` : 'nessun preavviso';
}

/** "tolleranza 15 giorni", "tolleranza 512 km", "nessuna tolleranza" */
export function descriviTolleranza(t: Tolleranza, unita: UnitaUso | null = null): string {
  const parti: string[] = [];
  if (t.giorni > 0) parti.push(giorniTesto(t.giorni));
  if (t.uso > 0 && unita) parti.push(conUnita(t.uso, unita));
  return parti.length ? `tolleranza ${parti.join(' o ')}` : 'nessuna tolleranza';
}

// =============================================================================
// Analisi — i segnali "Da valutare" (2026-11-23, fase D; regola pura)
// =============================================================================
// Dagli indicatori e dalle soglie del tenant, l'elenco di ciò che conviene
// guardare: che cosa si è visto, perché conta, che cosa fare. Nessuna formula
// nascosta: ogni segnale nasce da una soglia che il tenant può cambiare.
// In ordine di gravità (alta, media, bassa), poi come sono calcolati.
// =============================================================================
import type { RegoleAnalisi } from '../impostazioni/limiti';

export type Gravita = 'alta' | 'media' | 'bassa';

export interface Segnale {
  /** Unica nell'elenco (tipo + soggetto o voce) */
  chiave: string;
  tipo: 'consumoAlto' | 'consumoCrescita' | 'pocoUsato' | 'spessoFermo' | 'guastiAlti' | 'struttura' | 'stimeVerso' | 'serviziPerdita' | 'margineBasso';
  gravita: Gravita;
  titolo: string;
  dettaglio: string;
  azione: string;
  soggetto?: { uuid: string; nome: string };
}

/** Quanto serve degli indicatori */
export interface DatiSegnali {
  perVeicolo: { uuid: string; nome: string; categoria: string | null; consumo: number | null; sullaCategoria: number | null; kmMese: number | null; disponibilita: number | null; giorniFermo: number }[];
  tendenzaConsumo: number | null;
  quotaGuasti: number | null;
  struttura: { anno: number; precedente: number; voci: { voce: string; nome: string; prima: number; dopo: number; percentuale: number | null }[] } | null;
  stime: { conReale: number; verso: 'sotto' | 'sopra' | 'misto' | null; scostamentoMedio: number | null; conPrezzo: number; inPerdita: number };
  margine: { anno: number; percentuale: number | null } | null;
}

const ORDINE: Record<Gravita, number> = { alta: 0, media: 1, bassa: 2 };
const pct = (n: number) => `${n.toLocaleString('it-IT')}%`;
const n = (x: number) => x.toLocaleString('it-IT', { useGrouping: 'always' } as unknown as Intl.NumberFormatOptions);

/** I segnali da valutare, dal più grave (pura) */
export function segnali(d: DatiSegnali, s: RegoleAnalisi): Segnale[] {
  const r: Segnale[] = [];

  for (const v of d.perVeicolo) {
    if (v.disponibilita !== null && v.disponibilita < s.disponibilitaMinima)
      r.push({
        chiave: `spessoFermo-${v.uuid}`,
        tipo: 'spessoFermo',
        gravita: 'alta',
        titolo: `${v.nome}: disponibile il ${pct(v.disponibilita)} del tempo`,
        dettaglio: `${v.giorniFermo} giorni di fermo per guasti che bloccano l'uso negli ultimi 12 mesi (soglia ${pct(s.disponibilitaMinima)}).`,
        azione: 'Guarda i suoi guasti: se si ripetono, anticipa la manutenzione o valuta la sostituzione.',
        soggetto: { uuid: v.uuid, nome: v.nome },
      });
    if (v.sullaCategoria !== null && v.sullaCategoria > s.consumoAlto)
      r.push({
        chiave: `consumoAlto-${v.uuid}`,
        tipo: 'consumoAlto',
        gravita: v.sullaCategoria > 2 * s.consumoAlto ? 'alta' : 'media',
        titolo: `${v.nome}: consuma il ${pct(v.sullaCategoria)} più della sua categoria`,
        dettaglio: `${v.consumo?.toLocaleString('it-IT')} l/100 km contro la media di "${v.categoria}" (soglia +${pct(s.consumoAlto)}).`,
        azione: 'Controllo tecnico (gomme, iniettori, filtri) o stile di guida; se dura, valuta la sostituzione.',
        soggetto: { uuid: v.uuid, nome: v.nome },
      });
    if (v.kmMese !== null && v.kmMese < s.kmMeseMinimi)
      r.push({
        chiave: `pocoUsato-${v.uuid}`,
        tipo: 'pocoUsato',
        gravita: 'bassa',
        titolo: `${v.nome}: ${n(v.kmMese)} km al mese`,
        dettaglio: `Sotto i ${n(s.kmMeseMinimi)} km al mese negli ultimi 12 mesi: costa anche quando è fermo.`,
        azione: 'Valuta se serve ancora: dismissione, noleggio a terzi o un uso diverso.',
        soggetto: { uuid: v.uuid, nome: v.nome },
      });
  }

  if (d.tendenzaConsumo !== null && d.tendenzaConsumo > s.consumoCrescita)
    r.push({
      chiave: 'consumoCrescita',
      tipo: 'consumoCrescita',
      gravita: 'media',
      titolo: `Il consumo della flotta cresce del ${pct(d.tendenzaConsumo)}`,
      dettaglio: `Ultimi 3 mesi contro i 9 prima (soglia +${pct(s.consumoCrescita)}).`,
      azione: 'Guarda quali veicoli consumano di più e i rifornimenti degli ultimi mesi; può essere anche la stagione o percorsi diversi.',
    });

  if (d.quotaGuasti !== null && d.quotaGuasti > s.quotaGuastiMassima)
    r.push({
      chiave: 'guastiAlti',
      tipo: 'guastiAlti',
      gravita: 'media',
      titolo: `Le riparazioni sono il ${pct(d.quotaGuasti)} della spesa di manutenzione`,
      dettaglio: `Più di quanto si spende per la manutenzione programmata (soglia ${pct(s.quotaGuastiMassima)}).`,
      azione: 'Anticipa tagliandi e controlli: costano meno dei guasti e dei fermi.',
    });

  for (const v of d.struttura?.voci ?? [])
    // sia la percentuale sia l'importo: +25% su 8.000 € non è un problema
    if (v.percentuale !== null && v.percentuale > s.strutturaMassima && v.dopo - v.prima > s.strutturaMinimaEuro)
      r.push({
        chiave: `struttura-${v.voce}`,
        tipo: 'struttura',
        gravita: 'media',
        titolo: `${v.nome}: +${pct(v.percentuale)} sul ${d.struttura!.precedente}`,
        dettaglio: `Da ${n(Math.round(v.prima))} € a ${n(Math.round(v.dopo))} € nel ${d.struttura!.anno} (soglie +${pct(s.strutturaMassima)} e +${n(s.strutturaMinimaEuro)} €).`,
        azione: `Verifica che cosa fa crescere "${v.nome}" e se l'aumento è previsto.`,
      });

  if (d.stime.verso === 'sotto' || d.stime.verso === 'sopra')
    r.push({
      chiave: 'stimeVerso',
      tipo: 'stimeVerso',
      gravita: 'media',
      titolo: d.stime.verso === 'sotto' ? 'Le stime sono quasi sempre più basse del reale' : 'Le stime sono quasi sempre più alte del reale',
      dettaglio: `Su ${d.stime.conReale} stime con il costo reale, scostamento medio ${d.stime.scostamentoMedio === null ? '—' : pct(d.stime.scostamentoMedio)}.`,
      azione:
        d.stime.verso === 'sotto'
          ? 'Correggi i parametri della stima (costo orario, velocità media, ore di impiego) o ricorda gli extra: si rischia di offrire sotto costo.'
          : 'I parametri sono prudenti: si rischia di offrire prezzi troppo alti e perdere lavori.',
    });

  if (d.stime.inPerdita > 0)
    r.push({
      chiave: 'serviziPerdita',
      tipo: 'serviziPerdita',
      gravita: 'alta',
      titolo: `${d.stime.inPerdita} ${d.stime.inPerdita === 1 ? 'servizio venduto' : 'servizi venduti'} sotto il costo`,
      dettaglio: `Su ${d.stime.conPrezzo} stime con il prezzo applicato.`,
      azione: 'Rivedi i prezzi di quei servizi: il costo pieno per ora e per km è il minimo per non perdere.',
    });

  if (d.margine && d.margine.percentuale !== null && d.margine.percentuale < s.margineMinimo)
    r.push({
      chiave: 'margineBasso',
      tipo: 'margineBasso',
      gravita: 'alta',
      titolo: `Margine del ${d.margine.anno}: ${pct(d.margine.percentuale)} dei ricavi`,
      dettaglio: `Sotto il ${pct(s.margineMinimo)} (una stima: i conducenti come ore di servizio × costo orario).`,
      azione: 'Guarda dove pesano di più i costi (struttura, mezzi, conducenti) e i prezzi dei servizi.',
    });

  return r.map((x, i) => ({ x, i })).sort((a, b) => ORDINE[a.x.gravita] - ORDINE[b.x.gravita] || a.i - b.i).map(({ x }) => x);
}

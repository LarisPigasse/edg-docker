// =============================================================================
// Stima dei costi di un servizio — il calcolo (2026-11-17, fase 2; regole pure)
// =============================================================================
// Un'idea approssimata dei costi di un servizio, a km (un trasporto) o a ore
// (un lavoro con una macchina):
//   Mezzo              km totali × €/km (a km) o ore di lavoro × €/h (a ore)
//   Conducente         ore di servizio × costo orario + pernottamenti × diaria
//   Pedaggi            importo noto, oppure km in autostrada × €/km
//   Extra              voci a mano (traghetto, permessi, …)
//   Costi aziendali    ore di servizio × costo aziendale per ora
// A km: km totali = km × 2 se il ritorno è a vuoto; ore di guida = km totali
// ÷ velocità media; giorni = ore di guida ÷ ore di guida al giorno, in su;
// pernottamenti = giorni − 1. Ore di servizio = guida (o lavoro) + ore in più
// (carico, scarico, attese, trasferimenti). A ore i pernottamenti si scrivono.
// Un dato che manca (costo del mezzo, costo orario, costi aziendali) conta
// zero e diventa un avviso: la stima resta leggibile ma dichiara i suoi buchi.
// =============================================================================

export type TipoServizio = 'km' | 'ore';

export interface VoceExtra {
  descrizione: string;
  importo: number;
}

export interface ParametriCalcolo {
  velocitaMedia: number;
  oreGuidaGiorno: number;
  diaria: number | null;
  pedaggioKm: number | null;
  /** Costo aziendale per ora di servizio; null se non c'è un anno con le ore */
  costoAziendalePerOra: number | null;
}

export interface DatiCalcolo {
  tipo: TipoServizio;
  /** €/km (a km) o €/h (a ore) del mezzo; null = non noto */
  costoMezzo: number | null;
  /** A km: km dell'andata */
  km?: number;
  ritornoAVuoto?: boolean;
  /** A km: km in autostrada dell'andata, per stimare i pedaggi */
  kmAutostrada?: number | null;
  /** A ore: ore di lavoro della macchina */
  oreLavoro?: number;
  /** Carico, scarico, attese, trasferimenti */
  oreAggiuntive: number;
  /** €/h del conducente o dell'operatore; null = non noto */
  costoOrario: number | null;
  /** A ore: pernottamenti scritti a mano */
  pernottamenti?: number;
  /** Pedaggi noti; null = stimati dai km in autostrada */
  pedaggi: number | null;
  extra: VoceExtra[];
  parametri: ParametriCalcolo;
}

const alCentesimo = (n: number) => Math.round(n * 100) / 100;
const unDecimale = (n: number) => Math.round(n * 10) / 10;

/** Il calcolo della stima (pura) */
export function calcolaStima(d: DatiCalcolo) {
  const p = d.parametri;
  const avvisi: string[] = [];
  const aKm = d.tipo === 'km';
  const fattore = aKm && d.ritornoAVuoto ? 2 : 1;
  const kmTotali = aKm ? (d.km ?? 0) * fattore : null;
  const oreGuida = aKm ? unDecimale((kmTotali ?? 0) / p.velocitaMedia) : null;
  const giorni = aKm ? Math.max(1, Math.ceil((oreGuida ?? 0) / p.oreGuidaGiorno)) : Math.max(1, (d.pernottamenti ?? 0) + 1);
  const pernottamenti = giorni - 1;
  const oreServizio = unDecimale((aKm ? (oreGuida ?? 0) : (d.oreLavoro ?? 0)) + d.oreAggiuntive);

  // Mezzo
  const quantitaMezzo = aKm ? (kmTotali ?? 0) : (d.oreLavoro ?? 0);
  if (d.costoMezzo === null) avvisi.push(aKm ? 'Manca il costo per km del mezzo: conta zero' : 'Manca il costo orario del mezzo: conta zero');
  const mezzo = alCentesimo(quantitaMezzo * (d.costoMezzo ?? 0));

  // Conducente o operatore
  if (d.costoOrario === null) avvisi.push('Manca il costo orario del conducente: le ore contano zero');
  if (pernottamenti > 0 && p.diaria === null) avvisi.push('Manca la diaria nei parametri: i pernottamenti contano zero');
  const oreConducente = alCentesimo(oreServizio * (d.costoOrario ?? 0));
  const diarie = alCentesimo(pernottamenti * (p.diaria ?? 0));
  const conducente = alCentesimo(oreConducente + diarie);

  // Pedaggi: noti, oppure stimati dai km in autostrada
  let pedaggi = 0;
  let pedaggiStimati = false;
  if (d.pedaggi !== null) pedaggi = alCentesimo(d.pedaggi);
  else if (aKm && d.kmAutostrada) {
    if (p.pedaggioKm === null) avvisi.push('Manca il pedaggio per km nei parametri: i pedaggi contano zero');
    else {
      pedaggi = alCentesimo(d.kmAutostrada * fattore * p.pedaggioKm);
      pedaggiStimati = true;
    }
  }
  const extra = alCentesimo(d.extra.reduce((t, e) => t + e.importo, 0));

  // Costi aziendali
  if (p.costoAziendalePerOra === null) avvisi.push('Mancano i costi aziendali (un anno con le ore di servizio): contano zero');
  const aziendali = alCentesimo(oreServizio * (p.costoAziendalePerOra ?? 0));

  const totale = alCentesimo(mezzo + conducente + pedaggi + extra + aziendali);
  return {
    kmTotali,
    oreGuida,
    oreServizio,
    giorni,
    pernottamenti,
    voci: {
      mezzo: { quantita: quantitaMezzo, unitario: d.costoMezzo, totale: mezzo },
      conducente: { ore: oreServizio, costoOrario: d.costoOrario, oreTotale: oreConducente, pernottamenti, diaria: p.diaria, diarie, totale: conducente },
      pedaggi: { stimati: pedaggiStimati, totale: pedaggi },
      extra: { voci: d.extra, totale: extra },
      aziendali: { ore: oreServizio, perOra: p.costoAziendalePerOra, totale: aziendali },
    },
    totale,
    /** € per km del servizio (a km) */
    perKm: kmTotali ? alCentesimo(totale / kmTotali) : null,
    /** € per ora di servizio */
    perOra: oreServizio > 0 ? alCentesimo(totale / oreServizio) : null,
    avvisi,
  };
}

export type RisultatoStima = ReturnType<typeof calcolaStima>;

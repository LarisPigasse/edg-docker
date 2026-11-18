// =============================================================================
// Stima dei costi di un servizio — parametri (2026-11-17, fase 1; regole pure)
// =============================================================================
// I costi aziendali di un anno, inseriti a mano a consuntivo o a preventivo,
// per macro voce; con le ore di servizio annue danno il costo aziendale per
// ora di servizio, che la stima carica sulle ore di ogni servizio. Per la
// stima si usa l'anno in corso, o in mancanza il più recente prima di esso.
// I conducenti non stanno qui: si contano nel servizio, ora per ora.
// =============================================================================
import { LIMITI_STIMA, numeroValido } from '../impostazioni/limiti';

export const VOCI_COSTI = ['personale', 'struttura', 'servizi', 'consulenze', 'finanziari', 'altro'] as const;
export type VoceCosti = (typeof VOCI_COSTI)[number];
export type VociCosti = Partial<Record<VoceCosti, number>>;

export const NOMI_VOCI_COSTI: Record<VoceCosti, string> = {
  personale: 'Personale indiretto',
  struttura: 'Struttura',
  servizi: 'Servizi e consumi',
  consulenze: 'Consulenze e adempimenti',
  finanziari: 'Oneri finanziari',
  altro: 'Altro',
};

export const STATI_COSTI = ['consuntivo', 'preventivo'] as const;
export type StatoCosti = (typeof STATI_COSTI)[number];

const alCentesimo = (n: number) => Math.round(n * 100) / 100;

/** Il totale delle voci (le mancanti contano zero) (pura) */
export const totaleVoci = (voci: VociCosti | null | undefined): number => alCentesimo(VOCI_COSTI.reduce((t, v) => t + (voci?.[v] ?? 0), 0));

/** Il costo aziendale per ora di servizio; null senza ore (pura) */
export const costoPerOra = (totale: number, oreServizio: number | null | undefined): number | null =>
  oreServizio && oreServizio > 0 ? alCentesimo(totale / oreServizio) : null;

export interface DatiAnno {
  stato?: unknown;
  voci?: unknown;
  oreServizio?: unknown;
  note?: unknown;
}

/** Gli errori dei costi di un anno (vuoto = validi), con parole per l'utente (pura) */
export function erroriAnno(anno: number, d: DatiAnno): string[] {
  const errori: string[] = [];
  const l = LIMITI_STIMA;
  if (!Number.isInteger(anno) || anno < l.anno.min || anno > l.anno.max) errori.push(`L'anno va da ${l.anno.min} a ${l.anno.max}`);
  if (!STATI_COSTI.includes(d.stato as StatoCosti)) errori.push('Indica se i costi sono a consuntivo o a preventivo');
  if (d.voci !== undefined) {
    if (typeof d.voci !== 'object' || d.voci === null || Array.isArray(d.voci)) errori.push('Le voci dei costi non sono valide');
    else
      for (const [voce, valore] of Object.entries(d.voci)) {
        if (!VOCI_COSTI.includes(voce as VoceCosti)) errori.push(`Voce sconosciuta: ${voce}`);
        else if (valore !== null && !numeroValido(valore, l.costoAnnuo))
          errori.push(`${NOMI_VOCI_COSTI[voce as VoceCosti]} va da ${l.costoAnnuo.min} a ${l.costoAnnuo.max} €, al centesimo`);
      }
  }
  if (d.oreServizio !== undefined && d.oreServizio !== null && !numeroValido(d.oreServizio, l.oreServizio))
    errori.push(`Le ore di servizio annue vanno da ${l.oreServizio.min} a ${l.oreServizio.max}`);
  if (d.note !== undefined && d.note !== null && (typeof d.note !== 'string' || d.note.length > 1024)) errori.push('Le note sono al massimo 1024 caratteri');
  return errori;
}

/** Le voci da salvare: solo quelle conosciute e con un valore, al centesimo (pura) */
export const vociPulite = (voci: VociCosti | null | undefined): VociCosti =>
  Object.fromEntries(VOCI_COSTI.flatMap(v => (voci?.[v] != null ? [[v, alCentesimo(voci[v] as number)]] : [])));

/** L'anno da usare per la stima: quello indicato o in corso se c'è, altrimenti il più recente prima (pura) */
export function annoDiRiferimento(anni: readonly number[], anno: number): number | null {
  const prima = anni.filter(a => a <= anno).sort((a, b) => b - a);
  return prima[0] ?? null;
}

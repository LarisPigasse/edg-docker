// =============================================================================
// Consultazioni (fase 1 dei log, passo 1e — ADR117)
// =============================================================================
// Che cosa ha guardato chi: documenti aperti o scaricati, schede di un oggetto,
// report e analisi, esportazioni del servizio. Si registra in log-service come
// categoria USO, tipo 'vigilo.consultazione', con una frase leggibile.
// Si chiama nei gestori DOPO una risposta riuscita, perché lì si conosce
// l'oggetto. Elenchi, ricerche e letture di servizio non si registrano, né ciò
// che una scheda carica da sola (letture dei contatori, costo del singolo mezzo).
//
// La stessa persona sullo stesso oggetto entro una pausa conta una volta
// (PARAMETRI.consultazioniPausaMinuti): ricaricare una pagina non riempie il
// log. Per i report conta il report, non ogni cambio di filtro: si salvano i
// filtri della prima consultazione. In accesso assistito l'evento nomina
// l'operatore EDG. I processi pianificati (utente 0) e le letture in sottofondo
// (x-edg-sfondo: 1, es. i conteggi della pagina Soggetti) non consultano niente.
// Non attende mai: il nome, se costa una lettura, si cerca solo quando la
// consultazione si registra davvero, e un errore non tocca la risposta.
// =============================================================================
import type { Contesto } from '../contesto';
import { PARAMETRI } from '../parametri';
import { logger } from './logger';

/** Che cosa si consulta, con la sua frase (il nome è dell'oggetto, se c'è) */
const FRASI = {
  'documento-aperto': (n: string) => `Ha aperto il documento ${n}`,
  'documento-scaricato': (n: string) => `Ha scaricato il documento ${n}`,
  soggetto: (n: string) => `Ha aperto la scheda di ${n}`,
  scadenza: (n: string) => `Ha aperto la scadenza ${n}`,
  fornitore: (n: string) => `Ha aperto la scheda del fornitore ${n}`,
  controllo: (n: string) => `Ha aperto il controllo ${n}`,
  categoria: (n: string) => `Ha aperto la categoria ${n}`,
  stima: (n: string) => `Ha aperto la stima dei costi «${n}»`,
  rifornimento: (n: string) => `Ha aperto il rifornimento ${n}`,
  'storico-libreria': (n: string) => `Ha consultato lo storico della libreria di ${n}`,
  'andamento-mezzo': (n: string) => `Ha consultato l'andamento dei costi di ${n}`,
  dashboard: () => 'Ha consultato la Dashboard',
  analisi: () => "Ha consultato l'Analisi dei costi",
  'resoconto-spese': () => 'Ha consultato Spese e consumi',
  'resoconto-fornitori': () => 'Ha consultato il resoconto per fornitore',
  'resoconto-mezzi': () => 'Ha consultato il costo dei mezzi',
  'controlli-non-seguiti': () => 'Ha consultato il report dei controlli non seguiti',
  calendario: () => 'Ha consultato il calendario',
  'csv-spese': () => 'Ha esportato il CSV delle spese',
} as const satisfies Record<string, (nome: string) => string>;

export type CosaConsultata = keyof typeof FRASI;

export interface Consultazione {
  /** uuid dell'oggetto; assente per report e analisi (conta il report) */
  id?: string | null;
  /** Nome dell'oggetto, o come trovarlo (solo se la consultazione si registra) */
  nome?: string | null | (() => Promise<string | null>);
  /** In più nell'evento: filtri, periodo, ... */
  dettagli?: Record<string, unknown>;
}

/** Oltre questo numero di chiavi ricordate si tolgono le scadute */
const MEMORIA_PULIZIA = 4096;

/** Chiave "stessa persona, stesso oggetto" (pura) */
export function chiaveConsultazione(ctx: Contesto, cosa: CosaConsultata, id?: string | null): string {
  return `${ctx.idTenant}:${ctx.utente.id}:${ctx.utente.assistenza?.id ?? '-'}:${cosa}:${id ?? '-'}`;
}

/**
 * true se la consultazione va registrata (prima volta o pausa passata); in ogni
 * caso la finestra riparte da adesso, così chi resta sull'oggetto non lo
 * registra di nuovo finché non se ne allontana per una pausa intera (pura sulla memoria data).
 */
export function daRegistrare(memoria: Map<string, number>, chiave: string, adessoMs: number, pausaMs: number): boolean {
  const scade = memoria.get(chiave);
  memoria.set(chiave, adessoMs + pausaMs);
  if (memoria.size > MEMORIA_PULIZIA) for (const [k, t] of memoria) if (t <= adessoMs) memoria.delete(k);
  return !(scade !== undefined && scade > adessoMs);
}

/** La frase dell'evento (pura): che cosa, di chi, e l'operatore EDG in assistenza */
export function fraseConsultazione(ctx: Contesto, cosa: CosaConsultata, nome: string | null): string {
  const chi = ctx.utente.assistenza?.operatore?.nome ? ` (assistenza EDG: ${ctx.utente.assistenza.operatore.nome})` : '';
  return `${FRASI[cosa](nome || '(nome non disponibile)')}: ${ctx.utente.email}${chi}`;
}

const memoria = new Map<string, number>();

/** Registra una consultazione riuscita; non attende e non lancia mai */
export function consultato(ctx: Contesto, cosa: CosaConsultata, c: Consultazione = {}): void {
  if (!ctx.utente?.id) return; // processi pianificati
  if (ctx.sfondo) return; // letture in sottofondo (x-edg-sfondo): non le ha chieste la persona
  const pausaMs = PARAMETRI.consultazioniPausaMinuti * 60_000;
  if (!daRegistrare(memoria, chiaveConsultazione(ctx, cosa, c.id), Date.now(), pausaMs)) return;
  void (async () => {
    let nome: string | null = null;
    try {
      nome = typeof c.nome === 'function' ? await c.nome() : (c.nome ?? null);
    } catch {
      nome = null; // il nome è un di più: l'evento si scrive lo stesso
    }
    const assistenza = ctx.utente.assistenza ? { modo: ctx.utente.assistenza.modo, operatore: ctx.utente.assistenza.operatore } : null;
    logger.audit(
      'vigilo.consultazione',
      fraseConsultazione(ctx, cosa, nome),
      { id: ctx.utente.id, email: ctx.utente.email, tenantId: ctx.idTenant },
      { cosa, ...(c.id ? { id: c.id } : {}), ...(nome ? { nome } : {}), ...(c.dettagli ?? {}), ...(assistenza ? { assistenza } : {}) },
      'USO'
    );
  })().catch(() => {});
}

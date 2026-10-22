// =============================================================================
// Quando e come parte un avviso per email (04-avvisi 4.4, 4.7) — regole pure
// =============================================================================
// Senza preferenze salvate: riepilogo giornaliero, urgenti subito, app + email
// (decisione 2 del 2026-10-08). Le persone senza account hanno sempre i
// predefiniti. Il silenzio notturno è un'impostazione del tenant e i
// tentativi un parametro della piattaforma (ADR093).
// =============================================================================
import type { Canale, FrequenzaAvvisi } from '../valori';

export interface PreferenzeEmail {
  frequenza: FrequenzaAvvisi;
  urgentiSubito: boolean;
  canali: Canale[];
}

export const PREFERENZE_INIZIALI: PreferenzeEmail = { frequenza: 'riepilogo-giornaliero', urgentiSubito: true, canali: ['app', 'email'] };

/** Come parte l'email di un avviso per una persona */
export type InvioEmail = 'subito' | 'giornaliero' | 'settimanale' | 'mai';

export function invioEmail(p: PreferenzeEmail, urgente: boolean): InvioEmail {
  if (!p.canali.includes('email')) return 'mai';
  if (urgente && p.urgentiSubito) return 'subito';
  switch (p.frequenza) {
    case 'subito':
      return 'subito';
    case 'riepilogo-settimanale':
      return 'settimanale';
    case 'mai':
      return 'mai';
    default:
      return 'giornaliero';
  }
}

/** Dove si apre la scadenza nell'app: scheda del soggetto, o elenco se è un promemoria */
export const percorsoScadenza = (uuidScadenza: string, uuidSoggetto: string | null): string =>
  uuidSoggetto ? `/vigilo/soggetti/${uuidSoggetto}?scadenza=${uuidScadenza}` : `/vigilo/scadenze?scadenza=${uuidScadenza}`;

/** "Iveco S-Way 01 (GH128KM)" */
export const nomeSoggetto = (s: { nome: string; identificativo?: string | null } | null | undefined): string | null =>
  s ? `${s.nome}${s.identificativo ? ` (${s.identificativo})` : ''}` : null;

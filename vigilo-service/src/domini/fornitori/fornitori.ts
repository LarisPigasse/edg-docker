// =============================================================================
// Fornitori — regole pure (F1)
// =============================================================================
// Quali fornitori mostra l'elenco (stato: attivi, disattivati, tutti; il
// vecchio parametro `attivo` vale ancora, per il modulo Registra) e quando un
// nome è già usato nel tenant: due fornitori non possono chiamarsi allo stesso
// modo, senza badare a maiuscole e spazi, nemmeno se uno è disattivato.
// =============================================================================

export const STATI_FORNITORI = ['attivi', 'disattivati', 'tutti'] as const;
export type StatoFornitori = (typeof STATI_FORNITORI)[number];

/** Il filtro sulla colonna attivo: true, false o nessuno (tutti). `stato` vince su `attivo`; predefinito: attivi */
export function filtroAttivo(stato?: StatoFornitori, attivo?: boolean): boolean | undefined {
  if (stato === 'tutti') return undefined;
  if (stato) return stato === 'attivi';
  return attivo ?? true;
}

/** L'errore per un nome già usato da un altro fornitore del tenant, o null */
export function erroreDoppione(esistente: { nome: string; attivo: boolean } | null): string | null {
  if (!esistente) return null;
  return esistente.attivo
    ? `Esiste già un fornitore con questo nome: "${esistente.nome}"`
    : `Esiste già un fornitore con questo nome, disattivato: "${esistente.nome}". Riattivalo dall'elenco dei fornitori`;
}

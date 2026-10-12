// =============================================================================
// Libreria EDG — che cosa fare di ogni voce alla sincronizzazione (pura)
// =============================================================================
//   file nuovo                          → inserisci
//   versione del file piu' alta         → aggiorna
//   stessa versione, stessa impronta    → invariata (o solo ordine/ritiro)
//   stessa versione, impronta diversa   → conflitto: contenuto cambiato senza
//                                         nuova versione, NON si sovrascrive
//   versione del database piu' alta     → conflitto (file vecchi?)
//   nel database ma non nei file        → ritira (si segnala, non si cancella)
// =============================================================================

export interface StatoVoce {
  chiave: string;
  versione: number;
  impronta: string | null;
  ordine: number;
  /** null = la tabella non ha il ritiro (modelli di settore) */
  ritirata: boolean | null;
}

export type Azione =
  | { tipo: 'inserisci' | 'aggiorna' | 'riordina' | 'invariata' | 'ritira'; chiave: string }
  | { tipo: 'conflitto'; chiave: string; motivo: string };

export function pianifica(esistenti: StatoVoce[], file: StatoVoce[]): Azione[] {
  const db = new Map(esistenti.map(e => [e.chiave, e]));
  const azioni: Azione[] = [];

  for (const v of file) {
    const e = db.get(v.chiave);
    if (!e) azioni.push({ tipo: 'inserisci', chiave: v.chiave });
    else if (v.versione > e.versione || e.impronta === null) azioni.push({ tipo: 'aggiorna', chiave: v.chiave });
    else if (v.versione < e.versione)
      azioni.push({ tipo: 'conflitto', chiave: v.chiave, motivo: `versione ${e.versione} nel database, ${v.versione} nei file` });
    else if (v.impronta !== e.impronta)
      azioni.push({ tipo: 'conflitto', chiave: v.chiave, motivo: `contenuto cambiato senza aumentare la versione (${v.versione})` });
    else if (v.ordine !== e.ordine || (e.ritirata !== null && e.ritirata !== v.ritirata))
      azioni.push({ tipo: 'riordina', chiave: v.chiave });
    else azioni.push({ tipo: 'invariata', chiave: v.chiave });
  }

  const nei = new Set(file.map(v => v.chiave));
  for (const e of esistenti) {
    if (!nei.has(e.chiave) && e.ritirata === false) azioni.push({ tipo: 'ritira', chiave: e.chiave });
  }
  return azioni;
}

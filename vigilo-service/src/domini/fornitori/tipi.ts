// =============================================================================
// Tipi di fornitore — regole pure (F0)
// =============================================================================
// La chiave di un tipo nuovo si ricava dal nome ("Centro revisioni" →
// centro-revisioni) e poi non cambia; due tipi non possono avere lo stesso
// nome (senza badare a maiuscole e spazi). Limiti invalicabili del catalogo.
// =============================================================================

export const LIMITI_TIPI_FORNITORE = { tipi: 64, nome: 64, chiave: 32 } as const;

/** "Centro revisioni" → "centro-revisioni"; lettere accentate senza accento */
export function chiaveDa(nome: string): string {
  const k = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LIMITI_TIPI_FORNITORE.chiave)
    .replace(/-+$/, '');
  return /^[a-z]/.test(k) ? k : `tipo-${k}`.slice(0, LIMITI_TIPI_FORNITORE.chiave).replace(/-+$/, '');
}

/** Una chiave libera: se c'è già, "-2", "-3"... */
export function chiaveLibera(base: string, usate: ReadonlySet<string>): string {
  if (!usate.has(base)) return base;
  for (let i = 2; ; i++) {
    const coda = `-${i}`;
    const k = `${base.slice(0, LIMITI_TIPI_FORNITORE.chiave - coda.length).replace(/-+$/, '')}${coda}`;
    if (!usate.has(k)) return k;
  }
}

export const stessoNome = (a: string, b: string): boolean => a.trim().toLocaleLowerCase('it') === b.trim().toLocaleLowerCase('it');

/** L'errore da mostrare per un nome, o null */
export function erroreNome(nome: string, altri: string[]): string | null {
  const n = nome.trim();
  if (!n) return 'Il nome del tipo è obbligatorio';
  if (n.length > LIMITI_TIPI_FORNITORE.nome) return `Il nome del tipo può avere al massimo ${LIMITI_TIPI_FORNITORE.nome} caratteri`;
  if (altri.some(a => stessoNome(a, n))) return `Esiste già il tipo "${n}"`;
  return null;
}

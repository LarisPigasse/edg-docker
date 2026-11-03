// Tipi di fornitore: chiave dal nome, chiave libera, nome valido (F0)
import { LIMITI_TIPI_FORNITORE, chiaveDa, chiaveLibera, erroreNome } from '../../src/domini/fornitori/tipi';

describe('tipi di fornitore (F0)', () => {
  test('chiave dal nome: minuscole, trattini, senza accenti, inizia con una lettera', () => {
    expect(chiaveDa('Centro revisioni')).toBe('centro-revisioni');
    expect(chiaveDa('  Elettrauto & Climatizzazione  ')).toBe('elettrauto-climatizzazione');
    expect(chiaveDa('Società di leasing')).toBe('societa-di-leasing');
    expect(chiaveDa('24 ore soccorso')).toBe('tipo-24-ore-soccorso');
    expect(chiaveDa('x'.repeat(80)).length).toBeLessThanOrEqual(LIMITI_TIPI_FORNITORE.chiave);
  });

  test('chiave libera: aggiunge -2, -3 se serve, entro la lunghezza', () => {
    expect(chiaveLibera('officina', new Set(['ente']))).toBe('officina');
    expect(chiaveLibera('officina', new Set(['officina', 'officina-2']))).toBe('officina-3');
    const lunga = 'a'.repeat(LIMITI_TIPI_FORNITORE.chiave);
    expect(chiaveLibera(lunga, new Set([lunga])).length).toBeLessThanOrEqual(LIMITI_TIPI_FORNITORE.chiave);
  });

  test('nome: obbligatorio, entro il limite, non doppio (maiuscole e spazi non contano)', () => {
    expect(erroreNome('  ', [])).toMatch(/obbligatorio/);
    expect(erroreNome('x'.repeat(LIMITI_TIPI_FORNITORE.nome + 1), [])).toMatch(/al massimo/);
    expect(erroreNome(' officina ', ['Officina'])).toMatch(/Esiste già/);
    expect(erroreNome('Elettrauto', ['Officina'])).toBeNull();
  });
});

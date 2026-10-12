// Che cosa fa la sincronizzazione di ogni voce
import { pianifica, type StatoVoce } from '../../src/libreria/piano';

const v = (chiave: string, versione: number, impronta: string | null, ordine = 0, ritirata: boolean | null = false): StatoVoce => ({
  chiave,
  versione,
  impronta,
  ordine,
  ritirata,
});

describe('piano di sincronizzazione', () => {
  test('tabella vuota: si inserisce tutto', () => {
    expect(pianifica([], [v('a', 1, 'x'), v('b', 1, 'y')]).map(a => a.tipo)).toEqual(['inserisci', 'inserisci']);
  });

  test('versione piu\' alta nei file: si aggiorna', () => {
    expect(pianifica([v('a', 1, 'x')], [v('a', 2, 'z')])).toEqual([{ tipo: 'aggiorna', chiave: 'a' }]);
  });

  test('stesso contenuto: invariata; cambia solo l\'ordine: riordina', () => {
    expect(pianifica([v('a', 1, 'x')], [v('a', 1, 'x')])[0].tipo).toBe('invariata');
    expect(pianifica([v('a', 1, 'x', 0)], [v('a', 1, 'x', 3)])[0].tipo).toBe('riordina');
  });

  test('contenuto cambiato senza nuova versione: conflitto, non si sovrascrive', () => {
    const [a] = pianifica([v('a', 1, 'x')], [v('a', 1, 'z')]);
    expect(a.tipo).toBe('conflitto');
    expect(a.tipo === 'conflitto' && a.motivo).toContain('senza aumentare la versione');
  });

  test('database piu\' avanti dei file: conflitto', () => {
    expect(pianifica([v('a', 3, 'x')], [v('a', 2, 'x')])[0].tipo).toBe('conflitto');
  });

  test('tolta dai file: ritirata una volta sola; i modelli non si ritirano', () => {
    expect(pianifica([v('a', 1, 'x')], [])).toEqual([{ tipo: 'ritira', chiave: 'a' }]);
    expect(pianifica([v('a', 1, 'x', 0, true)], [])).toEqual([]);
    expect(pianifica([v('m', 1, 'x', 0, null)], [])).toEqual([]);
  });

  test('voce ritirata che torna nei file: si riattiva', () => {
    expect(pianifica([v('a', 1, 'x', 0, true)], [v('a', 1, 'x', 0, false)])[0].tipo).toBe('riordina');
  });

  test('riga senza impronta (prima della migrazione): si aggiorna', () => {
    expect(pianifica([v('a', 1, null)], [v('a', 1, 'x')])[0].tipo).toBe('aggiorna');
  });
});

// Ambito dell'utente: l'addetto vede la sua persona e ciò che ha assegnato oggi (B9b)
import { TUTTO, ambitoAddetto, nellAmbito } from '../../src/domini/ambito/ambito';

describe('ambito dell addetto (B9b)', () => {
  const oggi = '2026-10-27';

  test('la persona e le assegnazioni in corso, senza doppioni', () => {
    const a = ambitoAddetto(
      7,
      [
        { idSoggetto: 12, dal: '2026-01-01', al: null },
        { idSoggetto: 30, dal: '2026-10-27', al: '2026-10-27' },
        { idSoggetto: 12, dal: '2025-01-01', al: '2025-12-31' },
      ],
      oggi
    );
    expect(a).toEqual({ tutto: false, idPersona: 7, idSoggetti: [7, 12, 30] });
  });

  test('assegnazioni finite o future no', () => {
    const a = ambitoAddetto(
      7,
      [
        { idSoggetto: 12, dal: '2026-01-01', al: '2026-10-26' },
        { idSoggetto: 13, dal: '2026-10-28', al: null },
      ],
      oggi
    );
    expect(a).toEqual({ tutto: false, idPersona: 7, idSoggetti: [7] });
  });

  test('senza persona collegata: niente', () => {
    const a = ambitoAddetto(null, [{ idSoggetto: 12, dal: '2026-01-01', al: null }], oggi);
    expect(a).toEqual({ tutto: false, idPersona: null, idSoggetti: [] });
    expect(nellAmbito(a, 12)).toBe(false);
  });

  test('nell ambito: tutto per l ufficio; per l addetto solo i suoi, mai le cose senza soggetto', () => {
    const a = ambitoAddetto(7, [{ idSoggetto: 12, dal: '2026-01-01', al: null }], oggi);
    expect(nellAmbito(TUTTO, 99)).toBe(true);
    expect(nellAmbito(TUTTO, null)).toBe(true);
    expect(nellAmbito(a, 12)).toBe(true);
    expect(nellAmbito(a, 99)).toBe(false);
    expect(nellAmbito(a, null)).toBe(false);
  });
});

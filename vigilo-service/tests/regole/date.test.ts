import { aggiungiGiorni, aggiungiMesi, differenzaGiorni, fineMese, isGiorno, minimo } from '../../src/regole';

describe('date di calendario', () => {
  test('mesi: il giorno resta, o diventa l\'ultimo del mese', () => {
    expect(aggiungiMesi('2026-01-31', 1)).toBe('2026-02-28');
    expect(aggiungiMesi('2028-01-31', 1)).toBe('2028-02-29'); // bisestile
    expect(aggiungiMesi('2026-11-30', 2)).toBe('2027-01-30');
    expect(aggiungiMesi('2026-03-15', -3)).toBe('2025-12-15');
  });

  test('ancora: una serie partita il 31 non scivola al 28', () => {
    const feb = aggiungiMesi('2026-01-31', 1, 31);
    expect(feb).toBe('2026-02-28');
    expect(aggiungiMesi(feb, 1, 31)).toBe('2026-03-31');
  });

  test('29 febbraio + 1 anno = 28 febbraio', () => {
    expect(aggiungiMesi('2024-02-29', 12)).toBe('2025-02-28');
  });

  test('giorni, differenze, fine mese, minimo', () => {
    expect(aggiungiGiorni('2026-10-01', 15)).toBe('2026-10-16');
    expect(aggiungiGiorni('2026-12-31', 1)).toBe('2027-01-01');
    expect(differenzaGiorni('2026-10-08', '2026-10-30')).toBe(22);
    expect(differenzaGiorni('2026-10-08', '2026-09-30')).toBe(-8);
    expect(fineMese('2026-02-10')).toBe('2026-02-28');
    expect(minimo(null, '2026-11-12', '2026-10-12', undefined)).toBe('2026-10-12');
    expect(minimo(null)).toBeNull();
  });

  test('ora legale non sposta i giorni', () => {
    expect(aggiungiGiorni('2026-03-28', 1)).toBe('2026-03-29');
    expect(aggiungiGiorni('2026-03-29', 1)).toBe('2026-03-30');
    expect(differenzaGiorni('2026-03-28', '2026-03-30')).toBe(2);
  });

  test('validazione', () => {
    expect(isGiorno('2026-02-29')).toBe(false);
    expect(isGiorno('2026-13-01')).toBe(false);
    expect(isGiorno('2026-10-08')).toBe(true);
    expect(isGiorno(null)).toBe(false);
  });
});

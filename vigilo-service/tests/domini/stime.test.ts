// Stime salvate: scostamento e descrizione di riserva (2026-11-18)
import { descrizioneDi, margine, scostamento } from '../../src/domini/stima/stime';

describe('stime salvate', () => {
  test('scostamento: reale − stimato, in euro e in percentuale', () => {
    expect(scostamento(1000, 1128)).toEqual({ euro: 128, percentuale: 12.8 });
    expect(scostamento(1000, 936.5)).toEqual({ euro: -63.5, percentuale: -6.4 });
    expect(scostamento(0, 50)).toEqual({ euro: 50, percentuale: null });
    expect(scostamento(1000, null)).toBeNull();
  });
  test('descrizione scritta, o di riserva dai dati', () => {
    expect(descrizioneDi('  Nereto → Milano ', 'km', 512)).toBe('Nereto → Milano');
    expect(descrizioneDi('', 'km', 1024)).toBe('Trasporto di 1.024 km');
    expect(descrizioneDi(null, 'ore', undefined, 1)).toBe('Lavoro di 1 ora');
    expect(descrizioneDi(undefined, 'ore', undefined, 16)).toBe('Lavoro di 16 ore');
  });
});

describe('margine (2026-11-23)', () => {
  test('senza prezzo: nessun margine', () => {
    expect(margine(null, 1000, null)).toBeNull();
  });
  test('sul costo reale se c\'è, altrimenti sulla stima', () => {
    expect(margine(1200, 1000, null)).toEqual({ euro: 200, percentuale: 16.7, base: 'stimato' });
    expect(margine(1200, 1000, 1250.5)).toEqual({ euro: -50.5, percentuale: -4.2, base: 'reale' });
  });
  test('prezzo zero: la percentuale non si calcola', () => {
    expect(margine(0, 100, null)).toEqual({ euro: -100, percentuale: null, base: 'stimato' });
  });
});

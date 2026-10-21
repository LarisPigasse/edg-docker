// Calendario: periodo ammesso e giorno in cui compare una scadenza
import { giornoDelCalendario, verificaPeriodo, GIORNI_MASSIMI } from '../../src/domini/calendario/periodo';

describe('periodo del calendario', () => {
  test('un mese a schermo (42 giorni) va bene', () => {
    expect(verificaPeriodo('2026-09-28', '2026-11-08')).toBeNull();
  });
  test('al massimo 64 giorni, estremi compresi', () => {
    expect(GIORNI_MASSIMI).toBe(64);
    expect(verificaPeriodo('2026-01-01', '2026-03-05')).toBeNull(); // 64 giorni
    expect(verificaPeriodo('2026-01-01', '2026-03-06')).toMatch(/64 giorni/);
  });
  test('date al contrario o inesistenti rifiutate', () => {
    expect(verificaPeriodo('2026-11-08', '2026-10-01')).toMatch(/prima/);
    expect(verificaPeriodo('2026-02-30', '2026-03-10')).toBe('Date non valide');
    expect(verificaPeriodo('20261001', '2026-10-31')).toBe('Date non valide');
  });
});

describe('giorno di una scadenza nel calendario', () => {
  test('a tempo: il giorno della scadenza', () => {
    expect(giornoDelCalendario({ scadeIl: '2026-10-31', stimataIl: null, urgenzaIl: '2026-10-31' })).toEqual({ giorno: '2026-10-31', stimata: false });
  });
  test('combinata, arriva prima la stima: giorno stimato', () => {
    expect(giornoDelCalendario({ scadeIl: '2027-03-31', stimataIl: '2026-12-12', urgenzaIl: '2026-12-12' })).toEqual({ giorno: '2026-12-12', stimata: true });
  });
  test('combinata, arriva prima la data: non stimata', () => {
    expect(giornoDelCalendario({ scadeIl: '2026-11-30', stimataIl: '2027-01-08', urgenzaIl: '2026-11-30' })).toEqual({ giorno: '2026-11-30', stimata: false });
  });
  test('solo a uso: la stima', () => {
    expect(giornoDelCalendario({ scadeIl: null, stimataIl: '2026-11-16', urgenzaIl: '2026-11-16' })).toEqual({ giorno: '2026-11-16', stimata: true });
  });
  test('senza data né stima: fuori dal calendario', () => {
    expect(giornoDelCalendario({ scadeIl: null, stimataIl: null, urgenzaIl: null })).toBeNull();
  });
});

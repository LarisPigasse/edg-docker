// Il riepilogo degli avvisi (04-avvisi 4.5, ADR093)
import { giornoDellaSettimana, gruppoDi, lunediDi, riepilogoDovuto, settimanaleDovuto } from '../../src/domini/avvisi/riepilogo';

const r = { orarioRiepilogo: '08:00', giorniLavorativi: [1, 2, 3, 4, 5] };
const ore = (o: string) => Number(o.slice(0, 2)) * 60 + Number(o.slice(3));

describe('riepilogo degli avvisi', () => {
  test('giorno della settimana e lunedì', () => {
    expect(giornoDellaSettimana('2026-10-22')).toBe(4); // giovedì
    expect(giornoDellaSettimana('2026-10-25')).toBe(7); // domenica
    expect(lunediDi('2026-10-22')).toBe('2026-10-19');
    expect(lunediDi('2026-10-19')).toBe('2026-10-19');
    expect(lunediDi('2026-11-01')).toBe('2026-10-26');
  });
  test('dovuto: dopo l\'orario, nei giorni lavorativi, una volta al giorno', () => {
    expect(riepilogoDovuto(r, '2026-10-22', ore('07:59'), null)).toBe(false);
    expect(riepilogoDovuto(r, '2026-10-22', ore('08:00'), null)).toBe(true);
    expect(riepilogoDovuto(r, '2026-10-22', ore('11:00'), '2026-10-21')).toBe(true);
    expect(riepilogoDovuto(r, '2026-10-22', ore('11:00'), '2026-10-22')).toBe(false);
    expect(riepilogoDovuto(r, '2026-10-24', ore('09:00'), null)).toBe(false); // sabato
  });
  test('settimanale col primo riepilogo della settimana', () => {
    expect(settimanaleDovuto('2026-10-26', '2026-10-23')).toBe(true); // lunedì dopo venerdì
    expect(settimanaleDovuto('2026-10-27', '2026-10-23')).toBe(true); // martedì, lunedì festivo
    expect(settimanaleDovuto('2026-10-27', '2026-10-26')).toBe(false);
    expect(settimanaleDovuto('2026-10-22', null)).toBe(true);
  });
  test('gruppi dal tono', () => {
    expect([gruppoDi('pericolo'), gruppoDi('attenzione'), gruppoDi('normale')]).toEqual(['subito', 'organizzare', 'occhio']);
  });
});

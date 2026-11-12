// Recupero del ricalcolo notturno quando il servizio non girava a mezzanotte
import { ORARIO_RICALCOLO, cronGiornaliero, ricalcoloDovuto } from '../../src/processi/recupero';

describe('recupero del ricalcolo', () => {
  test("l'orario del processo notturno in node-cron", () => {
    expect(cronGiornaliero(ORARIO_RICALCOLO)).toBe('16 0 * * *');
    expect(cronGiornaliero(8 * 60 + 32)).toBe('32 8 * * *');
  });
  test('gia fatto oggi: niente', () => {
    expect(ricalcoloDovuto('2026-11-09', '2026-11-09', 600)).toBe(false);
  });
  test('fatto ieri (o mai) e ora passata: si recupera', () => {
    expect(ricalcoloDovuto('2026-11-06', '2026-11-09', 600)).toBe(true);
    expect(ricalcoloDovuto(null, '2026-11-09', ORARIO_RICALCOLO)).toBe(true);
  });
  test("prima dell'ora prevista lo fa il processo notturno", () => {
    expect(ricalcoloDovuto('2026-11-08', '2026-11-09', ORARIO_RICALCOLO - 1)).toBe(false);
    expect(ricalcoloDovuto('2026-11-08', '2026-11-09', 0)).toBe(false);
  });
});

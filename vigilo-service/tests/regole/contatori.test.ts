import { dataStimata, letturaAnomala, usoGiornaliero } from '../../src/regole';
import { OGGI } from './helpers';

describe('contatori', () => {
  const letture = [
    { valore: 221020, lettoIl: '2026-06-02' },
    { valore: 227590, lettoIl: '2026-07-01' },
    { valore: 234160, lettoIl: '2026-08-01' },
    { valore: 240730, lettoIl: '2026-09-01' },
    { valore: 248360, lettoIl: '2026-10-07' },
  ];

  test('uso medio sulla finestra di 128 giorni', () => {
    const uso = usoGiornaliero(letture, OGGI)!;
    expect(Math.round(uso)).toBe(215); // (248360 - 221020) / 127
  });

  test('letture vecchie fuori finestra e letture all\'indietro ignorate', () => {
    const conVecchia = [{ valore: 100000, lettoIl: '2025-01-01' }, ...letture, { valore: 230000, lettoIl: '2026-09-15' }];
    expect(Math.round(usoGiornaliero(conVecchia, OGGI)!)).toBe(215);
  });

  test('storia troppo corta o una sola lettura: nessuna media', () => {
    expect(usoGiornaliero([{ valore: 10, lettoIl: '2026-10-01' }, { valore: 50, lettoIl: '2026-10-05' }], OGGI)).toBeNull();
    expect(usoGiornaliero([{ valore: 10, lettoIl: '2026-10-01' }], OGGI)).toBeNull();
  });

  test('data stimata', () => {
    expect(dataStimata(249000, 248360, 212, OGGI)).toBe('2026-10-12');
    expect(dataStimata(249000, 249100, 212, OGGI)).toBe(OGGI);
    expect(dataStimata(249000, 248360, null, OGGI)).toBeNull();
  });

  test('lettura anomala: minore di una precedente o maggiore di una successiva', () => {
    expect(letturaAnomala({ valore: 248000, lettoIl: OGGI }, letture)).toBe(true);
    expect(letturaAnomala({ valore: 248590, lettoIl: OGGI }, letture)).toBe(false);
    expect(letturaAnomala({ valore: 250000, lettoIl: '2026-09-20' }, letture)).toBe(true);
  });
});

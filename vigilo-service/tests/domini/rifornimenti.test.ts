// Rifornimenti: errori in parole, limiti, litri solo per carburante e AdBlue, prezzo al litro
import { erroriRifornimento, prezzoAlLitro } from '../../src/domini/rifornimenti/rifornimenti';

const OGGI = '2026-11-05';

describe('rifornimenti', () => {
  test('validi: carburante con litri e km, pedaggio senza litri', () => {
    expect(erroriRifornimento({ fattoIl: '2026-11-04', voce: 'carburante', litri: 412.5, importo: 701.25, lettura: 512400 }, OGGI)).toEqual([]);
    expect(erroriRifornimento({ fattoIl: '2026-11-05', voce: 'pedaggi', importo: 38.6 }, OGGI)).toEqual([]);
  });

  test('che cosa manca e che cosa non va', () => {
    expect(erroriRifornimento({}, OGGI)).toEqual(['Scegli la voce: carburante, AdBlue, pedaggi o altro', 'Scrivi la data', "Scrivi l'importo"]);
    expect(erroriRifornimento({ fattoIl: '2026-11-06', voce: 'altro', importo: 10 }, OGGI)).toEqual(['La data non può essere nel futuro']);
    expect(erroriRifornimento({ fattoIl: OGGI, voce: 'pedaggi', importo: 10, litri: 5 }, OGGI)).toEqual(['I litri si scrivono solo per carburante e AdBlue']);
    expect(erroriRifornimento({ fattoIl: OGGI, voce: 'carburante', importo: 70000 }, OGGI)[0]).toMatch(/65\.536 €/);
    expect(erroriRifornimento({ fattoIl: OGGI, voce: 'adblue', importo: 30, litri: 0 }, OGGI)[0]).toMatch(/16\.384/);
    expect(erroriRifornimento({ fattoIl: OGGI, voce: 'carburante', importo: 10.005 }, OGGI)[0]).toMatch(/al centesimo/);
    expect(erroriRifornimento({ fattoIl: OGGI, voce: 'carburante', importo: 100, lettura: 12.5 }, OGGI)[0]).toMatch(/numero intero/);
  });

  test('prezzo al litro', () => {
    expect(prezzoAlLitro(701.25, 412.5)).toBe(1.7);
    expect(prezzoAlLitro(38.6, null)).toBeNull();
  });
});

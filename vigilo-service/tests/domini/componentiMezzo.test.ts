// Le due componenti del costo di un mezzo (2026-11-18)
import { componentiMezzo } from '../../src/domini/resoconti/componenti';

const daf = {
  possesso: { quota: 10569.21, obblighi: 4199, totale: 14768.21 },
  manutenzione: { totale: 2130, guasti: 1 },
  rifornimenti: { totale: 83456.24, litri: 45776, consumo: 36.6 },
  uso: { unita: 'km' as const, valore: 125152 },
  mesi: 12,
};

describe('componenti del costo di un mezzo', () => {
  test('fissa per ora di impiego, variabile per km', () => {
    expect(componentiMezzo(daf, 2048)).toEqual({ fissoOra: 8.25, variabile: 0.667, unita: 'km', oreImpiego: 2048 });
  });
  test('le ore di impiego si riportano ai mesi del periodo', () => {
    expect(componentiMezzo({ ...daf, mesi: 6 }, 2048).oreImpiego).toBe(1024);
    expect(componentiMezzo({ ...daf, mesi: 6 }, 2048).fissoOra).toBe(16.5);
  });
  test('senza uso registrato: niente parte variabile; senza mesi: niente parte fissa', () => {
    expect(componentiMezzo({ ...daf, uso: null }, 2048).variabile).toBeNull();
    expect(componentiMezzo({ ...daf, mesi: 0 }, 2048).fissoOra).toBeNull();
  });
  test('una macchina a contaore: variabile per ora motore', () => {
    expect(componentiMezzo({ ...daf, uso: { unita: 'ore', valore: 512 }, rifornimenti: { totale: 4096, litri: 1, consumo: null } }, 2048)).toMatchObject({ variabile: 8, unita: 'ore' });
  });
});

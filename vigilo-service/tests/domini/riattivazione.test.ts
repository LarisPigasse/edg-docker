// Riattivazione di un controllo: quali scadenze si riaprono (2026-11-19)
import { scadenzeDaRiaprire } from '../../src/domini/controlli/riattivazione';

const chiuse = [
  { idScadenza: 11, idSoggetto: 1 },
  { idScadenza: 12, idSoggetto: 2 },
  { idScadenza: 13, idSoggetto: 3 },
  { idScadenza: 14, idSoggetto: 4 },
];
const tutti = new Set([1, 2, 3, 4]);

describe('riattivazione di un controllo', () => {
  test('si riaprono tutte quelle chiuse dalla disattivazione', () => {
    expect(scadenzeDaRiaprire(chiuse, { conAperta: new Set(), nonSeguiti: new Set(), ammessi: tutti })).toEqual([11, 12, 13, 14]);
  });
  test('non si riapre per chi ha già una scadenza aperta, per chi non lo segue, per chi non è più ammesso', () => {
    expect(scadenzeDaRiaprire(chiuse, { conAperta: new Set([1]), nonSeguiti: new Set([2]), ammessi: new Set([1, 2, 4]) })).toEqual([14]);
  });
  test('una sola per soggetto', () => {
    expect(scadenzeDaRiaprire([...chiuse, { idScadenza: 15, idSoggetto: 1 }], { conAperta: new Set(), nonSeguiti: new Set(), ammessi: tutti })).toEqual([11, 12, 13, 14]);
  });
});

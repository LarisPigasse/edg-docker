// Controlli di significato su cadenze e applicabilita' dei controlli
import { controllaCadenza } from '../../src/domini/coerenza';
import { siApplica } from '../../src/domini/scadenze/ciclo.service';
import { etichetteDate } from '../../src/domini/valori';
import { oggiInItalia } from '../../src/core/utils/oggi';
import { cadenza } from '../regole/helpers';

const anni = (valore: number) => ({ valore, unita: 'anni' as const });

describe('coerenza delle cadenze', () => {
  test('prima e fasce solo da date del tipo', () => {
    expect(() => controllaCadenza(cadenza({ tempo: anni(2), prima: { tempo: anni(4), da: 'immatricolazione' } }), 'veicolo', null)).not.toThrow();
    expect(() => controllaCadenza(cadenza({ tempo: anni(2), prima: { tempo: anni(4), da: 'nascita' } }), 'veicolo', null)).toThrow(/immatricolazione/);
    expect(() =>
      controllaCadenza(cadenza({ tempo: anni(10), fasce: { da: 'nascita', elenco: [{ oltre: anni(50), tempo: anni(5) }] } }), 'persona', null)
    ).not.toThrow();
    expect(() => controllaCadenza(cadenza({ fasce: { da: 'nascita', elenco: [{ oltre: anni(50), tempo: anni(5) }] } }), 'persona', null)).toThrow(
      /solo con una cadenza a tempo/
    );
  });

  test('cadenza a uso: servono categorie con il contatore', () => {
    const tagliando = cadenza({ tempo: anni(1), uso: { valore: 16000, unita: 'km' } });
    expect(() => controllaCadenza(tagliando, 'veicolo', [['km'], ['km', 'ore']])).not.toThrow();
    expect(() => controllaCadenza(tagliando, 'veicolo', [['km'], []])).toThrow(/contatore km/);
    expect(() => controllaCadenza(tagliando, 'veicolo', [])).toThrow(/contatore km/);
  });

  test('etichette delle date per le frasi', () => {
    expect(etichetteDate('veicolo')).toEqual({ immatricolazione: "dall'immatricolazione" });
    expect(etichetteDate('azienda')).toEqual({});
  });
});

describe('a chi si applica un controllo', () => {
  const controllo = { tipoSoggetto: 'veicolo' } as never;
  const soggetto = (o: object) => ({ tipo: 'veicolo', stato: 'in-servizio', idCategoria: 7, ...o }) as never;
  test('tipo, categorie e dismessi', () => {
    expect(siApplica(controllo, [], soggetto({}))).toBe(true);
    expect(siApplica(controllo, [7, 9], soggetto({}))).toBe(true);
    expect(siApplica(controllo, [9], soggetto({}))).toBe(false);
    expect(siApplica(controllo, [], soggetto({ tipo: 'macchina' }))).toBe(false);
    expect(siApplica(controllo, [], soggetto({ stato: 'dismesso' }))).toBe(false);
    expect(siApplica(controllo, [], soggetto({ stato: 'fermo' }))).toBe(true);
    expect(siApplica(controllo, [7], soggetto({ idCategoria: null }))).toBe(false);
  });
});

describe('oggi in Italia', () => {
  test('mezzanotte e mezza in Italia e\' gia\' domani anche se in UTC no', () => {
    expect(oggiInItalia(new Date('2026-10-11T22:30:00Z'))).toBe('2026-10-12'); // ora legale, UTC+2
    expect(oggiInItalia(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01'); // ora solare, UTC+1
    expect(oggiInItalia(new Date('2026-10-12T21:59:00Z'))).toBe('2026-10-12');
  });
});

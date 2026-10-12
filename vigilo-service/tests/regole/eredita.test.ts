import { impostazioniEffettive, impostazioniPredefinite, type Impostazioni } from '../../src/regole';
import { cadenza, preavvisi, tolleranza } from './helpers';

const controllo: Impostazioni = {
  cadenza: cadenza({ tempo: { valore: 12, unita: 'mesi' }, fineMese: true }),
  preavvisi: preavvisi([32, 8, 1]),
  tolleranza: tolleranza(),
  destinatari: [{ tipo: 'ufficio' }, { tipo: 'referente' }, { tipo: 'assegnatario' }],
};

describe('ereditarieta\' controllo -> scadenza', () => {
  test('nessuna ridefinizione: tutto dal controllo', () => {
    const e = impostazioniEffettive(controllo, {});
    expect(e.preavvisi.giorni).toEqual([32, 8, 1]);
    expect(Object.values(e.origine).every(o => o === 'controllo')).toBe(true);
  });

  test('preavvisi personalizzati sulla scadenza, il resto ereditato', () => {
    const e = impostazioniEffettive(controllo, { preavvisi: preavvisi([64, 32, 8]), cadenza: null });
    expect(e.preavvisi.giorni).toEqual([64, 32, 8]);
    expect(e.origine.preavvisi).toBe('scadenza');
    expect(e.origine.cadenza).toBe('controllo');
    expect(e.cadenza.fineMese).toBe(true);
  });

  test('"nessuna tolleranza" esplicita sulla scadenza vince su quella del controllo', () => {
    const conTol = { ...controllo, tolleranza: tolleranza(15) };
    const e = impostazioniEffettive(conTol, { tolleranza: tolleranza(0) });
    expect(e.tolleranza.giorni).toBe(0);
    expect(e.origine.tolleranza).toBe('scadenza');
  });

  test('promemoria libero: predefinite del tenant', () => {
    const e = impostazioniEffettive(impostazioniPredefinite([16, 2]), {}, false);
    expect(e.cadenza.tempo).toBeNull();
    expect(e.preavvisi.giorni).toEqual([16, 2]);
    expect(e.origine.cadenza).toBe('predefinito');
  });

  test('non modifica gli oggetti di partenza', () => {
    impostazioniEffettive(controllo, { preavvisi: preavvisi([1]) });
    expect(controllo.preavvisi.giorni).toEqual([32, 8, 1]);
  });
});

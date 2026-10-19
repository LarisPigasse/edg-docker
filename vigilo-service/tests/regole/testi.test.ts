import { conArticolo, dataBreve, dataLunga, descriviCadenza, descriviPreavvisi, descriviTolleranza, numero } from '../../src/regole';
import { OGGI, cadenza, preavvisi, tolleranza } from './helpers';

describe('testi', () => {
  test('date e numeri', () => {
    expect(dataBreve('2026-10-30', OGGI)).toBe('30 ott');
    expect(dataBreve('2027-03-12', OGGI)).toBe('12 mar 2027');
    expect(dataLunga('2028-09-30')).toBe('30 settembre 2028');
    expect(numero(4048)).toBe('4.048');
    expect(numero(264360)).toBe('264.360');
    expect(numero(512)).toBe('512');
  });

  test('date con l\'articolo', () => {
    expect(conArticolo('2026-10-23', OGGI)).toBe('il 23 ott');
    expect(conArticolo('2026-10-08', OGGI)).toBe("l'8 ott");
    expect(conArticolo('2026-11-11', OGGI)).toBe("l'11 nov");
    expect(conArticolo('2026-12-01', OGGI)).toBe('il 1° dic');
    expect(conArticolo('2026-10-08', OGGI, true)).toBe("all'8 ott");
    expect(conArticolo('2027-03-01', OGGI, true)).toBe('al 1° mar 2027');
    expect(conArticolo('2026-10-16', OGGI, true)).toBe('al 16 ott');
  });

  test('cadenze in una frase', () => {
    expect(descriviCadenza(cadenza({}))).toBe('una tantum');
    expect(descriviCadenza(cadenza({ tempo: { valore: 12, unita: 'mesi' } }))).toBe('ogni 12 mesi dalla scadenza precedente');
    expect(descriviCadenza(cadenza({ tempo: { valore: 1, unita: 'mesi' }, fineMese: true }))).toBe('ogni mese dalla scadenza precedente, a fine mese');
    expect(descriviCadenza(cadenza({ tempo: { valore: 12, unita: 'mesi' }, uso: { valore: 16000, unita: 'km' }, ancoraggio: 'esecuzione' }))).toBe(
      'ogni 12 mesi o 16.000 km, quello che arriva prima, dalla data di esecuzione'
    );
    expect(descriviCadenza(cadenza({ uso: { valore: 512, unita: 'ore' } }))).toBe("ogni 512 ore dall'ultima lettura registrata");
    expect(
      descriviCadenza(
        cadenza({ tempo: { valore: 24, unita: 'mesi' }, fineMese: true, prima: { tempo: { valore: 4, unita: 'anni' }, da: 'immatricolazione' } }),
        { immatricolazione: "dall'immatricolazione" }
      )
    ).toBe("prima dopo 4 anni dall'immatricolazione, poi ogni 24 mesi dalla scadenza precedente, a fine mese");
    expect(
      descriviCadenza(
        cadenza({ tempo: { valore: 1, unita: 'anni' }, prima: { tempo: { valore: 1, unita: 'anni' }, da: 'immatricolazione' } }),
        { immatricolazione: "dall'immatricolazione" }
      )
    ).toBe("prima dopo un anno dall'immatricolazione, poi ogni anno dalla scadenza precedente");
  });

  test('preavvisi e tolleranza', () => {
    expect(descriviPreavvisi(preavvisi([8, 32, 1]))).toBe('avvisi a 32, 8 e 1 giorno');
    expect(descriviPreavvisi(preavvisi([1, 8]))).toBe('avvisi a 8 e 1 giorno');
    expect(descriviPreavvisi(preavvisi([8], [1024]), 'km')).toBe('avvisi a 8 giorni e a 1.024 km');
    expect(descriviPreavvisi(preavvisi([1]))).toBe('avvisi a 1 giorno');
    expect(descriviPreavvisi(preavvisi([]))).toBe('nessun preavviso');
    expect(descriviTolleranza(tolleranza(15))).toBe('tolleranza 15 giorni');
    expect(descriviTolleranza(tolleranza(0, 512), 'km')).toBe('tolleranza 512 km');
    expect(descriviTolleranza(tolleranza())).toBe('nessuna tolleranza');
  });
});

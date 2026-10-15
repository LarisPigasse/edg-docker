// Dati del tipo, campi aggiuntivi e identificativi dei soggetti
import { DATI_TIPO, normalizzaIdentificativo, validaDati } from '../../src/domini/soggetti/datiTipo';
import { validaCampi } from '../../src/domini/soggetti/campi';
import { DATE_SOGGETTO, TIPI_SOGGETTO } from '../../src/domini/valori';

describe('dati del tipo', () => {
  test('ogni data di DATE_SOGGETTO esiste nei dati del tipo', () => {
    for (const tipo of TIPI_SOGGETTO) for (const d of DATE_SOGGETTO[tipo]) expect(Object.keys(DATI_TIPO[tipo])).toContain(d.chiave);
  });

  test('validazione e pulizia', () => {
    const r = validaDati('veicolo', { immatricolazione: '2024-03-10', marca: 'Iveco', telaio: '', colore: 'rosso' });
    expect(r.errori).toEqual([]);
    expect(r.valore).toEqual({ immatricolazione: '2024-03-10', marca: 'Iveco' });
    expect(validaDati('veicolo', { immatricolazione: '10/03/2024' }).errori[0]).toMatch(/immatricolazione/);
    expect(validaDati('sede', { provincia: 'te', cap: '64015' }).valore).toEqual({ provincia: 'TE', cap: '64015' });
    expect(validaDati('persona', { email: 'NON-VALIDA' }).errori).toHaveLength(1);
  });

  test('identificativi normalizzati', () => {
    expect(normalizzaIdentificativo('veicolo', ' ab 123 cd ')).toBe('AB123CD');
    expect(normalizzaIdentificativo('persona', 'rssmra80a01h501u')).toBe('RSSMRA80A01H501U');
    expect(normalizzaIdentificativo('sede', ' Magazzino Nord ')).toBe('Magazzino Nord');
    expect(normalizzaIdentificativo('veicolo', '  ')).toBeNull();
  });
});

describe('campi aggiuntivi', () => {
  const definizioni = [
    { chiave: 'massa', etichetta: 'Massa', tipo: 'numero' as const, obbligatorio: true, ordine: 1 },
    { chiave: 'adr', etichetta: 'ADR', tipo: 'si-no' as const, obbligatorio: false, ordine: 2 },
    { chiave: 'colore', etichetta: 'Colore', tipo: 'elenco' as const, opzioni: ['bianco', 'rosso'], obbligatorio: false, ordine: 3 },
    { chiave: 'collaudo', etichetta: 'Collaudo', tipo: 'data' as const, obbligatorio: false, ordine: 4 },
  ];
  test('valori corretti, convertiti e campi sconosciuti tolti', () => {
    expect(validaCampi(definizioni, { massa: '7,5', adr: true, colore: 'rosso', altro: 1 })).toEqual({
      valore: { massa: 7.5, adr: true, colore: 'rosso' },
      errori: [],
    });
  });
  test('errori in italiano', () => {
    const r = validaCampi(definizioni, { adr: 'si', colore: 'verde', collaudo: '2026-13-01' });
    expect(r.errori).toEqual([
      'Massa è obbligatorio',
      'ADR deve essere sì o no',
      'Colore non è tra i valori consentiti',
      'Collaudo deve essere una data AAAA-MM-GG',
    ]);
  });
});

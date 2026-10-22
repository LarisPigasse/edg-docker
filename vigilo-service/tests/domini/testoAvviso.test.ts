// Testo di un avviso (04-avvisi 4.2)
import { testoAvviso } from '../../src/domini/avvisi/testo';

describe('testo degli avvisi', () => {
  test('preavviso: "scade tra ..."', () => {
    expect(testoAvviso({ titolo: 'Revisione', soggetto: { nome: 'Iveco S-Way 01', identificativo: 'GH128KM' }, stato: 'tra 8 giorni · 30 ott' })).toBe(
      'Revisione · Iveco S-Way 01 (GH128KM): scade tra 8 giorni · 30 ott'
    );
  });
  test('scaduta e senza identificativo', () => {
    expect(testoAvviso({ titolo: 'Visita medica', soggetto: { nome: 'Mario Rossi', identificativo: null }, stato: 'scaduta ieri · 21 ott' })).toBe(
      'Visita medica · Mario Rossi: scaduta ieri · 21 ott'
    );
  });
  test('senza soggetto', () => {
    expect(testoAvviso({ titolo: 'DURC', soggetto: null, stato: 'scade oggi' })).toBe('DURC: scade oggi');
  });
});

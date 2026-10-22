// Testo di un avviso (04-avvisi 4.2)
import { statoDelTesto, testoAvviso, tonoAvviso } from '../../src/domini/avvisi/testo';

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
  test('lo stato si ritrova nel testo, anche con ": " nel titolo', () => {
    const t = testoAvviso({ titolo: 'Corso: aggiornamento', soggetto: { nome: 'Mario Rossi', identificativo: null }, stato: 'tra 2 giorni · 24 ott' });
    expect(statoDelTesto(t)).toBe('scade tra 2 giorni · 24 ott');
    expect(statoDelTesto('senza separatore')).toBe('senza separatore');
  });
});

describe('tono degli avvisi', () => {
  test.each([
    ['scaduta', true, 'pericolo'],
    ['richiamo:2', true, 'pericolo'],
    ['tolleranza:ultimo-giorno', true, 'pericolo'],
    ['tolleranza:inizio', false, 'attenzione'],
    ['preavviso:8', false, 'attenzione'],
    ['preavviso:4', false, 'attenzione'],
    ['preavviso-stima:8', false, 'attenzione'],
    ['preavviso:32', false, 'normale'],
    ['preavviso-uso:1024', false, 'normale'],
  ])('%s (urgente: %s) → %s', (evento, urgente, tono) => {
    expect(tonoAvviso(evento as string, urgente as boolean)).toBe(tono);
  });
});

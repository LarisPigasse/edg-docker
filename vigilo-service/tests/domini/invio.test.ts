// Quando parte un avviso per email (04-avvisi 4.4, 4.7)
import { PREFERENZE_INIZIALI, invioEmail, nomeSoggetto, percorsoScadenza, type PreferenzeEmail } from '../../src/domini/avvisi/invio';

const p = (x: Partial<PreferenzeEmail>): PreferenzeEmail => ({ ...PREFERENZE_INIZIALI, ...x });

describe('invio delle email degli avvisi', () => {
  test('predefiniti: urgenti subito, gli altri nel riepilogo giornaliero', () => {
    expect(invioEmail(PREFERENZE_INIZIALI, true)).toBe('subito');
    expect(invioEmail(PREFERENZE_INIZIALI, false)).toBe('giornaliero');
  });
  test('frequenze', () => {
    expect(invioEmail(p({ frequenza: 'subito' }), false)).toBe('subito');
    expect(invioEmail(p({ frequenza: 'riepilogo-settimanale' }), false)).toBe('settimanale');
    expect(invioEmail(p({ frequenza: 'mai' }), false)).toBe('mai');
  });
  test('"mai" con urgenti subito: le urgenti arrivano comunque', () => {
    expect(invioEmail(p({ frequenza: 'mai' }), true)).toBe('subito');
    expect(invioEmail(p({ frequenza: 'mai', urgentiSubito: false }), true)).toBe('mai');
  });
  test('urgenti non subito: seguono la frequenza', () => {
    expect(invioEmail(p({ urgentiSubito: false }), true)).toBe('giornaliero');
  });
  test('senza il canale email: mai', () => {
    expect(invioEmail(p({ canali: ['app'] }), true)).toBe('mai');
  });
  test('percorso della scadenza e nome del soggetto', () => {
    expect(percorsoScadenza('s1', 'g1')).toBe('/vigilo/soggetti/g1?scadenza=s1');
    expect(percorsoScadenza('s1', null)).toBe('/vigilo/scadenze?scadenza=s1');
    expect(nomeSoggetto({ nome: 'Iveco S-Way 01', identificativo: 'GH128KM' })).toBe('Iveco S-Way 01 (GH128KM)');
    expect(nomeSoggetto({ nome: 'Sede di Nereto', identificativo: null })).toBe('Sede di Nereto');
    expect(nomeSoggetto(null)).toBeNull();
  });
});

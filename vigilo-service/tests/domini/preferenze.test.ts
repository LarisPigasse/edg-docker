// Preferenze degli avvisi di un utente (04-avvisi 4.4, B8d-1)
import {
  LIMITI_PREFERENZE,
  PREFERENZE_PREDEFINITE,
  erroriPreferenze,
  filtriEffettivi,
  passaFiltri,
  preferenzeEffettive,
} from '../../src/domini/avvisi/preferenze';

describe('preferenze degli avvisi', () => {
  test('senza riga: i predefiniti (riepilogo giornaliero, urgenti subito, tutto)', () => {
    expect(preferenzeEffettive(null)).toEqual(PREFERENZE_PREDEFINITE);
    expect(PREFERENZE_PREDEFINITE.filtri).toEqual({ tipi: [], sedi: [] });
  });

  test('riga con valori non validi: ciascuno torna al predefinito', () => {
    const p = preferenzeEffettive({ frequenza: 'ogni-ora', urgentiSubito: 'sì', canali: ['app', 'piccione'], filtri: 'tutto' });
    expect(p).toEqual({ frequenza: 'riepilogo-giornaliero', urgentiSubito: true, canali: ['app'], filtri: { tipi: [], sedi: [] } });
  });

  test('filtri: tipi nell ordine stabilito, doppioni e sconosciuti tolti; tutti scelti = nessun filtro', () => {
    expect(filtriEffettivi({ tipi: ['persona', 'veicolo', 'veicolo', 'astronave'] }).tipi).toEqual(['veicolo', 'persona']);
    expect(filtriEffettivi({ tipi: ['veicolo', 'macchina', 'attrezzatura', 'sede', 'persona', 'azienda'] }).tipi).toEqual([]);
  });

  test('filtri: le sedi che non esistono più si ignorano', () => {
    expect(filtriEffettivi({ sedi: [9, 3, 3, 1.5, 'x', 4] }, new Set([3, 4])).sedi).toEqual([3, 4]);
    expect(filtriEffettivi({ sedi: [9] }, new Set([3])).sedi).toEqual([]);
  });

  test('errori con parole per l utente', () => {
    expect(erroriPreferenze({ frequenza: 'subito', urgentiSubito: false, filtri: { tipi: ['sede'], sedi: [] } })).toEqual([]);
    expect(erroriPreferenze({ frequenza: 'ogni-ora' })).toEqual(['La frequenza delle email non è valida']);
    expect(erroriPreferenze({ filtri: { tipi: ['astronave'] } })).toEqual(['Uno dei tipi di soggetto non è valido']);
    const troppe = Array.from({ length: LIMITI_PREFERENZE.sedi + 1 }, (_, i) => `sede-${i}`);
    expect(erroriPreferenze({ filtri: { sedi: troppe } })).toEqual([`Si possono scegliere al massimo ${LIMITI_PREFERENZE.sedi} sedi`]);
  });

  test('passaFiltri: senza filtri passa tutto, promemoria senza soggetto sempre', () => {
    const veicolo = { idSoggetto: 10, tipo: 'veicolo' as const, idSede: 3 };
    expect(passaFiltri({ tipi: [], sedi: [] }, veicolo)).toBe(true);
    expect(passaFiltri({ tipi: ['persona'], sedi: [4] }, null)).toBe(true);
  });

  test('passaFiltri: per tipo e per sede (la sede è di se stessa, senza sede passa)', () => {
    const f = { tipi: ['veicolo' as const, 'sede' as const], sedi: [3] };
    expect(passaFiltri(f, { idSoggetto: 10, tipo: 'veicolo', idSede: 3 })).toBe(true);
    expect(passaFiltri(f, { idSoggetto: 11, tipo: 'veicolo', idSede: 4 })).toBe(false);
    expect(passaFiltri(f, { idSoggetto: 12, tipo: 'persona', idSede: 3 })).toBe(false);
    expect(passaFiltri(f, { idSoggetto: 3, tipo: 'sede', idSede: null })).toBe(true);
    expect(passaFiltri(f, { idSoggetto: 13, tipo: 'veicolo', idSede: null })).toBe(true);
  });
});

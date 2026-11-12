// Chi ha chiuso una scadenza (revisione 2026-11-10)
import { autoreChiusura, type RegistrazioneChiusura } from '../../src/domini/scadenze/chiusura';

const reg = (r: Partial<RegistrazioneChiusura>): RegistrazioneChiusura => ({ tipo: 'esecuzione', esito: 'positivo', creatoDa: 9, confermataDa: null, ...r });

describe('chi ha chiuso una scadenza', () => {
  test('rinnovata con una registrazione: chi l\'ha scritta', () => {
    expect(autoreChiusura({ motivoChiusura: 'rinnovata', modificatoDa: 4 }, [reg({ creatoDa: 9 })])).toEqual({ account: 9, automatica: false });
  });
  test('segnalazione dell\'addetto confermata: chi l\'ha confermata', () => {
    expect(autoreChiusura({ motivoChiusura: 'completata', modificatoDa: 9 }, [reg({ creatoDa: 4, confermataDa: 9 })])).toEqual({ account: 9, automatica: false });
  });
  test('rinnovo tacito: automatica, anche se una persona aveva modificato la scadenza', () => {
    expect(autoreChiusura({ motivoChiusura: 'rinnovata', modificatoDa: 9 }, [reg({ tipo: 'rinnovo-tacito', creatoDa: null })])).toEqual({ account: null, automatica: true });
  });
  test('rinvii ed esiti negativi non chiudono: conta la registrazione che ha chiuso', () => {
    const r = [reg({ tipo: 'rinvio', creatoDa: 4 }), reg({ esito: 'negativo', creatoDa: 4 }), reg({ creatoDa: 9 })];
    expect(autoreChiusura({ motivoChiusura: 'fine-ricorrenza', modificatoDa: 4 }, r)).toEqual({ account: 9, automatica: false });
  });
  test('soggetto dismesso o controllo disattivato: chi ha modificato la scadenza', () => {
    expect(autoreChiusura({ motivoChiusura: 'soggetto-dismesso', modificatoDa: 9 }, [reg({ creatoDa: 4 })])).toEqual({ account: 9, automatica: false });
    expect(autoreChiusura({ motivoChiusura: 'controllo-disattivato', modificatoDa: 4 }, [])).toEqual({ account: 4, automatica: false });
    // controllo non più seguito per il soggetto: chi l'ha deciso
    expect(autoreChiusura({ motivoChiusura: 'non-seguita', modificatoDa: 9 }, [reg({ creatoDa: 4 })])).toEqual({ account: 9, automatica: false });
  });
  test('esecuzione senza autore (importata): nessun nome, ma non automatica', () => {
    expect(autoreChiusura({ motivoChiusura: 'completata', modificatoDa: null }, [reg({ creatoDa: null })])).toEqual({ account: null, automatica: false });
  });
});

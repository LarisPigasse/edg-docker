// Segnalazioni dell'addetto: dati, ritiro, decisione, eventi e testi degli avvisi (B9c)
import {
  DATI_ADDETTO,
  erroreDecisione,
  erroreRitiro,
  eventoEsito,
  eventoSegnalazione,
  genereEvento,
  statoEsito,
  statoSegnalazione,
} from '../../src/domini/segnalazioni/segnalazioni';
import { statoDelTesto, testoAvviso, tonoAvviso } from '../../src/domini/avvisi/testo';

describe('segnalazioni dell addetto (B9c)', () => {
  const oggi = '2026-10-28';
  test('l addetto dà solo lettura e documento: importo e fornitore li completa l ufficio', () => {
    expect(DATI_ADDETTO).toEqual(['lettura', 'allegato']);
  });

  test('ritiro: solo chi l ha mandata, finché aspetta', () => {
    expect(erroreRitiro({ stato: 'da-confermare', creatoDa: 4 }, 4)).toBeNull();
    expect(erroreRitiro({ stato: 'da-confermare', creatoDa: 5 }, 4)).toMatch(/solo le segnalazioni che hai mandato tu/);
    expect(erroreRitiro({ stato: 'confermata', creatoDa: 4 }, 4)).toMatch(/già stata confermata o respinta/);
    expect(erroreRitiro({ stato: 'respinta', creatoDa: 4 }, 4)).not.toBeNull();
  });

  test('decisione dell ufficio solo su quelle in attesa', () => {
    expect(erroreDecisione({ stato: 'da-confermare' })).toBeNull();
    expect(erroreDecisione({ stato: 'confermata' })).toMatch(/non è più da confermare/);
  });

  test('eventi: genere riconosciuto, gli altri sono delle scadenze', () => {
    expect(eventoSegnalazione(12)).toBe('segnalazione:12');
    expect(eventoEsito('respinta', 12)).toBe('respinta:12');
    expect(genereEvento('segnalazione:12')).toBe('segnalazione');
    expect(genereEvento('confermata:12')).toBe('esito');
    expect(genereEvento('respinta:7')).toBe('esito');
    expect(genereEvento('preavviso:32')).toBeNull();
    expect(genereEvento('scaduta')).toBeNull();
    expect(genereEvento('segnalazione:')).toBeNull();
  });

  test('testi degli avvisi', () => {
    expect(statoSegnalazione('2026-10-27', 'Mario Rossi', oggi)).toBe('segnalata fatta il 27 ott da Mario Rossi, da confermare');
    expect(statoSegnalazione('2026-10-08', null, oggi)).toBe("segnalata fatta l'8 ott, da confermare");
    expect(statoEsito('confermata', '2026-10-27', null, oggi)).toBe('segnalazione confermata, fatta il 27 ott');
    expect(statoEsito('respinta', '2026-10-27', 'Manca il timbro', oggi)).toBe('segnalazione respinta: Manca il timbro');
  });

  test('lo stato si ritrova nel testo anche se il motivo contiene ": "', () => {
    const stato = statoEsito('respinta', '2026-10-27', 'Certificato: manca il timbro', oggi);
    const testo = testoAvviso({ titolo: 'Revisione', soggetto: { nome: 'Furgone', identificativo: 'GD512XY' }, stato });
    expect(statoDelTesto(testo)).toBe('segnalazione respinta: Certificato: manca il timbro');
    const ufficio = testoAvviso({ titolo: 'Nota: revisione', soggetto: null, stato: statoSegnalazione('2026-10-27', 'Mario Rossi', oggi) });
    expect(statoDelTesto(ufficio)).toBe('segnalata fatta il 27 ott da Mario Rossi, da confermare');
    expect(statoDelTesto('Revisione · Furgone: scade tra 2 giorni · 30 ott')).toBe('scade tra 2 giorni · 30 ott');
  });

  test('tono: la respinta chiede attenzione, le altre normali', () => {
    expect(tonoAvviso('respinta:3', false)).toBe('attenzione');
    expect(tonoAvviso('confermata:3', false)).toBe('normale');
    expect(tonoAvviso('segnalazione:3', false)).toBe('normale');
  });
});

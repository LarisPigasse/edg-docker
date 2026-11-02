// Aggiornamenti della libreria: confronto a tre, preselezione, esito, ritiro (B10b)
import {
  categorieComparabili,
  confronta,
  daApplicare,
  daProporre,
  decisioneRitiro,
  esitoDi,
  sceltaPredefinita,
  scelteComplete,
  uguale,
} from '../../src/domini/aggiornamenti/aggiornamenti';

describe('aggiornamenti della libreria (B10b)', () => {
  const preavvisi = { giorni: [32, 8, 1] };

  test('uguale: ordine delle chiavi e null/assente non contano, gli array sì', () => {
    expect(uguale({ a: 1, b: { c: 2 } }, { b: { c: 2 }, a: 1 })).toBe(true);
    expect(uguale({ a: 1, b: undefined }, { a: 1 })).toBe(true);
    expect(uguale(null, undefined)).toBe(true);
    expect(uguale([1, 2], [2, 1])).toBe(false);
    expect(uguale({ giorni: [32, 8] }, preavvisi)).toBe(false);
  });

  test('da proporre: nuova versione, già allineata, ritiro, ritiro deciso o voce spenta', () => {
    const voce = { versioneLibreria: 1, versioneIgnorata: null, attiva: true };
    expect(daProporre(voce, { versione: 2, ritirata: false })).toBe('aggiornamento');
    expect(daProporre(voce, { versione: 1, ritirata: false })).toBeNull();
    expect(daProporre({ ...voce, versioneLibreria: null }, { versione: 1, ritirata: false })).toBe('aggiornamento');
    expect(daProporre(voce, { versione: 2, ritirata: true })).toBe('ritiro');
    expect(daProporre({ ...voce, versioneIgnorata: 2 }, { versione: 2, ritirata: true })).toBeNull();
    expect(daProporre({ ...voce, attiva: false }, { versione: 1, ritirata: true })).toBeNull();
  });

  test('confronta: non cambiato dalla libreria e già uguale nascosti, intatto, personalizzato, senza fotografia', () => {
    const origine = { nome: 'Revisione', preavvisi, tolleranza: { giorni: 0 }, destinatari: ['ufficio'] };
    const mio = { nome: 'Revisione', preavvisi: { giorni: [64, 8] }, tolleranza: { giorni: 0 }, destinatari: ['ufficio', 'assegnatario'] };
    const lib = { nome: 'Revisione periodica', preavvisi: { giorni: [64, 32, 8] }, tolleranza: { giorni: 0 }, destinatari: ['ufficio'] };
    const campi = confronta(['nome', 'preavvisi', 'tolleranza', 'destinatari'], origine, mio, lib);
    expect(campi).toEqual([
      { campo: 'nome', stato: 'intatto', mio: 'Revisione', libreria: 'Revisione periodica' },
      { campo: 'preavvisi', stato: 'personalizzato', mio: { giorni: [64, 8] }, libreria: { giorni: [64, 32, 8] } },
    ]);
    expect(confronta(['nome'], null, mio, lib)[0].stato).toBe('personalizzato');
  });

  test('preselezione: intatto → libreria, personalizzato → il tuo', () => {
    expect(sceltaPredefinita({ stato: 'intatto' })).toBe('libreria');
    expect(sceltaPredefinita({ stato: 'personalizzato' })).toBe('mio');
  });

  test('scelte complete: predefinite, scelte del cliente, campi estranei e valori non validi', () => {
    const proposti = [
      { campo: 'nome', stato: 'intatto' as const, mio: 'A', libreria: 'B' },
      { campo: 'preavvisi', stato: 'personalizzato' as const, mio: 1, libreria: 2 },
    ];
    expect(scelteComplete(proposti).campi.map(c => c.scelto)).toEqual(['libreria', 'mio']);
    expect(scelteComplete(proposti, { preavvisi: 'libreria' }).campi.map(c => c.scelto)).toEqual(['libreria', 'libreria']);
    expect(scelteComplete(proposti, { cadenza: 'libreria' }).errore).toMatch(/cadenza/);
    expect(scelteComplete(proposti, { nome: 'forse' }).errore).toMatch(/nome/);
  });

  test('esito e valori da applicare', () => {
    const c = (scelto: 'mio' | 'libreria', campo = 'x') => ({ campo, mio: 1, libreria: 2, scelto });
    expect(esitoDi([c('libreria'), c('libreria')])).toBe('accettato');
    expect(esitoDi([c('mio'), c('mio')])).toBe('rifiutato');
    expect(esitoDi([c('mio'), c('libreria')])).toBe('parziale');
    expect(esitoDi([])).toBe('accettato');
    expect(daApplicare([c('libreria', 'nome'), c('mio', 'preavvisi')])).toEqual({ nome: 2 });
  });

  test('ritiro nel registro e categorie confrontabili', () => {
    expect(decisioneRitiro('tieni').esito).toBe('rifiutato');
    expect(decisioneRitiro('disattiva')).toEqual({ esito: 'accettato', campi: [{ campo: 'ritirata', mio: false, libreria: true, scelto: 'libreria' }] });
    const delCliente = new Set(['auto', 'furgone']);
    expect(categorieComparabili(['furgone', 'autocarro', 'auto', 'auto'], delCliente)).toEqual(['auto', 'furgone']);
    expect(categorieComparabili(null, delCliente)).toEqual([]);
  });
});

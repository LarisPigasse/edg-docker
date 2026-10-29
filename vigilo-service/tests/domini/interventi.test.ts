// Interventi: natura, guasti, manodopera, costi e regole del tenant (passo 8, B10a)
import {
  costoManodopera,
  costoOrarioDi,
  costoTotale,
  daRimettereInServizio,
  deduciEsecuzione,
  entroProposto,
  erroriManodopera,
  eventoGuasto,
  manodoperaPredefinita,
  naturaEffettiva,
  oreManodopera,
  senzaPreavvisi,
  statoGuasto,
  TIPI_CON_GUASTI,
} from '../../src/domini/interventi/interventi';
import { erroriInterventi, interventiEffettivi, INTERVENTI_INIZIALI } from '../../src/domini/impostazioni/limiti';

describe('interventi (passo 8)', () => {
  const oggi = '2026-10-28';

  test('natura effettiva: propria, del controllo, promemoria', () => {
    expect(naturaEffettiva({ natura: 'riparazione' }, null)).toBe('riparazione');
    expect(naturaEffettiva({ natura: null }, { natura: 'manutenzione' })).toBe('manutenzione');
    expect(naturaEffettiva({}, null)).toBe('promemoria');
  });

  test('entro proposto: oggi se blocca l uso, altrimenti tra i giorni del tenant', () => {
    expect(entroProposto(true, 8, oggi)).toBe(oggi);
    expect(entroProposto(false, 8, oggi)).toBe('2026-11-05');
    expect(entroProposto(false, 0, oggi)).toBe(oggi);
  });

  test('manodopera: righe, ore a quarti d ora, persone non ripetute', () => {
    expect(erroriManodopera([{ idPersona: 1, ore: 1.25 }, { idPersona: null, ore: 3 }, { idPersona: null, ore: 0.5 }])).toEqual([]);
    expect(erroriManodopera(Array.from({ length: 9 }, () => ({ idPersona: null, ore: 1 })))).toEqual(['Al massimo 8 righe di manodopera']);
    expect(erroriManodopera([{ idPersona: 1, ore: 0 }])[0]).toMatch(/quarto d'ora a 1024/);
    expect(erroriManodopera([{ idPersona: 1, ore: 1025 }])[0]).toMatch(/1024/);
    expect(erroriManodopera([{ idPersona: 1, ore: 1.1 }])).toEqual(["Le ore si contano a quarti d'ora (es. 1,25)"]);
    expect(erroriManodopera([{ idPersona: 2, ore: 1 }, { idPersona: 2, ore: 2 }])).toEqual(['La stessa persona compare in due righe: somma le ore']);
  });

  test('costo orario: della persona, altrimenti il predefinito', () => {
    expect(costoOrarioDi({ costoOrario: 32 }, 24)).toBe(32);
    expect(costoOrarioDi({ costoOrario: null }, 24)).toBe(24);
    expect(costoOrarioDi(null, null)).toBeNull();
  });

  test('costi: manodopera al centesimo, totale con importo', () => {
    const righe = [
      { idPersona: 1, nome: 'Mario Rossi', ore: 1.5, costoOrario: 32 },
      { idPersona: null, nome: null, ore: 2, costoOrario: 24.5 },
      { idPersona: 3, nome: 'Luca Bianchi', ore: 4, costoOrario: null },
    ];
    expect(costoManodopera(righe)).toBe(97);
    expect(oreManodopera(righe)).toBe(7.5);
    expect(costoTotale(150.25, righe)).toBe(247.25);
    expect(costoTotale(150.25, null)).toBe(150.25);
    expect(costoTotale(null, [{ idPersona: 1, nome: null, ore: 1, costoOrario: null }])).toBeNull();
    expect(costoManodopera([])).toBeNull();
  });

  test('esecuzione: scelta, altrimenti dedotta', () => {
    expect(deduciEsecuzione('esterna', 2, false)).toBe('esterna');
    expect(deduciEsecuzione(null, 2, true)).toBe('entrambe');
    expect(deduciEsecuzione(undefined, 1, false)).toBe('interna');
    expect(deduciEsecuzione(null, 0, true)).toBe('esterna');
    expect(deduciEsecuzione(null, 0, false)).toBeNull();
  });

  test('manodopera predefinita per natura', () => {
    expect(manodoperaPredefinita('manutenzione')).toBe('facoltativo');
    expect(manodoperaPredefinita('riparazione')).toBe('facoltativo');
    expect(manodoperaPredefinita('adempimento')).toBe('facoltativo');
    expect(manodoperaPredefinita('pagamento')).toBe('nascosto');
    expect(manodoperaPredefinita('promemoria')).toBe('nascosto');
  });

  test('guasto: soggetti, evento, testo, niente preavvisi', () => {
    expect(TIPI_CON_GUASTI).toEqual(['veicolo', 'macchina', 'attrezzatura', 'sede']);
    expect(eventoGuasto(42)).toBe('guasto:42');
    expect(statoGuasto('Mario Rossi', true)).toBe('guasto segnalato da Mario Rossi, blocca l’uso');
    expect(statoGuasto(null, false)).toBe('guasto segnalato');
    expect(senzaPreavvisi('riparazione', 'preavviso')).toBe(true);
    expect(senzaPreavvisi('riparazione', 'preavviso-uso')).toBe(true);
    expect(senzaPreavvisi('riparazione', 'scaduta')).toBe(false);
    expect(senzaPreavvisi(null, 'preavviso')).toBe(false);
  });

  test('rimessa in servizio: guasto bloccante, mezzo sospeso, nessun altro bloccante', () => {
    const g = { natura: 'riparazione' as const, bloccaUso: true };
    expect(daRimettereInServizio(g, 'fermo', 0)).toBe(true);
    expect(daRimettereInServizio(g, 'fermo', 1)).toBe(false);
    expect(daRimettereInServizio(g, 'in-servizio', 0)).toBe(false);
    expect(daRimettereInServizio({ ...g, bloccaUso: false }, 'fermo', 0)).toBe(false);
    expect(daRimettereInServizio({ natura: null, bloccaUso: true }, 'fermo', 0)).toBe(false);
  });

  test('regole del tenant: limiti e valori effettivi', () => {
    expect(INTERVENTI_INIZIALI).toEqual({ costoOrario: null, giorniRiparazione: 8 });
    expect(erroriInterventi({ costoOrario: 32.5, giorniRiparazione: 16 })).toEqual([]);
    expect(erroriInterventi({ costoOrario: null })).toEqual([]);
    expect(erroriInterventi({ costoOrario: 2048 })[0]).toMatch(/da 0 a 1024/);
    expect(erroriInterventi({ costoOrario: 10.005 })[0]).toMatch(/centesimo/);
    expect(erroriInterventi({ giorniRiparazione: 65 })[0]).toMatch(/da 0 a 64/);
    expect(interventiEffettivi({ costoOrario: -1, giorniRiparazione: 4 })).toEqual({ costoOrario: null, giorniRiparazione: 4 });
    expect(interventiEffettivi(null)).toEqual(INTERVENTI_INIZIALI);
  });
});

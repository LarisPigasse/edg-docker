// Parametri della piattaforma e regole degli avvisi del tenant (ADR093)
import { limita, parametro } from '../../src/core/parametri';
import { AVVISI_INIZIALI, avvisiEffettivi, erroriAvvisi, inSilenzio, minutiDi, stesseRegole, uniscilRegole } from '../../src/domini/impostazioni/limiti';

describe('parametri della piattaforma', () => {
  const l = { predefinito: 16, min: 4, max: 64 };
  test('predefinito, valore valido, fuori limite, non numerico', () => {
    expect(parametro('X', l, {})).toBe(16);
    expect(parametro('X', l, { X: '32' })).toBe(32);
    expect(parametro('X', l, { X: '1' })).toBe(4);
    expect(parametro('X', l, { X: '1000' })).toBe(64);
    expect(parametro('X', l, { X: 'tanti' })).toBe(16);
    expect(limita(8, 4, 64)).toBe(8);
  });
});

describe('regole degli avvisi del tenant', () => {
  test('i predefiniti sono validi', () => {
    expect(erroriAvvisi(AVVISI_INIZIALI)).toEqual([]);
  });
  test('valori fuori limite rifiutati', () => {
    expect(erroriAvvisi({ orarioRiepilogo: '04:00' })).toHaveLength(1);
    expect(erroriAvvisi({ orarioRiepilogo: '8:00' })).toHaveLength(1);
    expect(erroriAvvisi({ giorniLavorativi: [] })).toHaveLength(1);
    expect(erroriAvvisi({ giorniLavorativi: [8] })).toHaveLength(1);
    expect(erroriAvvisi({ intervalloRichiami: 128 })).toHaveLength(1);
    expect(erroriAvvisi({ silenzio: { dalle: '18:00', alle: '08:00' } })).toHaveLength(1);
  });
  test('valori validi ai limiti', () => {
    expect(erroriAvvisi({ orarioRiepilogo: '12:00', intervalloRichiami: 0, giorniLavorativi: [6], silenzio: { dalle: '20:00', alle: '08:00' } })).toEqual([]);
  });
  test('regole salvate: mancanti e sbagliate prendono il predefinito', () => {
    expect(avvisiEffettivi(null)).toEqual(AVVISI_INIZIALI);
    const r = avvisiEffettivi({ orarioRiepilogo: '07:32', intervalloRichiami: 999, giorniLavorativi: [5, 1, 1] });
    expect(r).toEqual({ ...AVVISI_INIZIALI, orarioRiepilogo: '07:32', giorniLavorativi: [1, 5] });
  });
  test('silenzio a cavallo della mezzanotte, e silenzio tolto', () => {
    const s = AVVISI_INIZIALI.silenzio;
    expect(['21:59', '22:00', '23:30', '00:00', '06:59', '07:00'].map(o => inSilenzio(minutiDi(o)!, s))).toEqual([false, true, true, true, true, false]);
    expect(inSilenzio(minutiDi('03:00')!, { dalle: '00:00', alle: '00:00' })).toBe(false);
    expect(inSilenzio(minutiDi('13:00')!, { dalle: '12:00', alle: '14:00' })).toBe(true);
  });
  test('modifica parziale: cambia solo ciò che arriva, giorni ordinati e senza doppioni', () => {
    const salvate = { orarioRiepilogo: '07:00', intervalloRichiami: 4 };
    const r = uniscilRegole(salvate, { giorniLavorativi: [6, 1, 2, 2, 3, 4, 5] });
    expect(r).toEqual({ ...AVVISI_INIZIALI, orarioRiepilogo: '07:00', intervalloRichiami: 4, giorniLavorativi: [1, 2, 3, 4, 5, 6] });
  });
  test('modifica del silenzio: tolto (dalle = alle) e rimesso', () => {
    const spento = uniscilRegole(null, { silenzio: { dalle: '00:00', alle: '00:00' } });
    expect(spento.silenzio).toEqual({ dalle: '00:00', alle: '00:00' });
    expect(uniscilRegole(spento, { silenzio: { dalle: '21:00', alle: '06:00' } }).silenzio).toEqual({ dalle: '21:00', alle: '06:00' });
  });
  test('stesse regole: ordine dei giorni normalizzato, ogni campo conta', () => {
    expect(stesseRegole(uniscilRegole(null, {}), AVVISI_INIZIALI)).toBe(true);
    expect(stesseRegole(uniscilRegole(null, { giorniLavorativi: [5, 4, 3, 2, 1] }), AVVISI_INIZIALI)).toBe(true);
    expect(stesseRegole(uniscilRegole(null, { intervalloRichiami: 16 }), AVVISI_INIZIALI)).toBe(false);
    expect(stesseRegole(uniscilRegole(null, { silenzio: { dalle: '22:00', alle: '06:00' } }), AVVISI_INIZIALI)).toBe(false);
  });
});

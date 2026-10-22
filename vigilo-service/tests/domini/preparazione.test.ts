// Chi prepara Vigilo (ADR088): lettura della config di EDG e chi può avviare
import { leggiPreparazione, puoAvviare, inPreparazioneQui } from '../../src/domini/avvio/preparazione';
import type { AssistenzaUtente } from '../../src/core/middleware/auth';

const assistita = (modo: AssistenzaUtente['modo'], idTenant: number): AssistenzaUtente => ({
  id: 8,
  modo,
  operatore: { id: 1, email: 'op@edg.it', nome: 'Mario Rossi' },
  tenant: { id: idTenant, nome: 'Cliente' },
  scade: '2026-10-22T10:00:00.000Z',
});

describe('chi prepara Vigilo', () => {
  test('senza config prepara il cliente, nessun settore suggerito', () => {
    expect(leggiPreparazione(null)).toEqual({ chi: 'cliente', modelli: [] });
    expect(leggiPreparazione({})).toEqual({ chi: 'cliente', modelli: [] });
  });

  test('config di EDG: preparazione e settori, valori estranei ignorati', () => {
    expect(leggiPreparazione({ preparazione: 'edg', idOperatore: 1, modelli: ['base', 'trasporto', 4] })).toEqual({
      chi: 'edg',
      modelli: ['base', 'trasporto'],
    });
    expect(leggiPreparazione({ preparazione: 'altro' }).chi).toBe('cliente');
  });

  test('prepara il cliente: può avviare chi ha il permesso', () => {
    expect(puoAvviare({ chi: 'cliente', modelli: [] }, false, null, 2)).toBe(true);
  });

  test('prepara EDG: prima dell avvio solo la sessione assistita in Preparazione nel tenant', () => {
    const p = { chi: 'edg' as const, modelli: [] };
    expect(puoAvviare(p, false, null, 2)).toBe(false);
    expect(puoAvviare(p, false, assistita('preparazione', 2), 2)).toBe(true);
    expect(puoAvviare(p, false, assistita('preparazione', 3), 2)).toBe(false);
    expect(puoAvviare(p, false, assistita('assistenza', 2), 2)).toBe(false);
  });

  test('dopo l avvio "Aggiungi dalla libreria" torna del cliente', () => {
    expect(puoAvviare({ chi: 'edg', modelli: [] }, true, null, 2)).toBe(true);
  });

  test('inPreparazioneQui', () => {
    expect(inPreparazioneQui(undefined, 2)).toBe(false);
    expect(inPreparazioneQui(assistita('preparazione', 2), 2)).toBe(true);
  });
});

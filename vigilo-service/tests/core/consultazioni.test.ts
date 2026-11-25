// Consultazioni (fase 1 dei log, passo 1e — ADR117)
jest.mock('../../src/core/services/logger', () => ({ logger: { audit: jest.fn() } }));

import type { Contesto } from '../../src/core/contesto';
import { contestoDiProcesso } from '../../src/core/contesto';
import { PARAMETRI } from '../../src/core/parametri';
import { chiaveConsultazione, consultato, daRegistrare, fraseConsultazione } from '../../src/core/services/consultazioni';
import { logger } from '../../src/core/services/logger';

const audit = logger.audit as jest.Mock;
const base = contestoDiProcesso(2);
const ctx = (o: Partial<Contesto['utente']> = {}): Contesto => ({ ...base, utente: { ...base.utente, id: 9, email: 'demo.admin@esempio.it', ...o } });
const assistito = ctx({ id: 4, email: 'demo.utente@esempio.it', assistenza: { id: 7, modo: 'assistenza', operatore: { id: 3, email: 'edg@esempio.it', nome: 'Mario Rossi' }, tenant: { id: 2, nome: 'Demo' }, scade: '2026-12-01T00:00:00Z' } });
const attendi = () => new Promise(r => setTimeout(r, 0));

describe('regole delle consultazioni', () => {
  test('la chiave distingue tenant, persona, assistenza, cosa e oggetto', () => {
    expect(chiaveConsultazione(ctx(), 'soggetto', 'u1')).toBe('2:9:-:soggetto:u1');
    expect(chiaveConsultazione(assistito, 'soggetto', 'u1')).toBe('2:4:7:soggetto:u1');
    expect(chiaveConsultazione(ctx(), 'analisi')).toBe('2:9:-:analisi:-');
  });

  test('entro la pausa conta una volta; la finestra riparte a ogni consultazione', () => {
    const m = new Map<string, number>();
    const pausa = 16 * 60_000;
    expect(daRegistrare(m, 'k', 0, pausa)).toBe(true);
    expect(daRegistrare(m, 'k', 10 * 60_000, pausa)).toBe(false);
    // 20 minuti dal primo ma 10 dall'ultimo: ancora dentro
    expect(daRegistrare(m, 'k', 20 * 60_000, pausa)).toBe(false);
    expect(daRegistrare(m, 'k', 37 * 60_000, pausa)).toBe(true);
    expect(daRegistrare(m, 'altro', 37 * 60_000, pausa)).toBe(true);
  });

  test('la frase dice che cosa, di chi e, in assistenza, chi di EDG', () => {
    expect(fraseConsultazione(ctx(), 'soggetto', 'DAF XF 01')).toBe('Ha aperto la scheda di DAF XF 01: demo.admin@esempio.it');
    expect(fraseConsultazione(assistito, 'documento-scaricato', '«Libretto.pdf» (DAF XF 01)')).toBe(
      'Ha scaricato il documento «Libretto.pdf» (DAF XF 01): demo.utente@esempio.it (assistenza EDG: Mario Rossi)'
    );
    expect(fraseConsultazione(ctx(), 'analisi', null)).toBe("Ha consultato l'Analisi dei costi: demo.admin@esempio.it");
    expect(fraseConsultazione(ctx(), 'fornitore', null)).toBe('Ha aperto la scheda del fornitore (nome non disponibile): demo.admin@esempio.it');
  });

  test('la pausa è un parametro con i suoi limiti (16 minuti, da 1 a 256)', () => {
    expect(PARAMETRI.consultazioniPausaMinuti).toBe(16);
  });
});

describe('consultato', () => {
  beforeEach(() => audit.mockClear());

  test('scrive un evento USO vigilo.consultazione con oggetto e persona, una volta sola', async () => {
    const c = ctx({ id: 11 });
    consultato(c, 'soggetto', { id: 's1', nome: 'DAF XF 01' });
    consultato(c, 'soggetto', { id: 's1', nome: 'DAF XF 01' });
    await attendi();
    expect(audit).toHaveBeenCalledTimes(1);
    const [azione, frase, attore, meta, categoria] = audit.mock.calls[0];
    expect(azione).toBe('vigilo.consultazione');
    expect(categoria).toBe('USO');
    expect(frase).toBe('Ha aperto la scheda di DAF XF 01: demo.admin@esempio.it');
    expect(attore).toEqual({ id: 11, email: 'demo.admin@esempio.it', tenantId: 2 });
    expect(meta).toEqual({ cosa: 'soggetto', id: 's1', nome: 'DAF XF 01' });
  });

  test('il nome da cercare si cerca solo se la consultazione si registra', async () => {
    const c = ctx({ id: 12 });
    const cerca = jest.fn().mockResolvedValue('Officina Di Marco');
    consultato(c, 'fornitore', { id: 'f1', nome: cerca });
    consultato(c, 'fornitore', { id: 'f1', nome: cerca });
    await attendi();
    expect(cerca).toHaveBeenCalledTimes(1);
    expect(audit.mock.calls[0][1]).toBe('Ha aperto la scheda del fornitore Officina Di Marco: demo.admin@esempio.it');
  });

  test('se cercare il nome fallisce, l\'evento si scrive lo stesso', async () => {
    consultato(ctx({ id: 13 }), 'andamento-mezzo', { id: 'm1', nome: () => Promise.reject(new Error('db')) });
    await attendi();
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit.mock.calls[0][1]).toBe("Ha consultato l'andamento dei costi di (nome non disponibile): demo.admin@esempio.it");
  });

  test('in assistenza l\'evento nomina l\'operatore EDG', async () => {
    consultato(assistito, 'scadenza', { id: 'x1', nome: 'Revisione di DAF XF 01' });
    await attendi();
    expect(audit.mock.calls[0][3].assistenza).toEqual({ modo: 'assistenza', operatore: { id: 3, email: 'edg@esempio.it', nome: 'Mario Rossi' } });
  });

  test('i report contano una volta anche cambiando i filtri; i filtri sono quelli della prima', async () => {
    const c = ctx({ id: 14 });
    consultato(c, 'resoconto-spese', { dettagli: { filtri: { periodo: 'anno' } } });
    consultato(c, 'resoconto-spese', { dettagli: { filtri: { periodo: '12m' } } });
    await attendi();
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit.mock.calls[0][3].filtri).toEqual({ periodo: 'anno' });
  });

  test('i processi pianificati non consultano niente', async () => {
    consultato(contestoDiProcesso(2), 'dashboard');
    await attendi();
    expect(audit).not.toHaveBeenCalled();
  });

  test('le letture in sottofondo non contano e non occupano la pausa', async () => {
    const c = ctx({ id: 15 });
    consultato({ ...c, sfondo: true }, 'dashboard');
    await attendi();
    expect(audit).not.toHaveBeenCalled();
    consultato(c, 'dashboard');
    await attendi();
    expect(audit).toHaveBeenCalledTimes(1);
  });
});

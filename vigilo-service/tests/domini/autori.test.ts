// Chi ha scritto lo storico: nomi degli autori nelle registrazioni (revisione 2026-11-10)
import type { Contesto } from '../../src/core/contesto';
import { contestoDiProcesso } from '../../src/core/contesto';
import type { Registrazione } from '../../src/domini/registrazioni/registrazione.model';
import { presentaRegistrazione } from '../../src/domini/scadenze/scadenza.presenta';
import { NESSUN_NOME, nomeAutore, nomiAutori } from '../../src/domini/soggetti/autori';

const nomi = new Map([
  [9, 'Demo Admin'],
  [4, 'Demo Utente'],
]);

const ctx: Contesto = { ...contestoDiProcesso(2), utente: { ...contestoDiProcesso(2).utente, id: 9 } };

const registrazione = (r: Partial<Registrazione>): Registrazione =>
  ({
    uuidRegistrazione: 'r1',
    tipo: 'esecuzione',
    stato: 'confermata',
    eseguitaIl: '2026-11-05',
    createdAt: new Date('2026-11-05T10:00:00Z'),
    manodopera: null,
    creatoDa: null,
    confermataDa: null,
    confermataIl: null,
    ...r,
  }) as unknown as Registrazione;

describe('autori dello storico', () => {
  test('il nome di un autore; null per i processi e per i nomi non letti', () => {
    expect(nomeAutore(nomi, 9)).toBe('Demo Admin');
    expect(nomeAutore(nomi, null)).toBeNull();
    expect(nomeAutore(nomi, 128)).toBeNull();
  });

  test('senza account da cercare non si chiama auth-service', async () => {
    await expect(nomiAutori([null, undefined])).resolves.toBe(NESSUN_NOME);
  });

  test('registrazione scritta da una persona', () => {
    const p = presentaRegistrazione(registrazione({ creatoDa: 9 }), ctx, nomi);
    expect(p).toMatchObject({ registrataDa: 'Demo Admin', automatica: false, confermataDa: null, tua: true });
  });

  test('segnalazione dell\'addetto confermata dall\'ufficio', () => {
    const il = new Date('2026-11-06T08:00:00Z');
    const p = presentaRegistrazione(registrazione({ creatoDa: 4, confermataDa: 9, confermataIl: il }), ctx, nomi);
    expect(p).toMatchObject({ registrataDa: 'Demo Utente', confermataDa: 'Demo Admin', confermataIl: il, tua: false });
  });

  test('rinnovo tacito: automatica, senza nome', () => {
    const p = presentaRegistrazione(registrazione({ tipo: 'rinnovo-tacito', creatoDa: null }), ctx, nomi);
    expect(p).toMatchObject({ registrataDa: null, automatica: true });
  });

  test('nomi non letti (auth-service fermo): la registrazione esce lo stesso, senza nome', () => {
    const p = presentaRegistrazione(registrazione({ creatoDa: 9 }), ctx);
    expect(p).toMatchObject({ registrataDa: null, automatica: false });
  });
});

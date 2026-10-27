// A chi va un avviso (04-avvisi 4.3, ADR090)
import {
  LIMITI_DESTINATARI,
  anteprimaDestinatari,
  erroriDestinatari,
  risolviDestinatari,
  ufficioDa,
  type ContestoAnteprima,
  type ContestoDestinatari,
} from '../../src/domini/avvisi/destinatari';

const base = (c: Partial<ContestoDestinatari> = {}): ContestoDestinatari => ({
  destinatari: [{ tipo: 'ufficio' }, { tipo: 'referente' }, { tipo: 'assegnatario' }],
  soggettoFermo: false,
  avvisaAncheSeFermo: false,
  ufficio: [2, 4],
  referente: { idAccount: 7, email: 'ref@cliente.it' },
  assegnatari: [{ idAccount: null, email: 'Autista@Cliente.it ' }],
  interessato: null,
  ...c,
});

describe('destinatari degli avvisi', () => {
  test('ufficio, referente con account, assegnatario senza account (email)', () => {
    expect(risolviDestinatari(base())).toEqual({ account: [2, 4, 7], email: ['autista@cliente.it'] });
  });

  test('nessun doppione: il referente è anche dell ufficio', () => {
    expect(risolviDestinatari(base({ referente: { idAccount: 4, email: null } })).account).toEqual([2, 4]);
  });

  test('soggetto fermo: solo l ufficio', () => {
    expect(risolviDestinatari(base({ soggettoFermo: true }))).toEqual({ account: [2, 4], email: [] });
  });

  test('fermo ma "avvisa anche se fermo": tutti', () => {
    expect(risolviDestinatari(base({ soggettoFermo: true, avvisaAncheSeFermo: true })).account).toEqual([2, 4, 7]);
  });

  test('interessato ed email aggiuntive', () => {
    const r = risolviDestinatari(
      base({ destinatari: [{ tipo: 'interessato' }, { tipo: 'email', email: 'consulente@studio.it' }], interessato: { idAccount: null, email: 'mario@cliente.it' } })
    );
    expect(r).toEqual({ account: [], email: ['consulente@studio.it', 'mario@cliente.it'] });
  });

  test('persona senza account né email: niente', () => {
    expect(risolviDestinatari(base({ destinatari: [{ tipo: 'referente' }], referente: { idAccount: null, email: null } }))).toEqual({ account: [], email: [] });
  });

  test('filtri delle preferenze: tolgono solo chi riceve come ufficio', () => {
    expect(risolviDestinatari(base({ filtroUfficio: id => id !== 2 })).account).toEqual([4, 7]);
  });

  test('filtri delle preferenze: chi è anche referente riceve comunque', () => {
    const r = risolviDestinatari(base({ referente: { idAccount: 4, email: null }, filtroUfficio: () => false }));
    expect(r).toEqual({ account: [4], email: ['autista@cliente.it'] });
  });

  test('ufficio = lettura o scrittura', () => {
    expect(
      ufficioDa([
        { id: 1, capacita: { read: true, write: false } },
        { id: 2, capacita: { read: false, write: false } },
        { id: 3, capacita: { read: true, write: true } },
      ])
    ).toEqual([1, 3]);
  });
});

describe('errori dei destinatari (B8d-3)', () => {
  test('elenco valido', () => {
    expect(erroriDestinatari([{ tipo: 'ufficio' }, { tipo: 'referente' }, { tipo: 'email', email: 'consulente@studio.it' }])).toEqual([]);
  });
  test('vuoto, doppioni (anche email con maiuscole), troppi', () => {
    expect(erroriDestinatari([])).toEqual(['Serve almeno un destinatario']);
    expect(erroriDestinatari([{ tipo: 'ufficio' }, { tipo: 'ufficio' }])).toEqual(['Lo stesso destinatario compare due volte']);
    expect(erroriDestinatari([{ tipo: 'email', email: 'A@b.it' }, { tipo: 'email', email: 'a@B.it ' }])).toEqual(['Lo stesso destinatario compare due volte']);
    const troppi = Array.from({ length: LIMITI_DESTINATARI.massimo + 1 }, (_, i) => ({ tipo: 'email' as const, email: `x${i}@studio.it` }));
    expect(erroriDestinatari(troppi)).toEqual([`Al massimo ${LIMITI_DESTINATARI.massimo} destinatari`]);
  });
});

describe('anteprima dei destinatari (B8d-3)', () => {
  const contesto = (c: Partial<ContestoAnteprima> = {}): ContestoAnteprima => ({
    destinatari: [{ tipo: 'ufficio' }, { tipo: 'referente' }, { tipo: 'assegnatario' }, { tipo: 'interessato' }, { tipo: 'email', email: 'Officina@Rossi.it' }],
    soggettoFermo: false,
    avvisaAncheSeFermo: false,
    referente: { idAccount: 7, email: null, nome: 'Mario Rossi' },
    assegnatari: [{ idAccount: null, email: 'autista@cliente.it', nome: 'Luca Bianchi' }],
    interessato: null,
    soggettoPersona: false,
    ...c,
  });

  test('nomi e recapiti; interessato ignorato se il soggetto non è una persona', () => {
    expect(anteprimaDestinatari(contesto())).toEqual({
      ufficio: true,
      soloUfficio: false,
      voci: [
        { ruolo: 'referente', nome: 'Mario Rossi', email: null, recapito: 'app' },
        { ruolo: 'assegnatario', nome: 'Luca Bianchi', email: 'autista@cliente.it', recapito: 'email' },
        { ruolo: 'email', nome: null, email: 'officina@rossi.it', recapito: 'email' },
      ],
    });
  });

  test('ruoli vuoti: nessuno li riceve, e lo si dice', () => {
    const a = anteprimaDestinatari(contesto({ destinatari: [{ tipo: 'referente' }, { tipo: 'assegnatario' }], referente: { idAccount: null, email: null, nome: 'Senza recapito' }, assegnatari: [] }));
    expect(a.voci).toEqual([
      { ruolo: 'referente', nome: 'Senza recapito', email: null, recapito: 'nessuno' },
      { ruolo: 'assegnatario', nome: null, email: null, recapito: 'nessuno' },
    ]);
    expect(a.ufficio).toBe(false);
  });

  test('soggetto fermo: solo l ufficio; persona: interessato', () => {
    expect(anteprimaDestinatari(contesto({ soggettoFermo: true }))).toEqual({ ufficio: true, soloUfficio: true, voci: [] });
    const p = anteprimaDestinatari(contesto({ destinatari: [{ tipo: 'interessato' }], soggettoPersona: true, interessato: { idAccount: null, email: 'mario@cliente.it', nome: 'Mario' } }));
    expect(p.voci).toEqual([{ ruolo: 'interessato', nome: 'Mario', email: 'mario@cliente.it', recapito: 'email' }]);
  });
});

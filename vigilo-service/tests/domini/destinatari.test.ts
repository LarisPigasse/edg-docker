// A chi va un avviso (04-avvisi 4.3, ADR090)
import { risolviDestinatari, ufficioDa, type ContestoDestinatari } from '../../src/domini/avvisi/destinatari';

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

// Vigilo è pronto (ADR089): chi riceve le email
import { destinatariPronto, nomeProprio } from '../../src/domini/avvio/pronto';
import type { ContattiAnagrafica } from '../../src/core/clients/systemClient';

const contatti = (c: Partial<ContattiAnagrafica> = {}): ContattiAnagrafica => ({
  ragioneSociale: 'Trasporti Rossi srl',
  referente: 'Anna Bianchi',
  telefonoReferente: null,
  emailReferente: 'anna@rossi.it',
  email: 'info@rossi.it',
  isActive: true,
  seguitoDa: { nome: 'Mario Verdi', email: 'mario@edg.it', isActive: true },
  ...c,
});

describe('destinatari di "Vigilo è pronto"', () => {
  test('preparato da EDG: referente e operatore', () => {
    expect(destinatariPronto(contatti(), true)).toEqual({ cliente: 'anna@rossi.it', operatore: { nome: 'Mario Verdi', email: 'mario@edg.it' } });
  });

  test('preparato dal cliente: solo l operatore', () => {
    expect(destinatariPronto(contatti(), false).cliente).toBeNull();
    expect(destinatariPronto(contatti(), false).operatore?.email).toBe('mario@edg.it');
  });

  test('senza email del referente: quella dell azienda; senza nessuna: niente', () => {
    expect(destinatariPronto(contatti({ emailReferente: '  ' }), true).cliente).toBe('info@rossi.it');
    expect(destinatariPronto(contatti({ emailReferente: null, email: null }), true).cliente).toBeNull();
  });

  test('operatore senza email, disattivato o assente: niente', () => {
    expect(destinatariPronto(contatti({ seguitoDa: { nome: 'M', email: null, isActive: true } }), true).operatore).toBeNull();
    expect(destinatariPronto(contatti({ seguitoDa: { nome: 'M', email: 'm@edg.it', isActive: false } }), true).operatore).toBeNull();
    expect(destinatariPronto(contatti({ seguitoDa: null }), true).operatore).toBeNull();
  });

  test('tenant senza cliente collegato: nessuno', () => {
    expect(destinatariPronto(null, true)).toEqual({ cliente: null, operatore: null });
  });

  test('nome proprio per il saluto', () => {
    expect(nomeProprio('Mario Verdi')).toBe('Mario');
  });
});

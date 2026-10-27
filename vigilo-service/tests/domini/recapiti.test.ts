// Recapiti email senza account: "Non ricevere più questi avvisi" (B8d-4)
import { FORMATO_CODICE, LIMITI_RECAPITI, chiaveRecapito, codiceValido, mascheraEmail, nuovoCodice } from '../../src/domini/avvisi/recapiti';

describe('recapiti email (B8d-4)', () => {
  test('codice: base64url della lunghezza giusta, ogni volta diverso', () => {
    const a = nuovoCodice();
    const b = nuovoCodice();
    expect(a).toMatch(FORMATO_CODICE);
    expect(a).toHaveLength(Math.ceil((LIMITI_RECAPITI.byteCodice * 4) / 3));
    expect(a).not.toBe(b);
  });

  test('codice valido solo nel formato giusto', () => {
    expect(codiceValido(nuovoCodice())).toBe(true);
    expect(codiceValido('corto')).toBe(false);
    expect(codiceValido(`${nuovoCodice()}x`)).toBe(false);
    expect(codiceValido('a'.repeat(42) + '/')).toBe(false);
    expect(codiceValido(undefined)).toBe(false);
  });

  test('email mascherata e chiave senza maiuscole né spazi', () => {
    expect(mascheraEmail(' Mario.Rossi@Example.com ')).toBe('ma•••@example.com');
    expect(mascheraEmail('ab@x.it')).toBe('a•••@x.it');
    expect(mascheraEmail('senza-chiocciola')).toBe('•••');
    expect(chiaveRecapito(4, ' Studio@Rossi.IT')).toBe('4:studio@rossi.it');
  });
});

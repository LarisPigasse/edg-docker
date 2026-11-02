// Avviso degli aggiornamenti della libreria: testo e impronta (B10b passo 2)
import { improntaAttesa, testoAvvisoLibreria } from '../../src/domini/aggiornamenti/avvisoLibreria';
import { statoDelTesto } from '../../src/domini/avvisi/testo';

describe('avviso della libreria (B10b)', () => {
  test('testo: una, tre, oltre quattro voci', () => {
    expect(testoAvvisoLibreria(['Revisione'])).toBe('Aggiornamenti della libreria: 1 voce da decidere (Revisione)');
    expect(testoAvvisoLibreria(['Revisione', 'Assicurazione RCA', 'Autovetture'])).toBe(
      'Aggiornamenti della libreria: 3 voci da decidere (Revisione, Assicurazione RCA e Autovetture)'
    );
    expect(testoAvvisoLibreria(['A', 'B', 'C', 'D', 'E'])).toMatch(/5 voci da decidere \(A, B, C, D e un’altra\)$/);
    expect(testoAvvisoLibreria(['A', 'B', 'C', 'D', 'E', 'F'])).toMatch(/\(A, B, C, D e altre 2\)$/);
  });

  test('il separatore nei nomi non rompe titolo e stato', () => {
    const t = testoAvvisoLibreria(['Revisione: estintori', 'Tagliando']);
    expect(statoDelTesto(t)).toBe('2 voci da decidere (Revisione – estintori e Tagliando)');
  });

  test('impronta: stessa con ordine diverso, diversa se cambia una versione, entro 64 caratteri', () => {
    const a = { entita: 'controllo', chiave: 'veicolo.revisione', versione: 2, tipo: 'aggiornamento' };
    const b = { entita: 'categoria', chiave: 'veicolo.autovetture', versione: 3, tipo: 'aggiornamento' };
    expect(improntaAttesa([a, b])).toBe(improntaAttesa([b, a]));
    expect(improntaAttesa([a, b])).not.toBe(improntaAttesa([{ ...a, versione: 3 }, b]));
    expect(improntaAttesa([a]).length).toBeLessThanOrEqual(64);
  });
});

// La libreria EDG e' coerente e ogni cambio di contenuto ha la sua versione
import { readFileSync } from 'fs';
import { join } from 'path';
import { LIBRERIA, validaLibreria, impronte } from '../../src/libreria';
import { confrontaImpronte, type Impronte } from '../../src/libreria/impronta';
import { m } from '../../src/libreria/costruttori';

describe('libreria EDG', () => {
  test('nessun errore di coerenza', () => {
    expect(validaLibreria(LIBRERIA)).toEqual([]);
  });

  test('contenuto e versioni allineati a versioni.json', () => {
    const registrate: Impronte = JSON.parse(readFileSync(join(__dirname, '../../src/libreria/versioni.json'), 'utf8'));
    const { errori, daAggiornare } = confrontaImpronte(impronte(LIBRERIA), registrate);
    // Errori: aumentare la versione delle voci cambiate. Da aggiornare: npm run libreria:versioni
    expect(errori).toEqual([]);
    expect(daAggiornare).toEqual([]);
  });

  test('numeri della bozza approvata', () => {
    expect(LIBRERIA.modelli).toHaveLength(5);
    expect(LIBRERIA.controlli).toHaveLength(123);
    expect(LIBRERIA.categorie).toHaveLength(33);
  });

  test('appartenenza ai modelli scritta come nella bozza', () => {
    expect(m('B T✓ L')).toEqual({ base: false, trasporto: true, logistica: false });
    expect(() => m('X')).toThrow();
    expect(() => m('B!')).toThrow();
  });

  test('la validazione trova gli errori', () => {
    const rotta = {
      ...LIBRERIA,
      controlli: [
        { ...LIBRERIA.controlli[0], categorie: ['veicolo.inesistente'] },
        { ...LIBRERIA.controlli[1], cadenza: { ...LIBRERIA.controlli[1].cadenza, ancoraggio: 'finestra' as const } },
        { ...LIBRERIA.controlli[2], preavvisi: { giorni: [8, 32], uso: [] } },
        { ...LIBRERIA.controlli[3], versione: 2 },
      ],
    };
    const errori = validaLibreria(rotta);
    expect(errori.some(e => e.includes('categoria veicolo.inesistente inesistente'))).toBe(true);
    expect(errori.some(e => e.includes('finestra'))).toBe(true);
    expect(errori.some(e => e.includes('non decrescenti'))).toBe(true);
    expect(errori.some(e => e.includes('serve la novità'))).toBe(true);
  });
});

describe('versioni', () => {
  const base: Impronte = { 'controllo:x': { versione: 1, impronta: 'a' } };
  test('contenuto cambiato senza nuova versione = errore', () => {
    expect(confrontaImpronte({ 'controllo:x': { versione: 1, impronta: 'b' } }, base).errori).toHaveLength(1);
  });
  test('versione aumentata o voce nuova = da registrare', () => {
    const r = confrontaImpronte({ 'controllo:x': { versione: 2, impronta: 'b' }, 'controllo:y': { versione: 1, impronta: 'c' } }, base);
    expect(r.errori).toEqual([]);
    expect(r.daAggiornare).toHaveLength(2);
  });
});

// Fornitori: filtro per stato e nome già usato (F1)
import { erroreDoppione, filtroAttivo } from '../../src/domini/fornitori/fornitori';

describe('fornitori (F1)', () => {
  test('filtro per stato: stato vince su attivo, predefinito attivi', () => {
    expect(filtroAttivo()).toBe(true);
    expect(filtroAttivo(undefined, false)).toBe(false);
    expect(filtroAttivo('attivi', false)).toBe(true);
    expect(filtroAttivo('disattivati')).toBe(false);
    expect(filtroAttivo('tutti', true)).toBeUndefined();
  });

  test('nome già usato: nessun errore se libero, riattivare se disattivato', () => {
    expect(erroreDoppione(null)).toBeNull();
    expect(erroreDoppione({ nome: 'Officina Rossi', attivo: true })).toMatch(/Esiste già.*"Officina Rossi"/);
    expect(erroreDoppione({ nome: 'Officina Rossi', attivo: false })).toMatch(/disattivato.*Riattivalo/);
  });
});

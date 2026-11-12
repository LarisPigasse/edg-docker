// Controlli non seguiti per soggetto: regole pure (revisione 2026-11-11)
import { LIMITI_ESCLUSIONE, comeRiprendere, coppia, motivoValido, notaValida } from '../../src/domini/esclusioni/esclusioni';

const base = { soggettoDismesso: false, controlloAttivo: true, controlloAutomatico: true, daRiaprire: true, giaAperta: false };

describe('controlli non seguiti', () => {
  test('il motivo è obbligatorio e si ripulisce', () => {
    expect(motivoValido('  mezzo   esente  ')).toBe('mezzo esente');
    expect(() => motivoValido('')).toThrow(/motivo/);
    expect(() => motivoValido(' x ')).toThrow(/motivo/);
    expect(() => motivoValido(null)).toThrow(/motivo/);
    expect(() => motivoValido('a'.repeat(LIMITI_ESCLUSIONE.motivo.max + 1))).toThrow(/troppo lungo/);
  });

  test('la nota della ripresa è facoltativa', () => {
    expect(notaValida('')).toBeNull();
    expect(notaValida(undefined)).toBeNull();
    expect(notaValida(' torna in uso ')).toBe('torna in uso');
    expect(() => notaValida('a'.repeat(LIMITI_ESCLUSIONE.motivo.max + 1))).toThrow(/troppo lunga/);
  });

  test('si riapre la scadenza di prima, con le sue date', () => {
    expect(comeRiprendere(base)).toBe('riapri');
    // anche per un controllo non automatico: la scadenza c'era
    expect(comeRiprendere({ ...base, controlloAutomatico: false })).toBe('riapri');
  });

  test('senza una scadenza da riaprire: ne nasce una nuova solo per i controlli automatici', () => {
    expect(comeRiprendere({ ...base, daRiaprire: false })).toBe('genera');
    expect(comeRiprendere({ ...base, daRiaprire: false, controlloAutomatico: false })).toBe('niente');
  });

  test('niente se il soggetto è dismesso, il controllo disattivato o una scadenza è già aperta', () => {
    expect(comeRiprendere({ ...base, soggettoDismesso: true })).toBe('niente');
    expect(comeRiprendere({ ...base, controlloAttivo: false })).toBe('niente');
    expect(comeRiprendere({ ...base, giaAperta: true })).toBe('niente');
  });

  test('la chiave di una coppia', () => {
    expect(coppia(32, 8)).toBe('32:8');
  });
});

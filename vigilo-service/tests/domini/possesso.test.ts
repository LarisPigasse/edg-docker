// Costo di possesso di un mezzo: errori, quota mensile, dati salvati, avviso morbido
import { avvisoQuota, erroriPossesso, euroInteri, possessoDa, quotaMensile } from '../../src/domini/soggetti/possesso';

describe('costo di possesso', () => {
  test('acquisto: (prezzo − valore finale) ÷ mesi; leasing e noleggio: il canone', () => {
    expect(quotaMensile({ modo: 'acquisto', prezzo: 150000, anni: 8, valoreFinale: 30000 })).toBe(1250);
    expect(quotaMensile({ modo: 'acquisto', prezzo: 40000, anni: 6 })).toBe(555.56);
    expect(quotaMensile({ modo: 'leasing', canone: 1890.5 })).toBe(1890.5);
    expect(quotaMensile({ modo: 'noleggio', canone: 640 })).toBe(640);
  });

  test('errori: limiti invalicabili e valori senza senso', () => {
    expect(erroriPossesso({ modo: 'acquisto', prezzo: 150000, anni: 8, valoreFinale: 30000 })).toEqual([]);
    expect(erroriPossesso({ modo: 'leasing', canone: 1200, dal: '2025-03-01' })).toEqual([]);
    expect(erroriPossesso({})).toEqual(['Scegli come hai il mezzo: acquistato, in leasing o a noleggio']);
    expect(erroriPossesso({ modo: 'acquisto' })).toEqual(["Scrivi il prezzo d'acquisto", 'Scegli gli anni di uso previsti']);
    expect(erroriPossesso({ modo: 'leasing' })).toEqual(['Scrivi il canone mensile']);
    expect(erroriPossesso({ modo: 'acquisto', prezzo: 20000000, anni: 8 })[0]).toMatch(/16\.777\.216 €/);
    expect(erroriPossesso({ modo: 'acquisto', prezzo: 50000, anni: 0 })).toEqual(['Gli anni di uso previsti vanno da 1 a 32']);
    expect(erroriPossesso({ modo: 'acquisto', prezzo: 50000, anni: 5, valoreFinale: 50000 })).toEqual(['Il valore finale deve essere minore del prezzo']);
    expect(erroriPossesso({ modo: 'acquisto', prezzo: 50000.123, anni: 5 })[0]).toMatch(/al centesimo/);
    expect(erroriPossesso({ modo: 'noleggio', canone: 0 })[0]).toMatch(/65\.536 €/);
    expect(erroriPossesso({ modo: 'leasing', canone: 900, dal: '01/03/2025' })).toEqual(['La data da cui conta va scritta come AAAA-MM-GG']);
  });

  test('si salvano solo i campi del modo scelto, con la quota', () => {
    expect(possessoDa({ modo: 'leasing', canone: 900, prezzo: 99999 })).toEqual({ modo: 'leasing', canone: 900, dal: null, mensile: 900 });
    expect(possessoDa({ modo: 'acquisto', prezzo: 96000, anni: 8, dal: '2024-01-15' })).toEqual({
      modo: 'acquisto',
      prezzo: 96000,
      anni: 8,
      valoreFinale: 0,
      dal: '2024-01-15',
      mensile: 1000,
    });
  });

  test('avviso morbido: quattro volte o un quarto della media, con almeno due altri mezzi', () => {
    expect(euroInteri(1492.4)).toBe('1.492 €');
    expect(avvisoQuota(12000, [1100, 1300], 'Autocarri oltre 3,5 t')).toBe(
      'È circa 10 volte la media di Autocarri oltre 3,5 t (1.200 € al mese): controlla i valori prima di salvare'
    );
    expect(avvisoQuota(250, [1100, 1300], 'Autocarri')).toBe('È meno di un quarto della media di Autocarri (1.200 € al mese): controlla i valori prima di salvare');
    expect(avvisoQuota(2400, [1100, 1300], 'Autocarri')).toBeNull();
    expect(avvisoQuota(12000, [1200], 'Autocarri')).toBeNull();
  });
});

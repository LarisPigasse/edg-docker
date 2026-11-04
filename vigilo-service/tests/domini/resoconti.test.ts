// Resoconti — Spese e consumi: periodi, uso dai contatori, costo per unità, riepilogo (B10c)
import { confrontoDi, costoPerUnita, intervalloDi, mesiDi, riepilogo, unAnnoPrima, usoNelPeriodo, variazione, type RigaSpesa } from '../../src/domini/resoconti/resoconti';

describe('resoconti (B10c)', () => {
  test('periodi: anno in corso, ultimi 12 mesi, anno precedente, personalizzato', () => {
    expect(intervalloDi('anno', '2026-11-03')).toEqual({ dal: '2026-01-01', al: '2026-11-03' });
    expect(intervalloDi('12m', '2026-11-03')).toEqual({ dal: '2025-12-01', al: '2026-11-03' });
    expect(intervalloDi('12m', '2026-12-15')).toEqual({ dal: '2026-01-01', al: '2026-12-15' });
    expect(intervalloDi('prec', '2026-11-03')).toEqual({ dal: '2025-01-01', al: '2025-12-31' });
    expect(intervalloDi('personalizzato', '2026-11-03', '2026-03-01', '2026-06-30')).toEqual({ dal: '2026-03-01', al: '2026-06-30' });
    expect(intervalloDi('personalizzato', '2026-11-03')).toMatch(/servono le date/);
    expect(intervalloDi('personalizzato', '2026-11-03', '2026-06-30', '2026-03-01')).toMatch(/prima di quella di inizio/);
    expect(intervalloDi('personalizzato', '2026-11-03', '2021-01-01', '2026-01-01')).toMatch(/4 anni/);
  });

  test('un anno prima: il 29 febbraio diventa il 28; confronto e mesi', () => {
    expect(unAnnoPrima('2028-02-29')).toBe('2027-02-28');
    expect(confrontoDi({ dal: '2026-01-01', al: '2026-11-03' })).toEqual({ dal: '2025-01-01', al: '2025-11-03' });
    expect(mesiDi({ dal: '2025-11-15', al: '2026-02-03' })).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });

  test('uso nel periodo: aumenti dalla lettura precedente, i cali non contano', () => {
    expect(usoNelPeriodo(100000, [100500, 101200])).toBe(1200);
    expect(usoNelPeriodo(null, [100500, 101200])).toBe(700);
    expect(usoNelPeriodo(null, [100500])).toBeNull();
    expect(usoNelPeriodo(250000, [251000, 12, 512])).toBe(1500); // contatore sostituito
  });

  test('costo per unità solo sopra la soglia; variazione rispetto all’anno prima', () => {
    expect(costoPerUnita(1024, 8192, 512)).toBe(0.125);
    expect(costoPerUnita(500, 8, 512)).toBeNull();
    expect(costoPerUnita(500, null, 512)).toBeNull();
    expect(variazione(1120, 1000)).toBe(12);
    expect(variazione(800, 1000)).toBe(-20);
    expect(variazione(100, 0)).toBeNull();
  });

  test('riepilogo: totali, mesi con l’anno prima, natura, soggetti, fornitori e tipi', () => {
    const furgone = { id: 1, uuid: 'u1', nome: 'Furgone', identificativo: 'GD512XY', tipo: 'veicolo' as const };
    const officina = { uuid: 'f1', nome: 'Officina Rossi', tipo: { chiave: 'officina', nome: 'Officina' } };
    const r = (g: string, extra: Partial<RigaSpesa>): RigaSpesa => ({ giorno: g, idScadenza: 1, soggetto: furgone, natura: 'manutenzione', fornitore: null, importo: 0, manodopera: 0, ore: 0, ...extra });
    const ora = [
      r('2026-01-10', { importo: 256, fornitore: officina }),
      r('2026-01-20', { manodopera: 64, ore: 2 }),
      r('2026-02-05', { natura: 'riparazione', idScadenza: 7, importo: 512, manodopera: 32, ore: 1, fornitore: officina }),
      r('2026-02-06', { natura: 'pagamento', soggetto: null, importo: 128 }),
    ];
    const prima = [r('2025-01-15', { importo: 400 })];
    const x = riepilogo(ora, prima, { dal: '2026-01-01', al: '2026-02-28' });
    expect(x.totale).toEqual({ spesa: 992, importi: 896, manodopera: 96, ore: 3, registrazioni: 4, conImporto: 3 });
    expect(x.totalePrima.spesa).toBe(400);
    expect(x.riparazioni).toEqual({ spesa: 544, guasti: 1, spesaPrima: 0 });
    expect(x.perMese).toEqual([
      { mese: '2026-01', importi: 256, manodopera: 64, prima: 400 },
      { mese: '2026-02', importi: 640, manodopera: 32, prima: 0 },
    ]);
    expect(x.perNatura.map(n => n.natura)).toEqual(['riparazione', 'manutenzione', 'pagamento']);
    expect(x.perSoggetto).toEqual([{ id: 1, uuid: 'u1', nome: 'Furgone', identificativo: 'GD512XY', tipo: 'veicolo', n: 3, spesa: 864, spesaPrima: 400, variazione: 116 }]);
    expect(x.perFornitore).toEqual([{ uuid: 'f1', nome: 'Officina Rossi', tipo: { chiave: 'officina', nome: 'Officina' }, importi: 768, n: 2 }]);
    expect(x.perTipoFornitore).toEqual([{ chiave: 'officina', nome: 'Officina', importi: 768, n: 2 }]);
  });
});

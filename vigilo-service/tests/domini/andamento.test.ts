// Andamento dei costi di un mezzo (2026-11-16)
import { andamentoCosti, fineMeseScorso, inizioLettura, piuMesi, soloMesiChiusi, ultimiMesiChiusi, MESI_RIPARTIZIONE } from '../../src/domini/resoconti/andamento';

const periodo = { dal: '2026-01-01', al: '2026-03-31' };

describe('andamento dei costi', () => {
  test('mesi in avanti e indietro', () => {
    expect(piuMesi('2026-11', 2)).toBe('2027-01');
    expect(piuMesi('2026-01', -1)).toBe('2025-12');
    expect(piuMesi('2026-03', -(MESI_RIPARTIZIONE - 1))).toBe('2025-04');
    expect(inizioLettura(periodo)).toBe('2025-02-01');
  });

  test('solo mesi chiusi: il periodo finisce a fine del mese scorso', () => {
    expect(fineMeseScorso('2026-11-16')).toBe('2026-10-31');
    expect(fineMeseScorso('2026-03-01')).toBe('2026-02-28');
    expect(fineMeseScorso('2026-01-10')).toBe('2025-12-31');
    expect(ultimiMesiChiusi('2026-11-16', 12)).toEqual({ dal: '2025-11-01', al: '2026-10-31' });
    expect(soloMesiChiusi({ dal: '2026-01-01', al: '2026-11-16' }, '2026-11-16')).toEqual({ dal: '2026-01-01', al: '2026-10-31' });
    expect(soloMesiChiusi({ dal: '2025-01-01', al: '2025-12-31' }, '2026-11-16')).toEqual({ dal: '2025-01-01', al: '2025-12-31' });
    // anno in corso a gennaio: ancora nessun mese chiuso
    expect(soloMesiChiusi({ dal: '2026-01-01', al: '2026-01-10' }, '2026-01-10')).toBeNull();
  });

  test('il possesso è una retta: quota mensile per ogni mese pieno', () => {
    const a = andamentoCosti({ periodo, possesso: { mensile: 1000, dal: '2020-01-01' }, fine: null, spese: [] });
    expect(a.mesi.map(m => [m.mese, m.quota, m.possesso])).toEqual([
      ['2026-01', 1000, 1000],
      ['2026-02', 1000, 1000],
      ['2026-03', 1000, 1000],
    ]);
  });

  test('il mese del possesso conta per i giorni in cui il mezzo c\'era', () => {
    const a = andamentoCosti({ periodo, possesso: { mensile: 1000, dal: '2026-02-15' }, fine: null, spese: [] });
    expect(a.mesi.map(m => m.quota)).toEqual([0, 500, 1000]);
  });

  test('gli obblighi si ripartiscono sui 12 mesi dal pagamento, anche se pagati prima del periodo', () => {
    const a = andamentoCosti({
      periodo,
      possesso: null,
      fine: null,
      spese: [
        { giorno: '2025-12-03', blocco: 'obblighi', spesa: 1200 }, // bollo: 100 al mese da dic 2025 a nov 2026
        { giorno: '2025-01-10', blocco: 'obblighi', spesa: 1200 }, // fino a dic 2025: fuori dal periodo
        { giorno: '2026-03-20', blocco: 'obblighi', spesa: 2400 }, // da marzo: 200
      ],
    });
    expect(a.mesi.map(m => m.obblighi)).toEqual([100, 100, 300]);
  });

  test('come la scheda: obblighi per intero nel mese del pagamento, solo dentro il periodo', () => {
    const a = andamentoCosti({
      periodo,
      possesso: null,
      fine: null,
      ripartisciObblighi: false,
      spese: [
        { giorno: '2025-12-03', blocco: 'obblighi', spesa: 1200 }, // prima del periodo: no
        { giorno: '2026-03-20', blocco: 'obblighi', spesa: 2400 },
      ],
    });
    expect(a.mesi.map(m => m.obblighi)).toEqual([0, 0, 2400]);
    expect(a.totali.obblighi).toBe(2400);
  });

  test('manutenzione e uso nel mese in cui si registrano, solo dentro il periodo', () => {
    const a = andamentoCosti({
      periodo,
      possesso: null,
      fine: null,
      spese: [
        { giorno: '2026-02-10', blocco: 'manutenzione', spesa: 928 },
        { giorno: '2026-02-11', blocco: 'uso', spesa: 640.64 },
        { giorno: '2025-12-30', blocco: 'manutenzione', spesa: 5000 }, // prima del periodo: no
      ],
    });
    expect(a.mesi.map(m => [m.manutenzione, m.uso])).toEqual([
      [0, 0],
      [928, 640.64],
      [0, 0],
    ]);
  });

  test('totali e quote dei tre blocchi', () => {
    const a = andamentoCosti({
      periodo,
      possesso: { mensile: 1000, dal: null },
      fine: null,
      spese: [
        { giorno: '2026-01-05', blocco: 'manutenzione', spesa: 1000 },
        { giorno: '2026-01-06', blocco: 'uso', spesa: 2000 },
      ],
    });
    expect(a.totali).toMatchObject({ possesso: 3000, manutenzione: 1000, uso: 2000, totale: 6000 });
    expect(a.quote).toEqual({ possesso: 50, manutenzione: 17, uso: 33 });
  });

  test('un mezzo archiviato non ha quota dopo l\'archiviazione', () => {
    const a = andamentoCosti({ periodo, possesso: { mensile: 1000, dal: null }, fine: '2026-01-31', spese: [] });
    expect(a.mesi.map(m => m.quota)).toEqual([1000, 0, 0]);
  });
});

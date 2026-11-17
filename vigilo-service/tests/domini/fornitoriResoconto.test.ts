// Interventi e costi per fornitore (report, 2026-11-12)
import { perFornitore, type RigaFornitore } from '../../src/domini/resoconti/fornitori';

const officina = { uuid: 'o', nome: 'Officina Rossi', tipo: { chiave: 'officina', nome: 'Officina' } };
const distributore = { uuid: 'd', nome: 'Distributore Nereto', tipo: { chiave: 'carburanti', nome: 'Carburanti' } };
const riga = (r: Partial<RigaFornitore>): RigaFornitore => ({
  giorno: '2026-11-01',
  soggetto: { nome: 'DAF XF 01', identificativo: 'GF064ZR' },
  intervento: 'Tagliando',
  natura: 'manutenzione',
  riferimento: null,
  importo: 100,
  litri: null,
  fornitore: officina,
  ...r,
});

describe('interventi e costi per fornitore', () => {
  const r = perFornitore([
    riga({ giorno: '2026-10-05', importo: 1170.5 }),
    riga({ giorno: '2026-03-01', importo: 230 }),
    riga({ fornitore: distributore, intervento: 'Rifornimento: Carburante', natura: 'uso', importo: 2000, litri: 1150 }),
  ]);

  test('totale e numero di interventi del periodo', () => {
    expect(r.totale).toBe(3400.5);
    expect(r.interventi).toBe(3);
  });

  test('fornitori dal più costoso, con subtotale e quota', () => {
    expect(r.fornitori.map(f => [f.nome, f.interventi, f.totale, f.quota])).toEqual([
      ['Distributore Nereto', 1, 2000, 59],
      ['Officina Rossi', 2, 1400.5, 41],
    ]);
  });

  test('righe dalla più vecchia, senza ripetere il fornitore', () => {
    const o = r.fornitori[1];
    expect(o.righe.map(x => x.giorno)).toEqual(['2026-03-01', '2026-10-05']);
    expect(o.righe[0]).not.toHaveProperty('fornitore');
    expect(o.tipo).toEqual({ chiave: 'officina', nome: 'Officina' });
  });

  test('senza spese: totale zero e nessun fornitore', () => {
    expect(perFornitore([])).toEqual({ totale: 0, interventi: 0, fornitori: [] });
  });
});

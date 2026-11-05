// Costo dei mezzi (stima): mesi del periodo, blocchi, unità, confronto con la categoria
import { bloccoDi, costiMezzi, mesiNelPeriodo, type MezzoDaCalcolare } from '../../src/domini/resoconti/mezzi';

const ANNO = { dal: '2026-01-01', al: '2026-12-31' };
const AUTOCARRI = { uuid: 'c1', nome: 'Autocarri oltre 3,5 t' };
const mezzo = (nome: string, km: number | null, manutenzione: number, mensile: number | null, altro: Partial<MezzoDaCalcolare> = {}): MezzoDaCalcolare => ({
  uuid: nome,
  nome,
  identificativo: null,
  tipo: 'veicolo',
  categoria: AUTOCARRI,
  possesso: mensile === null ? null : { mensile, dal: null },
  fine: null,
  uso: km === null ? null : { unita: 'km', valore: km },
  spese: { obblighi: 2000, manutenzione, uso: 0, guasti: 0, litri: 0 },
  ...altro,
});

describe('costo dei mezzi', () => {
  test('blocchi e mesi del periodo', () => {
    expect(bloccoDi('riparazione')).toBe('manutenzione');
    expect(bloccoDi('manutenzione')).toBe('manutenzione');
    expect(bloccoDi('pagamento')).toBe('obblighi');
    expect(mesiNelPeriodo(ANNO)).toBe(12);
    expect(mesiNelPeriodo(ANNO, '2026-07-01')).toBe(6);
    expect(mesiNelPeriodo(ANNO, null, '2026-03-31')).toBe(3);
    expect(mesiNelPeriodo(ANNO, '2026-02-15')).toBe(10.5);
    expect(mesiNelPeriodo({ dal: '2025-11-16', al: '2026-01-15' })).toBe(1.98);
    expect(mesiNelPeriodo(ANNO, '2027-01-01')).toBe(0);
  });

  test('possesso, totale, costo per km e per mese; parziale senza possesso', () => {
    const [a] = costiMezzi([mezzo('A', 100000, 6000, 1000)], ANNO, { km: 512, ore: 32 }, 32);
    expect(a.possesso).toEqual({ quota: 12000, obblighi: 2000, totale: 14000 });
    expect(a.totale).toBe(20000);
    expect(a.base).toBe('km');
    expect(a.costoPerUnita).toBe(0.2);
    const [b] = costiMezzi([mezzo('B', 300, 600, null)], ANNO, { km: 512, ore: 32 }, 32);
    expect(b.parziale).toBe(true);
    expect(b.base).toBe('mese');
    expect(b.costoPerUnita).toBe(216.667);
  });

  test('confronto: il mezzo che si guasta spesso è segnalato, "soprattutto guasti"', () => {
    const r = costiMezzi(
      [mezzo('A', 100000, 6000, 1000), mezzo('B', 100000, 6000, 1000), mezzo('C', 100000, 30000, 1000), mezzo('D', 100000, 5000, null)],
      ANNO,
      { km: 512, ore: 32 },
      32
    );
    const c = r.find(x => x.nome === 'C')!;
    expect(c.confronto.totale).toEqual({ scostamento: 120, media: 0.2, altri: 2 });
    expect(c.confronto.manutenzione).toEqual({ scostamento: 429, media: 0.057, altri: 3 });
    expect(c.confronto.segnalato).toBe(true);
    expect(c.confronto.soprattutto).toBe('manutenzione');
    const d = r.find(x => x.nome === 'D')!;
    expect(d.confronto.totale).toBeNull(); // parziale: niente confronto sul totale
    expect(d.confronto.manutenzione?.altri).toBe(3);
    expect(r[0].nome).toBe('C'); // dal più caro
  });

  test('blocco Uso dai rifornimenti, consumo in l/100 km e l/ora, "soprattutto uso"', () => {
    const conUso = (nome: string, uso: number, litri: number) => mezzo(nome, 100000, 6000, 1000, { spese: { obblighi: 2000, manutenzione: 6000, uso, guasti: 0, litri } });
    const r = costiMezzi([conUso('A', 30000, 18000), conUso('B', 30000, 18000), conUso('C', 90000, 54000)], ANNO, { km: 512, ore: 32 }, 32);
    const c = r.find(x => x.nome === 'C')!;
    expect(c.rifornimenti).toEqual({ totale: 90000, litri: 54000, consumo: 54 });
    expect(c.totale).toBe(110000);
    expect(c.confronto.segnalato).toBe(true);
    expect(c.confronto.soprattutto).toBe('uso');
    const [trattore] = costiMezzi(
      [mezzo('T', null, 0, 500, { tipo: 'macchina', uso: { unita: 'ore', valore: 400 }, spese: { obblighi: 0, manutenzione: 0, uso: 4000, guasti: 0, litri: 3200 } })],
      ANNO,
      { km: 512, ore: 32 },
      32
    );
    expect(trattore.base).toBe('ore');
    expect(trattore.rifornimenti.consumo).toBe(8); // litri per ora
  });

  test('niente confronto con meno di due altri o con basi diverse', () => {
    const r = costiMezzi([mezzo('A', 100000, 6000, 1000), mezzo('B', 100000, 9000, 1000), mezzo('C', 200, 9000, 1000)], ANNO, { km: 512, ore: 32 }, 32);
    expect(r.every(x => x.confronto.totale === null && !x.confronto.segnalato)).toBe(true);
    const altraCategoria = costiMezzi(
      [mezzo('A', 100000, 6000, 1000), mezzo('B', 100000, 6000, 1000), mezzo('X', 100000, 60000, 1000, { categoria: { uuid: 'c2', nome: 'Furgoni' } })],
      ANNO,
      { km: 512, ore: 32 },
      32
    );
    expect(altraCategoria.find(x => x.nome === 'X')!.confronto.segnalato).toBe(false);
  });
});

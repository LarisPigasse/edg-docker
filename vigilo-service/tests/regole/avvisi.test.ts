import { calcolaSituazione, eventiDovuti, type Preavvisi, type Tolleranza } from '../../src/regole';
import { OGGI, preavvisi, tolleranza } from './helpers';

const eventi = (scadeIl: string, p: Preavvisi = preavvisi(), t: Tolleranza = tolleranza(), richiami = 8, oggi = OGGI) => {
  const situazione = calcolaSituazione({ scadeIl, sogliaUso: null, valoreContatore: null, usoGiornaliero: null, preavvisi: p, tolleranza: t }, oggi);
  return eventiDovuti({ scadeIl, sogliaUso: null, situazione, preavvisi: p, intervalloRichiami: richiami }, oggi).map(e => e.evento);
};

describe('avvisi dovuti', () => {
  test('in regola: nessun avviso', () => {
    expect(eventi('2027-03-12')).toEqual([]);
  });

  test('si da\' solo il preavviso maturato piu\' vicino', () => {
    expect(eventi('2026-11-09')).toEqual(['preavviso:32']); // a 32 giorni
    expect(eventi('2026-10-13')).toEqual(['preavviso:8']); // a 5 giorni: non anche il 32
    expect(eventi('2026-10-09')).toEqual(['preavviso:1']);
    expect(eventi(OGGI)).toEqual(['preavviso:1']);
  });

  test('tolleranza: inizio, e l\'ultimo giorno anche l\'avviso urgente', () => {
    expect(eventi('2026-10-01', preavvisi(), tolleranza(15))).toEqual(['tolleranza:inizio']);
    expect(eventi('2026-09-23', preavvisi(), tolleranza(15))).toEqual(['tolleranza:inizio', 'tolleranza:ultimo-giorno']);
  });

  test('scaduta e richiami ogni 8 giorni', () => {
    // giorno 1 da scaduta = avviso "scaduta"; richiami 8 e 16 giorni dopo (giorni 9 e 17)
    expect(eventi('2026-10-07')).toEqual(['scaduta']); // giorno 1
    expect(eventi('2026-09-30')).toEqual(['scaduta']); // giorno 8: il richiamo arriva domani
    expect(eventi('2026-09-29')).toEqual(['scaduta', 'richiamo:1']); // giorno 9
    expect(eventi('2026-09-22')).toEqual(['scaduta', 'richiamo:1']); // giorno 16
    expect(eventi('2026-09-21')).toEqual(['scaduta', 'richiamo:2']); // giorno 17
    expect(eventi('2026-09-30', preavvisi(), tolleranza(), 0)).toEqual(['scaduta']);
  });

  test('i richiami contano dalla fine della tolleranza', () => {
    // scaduta il 2026-09-08, tolleranza 15 -> limite 2026-09-23, primo giorno scaduta 09-24
    expect(eventi('2026-09-08', preavvisi(), tolleranza(15))).toEqual(['scaduta', 'richiamo:1']); // 15 giorni dopo il limite
  });

  test('il riferimento cambia con la data: nuovo ciclo dopo un rinvio', () => {
    const p = preavvisi();
    const s1 = calcolaSituazione({ scadeIl: '2026-10-13', sogliaUso: null, valoreContatore: null, usoGiornaliero: null, preavvisi: p, tolleranza: tolleranza() }, OGGI);
    const s2 = calcolaSituazione({ scadeIl: '2026-10-15', sogliaUso: null, valoreContatore: null, usoGiornaliero: null, preavvisi: p, tolleranza: tolleranza() }, OGGI);
    const r1 = eventiDovuti({ scadeIl: '2026-10-13', sogliaUso: null, situazione: s1, preavvisi: p, intervalloRichiami: 8 }, OGGI)[0];
    const r2 = eventiDovuti({ scadeIl: '2026-10-15', sogliaUso: null, situazione: s2, preavvisi: p, intervalloRichiami: 8 }, OGGI)[0];
    expect(r1.evento).toBe(r2.evento);
    expect(r1.riferimento).not.toBe(r2.riferimento);
  });

  test('a uso: preavviso in km e urgenze', () => {
    const p = preavvisi([8], [1024]);
    const t = tolleranza(0, 512);
    const s = calcolaSituazione({ scadeIl: null, sogliaUso: 249000, valoreContatore: 248360, usoGiornaliero: 212, preavvisi: p, tolleranza: t }, OGGI);
    const ev = eventiDovuti({ scadeIl: null, sogliaUso: 249000, situazione: s, preavvisi: p, intervalloRichiami: 8 }, OGGI);
    expect(ev.map(e => e.evento)).toEqual(['preavviso-uso:1024']);
    const sc = calcolaSituazione({ scadeIl: null, sogliaUso: 249000, valoreContatore: 250000, usoGiornaliero: 212, preavvisi: p, tolleranza: t }, OGGI);
    const evs = eventiDovuti({ scadeIl: null, sogliaUso: 249000, situazione: sc, preavvisi: p, intervalloRichiami: 8 }, OGGI);
    expect(evs).toEqual([expect.objectContaining({ evento: 'scaduta', urgente: true })]);
  });
});

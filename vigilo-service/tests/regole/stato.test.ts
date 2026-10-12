import { calcolaSituazione, testoStato } from '../../src/regole';
import { OGGI, preavvisi, tolleranza } from './helpers';

const base = { sogliaUso: null, valoreContatore: null, usoGiornaliero: null, preavvisi: preavvisi(), tolleranza: tolleranza() };

describe('stato e testo — a tempo', () => {
  test('in regola oltre il primo preavviso', () => {
    const s = calcolaSituazione({ ...base, scadeIl: '2027-03-12' }, OGGI);
    expect(s.stato).toBe('in-regola');
    expect(testoStato(s, '2027-03-12', null, OGGI)).toBe('in regola · 12 mar 2027');
  });

  test('in scadenza: tra 5 giorni, domani, oggi', () => {
    const s = calcolaSituazione({ ...base, scadeIl: '2026-10-13' }, OGGI);
    expect(s.stato).toBe('in-scadenza');
    expect(testoStato(s, '2026-10-13', null, OGGI)).toBe('tra 5 giorni · 13 ott');
    expect(testoStato(calcolaSituazione({ ...base, scadeIl: '2026-10-09' }, OGGI), '2026-10-09', null, OGGI)).toBe('scade domani · 9 ott');
    const oggi = calcolaSituazione({ ...base, scadeIl: OGGI }, OGGI);
    expect(oggi.stato).toBe('in-scadenza');
    expect(testoStato(oggi, OGGI, null, OGGI)).toBe('scade oggi');
  });

  test('esattamente al primo preavviso (32 giorni) e un giorno prima', () => {
    expect(calcolaSituazione({ ...base, scadeIl: '2026-11-09' }, OGGI).stato).toBe('in-scadenza');
    expect(calcolaSituazione({ ...base, scadeIl: '2026-11-10' }, OGGI).stato).toBe('in-regola');
  });

  test('RCA in tolleranza: scaduta il 1 ott, rinnovabile fino al 16 ott', () => {
    const s = calcolaSituazione({ ...base, scadeIl: '2026-10-01', tolleranza: tolleranza(15) }, OGGI);
    expect(s.stato).toBe('in-tolleranza');
    expect(s.limiteIl).toBe('2026-10-16');
    expect(testoStato(s, '2026-10-01', null, OGGI)).toBe('scaduta il 1 ott · rinnovabile fino al 16 ott');
  });

  test('ultimo giorno di tolleranza e giorno dopo', () => {
    const ultimo = calcolaSituazione({ ...base, scadeIl: '2026-09-23', tolleranza: tolleranza(15) }, OGGI);
    expect(ultimo.stato).toBe('in-tolleranza');
    expect(testoStato(ultimo, '2026-09-23', null, OGGI)).toBe("scaduta il 23 set · oggi l'ultimo giorno per rinnovare");
    expect(calcolaSituazione({ ...base, scadeIl: '2026-09-22', tolleranza: tolleranza(15) }, OGGI).stato).toBe('scaduta');
  });

  test('scaduta da 8 giorni e scaduta ieri', () => {
    const s = calcolaSituazione({ ...base, scadeIl: '2026-09-30' }, OGGI);
    expect(s.stato).toBe('scaduta');
    expect(testoStato(s, '2026-09-30', null, OGGI)).toBe('scaduta da 8 giorni · 30 set');
    expect(testoStato(calcolaSituazione({ ...base, scadeIl: '2026-10-07' }, OGGI), '2026-10-07', null, OGGI)).toBe('scaduta ieri · 7 ott');
  });

  test('senza preavvisi: in scadenza solo il giorno stesso', () => {
    const senza = { ...base, preavvisi: preavvisi([]) };
    expect(calcolaSituazione({ ...senza, scadeIl: '2026-10-09' }, OGGI).stato).toBe('in-regola');
    expect(calcolaSituazione({ ...senza, scadeIl: OGGI }, OGGI).stato).toBe('in-scadenza');
  });

  test('da completare', () => {
    const s = calcolaSituazione({ ...base, scadeIl: null }, OGGI);
    expect(s.stato).toBe('da-completare');
    expect(testoStato(s, null, null, OGGI)).toBe('data da inserire');
  });
});

describe('stato e testo — a uso e combinate', () => {
  const tagliando = { ...base, scadeIl: '2026-11-12', sogliaUso: 249000, preavvisi: preavvisi([8], [1024]), tolleranza: tolleranza(0, 512) };

  test('tagliando: mancano 640 km, stima a 212 km al giorno', () => {
    const s = calcolaSituazione({ ...tagliando, valoreContatore: 248360, usoGiornaliero: 212 }, OGGI);
    expect(s.stato).toBe('in-scadenza');
    expect(s.per).toBe('uso');
    expect(s.stimataIl).toBe('2026-10-12'); // 640 / 212 = 3,02 -> 4 giorni
    expect(s.urgenzaIl).toBe('2026-10-12');
    expect(testoStato(s, tagliando.scadeIl, 'km', OGGI)).toBe('mancano 640 km · stima 12 ott');
  });

  test('soglia superata: tolleranza d\'uso, poi scaduta', () => {
    const tol = calcolaSituazione({ ...tagliando, valoreContatore: 249120, usoGiornaliero: 212 }, OGGI);
    expect(tol.stato).toBe('in-tolleranza');
    expect(testoStato(tol, tagliando.scadeIl, 'km', OGGI)).toBe('superata di 120 km · tolleranza fino a 249.512 km');
    const sc = calcolaSituazione({ ...tagliando, valoreContatore: 250200, usoGiornaliero: 212 }, OGGI);
    expect(sc.stato).toBe('scaduta');
    expect(testoStato(sc, tagliando.scadeIl, 'km', OGGI)).toBe('superata di 1.200 km');
  });

  test('combinata: vale lo stato peggiore (data scaduta, km in regola)', () => {
    const s = calcolaSituazione({ ...tagliando, scadeIl: '2026-09-30', valoreContatore: 240000, usoGiornaliero: 100 }, OGGI);
    expect(s.stato).toBe('scaduta');
    expect(s.per).toBe('tempo');
  });

  test('stima dentro i preavvisi a giorni anche senza preavvisi d\'uso', () => {
    const s = calcolaSituazione(
      { ...base, scadeIl: null, sogliaUso: 4608, valoreContatore: 4560, usoGiornaliero: 2, preavvisi: preavvisi([32, 8], []) },
      OGGI
    );
    expect(s.stato).toBe('in-scadenza');
    expect(s.stimataIl).toBe('2026-11-01');
  });

  test('contatore sconosciuto: conta solo la data', () => {
    const s = calcolaSituazione({ ...tagliando, valoreContatore: null }, OGGI);
    expect(s.per).toBe('tempo');
    expect(s.stato).toBe('in-regola');
  });
});

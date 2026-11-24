// Analisi: indicatori dell'azienda (2026-11-23)
import { consumo, consumoPerCategoria, disponibilita, giorniFermo, quotaGuasti, variazione } from '../../src/domini/analisi/operativita';
import { segnali } from '../../src/domini/analisi/segnali';
import { ANALISI_INIZIALI, analisiEffettiva, erroriAnalisi } from '../../src/domini/impostazioni/limiti';
import { affidabilitaStime, confrontoStruttura, costoPieno, costoPienoPerCategoria, flotta, margineAnno, mezziPerCostoPieno } from '../../src/domini/analisi/indicatori';

describe('analisi: flotta', () => {
  test('medie pesate su ore e km', () => {
    const f = flotta([
      { fissi: 10000, oreImpiego: 1000, rifornimenti: 30000, km: 50000, totale: 40000 },
      { fissi: 6000, oreImpiego: 1000, rifornimenti: 10000, km: 50000, totale: 16000 },
      { fissi: 2000, oreImpiego: 0, rifornimenti: 0, km: null, totale: 2000 },
    ]);
    expect(f).toEqual({ mezzi: 3, fissoOra: 8, variabileKm: 0.4, costoTotale: 58000 });
  });
  test('senza ore né km: null', () => {
    expect(flotta([])).toEqual({ mezzi: 0, fissoOra: null, variabileKm: null, costoTotale: 0 });
  });
});

describe('analisi: costo pieno', () => {
  test('per ora e per km, con le voci orarie divise per la velocità', () => {
    const c = costoPieno({ mezzoOra: 8, mezzoKm: 0.4, conducenteOra: 20, aziendaliOra: 36, velocitaMedia: 64 });
    expect(c.perOra).toEqual({ mezzo: 8, conducente: 20, aziendali: 36, totale: 64 });
    expect(c.perKm).toEqual({ movimento: 0.4, orarie: 1, totale: 1.4 });
    expect(c.mancanti).toEqual([]);
  });
  test('le voci mancanti contano zero e si dicono', () => {
    const c = costoPieno({ mezzoOra: null, mezzoKm: null, conducenteOra: null, aziendaliOra: 32, velocitaMedia: 64 });
    expect(c.perOra.totale).toBe(32);
    expect(c.mancanti).toEqual(['mezzo', 'conducente']);
  });
});

describe('analisi: affidabilità delle stime', () => {
  test('scostamento medio, assoluto, entro tolleranza, verso sistematico', () => {
    const a = affidabilitaStime([
      { totale: 1000, costoReale: 1100, prezzo: 1200 },
      { totale: 1000, costoReale: 1050, prezzo: 1000 },
      { totale: 1000, costoReale: 1200, prezzo: null },
      { totale: 1000, costoReale: 1020, prezzo: null },
      { totale: 500, costoReale: null, prezzo: 600 },
    ]);
    expect(a.conReale).toBe(4);
    expect(a.scostamentoMedio).toBe(9.3);
    expect(a.scostamentoAssoluto).toBe(9.3);
    expect(a.entroTolleranza).toBe(3);
    expect(a.verso).toBe('sotto');
    // margini: (1200-1100)/1200 = 8,3%; (1000-1050)/1000 = -5%; (600-500)/600 = 16,7% -> media 6,7%
    expect(a.conPrezzo).toBe(3);
    expect(a.margineMedio).toBe(6.7);
    expect(a.inPerdita).toBe(1);
  });
  test('con meno di 4 stime il verso non si giudica', () => {
    expect(affidabilitaStime([{ totale: 100, costoReale: 120, prezzo: null }]).verso).toBeNull();
    expect(affidabilitaStime([]).scostamentoMedio).toBeNull();
  });
});

describe('analisi: struttura e margine', () => {
  test('voce per voce e totale', () => {
    const c = confrontoStruttura(
      [
        { chiave: 'personale', nome: 'Personale' },
        { chiave: 'struttura', nome: 'Struttura' },
      ],
      { personale: 100000, struttura: 0 },
      { personale: 110000, struttura: 5000 }
    );
    expect(c.voci[0]).toMatchObject({ differenza: 10000, percentuale: 10 });
    expect(c.voci[1].percentuale).toBeNull();
    expect(c.totale).toMatchObject({ prima: 100000, dopo: 115000, percentuale: 15 });
  });
  test('margine dell\'anno', () => {
    expect(margineAnno(1000000, 300000, 400000, 200000)).toEqual({
      ricavi: 1000000,
      costi: { aziendali: 300000, mezzi: 400000, conducenti: 200000, totale: 900000 },
      euro: 100000,
      percentuale: 10,
    });
  });
});

describe('analisi: i mezzi per il costo pieno', () => {
  const m = (tipo: string, quota: number) => ({ tipo, quota, fissi: 0, oreImpiego: 1000, rifornimenti: 0, km: 1000, totale: 0 });
  test('solo i veicoli; la parte fissa da quelli con il costo di possesso', () => {
    const r = mezziPerCostoPieno([m('veicolo', 11000), m('veicolo', 0), m('veicolo', 0), m('macchina', 5000), m('attrezzatura', 0)]);
    expect(r.veicoli).toHaveLength(3);
    expect(r.perFissa).toHaveLength(1);
    expect(r.senzaPossesso).toBe(2);
  });
});

describe('analisi: la flotta al lavoro', () => {
  const periodo = { dal: '2026-01-01', al: '2026-01-31' };
  test('giorni di fermo: dentro il periodo, sovrapposti contati una volta', () => {
    expect(giorniFermo([{ dal: '2026-01-10', al: '2026-01-12' }], periodo)).toBe(3);
    expect(giorniFermo([{ dal: '2025-12-25', al: '2026-01-02' }], periodo)).toBe(2);
    expect(giorniFermo([{ dal: '2026-01-10', al: '2026-01-15' }, { dal: '2026-01-13', al: '2026-01-20' }], periodo)).toBe(11);
    expect(giorniFermo([{ dal: '2026-02-01', al: '2026-02-05' }], periodo)).toBe(0);
  });
  test('disponibilità, consumo, variazione, peso dei guasti', () => {
    expect(disponibilita(4, 32, 16)).toBe(87.5);
    expect(disponibilita(0, 32, 0)).toBeNull();
    expect(consumo(3200, 10000)).toBe(32);
    expect(consumo(0, 10000)).toBeNull();
    expect(variazione(32, 34)).toBe(6.3);
    expect(quotaGuasti(2000, 6000)).toBe(25);
    expect(quotaGuasti(0, 0)).toBeNull();
  });
});

describe('analisi: per categoria di veicoli', () => {
  const v = (categoria: string | null, quota: number, fissi: number, rifornimenti: number, km: number) => ({ tipo: 'veicolo', categoria, quota, fissi, oreImpiego: 1000, rifornimenti, km, totale: 0 });
  test('costo pieno per categoria, dal più caro', () => {
    const r = costoPienoPerCategoria([v('Auto', 100, 2000, 600, 10000), v('Camion', 900, 16000, 30000, 100000), v('Camion', 0, 4000, 25000, 100000)], {
      conducenteOra: 20,
      aziendaliOra: 32,
      velocitaMedia: 64,
    });
    expect(r.map(x => x.categoria)).toEqual(['Camion', 'Auto']);
    // camion: fissa solo dal primo (16 €/h), variabile da tutti e due (55.000 / 200.000 km)
    expect(r[0]).toMatchObject({ veicoli: 2, conPossesso: 1, mezzoOra: 16, mezzoKm: 0.275, perOra: 68 });
    expect(r[1]).toMatchObject({ veicoli: 1, mezzoOra: 2, mezzoKm: 0.06, perOra: 54 });
  });
  test('consumo per categoria solo con almeno 2 veicoli', () => {
    const m = consumoPerCategoria([
      { categoria: 'Camion', litri: 3000, km: 10000 },
      { categoria: 'Camion', litri: 2600, km: 10000 },
      { categoria: 'Auto', litri: 600, km: 10000 },
      { categoria: 'Auto', litri: 0, km: 10000 },
    ]);
    expect(m.get('Camion')).toBe(28);
    expect(m.has('Auto')).toBe(false);
  });
});

describe('analisi: segnali da valutare', () => {
  const base = {
    perVeicolo: [] as never[],
    tendenzaConsumo: null,
    quotaGuasti: null,
    struttura: null,
    stime: { conReale: 0, verso: null, scostamentoMedio: null, conPrezzo: 0, inPerdita: 0 },
    margine: null,
  };
  const veicolo = { uuid: 'u1', nome: 'DAF', categoria: 'Autocarri', consumo: 36.6, sullaCategoria: 19.2, kmMese: 800, disponibilita: 95, giorniFermo: 14 };
  test('tutto in regola: nessun segnale', () => {
    expect(segnali(base, ANALISI_INIZIALI)).toEqual([]);
  });
  test('un veicolo fermo, che consuma e poco usato: dal più grave', () => {
    const r = segnali({ ...base, perVeicolo: [veicolo] as never[] }, ANALISI_INIZIALI);
    expect(r.map(x => [x.tipo, x.gravita])).toEqual([
      ['spessoFermo', 'alta'],
      ['consumoAlto', 'media'],
      ['pocoUsato', 'bassa'],
    ]);
    expect(r[0].soggetto).toEqual({ uuid: 'u1', nome: 'DAF' });
  });
  test('le soglie decidono: con il consumo alto a 32% il DAF non si segnala', () => {
    expect(segnali({ ...base, perVeicolo: [veicolo] as never[] }, { ...ANALISI_INIZIALI, consumoAlto: 32 }).some(x => x.tipo === 'consumoAlto')).toBe(false);
  });
  test('flotta, struttura, stime, margine', () => {
    const r = segnali(
      {
        ...base,
        tendenzaConsumo: 10,
        quotaGuasti: 60,
        struttura: { anno: 2026, precedente: 2025, voci: [{ voce: 'personale', nome: 'Personale', prima: 100000, dopo: 140000, percentuale: 40 }] },
        stime: { conReale: 4, verso: 'sotto', scostamentoMedio: 9, conPrezzo: 3, inPerdita: 1 },
        margine: { anno: 2026, percentuale: 4 },
      },
      ANALISI_INIZIALI
    );
    expect(r.map(x => x.tipo)).toEqual(['serviziPerdita', 'margineBasso', 'consumoCrescita', 'guastiAlti', 'struttura', 'stimeVerso']);
  });
  test('struttura: servono sia la percentuale sia l\'importo', () => {
    const struttura = (prima: number, dopo: number) => ({
      anno: 2026,
      precedente: 2025,
      voci: [{ voce: 'altro', nome: 'Altro', prima, dopo, percentuale: Math.round(((dopo - prima) / prima) * 1000) / 10 }],
    });
    expect(segnali({ ...base, struttura: struttura(8000, 10000) }, ANALISI_INIZIALI)).toEqual([]);
    expect(segnali({ ...base, struttura: struttura(180000, 250000) }, ANALISI_INIZIALI).map(x => x.tipo)).toEqual(['struttura']);
  });
  test('soglie: limiti e valori non validi tornano all\'iniziale', () => {
    expect(erroriAnalisi({ consumoAlto: 0, kmMeseMinimi: 1.5 })).toHaveLength(2);
    expect(analisiEffettiva({ consumoAlto: 999, margineMinimo: 12 })).toMatchObject({ consumoAlto: 16, margineMinimo: 12 });
  });
});

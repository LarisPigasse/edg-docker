// Stima dei costi di un servizio: il calcolo (2026-11-17)
import { calcolaStima, type DatiCalcolo } from '../../src/domini/stima/calcolo';

const parametri = { velocitaMedia: 64, oreGuidaGiorno: 9, diaria: 48, pedaggioKm: 0.16, costoAziendalePerOra: 8 };
const base: DatiCalcolo = { tipo: 'km', costoMezzo: 0.8, km: 512, ritornoAVuoto: false, kmAutostrada: 0, oreAggiuntive: 2, costoOrario: 24, pedaggi: null, extra: [], parametri };

describe('stima: il calcolo', () => {
  test('a km: mezzo, ore di guida, conducente, costi aziendali', () => {
    const r = calcolaStima(base);
    expect(r.kmTotali).toBe(512);
    expect(r.oreGuida).toBe(8); // 512 / 64
    expect(r.giorni).toBe(1);
    expect(r.oreServizio).toBe(10); // 8 + 2
    expect(r.voci.mezzo.totale).toBe(409.6); // 512 × 0,80
    expect(r.voci.conducente.totale).toBe(240); // 10 × 24
    expect(r.voci.aziendali.totale).toBe(80); // 10 × 8
    expect(r.totale).toBe(729.6);
    expect(r.perKm).toBe(1.43);
    expect(r.perOra).toBe(72.96);
    expect(r.avvisi).toEqual([]);
  });

  test('ritorno a vuoto: km e pedaggi raddoppiano; oltre 9 ore di guida un pernottamento con la diaria', () => {
    const r = calcolaStima({ ...base, ritornoAVuoto: true, kmAutostrada: 400 });
    expect(r.kmTotali).toBe(1024);
    expect(r.oreGuida).toBe(16);
    expect(r.giorni).toBe(2);
    expect(r.pernottamenti).toBe(1);
    expect(r.voci.conducente.diarie).toBe(48);
    expect(r.voci.pedaggi).toEqual({ stimati: true, totale: 128 }); // 800 km × 0,16
  });

  test('pedaggi noti ed extra', () => {
    const r = calcolaStima({ ...base, kmAutostrada: 400, pedaggi: 75.5, extra: [{ descrizione: 'Traghetto', importo: 320 }] });
    expect(r.voci.pedaggi).toEqual({ stimati: false, totale: 75.5 });
    expect(r.voci.extra.totale).toBe(320);
    expect(r.totale).toBe(729.6 + 75.5 + 320);
  });

  test('a ore: mezzo sulle ore di lavoro, operatore sulle ore di servizio, pernottamenti scritti', () => {
    const r = calcolaStima({ ...base, tipo: 'ore', costoMezzo: 32, km: undefined, oreLavoro: 16, oreAggiuntive: 2, pernottamenti: 1 });
    expect(r.kmTotali).toBeNull();
    expect(r.oreServizio).toBe(18);
    expect(r.voci.mezzo.totale).toBe(512); // 16 × 32
    expect(r.voci.conducente.totale).toBe(18 * 24 + 48);
    expect(r.voci.aziendali.totale).toBe(144);
    expect(r.perKm).toBeNull();
  });

  test('i dati mancanti contano zero e diventano avvisi', () => {
    const r = calcolaStima({ ...base, costoMezzo: null, costoOrario: null, ritornoAVuoto: true, kmAutostrada: 100, parametri: { ...parametri, diaria: null, pedaggioKm: null, costoAziendalePerOra: null } });
    expect(r.totale).toBe(0);
    expect(r.avvisi).toHaveLength(5);
  });
});

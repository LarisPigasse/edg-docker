// Stima dei costi di un servizio: il calcolo (2026-11-17)
import { calcolaStima, type DatiCalcolo } from '../../src/domini/stima/calcolo';

const parametri = { velocitaMedia: 64, oreGuidaGiorno: 9, diaria: 48, pedaggioKm: 0.16, costoAziendalePerOra: 8 };
const base: DatiCalcolo = { tipo: 'km', costoMezzo: 0.8, costoMezzoOra: 8, km: 512, ritornoAVuoto: false, kmAutostrada: 0, oreAggiuntive: 2, costoOrario: 24, pedaggi: null, extra: [], parametri };

describe('stima: il calcolo', () => {
  test('a km: mezzo, ore di guida, conducente, costi aziendali', () => {
    const r = calcolaStima(base);
    expect(r.kmTotali).toBe(512);
    expect(r.oreGuida).toBe(8); // 512 / 64
    expect(r.giorni).toBe(1);
    expect(r.oreServizio).toBe(10); // 8 + 2
    expect(r.voci.mezzo).toMatchObject({ variabile: 409.6, fisso: 80, totale: 489.6 }); // 512 × 0,80 + 10 h × 8
    expect(r.voci.conducente.totale).toBe(240); // 10 × 24
    expect(r.voci.aziendali.totale).toBe(80); // 10 × 8
    expect(r.totale).toBe(809.6);
    expect(r.perKm).toBe(1.58);
    expect(r.perOra).toBe(80.96);
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

  test('le attese costano: la parte fissa del mezzo corre sulle ore di impegno', () => {
    const breve = calcolaStima({ ...base, km: 64, oreAggiuntive: 0 }); // 1 h di guida
    const conAttese = calcolaStima({ ...base, km: 64, oreAggiuntive: 23 }); // 1 h di guida + 23 di attese
    expect(breve.voci.mezzo).toMatchObject({ variabile: 51.2, fisso: 8 });
    expect(conAttese.voci.mezzo).toMatchObject({ variabile: 51.2, fisso: 192 }); // stessi km, 24 h di impegno
  });

  test('trasferta: per ogni giorno se non rientra in giornata (più giorni, ore o km oltre le soglie)', () => {
    const conTrasferta = { ...parametri, indennitaTrasferta: 46, sogliaOreTrasferta: 8, sogliaKmTrasferta: 128 };
    // 512 km di andata: oltre i 128 km, un giorno solo
    expect(calcolaStima({ ...base, parametri: conTrasferta }).voci.conducente).toMatchObject({ giorniTrasferta: 1, trasferta: 46 });
    // vicino e breve: rientra in giornata, niente trasferta
    expect(calcolaStima({ ...base, km: 64, oreAggiuntive: 1, parametri: conTrasferta }).voci.conducente).toMatchObject({ giorniTrasferta: 0, trasferta: 0 });
    // vicino ma lungo: 64 km e 9 h di attese -> 10 h di servizio, oltre le 8
    expect(calcolaStima({ ...base, km: 64, oreAggiuntive: 9, parametri: conTrasferta }).voci.conducente.giorniTrasferta).toBe(1);
    // due giorni (ritorno a vuoto, 16 h di guida): due giorni di trasferta e una notte
    const due = calcolaStima({ ...base, ritornoAVuoto: true, parametri: conTrasferta }).voci.conducente;
    expect(due).toMatchObject({ giorniTrasferta: 2, trasferta: 92, pernottamenti: 1, diarie: 48 });
    expect(due.totale).toBe(due.oreTotale + 48 + 92);
    // fuori sede senza importo: avviso
    expect(calcolaStima({ ...base, parametri: { ...conTrasferta, indennitaTrasferta: null } }).avvisi.some(a => a.includes('trasferta'))).toBe(true);
  });

  test('pedaggi noti ed extra', () => {
    const r = calcolaStima({ ...base, kmAutostrada: 400, pedaggi: 75.5, extra: [{ descrizione: 'Traghetto', importo: 320 }] });
    expect(r.voci.pedaggi).toEqual({ stimati: false, totale: 75.5 });
    expect(r.voci.extra.totale).toBe(320);
    expect(r.totale).toBe(809.6 + 75.5 + 320);
  });

  test('a ore: mezzo sulle ore di lavoro, operatore sulle ore di servizio, pernottamenti scritti', () => {
    const r = calcolaStima({ ...base, tipo: 'ore', costoMezzo: 32, km: undefined, oreLavoro: 16, oreAggiuntive: 2, pernottamenti: 1 });
    expect(r.kmTotali).toBeNull();
    expect(r.oreServizio).toBe(18);
    expect(r.voci.mezzo.totale).toBe(512 + 18 * 8); // 16 h motore × 32 + 18 h di impegno × 8
    expect(r.voci.conducente.totale).toBe(18 * 24 + 48);
    expect(r.voci.aziendali.totale).toBe(144);
    expect(r.perKm).toBeNull();
  });

  test('nei trasporti anche il valore per km dei costi aziendali e il totale che ne verrebbe', () => {
    const r = calcolaStima({ ...base, parametri: { ...parametri, costoAziendalePerKm: 0.12 } });
    expect(r.voci.aziendali).toMatchObject({ totale: 80, perKm: 0.12, totaleSeKm: 61.44 }); // 512 × 0,12
    expect(r.totale).toBe(809.6); // il totale resta per ora
    expect(r.totaleConAziendaliPerKm).toBe(791.04); // 809,60 − 80 + 61,44
    const ore = calcolaStima({ ...base, tipo: 'ore', oreLavoro: 8, parametri: { ...parametri, costoAziendalePerKm: 0.12 } });
    expect(ore.voci.aziendali.perKm).toBeNull();
    expect(ore.totaleConAziendaliPerKm).toBeNull();
  });

  test('i dati mancanti contano zero e diventano avvisi', () => {
    const r = calcolaStima({ ...base, costoMezzo: null, costoMezzoOra: null, costoOrario: null, ritornoAVuoto: true, kmAutostrada: 100, parametri: { ...parametri, diaria: null, pedaggioKm: null, costoAziendalePerOra: null } });
    expect(r.totale).toBe(0);
    expect(r.avvisi).toHaveLength(7); // anche la trasferta: due giorni senza indennità impostata
  });
});

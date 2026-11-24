// Stima dei costi di un servizio: parametri (2026-11-17)
import { STIMA_INIZIALI, erroriStima, stimaEffettiva } from '../../src/domini/impostazioni/limiti';
import { annoDiRiferimento, costiAttribuiti, costoPerKm, costoPerOra, erroriAnno, totaleVoci, vociPulite } from '../../src/domini/stima/parametri';

describe('stima: parametri generali', () => {
  test('valori iniziali: velocità e ore di guida, il resto vuoto', () => {
    expect(stimaEffettiva(null)).toEqual(STIMA_INIZIALI);
    expect(STIMA_INIZIALI).toMatchObject({ velocitaMedia: 64, oreGuidaGiorno: 9, costoOrarioConducente: null, diaria: null, pedaggioKm: null, oreImpiegoAnnue: 2048 });
    expect(erroriStima({ oreImpiegoAnnue: 64 })).toHaveLength(1);
    expect(erroriStima({ oreImpiegoAnnue: 1760 })).toEqual([]);
  });
  test('tutti modificabili entro i limiti', () => {
    expect(erroriStima({ costoOrarioConducente: 28.5, velocitaMedia: 72, oreGuidaGiorno: 10, diaria: 46.48, pedaggioKm: 0.16 })).toEqual([]);
    expect(erroriStima({ velocitaMedia: 8 })).toHaveLength(1);
    expect(erroriStima({ oreGuidaGiorno: 32 })).toHaveLength(1);
    expect(erroriStima({ pedaggioKm: 0.123 })).toHaveLength(1);
    expect(erroriStima({ diaria: null, pedaggioKm: null })).toEqual([]);
  });
  test('un valore salvato fuori limite torna a quello iniziale', () => {
    expect(stimaEffettiva({ velocitaMedia: 500, diaria: 40 })).toMatchObject({ velocitaMedia: 64, diaria: 40 });
  });
});

describe('stima: costi aziendali per anno', () => {
  test('totale delle voci e costo per ora di servizio', () => {
    const voci = { personale: 120000, struttura: 48000.5, consulenze: 12000 };
    expect(totaleVoci(voci)).toBe(180000.5);
    expect(costoPerOra(180000.5, 16384)).toBe(10.99);
    expect(costoPerOra(180000, null)).toBeNull();
  });
  test('errori dell\'anno', () => {
    expect(erroriAnno(2026, { stato: 'preventivo', voci: { personale: 1000 }, oreServizio: 2048 })).toEqual([]);
    expect(erroriAnno(1999, { stato: 'boh' })).toHaveLength(2);
    expect(erroriAnno(2026, { stato: 'consuntivo', voci: { mensa: 10 } })).toEqual(['Voce sconosciuta: mensa']);
    expect(erroriAnno(2026, { stato: 'consuntivo', voci: { altro: -1 }, oreServizio: 0 })).toHaveLength(2);
  });
  test('costo aziendale per km, al millesimo; km annui fra i limiti', () => {
    expect(costoPerKm(120000, 1000000)).toBe(0.12);
    expect(costoPerKm(180000.5, 1048576)).toBe(0.172);
    expect(costoPerKm(1000, null)).toBeNull();
    expect(erroriAnno(2026, { stato: 'consuntivo', kmAnnui: 1024000 })).toEqual([]);
    expect(erroriAnno(2026, { stato: 'consuntivo', kmAnnui: 0 })).toHaveLength(1);
  });

  test('quota sui servizi con i mezzi: i coefficienti si calcolano sui costi attribuiti', () => {
    expect(costiAttribuiti(348000, 64)).toBe(222720);
    expect(costiAttribuiti(348000, null)).toBe(348000); // senza quota: tutto
    expect(costoPerOra(costiAttribuiti(348000, 64), 6400)).toBe(34.8);
    expect(erroriAnno(2026, { stato: 'preventivo', quotaMezzi: 64 })).toEqual([]);
    expect(erroriAnno(2026, { stato: 'preventivo', quotaMezzi: 120 })).toHaveLength(1);
  });

  test('voci pulite: niente vuoti, al centesimo', () => {
    expect(vociPulite({ personale: 10.005, struttura: undefined, altro: 0 })).toEqual({ personale: 10.01, altro: 0 });
  });
  test('anno di riferimento: quello in corso, altrimenti il più recente prima', () => {
    expect(annoDiRiferimento([2024, 2025, 2026], 2026)).toBe(2026);
    expect(annoDiRiferimento([2024, 2025], 2026)).toBe(2025);
    expect(annoDiRiferimento([2027], 2026)).toBeNull();
  });
});

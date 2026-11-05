// Resoconti — CSV delle registrazioni: celle, numeri, date, file intero
import { cellaCsv, codiceCsv, dataCsv, nomeFileCsv, numeroCsv, testoCsv, type RigaCsv } from '../../src/domini/resoconti/csv';

describe('CSV delle spese', () => {
  test('celle di testo: virgolette solo se servono, formule disinnescate', () => {
    expect(cellaCsv('Iveco Daily')).toBe('Iveco Daily');
    expect(cellaCsv(null)).toBe('');
    expect(cellaCsv('Rossi; Bianchi')).toBe('"Rossi; Bianchi"');
    expect(cellaCsv('Officina "Da Mario"')).toBe('"Officina ""Da Mario"""');
    expect(cellaCsv('riga 1\nriga 2')).toBe('"riga 1\nriga 2"');
    expect(cellaCsv('=SOMMA(A1:A9)')).toBe("'=SOMMA(A1:A9)");
    expect(cellaCsv('-12')).toBe("'-12");
    expect(cellaCsv('@cmd')).toBe("'@cmd");
  });

  test('codici di sole cifre con lo zero davanti restano testo in Excel', () => {
    expect(codiceCsv('01234567890')).toBe('="01234567890"');
    expect(codiceCsv('12345678901')).toBe('12345678901');
    expect(codiceCsv('GH128KM')).toBe('GH128KM');
    expect(codiceCsv('1234567890123456')).toBe('="1234567890123456"');
    expect(codiceCsv(null)).toBe('');
  });

  test('numeri con la virgola, date gg/mm/aaaa, nome del file', () => {
    expect(numeroCsv(1492.5)).toBe('1492,50');
    expect(numeroCsv(0.25)).toBe('0,25');
    expect(dataCsv('2026-11-04')).toBe('04/11/2026');
    expect(nomeFileCsv({ dal: '2026-01-01', al: '2026-11-04' })).toBe('spese-vigilo-2026-01-01-2026-11-04.csv');
  });

  test('file intero: BOM, intestazioni, righe con CRLF, totale', () => {
    const r: RigaCsv = {
      giorno: '2026-03-15',
      soggetto: 'Iveco Daily 01',
      identificativo: 'GH128KM',
      tipo: 'veicolo',
      sede: 'Sede di Nereto',
      scadenza: 'Tagliando',
      natura: 'manutenzione',
      esecuzione: 'entrambe',
      fornitore: 'Autofficina Giuliani',
      tipoFornitore: 'Officina',
      riferimento: 'Fatt. 128/2026',
      litri: null,
      importo: 320,
      ore: 1.5,
      manodopera: 48,
    };
    const rifornimento: RigaCsv = { ...r, scadenza: 'Carburante', natura: 'uso', esecuzione: null, fornitore: null, tipoFornitore: null, riferimento: null, litri: 412.5, importo: 701.25, ore: 0, manodopera: 0 };
    const testo = testoCsv([r, { ...r, importo: 0, ore: 0, manodopera: 0, esecuzione: null, fornitore: null, tipoFornitore: null }, rifornimento]);
    expect(testo.startsWith('﻿Data;Soggetto;')).toBe(true);
    const righe = testo.slice(1).split('\r\n');
    expect(righe).toHaveLength(5); // intestazioni, 3 righe, riga vuota finale
    expect(righe[1]).toBe('15/03/2026;Iveco Daily 01;GH128KM;Veicolo;Sede di Nereto;Tagliando;Manutenzione;Interna ed esterna;Autofficina Giuliani;Officina;Fatt. 128/2026;;320,00;1,50;48,00;368,00');
    expect(righe[2]).toBe('15/03/2026;Iveco Daily 01;GH128KM;Veicolo;Sede di Nereto;Tagliando;Manutenzione;;;;Fatt. 128/2026;;;;;0,00');
    expect(righe[3]).toBe('15/03/2026;Iveco Daily 01;GH128KM;Veicolo;Sede di Nereto;Carburante;Uso (rifornimenti);;;;;412,50;701,25;;;701,25');
    expect(righe[4]).toBe('');
  });
});

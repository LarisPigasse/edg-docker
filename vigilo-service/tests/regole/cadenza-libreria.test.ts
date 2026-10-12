// Fasce d'eta' e finestra di anticipo (libreria-bozza, proposte A e B)
import { baseDelCalcolo, descriviCadenza, durataAl, primaScadenza, prossimaScadenza } from '../../src/regole';
import { cadenza } from './helpers';

const anni = (valore: number) => ({ valore, unita: 'anni' as const });
const mesi = (valore: number) => ({ valore, unita: 'mesi' as const });

// Patente B: 10 anni, 5 da 50, 3 da 70, 2 da 80, dalla scadenza (compleanno)
const patenteB = cadenza({
  tempo: anni(10),
  fasce: { da: 'nascita', elenco: [{ oltre: anni(70), tempo: anni(3) }, { oltre: anni(50), tempo: anni(5) }, { oltre: anni(80), tempo: anni(2) }] },
});
const nato = { nascita: '1976-03-15' };

// CQC: 5 anni, dalla scadenza se il corso finisce nei 12 mesi prima
const cqc = cadenza({ tempo: anni(5), ancoraggio: 'finestra', finestra: mesi(12) });

describe('fasce d\'eta\' (proposta A)', () => {
  test('la durata dipende dall\'eta\' alla data da cui si conta', () => {
    expect(durataAl(patenteB, '2016-03-15', nato)).toEqual(anni(10)); // 40 anni
    expect(durataAl(patenteB, '2026-03-14', nato)).toEqual(anni(10)); // un giorno prima dei 50
    expect(durataAl(patenteB, '2026-03-15', nato)).toEqual(anni(5)); // 50 anni (fasce in qualunque ordine)
    expect(durataAl(patenteB, '2046-03-15', nato)).toEqual(anni(3)); // 70
    expect(durataAl(patenteB, '2056-03-15', nato)).toEqual(anni(2)); // 80
  });

  test('senza la data del soggetto vale la durata base', () => {
    expect(durataAl(patenteB, '2046-03-15', {})).toEqual(anni(10));
    expect(durataAl(cadenza({ uso: { valore: 512, unita: 'ore' } }), '2026-01-01')).toBeNull();
  });

  test('patente B: rinnovo a 40 anni → 10, rinnovo a 50 anni → 5', () => {
    const r = (scadeIl: string, eseguitaIl: string) =>
      prossimaScadenza(patenteB, { scadeIl, sogliaUso: null }, { eseguitaIl, lettura: null }, {}, null, nato).scadeIl;
    expect(r('2016-03-15', '2016-02-01')).toBe('2026-03-15');
    expect(r('2026-03-15', '2026-02-20')).toBe('2031-03-15');
  });

  test('verifica gru: biennale, annuale da 10 anni dalla fabbricazione', () => {
    const gru = cadenza({
      tempo: anni(2),
      ancoraggio: 'esecuzione',
      fasce: { da: 'fabbricazione', elenco: [{ oltre: anni(10), tempo: anni(1) }] },
    });
    const fatta = { fabbricazione: '2017-06-01' };
    const r = (eseguitaIl: string) =>
      prossimaScadenza(gru, { scadeIl: eseguitaIl, sogliaUso: null }, { eseguitaIl, lettura: null }, {}, null, fatta).scadeIl;
    expect(r('2026-10-12')).toBe('2028-10-12'); // 9 anni
    expect(r('2027-06-01')).toBe('2028-06-01'); // 10 anni
  });

  test('prima scadenza e scadenze successive a oggi seguono le fasce', () => {
    const vdt = cadenza({
      tempo: anni(5),
      ancoraggio: 'esecuzione',
      prima: { tempo: anni(5), da: 'assunzione' },
      fasce: { da: 'nascita', elenco: [{ oltre: anni(50), tempo: anni(2) }] },
    });
    // assunto nel 2010, nato nel 1970: 2015 (45 anni) → 2020 (50: da qui ogni 2) → 2022 → 2024 → 2026-03 → 2028
    expect(primaScadenza(vdt, { assunzione: '2010-03-01', nascita: '1970-01-01' }, '2026-10-12')).toBe('2028-03-01');
  });
});

describe('finestra di anticipo (proposta B)', () => {
  const r = (eseguitaIl: string) =>
    prossimaScadenza(cqc, { scadeIl: '2027-05-20', sogliaUso: null }, { eseguitaIl, lettura: null }).scadeIl;

  test('fatto nei 12 mesi prima: dalla scadenza', () => {
    expect(r('2026-06-10')).toBe('2032-05-20');
    expect(r('2026-05-20')).toBe('2032-05-20'); // primo giorno della finestra
    expect(r('2027-05-20')).toBe('2032-05-20'); // il giorno della scadenza
  });

  test('fatto prima della finestra o dopo la scadenza: dall\'esecuzione', () => {
    expect(r('2026-05-19')).toBe('2031-05-19');
    expect(r('2027-06-03')).toBe('2032-06-03');
  });

  test('senza scadenza attuale si conta dall\'esecuzione', () => {
    expect(baseDelCalcolo(cqc, { scadeIl: null, sogliaUso: null }, '2026-10-12')).toEqual({ base: '2026-10-12', daScadenza: false });
  });
});

describe('testi', () => {
  test('fasce e finestra in una frase', () => {
    expect(descriviCadenza(patenteB)).toBe(
      'ogni 10 anni (età da 50 anni: ogni 5 anni; età da 70 anni: ogni 3 anni; età da 80 anni: ogni 2 anni) dalla scadenza precedente'
    );
    expect(
      descriviCadenza(
        cadenza({ tempo: anni(2), ancoraggio: 'esecuzione', fasce: { da: 'fabbricazione', elenco: [{ oltre: anni(10), tempo: anni(1) }] } }),
        { fabbricazione: 'dalla fabbricazione' }
      )
    ).toBe('ogni 2 anni (da 10 anni dalla fabbricazione: ogni anno) dalla data di esecuzione');
    expect(descriviCadenza(cqc)).toBe(
      'ogni 5 anni dalla scadenza precedente se fatto entro 12 mesi prima, altrimenti dalla data di esecuzione'
    );
  });
});

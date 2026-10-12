import { prossimaScadenza, primaScadenza } from '../../src/regole';
import { cadenza } from './helpers';

const OGGI = '2026-10-08';

describe('prossima scadenza — casi della tabella 01-dominio 1.5', () => {
  test('revisione fino a 3,5 t: prima dopo 4 anni dall\'immatricolazione, poi ogni 24 mesi a fine mese', () => {
    const c = cadenza({ tempo: { valore: 24, unita: 'mesi' }, fineMese: true, prima: { tempo: { valore: 4, unita: 'anni' }, da: 'immatricolazione' } });
    expect(primaScadenza(c, { immatricolazione: '2022-05-10' })).toBe('2026-05-31');
    const p = prossimaScadenza(c, { scadeIl: '2026-05-31', sogliaUso: null }, { eseguitaIl: '2026-05-20', lettura: null });
    expect(p.scadeIl).toBe('2028-05-31');
    expect(p.finita).toBe(false);
  });

  test('revisione oltre 3,5 t: ogni 12 mesi a fine mese, eseguita in ritardo', () => {
    const c = cadenza({ tempo: { valore: 12, unita: 'mesi' }, fineMese: true });
    const p = prossimaScadenza(c, { scadeIl: '2026-09-30', sogliaUso: null }, { eseguitaIl: OGGI, lettura: null });
    expect(p.scadeIl).toBe('2027-09-30');
  });

  test('assicurazione RCA: rinnovata in tolleranza, il calendario non slitta', () => {
    const c = cadenza({ tempo: { valore: 12, unita: 'mesi' } });
    const p = prossimaScadenza(c, { scadeIl: '2026-10-01', sogliaUso: null }, { eseguitaIl: '2026-10-10', lettura: null });
    expect(p.scadeIl).toBe('2027-10-01');
  });

  test('tagliando: 12 mesi o 16.000 km dalla data di esecuzione', () => {
    const c = cadenza({ tempo: { valore: 12, unita: 'mesi' }, uso: { valore: 16000, unita: 'km' }, ancoraggio: 'esecuzione' });
    const p = prossimaScadenza(c, { scadeIl: '2026-11-12', sogliaUso: 249000 }, { eseguitaIl: OGGI, lettura: 248360 });
    expect(p.scadeIl).toBe('2027-10-08');
    expect(p.sogliaUso).toBe(264360);
  });

  test('cambio olio: ogni 512 ore', () => {
    const c = cadenza({ uso: { valore: 512, unita: 'ore' }, ancoraggio: 'esecuzione' });
    const p = prossimaScadenza(c, { scadeIl: null, sogliaUso: 4096 }, { eseguitaIl: OGGI, lettura: 4101 });
    expect(p).toMatchObject({ scadeIl: null, sogliaUso: 4613, finita: false });
  });

  test('a uso senza lettura: soglia non calcolabile, segnalato', () => {
    const c = cadenza({ uso: { valore: 512, unita: 'ore' } });
    const p = prossimaScadenza(c, { scadeIl: null, sogliaUso: 4096 }, { eseguitaIl: OGGI, lettura: null });
    expect(p.letturaMancante).toBe(true);
    expect(p.sogliaUso).toBeNull();
  });

  test('patente C e CQC: 5 anni dalla scadenza precedente', () => {
    const c = cadenza({ tempo: { valore: 5, unita: 'anni' } });
    expect(prossimaScadenza(c, { scadeIl: '2026-10-29', sogliaUso: null }, { eseguitaIl: '2026-10-20', lettura: null }).scadeIl).toBe('2031-10-29');
  });

  test('visita medica: 12 mesi dalla visita', () => {
    const c = cadenza({ tempo: { valore: 12, unita: 'mesi' }, ancoraggio: 'esecuzione' });
    expect(prossimaScadenza(c, { scadeIl: '2026-10-13', sogliaUso: null }, { eseguitaIl: '2026-10-09', lettura: null }).scadeIl).toBe('2027-10-09');
  });

  test('estintori ogni 6 mesi, CPI ogni 5 anni, ISO ogni 12 mesi', () => {
    expect(prossimaScadenza(cadenza({ tempo: { valore: 6, unita: 'mesi' }, ancoraggio: 'esecuzione' }), { scadeIl: '2026-10-15', sogliaUso: null }, { eseguitaIl: '2026-10-15', lettura: null }).scadeIl).toBe('2027-04-15');
    expect(prossimaScadenza(cadenza({ tempo: { valore: 5, unita: 'anni' } }), { scadeIl: '2027-03-01', sogliaUso: null }, { eseguitaIl: '2027-02-10', lettura: null }).scadeIl).toBe('2032-03-01');
    expect(prossimaScadenza(cadenza({ tempo: { valore: 12, unita: 'mesi' } }), { scadeIl: '2026-06-30', sogliaUso: null }, { eseguitaIl: '2026-06-12', lettura: null }).scadeIl).toBe('2027-06-30');
  });

  test('rata del leasing: ogni mese a fine mese, si ferma alla data di fine', () => {
    const c = cadenza({ tempo: { valore: 1, unita: 'mesi' }, fineMese: true });
    const fine = { fineIl: '2028-12-31' };
    expect(prossimaScadenza(c, { scadeIl: '2028-11-30', sogliaUso: null }, { eseguitaIl: '2028-11-30', lettura: null }, fine).scadeIl).toBe('2028-12-31');
    const ultima = prossimaScadenza(c, { scadeIl: '2028-12-31', sogliaUso: null }, { eseguitaIl: '2028-12-31', lettura: null }, fine);
    expect(ultima.finita).toBe(true);
  });

  test('rata il 30 di ogni mese: dopo febbraio torna al 30 (ancora)', () => {
    const c = cadenza({ tempo: { valore: 1, unita: 'mesi' } });
    const feb = prossimaScadenza(c, { scadeIl: '2027-01-30', sogliaUso: null }, { eseguitaIl: '2027-01-30', lettura: null }, {}, 30);
    expect(feb.scadeIl).toBe('2027-02-28');
    const mar = prossimaScadenza(c, { scadeIl: feb.scadeIl, sogliaUso: null }, { eseguitaIl: '2027-02-28', lettura: null }, {}, 30);
    expect(mar.scadeIl).toBe('2027-03-30');
  });

  test('ripetizioni: si contano e si esauriscono', () => {
    const c = cadenza({ tempo: { valore: 1, unita: 'mesi' } });
    const p = prossimaScadenza(c, { scadeIl: '2026-10-15', sogliaUso: null }, { eseguitaIl: '2026-10-15', lettura: null }, { ripetizioniRimaste: 2 });
    expect(p).toMatchObject({ scadeIl: '2026-11-15', ripetizioniRimaste: 1 });
    expect(prossimaScadenza(c, { scadeIl: '2026-12-15', sogliaUso: null }, { eseguitaIl: '2026-12-15', lettura: null }, { ripetizioniRimaste: 0 }).finita).toBe(true);
  });

  test('promemoria una tantum: dopo la registrazione e\' finito', () => {
    expect(prossimaScadenza(cadenza({}), { scadeIl: '2026-11-03', sogliaUso: null }, { eseguitaIl: '2026-11-01', lettura: null }).finita).toBe(true);
  });

  test('calendario fisso ma intervento con anni di ritardo: la prossima viene dopo l\'esecuzione', () => {
    const c = cadenza({ tempo: { valore: 12, unita: 'mesi' } });
    expect(prossimaScadenza(c, { scadeIl: '2024-03-01', sogliaUso: null }, { eseguitaIl: OGGI, lettura: null }).scadeIl).toBe('2027-03-01');
  });
});

describe('prima scadenza di un soggetto nuovo', () => {
  const rev = cadenza({ tempo: { valore: 24, unita: 'mesi' }, fineMese: true, prima: { tempo: { valore: 4, unita: 'anni' }, da: 'immatricolazione' } });

  test('mezzo inserito anni dopo: si propone la prima successiva a oggi', () => {
    // 2020-09-30, 2022, 2024, 2026-09-30 (gia' passata l'8 ottobre) -> 2028-09-30
    expect(primaScadenza(rev, { immatricolazione: '2016-09-15' }, OGGI)).toBe('2028-09-30');
    expect(primaScadenza(rev, { immatricolazione: '2016-09-15' }, '2026-09-30')).toBe('2026-09-30');
  });

  test('senza la data del soggetto: da completare', () => {
    expect(primaScadenza(rev, {})).toBeNull();
    expect(primaScadenza(cadenza({ tempo: { valore: 12, unita: 'mesi' } }), { immatricolazione: '2020-01-01' })).toBeNull();
  });
});

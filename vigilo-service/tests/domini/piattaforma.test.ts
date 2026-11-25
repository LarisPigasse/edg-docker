// Dati di un tenant (fase 3, ADR117): tabelle, ordine di eliminazione, eliminazioni in corso
import fs from 'fs';
import path from 'path';
import { conTenantInEliminazione, eInEliminazione } from '../../src/domini/piattaforma/eliminazioni';
import { TABELLE_CONFIGURAZIONE, TABELLE_DATI, cheCosaResta, tabelleDaEliminare } from '../../src/domini/piattaforma/tabelle';

const DOMINI = path.join(__dirname, '../../src/domini');

/** classe → { tabella, conTenant } leggendo i file dei modelli come testo (niente database) */
function modelli(): Map<string, { tabella: string; conTenant: boolean }> {
  const m = new Map<string, { tabella: string; conTenant: boolean }>();
  const giro = (dir: string) => {
    for (const v of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, v.name);
      if (v.isDirectory()) giro(p);
      else if (v.name.endsWith('.model.ts')) {
        const s = fs.readFileSync(p, 'utf8');
        const classe = s.match(/export class (\w+)/)?.[1];
        const tabella = s.match(/tableName: '([a-z_]+)'/)?.[1];
        if (classe && tabella) m.set(classe, { tabella, conTenant: /declare idTenant\b/.test(s) });
      }
    }
  };
  giro(DOMINI);
  return m;
}

describe('tabelle del tenant', () => {
  const tutte = [...TABELLE_DATI, ...TABELLE_CONFIGURAZIONE];

  test('ogni tabella con il tenant è in uno dei due elenchi, una volta sola; nessuna tabella comune', () => {
    const conTenant = [...modelli().values()].filter(x => x.conTenant).map(x => x.tabella).sort();
    expect(new Set(tutte).size).toBe(tutte.length);
    expect([...tutte].sort()).toEqual(conTenant);
    for (const comune of ['libreria_categorie', 'libreria_controlli', 'modelli_settore', 'modelli_voci', 'tipi_fornitore']) expect(tutte).not.toContain(comune);
  });

  test('ogni figlia si elimina prima del suo genitore (legami di modelli.ts)', () => {
    const m = modelli();
    const s = fs.readFileSync(path.join(DOMINI, 'modelli.ts'), 'utf8');
    const ordine = tabelleDaEliminare('tutto');
    const legami = [...s.matchAll(/^(\w+)\.belongsTo\((\w+),/gm)].map(([, figlia, genitore]) => [m.get(figlia)?.tabella, m.get(genitore)?.tabella]);
    expect(legami.length).toBeGreaterThan(16);
    for (const [figlia, genitore] of legami) {
      if (!figlia || !genitore || figlia === genitore) continue;
      const [i, j] = [ordine.indexOf(figlia as never), ordine.indexOf(genitore as never)];
      if (i < 0 || j < 0) continue; // tabelle comuni
      expect(`${figlia} prima di ${genitore}: ${i < j}`).toBe(`${figlia} prima di ${genitore}: true`);
    }
  });

  test("'dati' tiene la configurazione, 'tutto' la toglie dopo i dati", () => {
    expect(tabelleDaEliminare('dati')).toEqual([...TABELLE_DATI]);
    for (const c of TABELLE_CONFIGURAZIONE) expect(tabelleDaEliminare('dati')).not.toContain(c);
    expect(tabelleDaEliminare('tutto')).toEqual([...TABELLE_DATI, ...TABELLE_CONFIGURAZIONE]);
    expect(tabelleDaEliminare('tutto').at(-1)).toBe('impostazioni');
    expect(cheCosaResta('tutto')).toMatch(/procedura di avvio/);
    expect(cheCosaResta('dati')).toMatch(/Restano categorie, controlli/);
  });
});

describe('eliminazioni in corso', () => {
  test('il tenant è segnato durante il lavoro, una seconda eliminazione è rifiutata, il segno sparisce anche se fallisce', async () => {
    let durante = false;
    let seconda: unknown = null;
    await conTenantInEliminazione(7, async () => {
      durante = eInEliminazione(7);
      seconda = await conTenantInEliminazione(7, async () => 'no').catch(e => (e as Error).message);
    });
    expect(durante).toBe(true);
    expect(seconda).toBe('Eliminazione già in corso per questo tenant');
    expect(eInEliminazione(7)).toBe(false);
    await expect(conTenantInEliminazione(8, async () => Promise.reject(new Error('db')))).rejects.toThrow('db');
    expect(eInEliminazione(8)).toBe(false);
  });
});

// =============================================================================
// Dati di un tenant in Vigilo: riepilogo ed eliminazione (fase 3, ADR117)
// =============================================================================
// Il contratto "dati del tenant" che ogni modulo espone alla piattaforma: quanto
// c'è (per la scheda del tenant e la demo) e "togli tutto" o "togli i dati,
// tieni la configurazione" (tabelle.ts). L'eliminazione è una transazione sola,
// tabella per tabella nell'ordine giusto; poi un ultimo passaggio su avvisi e
// consegne (eventuali righe nate nel frattempo) e i file dei documenti, che
// non stanno nella transazione: un file che non si toglie si dice nell'esito.
// =============================================================================
import fs from 'fs/promises';
import path from 'path';
import type { Transaction } from 'sequelize';
import { sequelize } from '../../config/database';
import type { Contesto } from '../../core/contesto';
import { logger } from '../../core/services/logger';
import { ConflictError } from '../../core/utils/errors';
import { cartellaDelTenant } from '../allegati/allegati.service';
import { conTenantInEliminazione } from './eliminazioni';
import { TABELLE_CONFIGURAZIONE, TABELLE_DATI, cheCosaResta, tabelleDaEliminare, type ModoEliminazione, type TabellaTenant } from './tabelle';

/** Come si chiama ogni tabella per chi legge */
export const ETICHETTE: Record<TabellaTenant, string> = {
  consegne: 'Consegne degli avvisi',
  avvisi: 'Avvisi',
  letture: 'Letture dei contatori',
  allegati: 'Documenti',
  registrazioni: 'Registrazioni',
  controlli_non_seguiti: 'Controlli non seguiti',
  rifornimenti: 'Rifornimenti',
  scadenze: 'Scadenze',
  contatori: 'Contatori',
  assegnazioni: 'Assegnazioni',
  soggetti: 'Soggetti',
  fornitori: 'Fornitori',
  stime_costi: 'Stime dei costi',
  costi_aziendali: 'Costi aziendali',
  controlli_categorie: 'Categorie dei controlli',
  controlli: 'Controlli',
  categorie: 'Categorie',
  decisioni_libreria: 'Decisioni sulla libreria',
  preferenze_avvisi: 'Preferenze degli avvisi',
  recapiti_email: 'Indirizzi email degli avvisi',
  impostazioni: 'Impostazioni',
};

export interface RigaTabella {
  tabella: TabellaTenant;
  etichetta: string;
  righe: number;
}

export interface RiepilogoDati {
  idTenant: number;
  /** Ha fatto la procedura di avvio */
  avviato: boolean;
  dati: RigaTabella[];
  configurazione: RigaTabella[];
  scadenze: { aperte: number; scadute: number };
  documenti: { numero: number; byte: number };
}

const numero = (v: unknown): number => Number(v ?? 0) || 0;

async function conta(tabelle: readonly TabellaTenant[], idTenant: number): Promise<RigaTabella[]> {
  const parti = tabelle.map(t => `SELECT '${t}' AS tabella, count(*)::int AS righe FROM "${t}" WHERE id_tenant = $1`).join(' UNION ALL ');
  const [righe] = (await sequelize.query(parti, { bind: [idTenant] })) as [{ tabella: TabellaTenant; righe: number }[], unknown];
  const per = new Map(righe.map(r => [r.tabella, numero(r.righe)]));
  return tabelle.map(t => ({ tabella: t, etichetta: ETICHETTE[t], righe: per.get(t) ?? 0 }));
}

/** Quanto c'è di un tenant in Vigilo */
export async function riepilogoDati(idTenant: number): Promise<RiepilogoDati> {
  const [dati, configurazione, [extra]] = await Promise.all([
    conta(TABELLE_DATI, idTenant),
    conta(TABELLE_CONFIGURAZIONE, idTenant),
    sequelize.query(
      `SELECT
         (SELECT count(*) FROM scadenze WHERE id_tenant = $1 AND chiusa_il IS NULL)::int AS aperte,
         (SELECT count(*) FROM scadenze WHERE id_tenant = $1 AND chiusa_il IS NULL AND stato = 'scaduta')::int AS scadute,
         (SELECT count(*) FROM allegati WHERE id_tenant = $1)::int AS documenti,
         (SELECT coalesce(sum(dimensione), 0) FROM allegati WHERE id_tenant = $1)::bigint AS byte,
         (SELECT avviato_il FROM impostazioni WHERE id_tenant = $1) AS avviato_il`,
      { bind: [idTenant] }
    ) as Promise<[Record<string, unknown>[], unknown]>,
  ]);
  const e = extra[0] ?? {};
  return {
    idTenant,
    avviato: e.avviato_il != null,
    dati,
    configurazione,
    scadenze: { aperte: numero(e.aperte), scadute: numero(e.scadute) },
    documenti: { numero: numero(e.documenti), byte: numero(e.byte) },
  };
}

export interface EsitoEliminazione {
  idTenant: number;
  modo: ModoEliminazione;
  righe: Partial<Record<TabellaTenant, number>>;
  totaleRighe: number;
  file: { tolti: number; nonTolti: number };
  resta: string;
}

/** Quanti file in una cartella (anche nelle sottocartelle); 0 se non c'è */
async function contaFile(cartella: string): Promise<number> {
  let n = 0;
  const voci = await fs.readdir(cartella, { withFileTypes: true }).catch(() => []);
  for (const v of voci) n += v.isDirectory() ? await contaFile(path.join(cartella, v.name)) : 1;
  return n;
}

/** Elimina i dati di un tenant: 'tutto' o 'dati' (configurazione tenuta). Solo root, mai il proprio tenant. */
export async function eliminaDatiTenant(ctx: Contesto, idTenant: number, modo: ModoEliminazione): Promise<EsitoEliminazione> {
  if (idTenant === ctx.utente.tenantId) throw new ConflictError('I dati del tenant di sistema non si eliminano da qui');
  return conTenantInEliminazione(idTenant, async () => {
    const righe: Partial<Record<TabellaTenant, number>> = {};
    const svuota = async (t: TabellaTenant, transaction?: Transaction) => {
      const [, meta] = (await sequelize.query(`DELETE FROM "${t}" WHERE id_tenant = $1`, { bind: [idTenant], ...(transaction ? { transaction } : {}) })) as [unknown, { rowCount?: number }];
      righe[t] = (righe[t] ?? 0) + numero(meta?.rowCount);
    };
    await sequelize.transaction(async transaction => {
      for (const t of tabelleDaEliminare(modo)) await svuota(t, transaction);
    });
    // ultimo passaggio: avvisi nati mentre si eliminava (la generazione salta il tenant, ma una già partita no)
    await svuota('consegne');
    await svuota('avvisi');

    // i file dei documenti: sempre dati, in entrambi i modi
    const cartella = cartellaDelTenant(idTenant);
    const primaFile = await contaFile(cartella);
    let nonTolti = 0;
    try {
      await fs.rm(cartella, { recursive: true, force: true });
    } catch (err) {
      nonTolti = await contaFile(cartella);
      logger.warn('vigilo.piattaforma', `Documenti del tenant ${idTenant} non tolti dal disco: ${String(err)}`, { idTenant, nonTolti });
    }
    const totaleRighe = Object.values(righe).reduce((a, b) => a + (b ?? 0), 0);
    const esito: EsitoEliminazione = { idTenant, modo, righe, totaleRighe, file: { tolti: primaFile - nonTolti, nonTolti }, resta: cheCosaResta(modo) };
    logger.audit(
      'vigilo.dati.eliminati',
      `Dati di Vigilo del tenant ${idTenant} eliminati (${modo === 'tutto' ? 'tutto, configurazione compresa' : 'solo i dati, configurazione tenuta'}): ${totaleRighe} ${totaleRighe === 1 ? 'riga' : 'righe'} e ${esito.file.tolti} ${esito.file.tolti === 1 ? 'documento' : 'documenti'}`,
      { id: ctx.utente.id, email: ctx.utente.email, tenantId: ctx.idTenant },
      { tenantEliminato: idTenant, modo, righe, file: esito.file },
      'AUDIT'
    );
    return esito;
  });
}

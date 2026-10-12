// =============================================================================
// Allegato: un file di un soggetto, una scadenza o una registrazione (B9)
// =============================================================================
// Il file sta nel volume vigilo-uploads (percorso relativo), qui i dati per
// mostrarlo. Collegamento generico (entita + idEntita): niente FK, la pulizia
// la fa il servizio quando elimina l'entita'.
// =============================================================================
import { CreationOptional } from 'sequelize';
import { sequelize } from '../../config/database';
import { AUDIT, chiave, ConAudit, elenco, intero, istante, tenant, testo, uuid } from '../../core/db/colonne';
import { ENTITA_ALLEGATO, type EntitaAllegato } from '../valori';

export class Allegato extends ConAudit<Allegato> {
  declare idAllegato: CreationOptional<number>;
  declare uuidAllegato: CreationOptional<string>;
  declare idTenant: number;
  declare entita: EntitaAllegato;
  declare idEntita: number;
  declare nomeFile: string;
  /** Relativo alla cartella degli allegati, mai assoluto */
  declare percorso: string;
  declare tipoMime: string;
  declare dimensione: number;
  declare descrizione: CreationOptional<string | null>;
}

Allegato.init(
  {
    idAllegato: chiave(),
    uuidAllegato: uuid(),
    idTenant: tenant(),
    entita: elenco(ENTITA_ALLEGATO),
    idEntita: intero(false),
    nomeFile: testo(256, false),
    percorso: testo(512, false),
    tipoMime: testo(128, false),
    dimensione: { ...intero(false), validate: { min: 0 } },
    descrizione: testo(256),
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  { sequelize, tableName: 'allegati' }
);

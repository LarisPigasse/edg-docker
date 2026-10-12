// =============================================================================
// Colonne comuni dei modelli (02-modello-dati 2.1)
// =============================================================================
// Mattoncini per Model.init: le stesse convenzioni su tutte le tabelle senza
// ripeterle (chiave intera, uuid dal database, tenant, chi e quando).
// I modelli usano InferAttributes / CreationOptional (Sequelize >= 6.14):
// un solo elenco di campi per classe, niente interfacce gemelle.
// =============================================================================
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  ModelAttributeColumnOptions,
} from 'sequelize';

type Colonna = ModelAttributeColumnOptions;

/** Chiave primaria intera (SERIAL) */
export const chiave = (): Colonna => ({ type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true });

/**
 * uuid per cio' che esce dal servizio. Generato dal database
 * (DEFAULT gen_random_uuid()): allowNull solo per la validazione di Sequelize,
 * il NOT NULL vero e' nella tabella (come system-service).
 */
export const uuid = (): Colonna => ({ type: DataTypes.UUID, allowNull: true, unique: true });

/** Tenant del cliente: sempre da req.user, mai dalla richiesta (ADR068) */
export const tenant = (): Colonna => ({ type: DataTypes.INTEGER, allowNull: false });

/** Riferimento intero (FK o id esterno come idAccount) */
export const intero = (allowNull = true, defaultValue?: number): Colonna => ({
  type: DataTypes.INTEGER,
  allowNull,
  ...(defaultValue === undefined ? {} : { defaultValue }),
});

export const testo = (lunghezza?: number, allowNull = true): Colonna => ({
  type: lunghezza ? DataTypes.STRING(lunghezza) : DataTypes.TEXT,
  allowNull,
});

export const booleano = (defaultValue: boolean): Colonna => ({ type: DataTypes.BOOLEAN, allowNull: false, defaultValue });

/** Giorno 'AAAA-MM-GG' (DATEONLY: Sequelize lo restituisce come stringa, il tipo Giorno delle regole) */
export const giorno = (allowNull = true): Colonna => ({ type: DataTypes.DATEONLY, allowNull });

/** Istante (TIMESTAMPTZ) */
export const istante = (allowNull = true): Colonna => ({ type: DataTypes.DATE, allowNull });

/** JSONB; senza default lo fornisce il database o chi crea la riga */
export const json = (allowNull = false, defaultValue?: unknown): Colonna => ({
  type: DataTypes.JSONB,
  allowNull,
  ...(defaultValue === undefined ? {} : { defaultValue }),
});

/** Uno dei valori strutturali di domini/valori.ts (lo stesso elenco del CHECK) */
export const elenco = (valori: readonly string[], allowNull = false, defaultValue?: string): Colonna => ({
  type: DataTypes.STRING(32),
  allowNull,
  validate: { isIn: [valori as string[]] },
  ...(defaultValue === undefined ? {} : { defaultValue }),
});

/**
 * NUMERIC(12,2): pg lo restituisce come stringa per non perdere precisione;
 * qui diventa numero (importi e uso medio stanno ben dentro un double).
 */
export const decimale = (nome: string): Colonna => ({
  type: DataTypes.DECIMAL(12, 2),
  allowNull: true,
  get(this: Model) {
    const valore = this.getDataValue(nome);
    return valore === null || valore === undefined ? null : Number(valore);
  },
});

/** Chi ha creato e modificato la riga: accountId, null per i processi (core/db/audit.ts) */
export const AUDIT = {
  creatoDa: intero(),
  modificatoDa: intero(),
};

/**
 * Base dei modelli con chi e quando. Uso:
 *   class Soggetto extends ConAudit<Soggetto> { declare nome: string; ... }
 */
export abstract class ConAudit<M extends Model> extends Model<InferAttributes<M>, InferCreationAttributes<M>> {
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare creatoDa: CreationOptional<number | null>;
  declare modificatoDa: CreationOptional<number | null>;
}

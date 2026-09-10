// =============================================================================
// EDG System Service - Modello Anagrafica
// Copre partner, clienti e agenti (nella pratica sempre aziende) — un'unica
// tabella perche' i campi sono sostanzialmente gli stessi per i tre tipi.
// Il campo `tipo` resta un CHECK (non una tabella primitiva) perche' i tre
// valori ammessi sono strutturali e non destinati ad ampliarsi.
// =============================================================================
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type TipoAnagrafica = 'partner' | 'cliente' | 'agente';

interface AnagraficaAttributes {
  idAnagrafica: number;
  uuidAnagrafica: string;
  tipo: TipoAnagrafica;
  idTenant: number;
  ragioneSociale: string;
  partitaIva: string | null;
  codiceFiscale: string | null;
  indirizzo: string | null;
  cap: string | null;
  citta: string | null;
  provincia: string | null;
  telefono: string | null;
  email: string | null;
  referente: string | null;
  note: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AnagraficaCreationAttributes
  extends Optional<
    AnagraficaAttributes,
    | 'idAnagrafica'
    | 'uuidAnagrafica'
    | 'partitaIva'
    | 'codiceFiscale'
    | 'indirizzo'
    | 'cap'
    | 'citta'
    | 'provincia'
    | 'telefono'
    | 'email'
    | 'referente'
    | 'note'
    | 'isActive'
  > {}

class Anagrafica
  extends Model<AnagraficaAttributes, AnagraficaCreationAttributes>
  implements AnagraficaAttributes
{
  declare idAnagrafica: number;
  declare uuidAnagrafica: string;
  declare tipo: TipoAnagrafica;
  declare idTenant: number;
  declare ragioneSociale: string;
  declare partitaIva: string | null;
  declare codiceFiscale: string | null;
  declare indirizzo: string | null;
  declare cap: string | null;
  declare citta: string | null;
  declare provincia: string | null;
  declare telefono: string | null;
  declare email: string | null;
  declare referente: string | null;
  declare note: string | null;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Anagrafica.init(
  {
    idAnagrafica: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuidAnagrafica: {
      // Generato lato DB (DEFAULT gen_random_uuid() in migration)
      type: DataTypes.UUID,
      // allowNull: true SOLO per bypassare la validazione client-side di
      // Sequelize (che altrimenti rifiuta l'istanza prima ancora di
      // arrivare al DB, perché il campo non è valorizzato in JS). Il
      // vincolo NOT NULL vero resta sul DB (vedi migration): e' li' che
      // viene davvero applicato, dopo che gen_random_uuid() lo riempie.
      allowNull: true,
      unique: true,
    },
    tipo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['partner', 'cliente', 'agente']],
      },
    },
    idTenant: {
      // Riferimento applicativo al tenant di auth-service — nessuna FK reale
      // (database/servizio diverso), stesso pattern gia' usato per entityId.
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ragioneSociale: {
      type: DataTypes.STRING(256),
      allowNull: false,
    },
    partitaIva: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    codiceFiscale: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    indirizzo: {
      type: DataTypes.STRING(256),
      allowNull: true,
    },
    cap: {
      type: DataTypes.STRING(16),
      allowNull: true,
    },
    citta: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    provincia: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    telefono: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    referente: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'anagrafiche',
    timestamps: true,
  }
);

export default Anagrafica;

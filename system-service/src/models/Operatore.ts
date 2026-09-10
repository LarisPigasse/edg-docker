// =============================================================================
// EDG System Service - Modello Operatore
// Anagrafica del personale interno EDG (distinta da Anagrafica, che copre
// partner/clienti/agenti — dati molto diversi, tabella dedicata)
// =============================================================================
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface OperatoreAttributes {
  idOperatore: number;
  uuidOperatore: string;
  nome: string;
  cognome: string;
  idReparto: number;
  telefono: string | null;
  email: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OperatoreCreationAttributes
  extends Optional<
    OperatoreAttributes,
    'idOperatore' | 'uuidOperatore' | 'telefono' | 'email' | 'isActive'
  > {}

class Operatore
  extends Model<OperatoreAttributes, OperatoreCreationAttributes>
  implements OperatoreAttributes
{
  declare idOperatore: number;
  declare uuidOperatore: string;
  declare nome: string;
  declare cognome: string;
  declare idReparto: number;
  declare telefono: string | null;
  declare email: string | null;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Operatore.init(
  {
    idOperatore: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuidOperatore: {
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
    nome: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    cognome: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    idReparto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'reparti', key: 'id_reparto' },
    },
    telefono: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(64),
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
    tableName: 'operatori',
    timestamps: true,
  }
);

export default Operatore;

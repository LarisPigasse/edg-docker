// =============================================================================
// Libreria EDG — modello di settore e sue voci (03-libreria-avvio, ADR066)
// =============================================================================
// Un modello (es. autotrasporto) propone categorie e controlli alla procedura
// di avvio; le voci dicono quali e se partono gia' selezionate.
// =============================================================================
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../../config/database';
import { booleano, elenco, intero, testo } from '../../core/db/colonne';
import { TIPI_VOCE_MODELLO, type TipoVoceModello } from '../valori';

export class ModelloSettore extends Model<InferAttributes<ModelloSettore>, InferCreationAttributes<ModelloSettore>> {
  declare chiave: string;
  declare nome: string;
  declare descrizione: CreationOptional<string | null>;
  declare icona: CreationOptional<string | null>;
  declare ordine: CreationOptional<number>;
  /** Proposto a tutti (es. "Azienda e persone"), qualunque sia il settore */
  declare sempreProposto: CreationOptional<boolean>;
  declare versione: number;
  declare impronta: CreationOptional<string | null>;
  declare updatedAt: CreationOptional<Date>;

  declare voci?: NonAttribute<ModelloVoce[]>;
}

ModelloSettore.init(
  {
    chiave: { type: DataTypes.STRING(64), primaryKey: true },
    nome: testo(128, false),
    descrizione: testo(),
    icona: testo(32),
    ordine: intero(false, 0),
    sempreProposto: booleano(false),
    versione: { type: DataTypes.INTEGER, allowNull: false },
    impronta: testo(64),
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'modelli_settore', createdAt: false }
);

export class ModelloVoce extends Model<InferAttributes<ModelloVoce>, InferCreationAttributes<ModelloVoce>> {
  declare chiaveModello: string;
  declare tipoVoce: TipoVoceModello;
  declare chiaveVoce: string;
  declare preselezionata: CreationOptional<boolean>;
}

ModelloVoce.init(
  {
    chiaveModello: { type: DataTypes.STRING(64), primaryKey: true },
    tipoVoce: { ...elenco(TIPI_VOCE_MODELLO), primaryKey: true },
    chiaveVoce: { type: DataTypes.STRING(64), primaryKey: true },
    preselezionata: booleano(true),
  },
  { sequelize, tableName: 'modelli_voci', timestamps: false }
);

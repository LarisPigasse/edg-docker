// =============================================================================
// Registro delle decisioni sulla libreria (ADR074)
// =============================================================================
// Ogni scelta del cliente sulla libreria EDG, per sempre:
//   avvio          voce proposta dalla procedura e inclusa o tolta (B6)
//   aggiornamento  nuova versione accettata, in parte o rifiutata, campo per
//                  campo (B10)
// con che cosa gli e' stato detto (novita), quando era disponibile, quando
// l'ha visto, chi ha deciso e quando. Il database impedisce di modificare le
// righe (trigger): un ripensamento e' una riga nuova. Nome ed email di chi ha
// deciso sono copiati, cosi' restano leggibili anche se l'account sparisce.
// =============================================================================
import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../../config/database';
import { chiave, elenco, intero, istante, json, tenant, testo, uuid } from '../../core/db/colonne';
import {
  CONTESTI_DECISIONE,
  ENTITA_DECISIONE,
  ESITI_DECISIONE,
  type CampoDecisione,
  type ContestoDecisione,
  type EntitaDecisione,
  type EsitoDecisione,
} from '../valori';

export class DecisioneLibreria extends Model<InferAttributes<DecisioneLibreria>, InferCreationAttributes<DecisioneLibreria>> {
  declare idDecisione: CreationOptional<number>;
  declare uuidDecisione: CreationOptional<string>;
  declare idTenant: number;
  declare contesto: ContestoDecisione;
  declare entita: EntitaDecisione;
  declare chiaveLibreria: string;
  /** Nome della voce al momento della decisione */
  declare nome: string;
  /** La categoria o il controllo del cliente; null se all'avvio la voce e' stata tolta */
  declare idEntita: CreationOptional<number | null>;
  declare versioneDa: CreationOptional<number | null>;
  declare versioneA: number;
  /** Il testo della novita' mostrato al cliente */
  declare novita: CreationOptional<string | null>;
  declare disponibileDal: CreationOptional<Date | null>;
  declare vistoIl: CreationOptional<Date | null>;
  declare esito: EsitoDecisione;
  declare campi: CreationOptional<CampoDecisione[]>;
  declare decisoIl: CreationOptional<Date>;
  declare decisoDa: CreationOptional<number | null>;
  declare decisoDaNome: CreationOptional<string | null>;
  declare decisoDaEmail: CreationOptional<string | null>;
}

DecisioneLibreria.init(
  {
    idDecisione: chiave(),
    uuidDecisione: uuid(),
    idTenant: tenant(),
    contesto: elenco(CONTESTI_DECISIONE),
    entita: elenco(ENTITA_DECISIONE),
    chiaveLibreria: testo(64, false),
    nome: testo(160, false),
    idEntita: intero(),
    versioneDa: intero(),
    versioneA: intero(false),
    novita: testo(),
    disponibileDal: istante(),
    vistoIl: istante(),
    esito: elenco(ESITI_DECISIONE),
    campi: json(false, []),
    decisoIl: { ...istante(false), defaultValue: DataTypes.NOW },
    decisoDa: intero(),
    decisoDaNome: testo(128),
    decisoDaEmail: testo(256),
  },
  {
    sequelize,
    tableName: 'decisioni_libreria',
    timestamps: false,
    validate: {
      esitoDelContesto(this: DecisioneLibreria) {
        const avvio = this.esito === 'incluso' || this.esito === 'escluso';
        if (avvio !== (this.contesto === 'avvio')) throw new Error(`Esito "${this.esito}" non valido per il contesto "${this.contesto}"`);
      },
    },
  }
);

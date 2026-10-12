// =============================================================================
// Consegna: un avviso a un destinatario su un canale (04-avvisi)
// =============================================================================
// app = campanella (letto/risolto), email = coda verso email-service con
// tentativi; whatsapp previsto. Destinatario: un account, oppure solo un
// indirizzo email (persone e fornitori senza account).
// =============================================================================
import { CreationOptional, InferAttributes, InferCreationAttributes, Model, NonAttribute } from 'sequelize';
import { sequelize } from '../../config/database';
import { chiave, elenco, intero, istante, tenant, testo } from '../../core/db/colonne';
import { CANALI, STATI_CONSEGNA, type Canale, type StatoConsegna } from '../valori';
import type { Avviso } from './avviso.model';

export class Consegna extends Model<InferAttributes<Consegna>, InferCreationAttributes<Consegna>> {
  declare idConsegna: CreationOptional<number>;
  declare idTenant: number;
  declare idAvviso: number;
  declare idAccount: CreationOptional<number | null>;
  declare email: CreationOptional<string | null>;
  declare canale: Canale;
  declare stato: CreationOptional<StatoConsegna>;
  declare tentativi: CreationOptional<number>;
  declare inviatoIl: CreationOptional<Date | null>;
  declare lettoIl: CreationOptional<Date | null>;
  declare errore: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare avviso?: NonAttribute<Avviso>;
}

Consegna.init(
  {
    idConsegna: chiave(),
    idTenant: tenant(),
    idAvviso: intero(false),
    idAccount: intero(),
    email: testo(256),
    canale: elenco(CANALI),
    stato: elenco(STATI_CONSEGNA, false, 'in-coda'),
    tentativi: intero(false, 0),
    inviatoIl: istante(),
    lettoIl: istante(),
    errore: testo(),
    createdAt: istante(false),
    updatedAt: istante(false),
  },
  {
    sequelize,
    tableName: 'consegne',
    validate: {
      destinatario(this: Consegna) {
        if (this.idAccount == null && !this.email) throw new Error('Una consegna ha bisogno di un account o di un indirizzo email');
      },
    },
  }
);

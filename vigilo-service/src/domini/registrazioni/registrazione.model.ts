// =============================================================================
// Registrazione: cosa e' successo a una scadenza (01-dominio, 05-permessi)
// =============================================================================
//   esecuzione      fatto (con esito, importo, fornitore, lettura...)
//   rinvio          spostata a una nuova data, con motivo
//   rinnovo-tacito  rinnovata da sola (controlli con rinnovo tacito)
// Quella segnalata dall'addetto resta "da-confermare" finche' l'ufficio non
// la conferma o la respinge (ADR068).
// =============================================================================
import { CreationOptional, NonAttribute } from 'sequelize';
import { sequelize } from '../../config/database';
import { AUDIT, chiave, ConAudit, decimale, elenco, giorno, intero, istante, tenant, testo, uuid } from '../../core/db/colonne';
import type { Giorno } from '../../regole';
import {
  ESITI,
  STATI_REGISTRAZIONE,
  TIPI_REGISTRAZIONE,
  type Esito,
  type StatoRegistrazione,
  type TipoRegistrazione,
} from '../valori';
import type { Scadenza } from '../scadenze/scadenza.model';
import type { Fornitore } from '../fornitori/fornitore.model';
import type { Contatore } from '../contatori/contatore.model';

export class Registrazione extends ConAudit<Registrazione> {
  declare idRegistrazione: CreationOptional<number>;
  declare uuidRegistrazione: CreationOptional<string>;
  declare idTenant: number;
  declare idScadenza: number;
  declare tipo: TipoRegistrazione;
  declare stato: CreationOptional<StatoRegistrazione>;
  declare eseguitaIl: Giorno;
  declare esito: CreationOptional<Esito | null>;
  declare dataPrecedente: CreationOptional<Giorno | null>;
  declare dataNuova: CreationOptional<Giorno | null>;
  declare idContatore: CreationOptional<number | null>;
  declare lettura: CreationOptional<number | null>;
  declare importo: CreationOptional<number | null>;
  declare idFornitore: CreationOptional<number | null>;
  /** Numero di fattura, di polizza, di pratica... */
  declare riferimento: CreationOptional<string | null>;
  declare idScadenzaSuccessiva: CreationOptional<number | null>;
  declare motivo: CreationOptional<string | null>;
  declare note: CreationOptional<string | null>;
  declare confermataDa: CreationOptional<number | null>;
  declare confermataIl: CreationOptional<Date | null>;
  declare motivoRifiuto: CreationOptional<string | null>;

  declare scadenza?: NonAttribute<Scadenza>;
  declare successiva?: NonAttribute<Scadenza | null>;
  declare fornitore?: NonAttribute<Fornitore | null>;
  declare contatore?: NonAttribute<Contatore | null>;
}

Registrazione.init(
  {
    idRegistrazione: chiave(),
    uuidRegistrazione: uuid(),
    idTenant: tenant(),
    idScadenza: intero(false),
    tipo: elenco(TIPI_REGISTRAZIONE),
    stato: elenco(STATI_REGISTRAZIONE, false, 'confermata'),
    eseguitaIl: giorno(false),
    esito: elenco(ESITI, true),
    dataPrecedente: giorno(),
    dataNuova: giorno(),
    idContatore: intero(),
    lettura: { ...intero(), validate: { min: 0 } },
    importo: decimale('importo'),
    idFornitore: intero(),
    riferimento: testo(128),
    idScadenzaSuccessiva: intero(),
    motivo: testo(512),
    note: testo(),
    confermataDa: intero(),
    confermataIl: istante(),
    motivoRifiuto: testo(512),
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  {
    sequelize,
    tableName: 'registrazioni',
    validate: {
      esecuzioneConEsito(this: Registrazione) {
        if (this.tipo === 'esecuzione' && !this.esito) throw new Error("Un'esecuzione ha bisogno dell'esito");
      },
      rinvioCompleto(this: Registrazione) {
        if (this.tipo === 'rinvio' && (!this.motivo || !this.dataNuova)) throw new Error('Un rinvio ha bisogno della nuova data e del motivo');
      },
    },
  }
);

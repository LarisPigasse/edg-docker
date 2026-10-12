// =============================================================================
// Scadenza: un controllo su un soggetto, o un promemoria libero (ADR065)
// =============================================================================
// Dove si trova adesso (scadeIl e/o sogliaUso) e le eventuali ridefinizioni
// dei 4 gruppi: null = eredita dal controllo, valore = ridefinito qui.
// Una scadenza aperta per (soggetto, controllo) alla volta: quando si
// registra l'esecuzione si chiude e nasce la successiva.
// stato, limiteIl, stimataIl e urgenzaIl sono CALCOLATI (regole/stato.ts) e
// salvati per il cruscotto: mai scritti a mano.
// =============================================================================
import { CreationOptional, NonAttribute } from 'sequelize';
import { sequelize } from '../../config/database';
import { AUDIT, chiave, ConAudit, elenco, giorno, intero, istante, json, tenant, testo, uuid } from '../../core/db/colonne';
import { STATI, type Cadenza, type Destinatario, type Giorno, type Preavvisi, type Stato, type Tolleranza } from '../../regole';
import { MOTIVI_CHIUSURA, type MotivoChiusura } from '../valori';
import type { Soggetto } from '../soggetti/soggetto.model';
import type { Controllo } from '../controlli/controllo.model';
import type { Contatore } from '../contatori/contatore.model';
import type { Registrazione } from '../registrazioni/registrazione.model';

export class Scadenza extends ConAudit<Scadenza> {
  declare idScadenza: CreationOptional<number>;
  declare uuidScadenza: CreationOptional<string>;
  declare idTenant: number;
  /** null = promemoria dell'azienda senza soggetto */
  declare idSoggetto: CreationOptional<number | null>;
  /** null = promemoria libero (serve il titolo) */
  declare idControllo: CreationOptional<number | null>;
  declare titolo: CreationOptional<string | null>;

  // Posizione attuale
  declare scadeIl: CreationOptional<Giorno | null>;
  declare idContatore: CreationOptional<number | null>;
  declare sogliaUso: CreationOptional<number | null>;

  // Ridefinizioni (null = eredita dal controllo)
  declare cadenza: CreationOptional<Cadenza | null>;
  declare preavvisi: CreationOptional<Preavvisi | null>;
  declare tolleranza: CreationOptional<Tolleranza | null>;
  declare destinatari: CreationOptional<Destinatario[] | null>;

  // Fine della ricorrenza e calendario fisso
  declare fineIl: CreationOptional<Giorno | null>;
  declare ripetizioniRimaste: CreationOptional<number | null>;
  /** Giorno del mese da mantenere nelle cadenze a mesi (ADR071) */
  declare giornoAncora: CreationOptional<number | null>;

  // Chiusura
  declare chiusaIl: CreationOptional<Date | null>;
  declare motivoChiusura: CreationOptional<MotivoChiusura | null>;

  // Calcolati
  declare stato: CreationOptional<Stato>;
  declare limiteIl: CreationOptional<Giorno | null>;
  declare stimataIl: CreationOptional<Giorno | null>;
  declare urgenzaIl: CreationOptional<Giorno | null>;
  declare calcolatoIl: CreationOptional<Date | null>;

  declare note: CreationOptional<string | null>;

  declare soggetto?: NonAttribute<Soggetto | null>;
  declare controllo?: NonAttribute<Controllo | null>;
  declare contatore?: NonAttribute<Contatore | null>;
  declare registrazioni?: NonAttribute<Registrazione[]>;
}

Scadenza.init(
  {
    idScadenza: chiave(),
    uuidScadenza: uuid(),
    idTenant: tenant(),
    idSoggetto: intero(),
    idControllo: intero(),
    titolo: testo(160),
    scadeIl: giorno(),
    idContatore: intero(),
    sogliaUso: intero(),
    cadenza: json(true),
    preavvisi: json(true),
    tolleranza: json(true),
    destinatari: json(true),
    fineIl: giorno(),
    ripetizioniRimaste: { ...intero(), validate: { min: 0 } },
    giornoAncora: { ...intero(), validate: { min: 1, max: 31 } },
    chiusaIl: istante(),
    motivoChiusura: elenco(MOTIVI_CHIUSURA, true),
    stato: elenco(STATI, false, 'da-completare'),
    limiteIl: giorno(),
    stimataIl: giorno(),
    urgenzaIl: giorno(),
    calcolatoIl: istante(),
    note: testo(),
    createdAt: istante(false),
    updatedAt: istante(false),
    ...AUDIT,
  },
  {
    sequelize,
    tableName: 'scadenze',
    validate: {
      // Stessi vincoli della tabella, con un messaggio comprensibile
      promemoriaConTitolo(this: Scadenza) {
        if (this.idControllo == null && !this.titolo) throw new Error('Un promemoria senza controllo ha bisogno di un titolo');
      },
      chiusuraCompleta(this: Scadenza) {
        if ((this.chiusaIl == null) !== (this.motivoChiusura == null)) throw new Error('Chiusura senza data o senza motivo');
      },
    },
  }
);

'use strict';

/**
 * Migration: schema iniziale di Vigilo (blocco B3, ADR065-071)
 *
 * TUTTE le tabelle dei passi 2-5 dell'analisi (docs/vigilo/), cosi' lo schema
 * non va ripreso a ogni blocco:
 *
 *   del cliente (idTenant)   impostazioni, categorie, soggetti, contatori,
 *                            letture, assegnazioni, fornitori, controlli,
 *                            controlli_categorie, scadenze, registrazioni,
 *                            allegati, avvisi, consegne, preferenze_avvisi
 *   della libreria EDG       libreria_categorie, libreria_controlli,
 *                            modelli_settore, modelli_voci
 *
 * Convenzioni (02-modello-dati 2.1): colonne snake_case, id interi per le
 * relazioni interne, uuid per cio' che esce dal servizio, id_tenant su ogni
 * tabella del cliente (eliminare i dati di un tenant = DELETE per tenant),
 * chi e quando su ogni riga. Gli stati ammessi sono CHECK: valori strutturali
 * decisi nell'analisi, non elenchi del cliente.
 */

const AUDIT = `
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  creato_da     INTEGER NULL,
  modificato_da INTEGER NULL`;

const TIPI_SOGGETTO = `('veicolo','macchina','attrezzatura','sede','persona','azienda')`;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      -- =====================================================================
      -- LIBRERIA EDG (senza tenant): file versionati sincronizzati all'avvio
      -- =====================================================================
      CREATE TABLE libreria_categorie (
        chiave        VARCHAR(64) PRIMARY KEY,
        tipo_soggetto VARCHAR(16) NOT NULL CHECK (tipo_soggetto IN ${TIPI_SOGGETTO}),
        nome          VARCHAR(128) NOT NULL,
        descrizione   TEXT NULL,
        icona         VARCHAR(32) NULL,
        campi         JSONB NOT NULL DEFAULT '[]',
        contatori     JSONB NOT NULL DEFAULT '[]',
        versione      INTEGER NOT NULL CHECK (versione >= 1),
        ritirata      BOOLEAN NOT NULL DEFAULT false,
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE libreria_controlli (
        chiave                VARCHAR(64) PRIMARY KEY,
        nome                  VARCHAR(128) NOT NULL,
        descrizione           TEXT NULL,
        natura                VARCHAR(16) NOT NULL CHECK (natura IN ('adempimento','manutenzione','abilitazione','documento','pagamento','promemoria')),
        tipo_soggetto         VARCHAR(16) NOT NULL CHECK (tipo_soggetto IN ${TIPI_SOGGETTO}),
        categorie             JSONB NOT NULL DEFAULT '[]',
        automatico            BOOLEAN NOT NULL DEFAULT false,
        cadenza               JSONB NOT NULL,
        preavvisi             JSONB NOT NULL,
        tolleranza            JSONB NOT NULL,
        destinatari           JSONB NOT NULL,
        rinnovo               VARCHAR(16) NOT NULL DEFAULT 'conferma' CHECK (rinnovo IN ('conferma','tacito')),
        rinviabile            BOOLEAN NOT NULL DEFAULT true,
        registrazione         JSONB NOT NULL DEFAULT '{}',
        riferimento_normativo VARCHAR(256) NULL,
        note                  TEXT NULL,
        versione              INTEGER NOT NULL CHECK (versione >= 1),
        ritirato              BOOLEAN NOT NULL DEFAULT false,
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE modelli_settore (
        chiave          VARCHAR(64) PRIMARY KEY,
        nome            VARCHAR(128) NOT NULL,
        descrizione     TEXT NULL,
        icona           VARCHAR(32) NULL,
        ordine          INTEGER NOT NULL DEFAULT 0,
        sempre_proposto BOOLEAN NOT NULL DEFAULT false,
        versione        INTEGER NOT NULL CHECK (versione >= 1),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE modelli_voci (
        chiave_modello VARCHAR(64) NOT NULL REFERENCES modelli_settore (chiave) ON DELETE CASCADE ON UPDATE CASCADE,
        tipo_voce      VARCHAR(16) NOT NULL CHECK (tipo_voce IN ('categoria','controllo')),
        chiave_voce    VARCHAR(64) NOT NULL,
        preselezionata BOOLEAN NOT NULL DEFAULT true,
        PRIMARY KEY (chiave_modello, tipo_voce, chiave_voce)
      );

      -- =====================================================================
      -- IMPOSTAZIONI DEL TENANT
      -- =====================================================================
      CREATE TABLE impostazioni (
        id_tenant         INTEGER PRIMARY KEY,
        avviato_il        TIMESTAMPTZ NULL,
        modelli_applicati JSONB NOT NULL DEFAULT '[]',
        predefiniti       JSONB NOT NULL DEFAULT '{"preavvisi":{"giorni":[32,8,1],"uso":[]},"tolleranza":{"giorni":0,"uso":0}}',
        avvisi            JSONB NOT NULL DEFAULT '{"orarioRiepilogo":"08:00","giorniLavorativi":[1,2,3,4,5],"intervalloRichiami":8}',
        ${AUDIT}
      );
      COMMENT ON TABLE impostazioni IS 'Vigilo per un tenant: avvio, modelli applicati, predefiniti, avvisi (passi 3 e 4)';

      -- =====================================================================
      -- CATEGORIE E SOGGETTI
      -- =====================================================================
      CREATE TABLE categorie (
        id_categoria      SERIAL PRIMARY KEY,
        uuid_categoria    UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        id_tenant         INTEGER NOT NULL,
        tipo_soggetto     VARCHAR(16) NOT NULL CHECK (tipo_soggetto IN ${TIPI_SOGGETTO}),
        nome              VARCHAR(128) NOT NULL,
        descrizione       TEXT NULL,
        icona             VARCHAR(32) NULL,
        ordine            INTEGER NOT NULL DEFAULT 0,
        attiva            BOOLEAN NOT NULL DEFAULT true,
        campi             JSONB NOT NULL DEFAULT '[]',
        contatori         JSONB NOT NULL DEFAULT '[]',
        chiave_libreria   VARCHAR(64) NULL,
        versione_libreria INTEGER NULL,
        origine           JSONB NULL,
        ${AUDIT},
        CONSTRAINT uq_categorie_nome UNIQUE (id_tenant, tipo_soggetto, nome)
      );
      CREATE UNIQUE INDEX uq_categorie_libreria ON categorie (id_tenant, chiave_libreria) WHERE chiave_libreria IS NOT NULL;

      CREATE TABLE soggetti (
        id_soggetto    SERIAL PRIMARY KEY,
        uuid_soggetto  UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        id_tenant      INTEGER NOT NULL,
        tipo           VARCHAR(16) NOT NULL CHECK (tipo IN ${TIPI_SOGGETTO}),
        id_categoria   INTEGER NULL REFERENCES categorie (id_categoria) ON DELETE RESTRICT,
        nome           VARCHAR(128) NOT NULL,
        identificativo VARCHAR(64) NULL,
        codice         VARCHAR(32) NULL,
        stato          VARCHAR(16) NOT NULL DEFAULT 'in-servizio' CHECK (stato IN ('in-servizio','fermo','dismesso')),
        stato_dal      DATE NULL,
        dati           JSONB NOT NULL DEFAULT '{}',
        campi          JSONB NOT NULL DEFAULT '{}',
        id_sede        INTEGER NULL REFERENCES soggetti (id_soggetto) ON DELETE SET NULL,
        id_referente   INTEGER NULL REFERENCES soggetti (id_soggetto) ON DELETE SET NULL,
        id_account     INTEGER NULL,
        note           TEXT NULL,
        ${AUDIT}
      );
      CREATE INDEX idx_soggetti_tenant_tipo ON soggetti (id_tenant, tipo, stato);
      CREATE INDEX idx_soggetti_tenant_nome ON soggetti (id_tenant, lower(nome));
      CREATE INDEX idx_soggetti_tenant_identificativo ON soggetti (id_tenant, lower(identificativo));
      CREATE UNIQUE INDEX uq_soggetti_identificativo ON soggetti (id_tenant, tipo, lower(identificativo))
        WHERE identificativo IS NOT NULL AND stato <> 'dismesso';
      CREATE UNIQUE INDEX uq_soggetti_account ON soggetti (id_tenant, id_account) WHERE id_account IS NOT NULL;

      CREATE TABLE assegnazioni (
        id_assegnazione   SERIAL PRIMARY KEY,
        uuid_assegnazione UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        id_tenant         INTEGER NOT NULL,
        id_soggetto       INTEGER NOT NULL REFERENCES soggetti (id_soggetto) ON DELETE CASCADE,
        id_persona        INTEGER NOT NULL REFERENCES soggetti (id_soggetto) ON DELETE CASCADE,
        dal               DATE NOT NULL,
        al                DATE NULL,
        note              TEXT NULL,
        ${AUDIT},
        CONSTRAINT ck_assegnazioni_periodo CHECK (al IS NULL OR al >= dal),
        CONSTRAINT ck_assegnazioni_distinti CHECK (id_soggetto <> id_persona)
      );
      CREATE INDEX idx_assegnazioni_soggetto ON assegnazioni (id_soggetto, al);
      CREATE INDEX idx_assegnazioni_persona ON assegnazioni (id_tenant, id_persona, al);

      -- =====================================================================
      -- FORNITORI
      -- =====================================================================
      CREATE TABLE fornitori (
        id_fornitore   SERIAL PRIMARY KEY,
        uuid_fornitore UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        id_tenant      INTEGER NOT NULL,
        nome           VARCHAR(128) NOT NULL,
        tipo           VARCHAR(64) NULL,
        telefono       VARCHAR(64) NULL,
        email          VARCHAR(256) NULL,
        indirizzo      VARCHAR(256) NULL,
        referente      VARCHAR(128) NULL,
        note           TEXT NULL,
        attivo         BOOLEAN NOT NULL DEFAULT true,
        ${AUDIT}
      );
      CREATE INDEX idx_fornitori_tenant_nome ON fornitori (id_tenant, lower(nome));

      -- =====================================================================
      -- CONTROLLI (definiti dal cliente, copiati con origine dalla libreria)
      -- =====================================================================
      CREATE TABLE controlli (
        id_controllo          SERIAL PRIMARY KEY,
        uuid_controllo        UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        id_tenant             INTEGER NOT NULL,
        nome                  VARCHAR(128) NOT NULL,
        descrizione           TEXT NULL,
        riferimento_normativo VARCHAR(256) NULL,
        natura                VARCHAR(16) NOT NULL CHECK (natura IN ('adempimento','manutenzione','abilitazione','documento','pagamento','promemoria')),
        tipo_soggetto         VARCHAR(16) NOT NULL CHECK (tipo_soggetto IN ${TIPI_SOGGETTO}),
        automatico            BOOLEAN NOT NULL DEFAULT false,
        cadenza               JSONB NOT NULL,
        preavvisi             JSONB NOT NULL,
        tolleranza            JSONB NOT NULL,
        destinatari           JSONB NOT NULL,
        rinnovo               VARCHAR(16) NOT NULL DEFAULT 'conferma' CHECK (rinnovo IN ('conferma','tacito')),
        rinviabile            BOOLEAN NOT NULL DEFAULT true,
        avvisa_anche_se_fermo BOOLEAN NOT NULL DEFAULT false,
        registrazione         JSONB NOT NULL DEFAULT '{}',
        ordine                INTEGER NOT NULL DEFAULT 0,
        attivo                BOOLEAN NOT NULL DEFAULT true,
        chiave_libreria       VARCHAR(64) NULL,
        versione_libreria     INTEGER NULL,
        origine               JSONB NULL,
        versione_ignorata     INTEGER NULL,
        ${AUDIT}
      );
      CREATE INDEX idx_controlli_tenant_tipo ON controlli (id_tenant, tipo_soggetto, attivo);
      CREATE UNIQUE INDEX uq_controlli_libreria ON controlli (id_tenant, chiave_libreria) WHERE chiave_libreria IS NOT NULL;
      COMMENT ON COLUMN controlli.origine IS 'Fotografia dei valori copiati dalla libreria: distingue cio che il cliente ha personalizzato (passo 3.6)';

      CREATE TABLE controlli_categorie (
        id_controllo INTEGER NOT NULL REFERENCES controlli (id_controllo) ON DELETE CASCADE,
        id_categoria INTEGER NOT NULL REFERENCES categorie (id_categoria) ON DELETE CASCADE,
        id_tenant    INTEGER NOT NULL,
        PRIMARY KEY (id_controllo, id_categoria)
      );
      CREATE INDEX idx_controlli_categorie_categoria ON controlli_categorie (id_categoria);

      -- =====================================================================
      -- CONTATORI E SCADENZE
      -- =====================================================================
      CREATE TABLE contatori (
        id_contatore    SERIAL PRIMARY KEY,
        uuid_contatore  UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        id_tenant       INTEGER NOT NULL,
        id_soggetto     INTEGER NOT NULL REFERENCES soggetti (id_soggetto) ON DELETE CASCADE,
        unita           VARCHAR(8) NOT NULL CHECK (unita IN ('km','ore')),
        nome            VARCHAR(64) NOT NULL DEFAULT '',
        valore          INTEGER NULL CHECK (valore IS NULL OR valore >= 0),
        letto_il        DATE NULL,
        uso_giornaliero NUMERIC(12,2) NULL,
        ${AUDIT},
        CONSTRAINT uq_contatori UNIQUE (id_soggetto, unita, nome)
      );

      CREATE TABLE scadenze (
        id_scadenza         SERIAL PRIMARY KEY,
        uuid_scadenza       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        id_tenant           INTEGER NOT NULL,
        id_soggetto         INTEGER NULL REFERENCES soggetti (id_soggetto) ON DELETE CASCADE,
        id_controllo        INTEGER NULL REFERENCES controlli (id_controllo) ON DELETE RESTRICT,
        titolo              VARCHAR(160) NULL,
        scade_il            DATE NULL,
        id_contatore        INTEGER NULL REFERENCES contatori (id_contatore) ON DELETE SET NULL,
        soglia_uso          INTEGER NULL,
        cadenza             JSONB NULL,
        preavvisi           JSONB NULL,
        tolleranza          JSONB NULL,
        destinatari         JSONB NULL,
        fine_il             DATE NULL,
        ripetizioni_rimaste INTEGER NULL CHECK (ripetizioni_rimaste IS NULL OR ripetizioni_rimaste >= 0),
        giorno_ancora       SMALLINT NULL CHECK (giorno_ancora IS NULL OR giorno_ancora BETWEEN 1 AND 31),
        chiusa_il           TIMESTAMPTZ NULL,
        motivo_chiusura     VARCHAR(32) NULL CHECK (motivo_chiusura IN ('rinnovata','completata','fine-ricorrenza','soggetto-dismesso','controllo-disattivato')),
        stato               VARCHAR(16) NOT NULL DEFAULT 'da-completare' CHECK (stato IN ('in-regola','in-scadenza','in-tolleranza','scaduta','da-completare')),
        limite_il           DATE NULL,
        stimata_il          DATE NULL,
        urgenza_il          DATE NULL,
        calcolato_il        TIMESTAMPTZ NULL,
        note                TEXT NULL,
        ${AUDIT},
        CONSTRAINT ck_scadenze_promemoria CHECK (id_controllo IS NOT NULL OR titolo IS NOT NULL),
        CONSTRAINT ck_scadenze_chiusura CHECK ((chiusa_il IS NULL) = (motivo_chiusura IS NULL))
      );
      CREATE UNIQUE INDEX uq_scadenze_aperta ON scadenze (id_soggetto, id_controllo)
        WHERE chiusa_il IS NULL AND id_controllo IS NOT NULL AND id_soggetto IS NOT NULL;
      CREATE INDEX idx_scadenze_cruscotto ON scadenze (id_tenant, urgenza_il) WHERE chiusa_il IS NULL;
      CREATE INDEX idx_scadenze_stato ON scadenze (id_tenant, stato) WHERE chiusa_il IS NULL;
      CREATE INDEX idx_scadenze_soggetto ON scadenze (id_soggetto);
      CREATE INDEX idx_scadenze_controllo ON scadenze (id_controllo);
      COMMENT ON COLUMN scadenze.stato IS 'Calcolato dalle regole (stato.ts), mai scritto a mano: ricalcolo a ogni modifica e ogni notte';

      CREATE TABLE registrazioni (
        id_registrazione       SERIAL PRIMARY KEY,
        uuid_registrazione     UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        id_tenant              INTEGER NOT NULL,
        id_scadenza            INTEGER NOT NULL REFERENCES scadenze (id_scadenza) ON DELETE CASCADE,
        tipo                   VARCHAR(16) NOT NULL CHECK (tipo IN ('esecuzione','rinvio','rinnovo-tacito')),
        stato                  VARCHAR(16) NOT NULL DEFAULT 'confermata' CHECK (stato IN ('confermata','da-confermare','respinta')),
        eseguita_il            DATE NOT NULL,
        esito                  VARCHAR(16) NULL CHECK (esito IN ('positivo','negativo')),
        data_precedente        DATE NULL,
        data_nuova             DATE NULL,
        id_contatore           INTEGER NULL REFERENCES contatori (id_contatore) ON DELETE SET NULL,
        lettura                INTEGER NULL CHECK (lettura IS NULL OR lettura >= 0),
        importo                NUMERIC(12,2) NULL,
        id_fornitore           INTEGER NULL REFERENCES fornitori (id_fornitore) ON DELETE SET NULL,
        riferimento            VARCHAR(128) NULL,
        id_scadenza_successiva INTEGER NULL REFERENCES scadenze (id_scadenza) ON DELETE SET NULL,
        motivo                 VARCHAR(512) NULL,
        note                   TEXT NULL,
        confermata_da          INTEGER NULL,
        confermata_il          TIMESTAMPTZ NULL,
        motivo_rifiuto         VARCHAR(512) NULL,
        ${AUDIT},
        CONSTRAINT ck_registrazioni_esito CHECK (tipo <> 'esecuzione' OR esito IS NOT NULL),
        CONSTRAINT ck_registrazioni_rinvio CHECK (tipo <> 'rinvio' OR (motivo IS NOT NULL AND data_nuova IS NOT NULL))
      );
      CREATE INDEX idx_registrazioni_scadenza ON registrazioni (id_scadenza, eseguita_il);
      CREATE INDEX idx_registrazioni_da_confermare ON registrazioni (id_tenant) WHERE stato = 'da-confermare';

      CREATE TABLE letture (
        id_lettura       SERIAL PRIMARY KEY,
        uuid_lettura     UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        id_tenant        INTEGER NOT NULL,
        id_contatore     INTEGER NOT NULL REFERENCES contatori (id_contatore) ON DELETE CASCADE,
        valore           INTEGER NOT NULL CHECK (valore >= 0),
        letto_il         DATE NOT NULL,
        fonte            VARCHAR(16) NOT NULL DEFAULT 'manuale' CHECK (fonte IN ('manuale','registrazione','telematica','importazione')),
        id_registrazione INTEGER NULL REFERENCES registrazioni (id_registrazione) ON DELETE SET NULL,
        anomala          BOOLEAN NOT NULL DEFAULT false,
        note             VARCHAR(256) NULL,
        ${AUDIT}
      );
      CREATE INDEX idx_letture_contatore ON letture (id_contatore, letto_il);

      -- =====================================================================
      -- ALLEGATI
      -- =====================================================================
      CREATE TABLE allegati (
        id_allegato   SERIAL PRIMARY KEY,
        uuid_allegato UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        id_tenant     INTEGER NOT NULL,
        entita        VARCHAR(16) NOT NULL CHECK (entita IN ('soggetto','scadenza','registrazione')),
        id_entita     INTEGER NOT NULL,
        nome_file     VARCHAR(256) NOT NULL,
        percorso      VARCHAR(512) NOT NULL,
        tipo_mime     VARCHAR(128) NOT NULL,
        dimensione    INTEGER NOT NULL CHECK (dimensione >= 0),
        descrizione   VARCHAR(256) NULL,
        ${AUDIT}
      );
      CREATE INDEX idx_allegati_entita ON allegati (id_tenant, entita, id_entita);

      -- =====================================================================
      -- AVVISI (passo 4)
      -- =====================================================================
      CREATE TABLE avvisi (
        id_avviso   SERIAL PRIMARY KEY,
        uuid_avviso UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        id_tenant   INTEGER NOT NULL,
        id_scadenza INTEGER NOT NULL REFERENCES scadenze (id_scadenza) ON DELETE CASCADE,
        evento      VARCHAR(64) NOT NULL,
        tipo        VARCHAR(32) NOT NULL,
        urgente     BOOLEAN NOT NULL DEFAULT false,
        riferimento VARCHAR(64) NOT NULL,
        testo       VARCHAR(512) NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_avvisi_evento UNIQUE (id_scadenza, evento, riferimento)
      );
      CREATE INDEX idx_avvisi_tenant ON avvisi (id_tenant, created_at);
      COMMENT ON CONSTRAINT uq_avvisi_evento ON avvisi IS 'Un avviso non si ripete: stesso evento nello stesso ciclo (data|soglia) una volta sola';

      CREATE TABLE consegne (
        id_consegna SERIAL PRIMARY KEY,
        id_tenant   INTEGER NOT NULL,
        id_avviso   INTEGER NOT NULL REFERENCES avvisi (id_avviso) ON DELETE CASCADE,
        id_account  INTEGER NULL,
        email       VARCHAR(256) NULL,
        canale      VARCHAR(16) NOT NULL CHECK (canale IN ('app','email','whatsapp')),
        stato       VARCHAR(16) NOT NULL DEFAULT 'in-coda' CHECK (stato IN ('in-coda','inviato','fallito','letto','risolto')),
        tentativi   SMALLINT NOT NULL DEFAULT 0,
        inviato_il  TIMESTAMPTZ NULL,
        letto_il    TIMESTAMPTZ NULL,
        errore      TEXT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT ck_consegne_destinatario CHECK (id_account IS NOT NULL OR email IS NOT NULL)
      );
      CREATE INDEX idx_consegne_campanella ON consegne (id_tenant, id_account, stato) WHERE canale = 'app';
      CREATE INDEX idx_consegne_da_inviare ON consegne (stato) WHERE stato IN ('in-coda','fallito');

      CREATE TABLE preferenze_avvisi (
        id_tenant     INTEGER NOT NULL,
        id_account    INTEGER NOT NULL,
        frequenza     VARCHAR(32) NOT NULL DEFAULT 'riepilogo-giornaliero' CHECK (frequenza IN ('riepilogo-giornaliero','riepilogo-settimanale','subito','mai')),
        urgenti_subito BOOLEAN NOT NULL DEFAULT true,
        canali        JSONB NOT NULL DEFAULT '["app","email"]',
        filtri        JSONB NOT NULL DEFAULT '{}',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (id_tenant, id_account)
      );
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS preferenze_avvisi, consegne, avvisi, allegati, letture, registrazioni,
        scadenze, contatori, controlli_categorie, controlli, fornitori, assegnazioni, soggetti,
        categorie, impostazioni, modelli_voci, modelli_settore, libreria_controlli, libreria_categorie;
    `);
  },
};

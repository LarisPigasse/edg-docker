'use strict';

/**
 * Migration: registro delle decisioni sulla libreria (blocco B4, ADR074)
 *
 * Libreria
 *   novita    che cosa cambia in questa versione e perche' (mostrato al cliente)
 *
 * Copie del cliente (categorie, controlli)
 *   aggiornamento_visto_il/da   prima apertura delle differenze della versione proposta
 *   categorie.versione_ignorata come gia' per i controlli
 *
 * Avvisi
 *   id_scadenza facoltativo: l'avviso "aggiornamenti della libreria disponibili"
 *   non riguarda una scadenza (tipo 'libreria')
 *
 * decisioni_libreria — registro NON modificabile (trigger) di ogni scelta del
 * cliente sulla libreria: voci incluse/escluse alla procedura di avvio,
 * aggiornamenti accettati/in parte/rifiutati campo per campo, con chi e quando.
 * Serve a rispondere "il ... ti e' stato proposto, l'hai rifiutato alle ...
 * con l'account ..." e il cliente lo vede nello storico del controllo.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE libreria_categorie ADD COLUMN novita TEXT NULL;
      ALTER TABLE libreria_controlli ADD COLUMN novita TEXT NULL;

      ALTER TABLE categorie
        ADD COLUMN versione_ignorata      INTEGER NULL,
        ADD COLUMN aggiornamento_visto_il TIMESTAMPTZ NULL,
        ADD COLUMN aggiornamento_visto_da INTEGER NULL;
      ALTER TABLE controlli
        ADD COLUMN aggiornamento_visto_il TIMESTAMPTZ NULL,
        ADD COLUMN aggiornamento_visto_da INTEGER NULL;

      ALTER TABLE avvisi ALTER COLUMN id_scadenza DROP NOT NULL;
      ALTER TABLE avvisi ADD CONSTRAINT ck_avvisi_scadenza CHECK (id_scadenza IS NOT NULL OR tipo = 'libreria');
      CREATE UNIQUE INDEX uq_avvisi_libreria ON avvisi (id_tenant, evento, riferimento) WHERE id_scadenza IS NULL;

      CREATE TABLE decisioni_libreria (
        id_decisione    SERIAL PRIMARY KEY,
        uuid_decisione  UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        id_tenant       INTEGER NOT NULL,
        contesto        VARCHAR(16) NOT NULL CHECK (contesto IN ('avvio','aggiornamento')),
        entita          VARCHAR(16) NOT NULL CHECK (entita IN ('categoria','controllo')),
        chiave_libreria VARCHAR(64) NOT NULL,
        nome            VARCHAR(160) NOT NULL,
        id_entita       INTEGER NULL,
        versione_da     INTEGER NULL,
        versione_a      INTEGER NOT NULL,
        novita          TEXT NULL,
        disponibile_dal TIMESTAMPTZ NULL,
        visto_il        TIMESTAMPTZ NULL,
        esito           VARCHAR(16) NOT NULL CHECK (esito IN ('incluso','escluso','accettato','parziale','rifiutato')),
        campi           JSONB NOT NULL DEFAULT '[]',
        deciso_il       TIMESTAMPTZ NOT NULL DEFAULT now(),
        deciso_da       INTEGER NULL,
        deciso_da_nome  VARCHAR(128) NULL,
        deciso_da_email VARCHAR(256) NULL,
        CONSTRAINT ck_decisioni_esito CHECK (
          (contesto = 'avvio' AND esito IN ('incluso','escluso')) OR
          (contesto = 'aggiornamento' AND esito IN ('accettato','parziale','rifiutato'))
        )
      );
      CREATE INDEX idx_decisioni_voce ON decisioni_libreria (id_tenant, entita, chiave_libreria, deciso_il);
      CREATE INDEX idx_decisioni_tenant ON decisioni_libreria (id_tenant, deciso_il);
      COMMENT ON TABLE decisioni_libreria IS 'Registro non modificabile delle scelte del cliente sulla libreria (ADR074): si aggiunge, non si corregge';

      CREATE FUNCTION decisioni_libreria_immutabili() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'decisioni_libreria: le righe del registro non si modificano (ADR074)';
      END;
      $$ LANGUAGE plpgsql;
      CREATE TRIGGER tr_decisioni_libreria_immutabili
        BEFORE UPDATE ON decisioni_libreria
        FOR EACH ROW EXECUTE FUNCTION decisioni_libreria_immutabili();
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS decisioni_libreria;
      DROP FUNCTION IF EXISTS decisioni_libreria_immutabili();
      DROP INDEX IF EXISTS uq_avvisi_libreria;
      ALTER TABLE avvisi DROP CONSTRAINT IF EXISTS ck_avvisi_scadenza;
      DELETE FROM avvisi WHERE id_scadenza IS NULL;
      ALTER TABLE avvisi ALTER COLUMN id_scadenza SET NOT NULL;
      ALTER TABLE controlli DROP COLUMN IF EXISTS aggiornamento_visto_da, DROP COLUMN IF EXISTS aggiornamento_visto_il;
      ALTER TABLE categorie DROP COLUMN IF EXISTS aggiornamento_visto_da, DROP COLUMN IF EXISTS aggiornamento_visto_il,
        DROP COLUMN IF EXISTS versione_ignorata;
      ALTER TABLE libreria_controlli DROP COLUMN IF EXISTS novita;
      ALTER TABLE libreria_categorie DROP COLUMN IF EXISTS novita;
    `);
  },
};

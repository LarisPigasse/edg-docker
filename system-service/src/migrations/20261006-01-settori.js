'use strict';

/**
 * Migration: tabella di base "settori" e settore dell'anagrafica (ADR059)
 *
 * Il settore di attività (trasportatore, azienda agricola, movimento terra,
 * ...) descrive l'azienda, quindi sta sull'anagrafica (clienti e partner) e
 * non sul tenant. L'elenco è una tabella di base gestita da EDG
 * dall'interfaccia (Tabelle di base → Settori), unica per tutta la
 * piattaforma: nessun elenco scritto nel codice, nessun valore iniziale.
 *
 * anagrafiche.id_settore è facoltativo, con vincolo vero (stesso database):
 * ON DELETE RESTRICT, come operatori → reparti. Un settore in uso non si
 * elimina: il crudFactory ripiega sulla disattivazione (ADR014).
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE settori (
        id_settore   SERIAL PRIMARY KEY,
        uuid_settore UUID NOT NULL DEFAULT gen_random_uuid(),
        settore      VARCHAR(64) NOT NULL,
        is_active    BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT uq_settori_uuid UNIQUE (uuid_settore),
        CONSTRAINT uq_settori_settore UNIQUE (settore)
      );
      COMMENT ON TABLE settori IS 'Tabella di base: settori di attivita delle aziende in anagrafica (ADR059)';

      ALTER TABLE anagrafiche
        ADD COLUMN id_settore INTEGER NULL REFERENCES settori (id_settore) ON DELETE RESTRICT ON UPDATE CASCADE;
      CREATE INDEX idx_anagrafiche_id_settore ON anagrafiche (id_settore);
      COMMENT ON COLUMN anagrafiche.id_settore IS 'Settore di attivita dell azienda (facoltativo, ADR059)';
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE anagrafiche DROP COLUMN IF EXISTS id_settore;
      DROP TABLE IF EXISTS settori;
    `);
  },
};

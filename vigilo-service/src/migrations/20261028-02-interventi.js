'use strict';

/**
 * Migration: interventi — guasti, esecuzione, manodopera, costo orario
 * (blocco B10a, passo 8 dell'analisi)
 *
 * scadenze.natura          solo per le scadenze senza controllo: 'riparazione'
 *                          (il guasto); vuota = promemoria
 * scadenze.blocca_uso      il guasto sospende il soggetto
 * registrazioni.esecuzione interna · esterna · entrambe (vuota = non detto)
 * registrazioni.manodopera elenco JSON di righe {idPersona, ore, costoOrario};
 *                          il numero massimo di righe è nel codice
 *                          (domini/interventi/interventi.ts)
 * soggetti.costo_orario    €/h, solo persone; il massimo è nei limiti del tenant
 * impostazioni.interventi  JSON { costoOrario, giorniRiparazione }: si legge
 *                          sempre con interventiEffettivi (limiti.ts)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE scadenze
        ADD COLUMN natura     VARCHAR(16) NULL,
        ADD COLUMN blocca_uso BOOLEAN NOT NULL DEFAULT false,
        ADD CONSTRAINT ck_scadenze_natura CHECK (natura IS NULL OR (natura = 'riparazione' AND id_controllo IS NULL)),
        -- IS NOT DISTINCT FROM: con natura vuota il confronto non resta "sconosciuto" (un CHECK lo accetterebbe)
        ADD CONSTRAINT ck_scadenze_blocca_uso CHECK (NOT blocca_uso OR natura IS NOT DISTINCT FROM 'riparazione');

      ALTER TABLE registrazioni
        ADD COLUMN esecuzione VARCHAR(8) NULL CHECK (esecuzione IN ('interna', 'esterna', 'entrambe')),
        ADD COLUMN manodopera JSONB NULL CHECK (manodopera IS NULL OR (jsonb_typeof(manodopera) = 'array' AND jsonb_array_length(manodopera) > 0));

      ALTER TABLE soggetti
        ADD COLUMN costo_orario NUMERIC(8,2) NULL,
        ADD CONSTRAINT ck_soggetti_costo_orario CHECK (costo_orario IS NULL OR (costo_orario >= 0 AND tipo = 'persona'));

      ALTER TABLE impostazioni
        ADD COLUMN interventi JSONB NOT NULL DEFAULT '{}'::jsonb;

      CREATE INDEX idx_scadenze_guasti_aperti ON scadenze (id_tenant, id_soggetto) WHERE natura = 'riparazione' AND chiusa_il IS NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_scadenze_guasti_aperti;
      ALTER TABLE impostazioni DROP COLUMN IF EXISTS interventi;
      ALTER TABLE soggetti DROP CONSTRAINT IF EXISTS ck_soggetti_costo_orario, DROP COLUMN IF EXISTS costo_orario;
      ALTER TABLE registrazioni DROP COLUMN IF EXISTS manodopera, DROP COLUMN IF EXISTS esecuzione;
      ALTER TABLE scadenze
        DROP CONSTRAINT IF EXISTS ck_scadenze_blocca_uso,
        DROP CONSTRAINT IF EXISTS ck_scadenze_natura,
        DROP COLUMN IF EXISTS blocca_uso,
        DROP COLUMN IF EXISTS natura;
    `);
  },
};

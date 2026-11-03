'use strict';

/**
 * Migration: tipi di fornitore (blocco F0)
 *
 * tipi_fornitore      catalogo comune a tutti i tenant (niente id_tenant): lo
 *                     cambia solo root da EDG Pro (SISTEMA → Moduli → Vigilo).
 *                     chiave stabile per il codice e i report, nome modificabile;
 *                     un tipo in uso non si elimina: si disattiva.
 * fornitori.id_tipo   obbligatorio, al posto della colonna di testo "tipo"
 *                     (la rubrica era vuota in tutti i tenant: niente da convertire;
 *                     se ci fossero fornitori, prendono "altro")
 */

const TIPI = [
  ['officina', 'Officina'],
  ['carrozzeria', 'Carrozzeria'],
  ['gommista', 'Gommista'],
  ['centro-revisioni', 'Centro revisioni'],
  ['assicurazione', 'Assicurazione'],
  ['consulente', 'Consulente'],
  ['medico-competente', 'Medico competente'],
  ['ente', 'Ente'],
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const valori = TIPI.map(([k, n]) => `('${k}', '${n}', 0)`).join(',\n        ');
    await queryInterface.sequelize.query(`
      CREATE TABLE tipi_fornitore (
        id_tipo       SERIAL PRIMARY KEY,
        chiave        VARCHAR(32) NOT NULL UNIQUE CHECK (chiave ~ '^[a-z][a-z0-9-]*$'),
        nome          VARCHAR(64) NOT NULL CHECK (length(trim(nome)) > 0),
        ordine        INTEGER NOT NULL DEFAULT 0,
        attivo        BOOLEAN NOT NULL DEFAULT true,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        creato_da     INTEGER NULL,
        modificato_da INTEGER NULL
      );
      CREATE UNIQUE INDEX uq_tipi_fornitore_nome ON tipi_fornitore (lower(nome));
      COMMENT ON TABLE tipi_fornitore IS 'Tipi di fornitore comuni a tutti i tenant (F0): solo root li cambia';

      INSERT INTO tipi_fornitore (chiave, nome, ordine) VALUES
        ${valori},
        ('altro', 'Altro', 1024);

      ALTER TABLE fornitori ADD COLUMN id_tipo INTEGER NULL REFERENCES tipi_fornitore (id_tipo) ON DELETE RESTRICT;
      UPDATE fornitori SET id_tipo = (SELECT id_tipo FROM tipi_fornitore WHERE chiave = 'altro');
      ALTER TABLE fornitori ALTER COLUMN id_tipo SET NOT NULL, DROP COLUMN tipo;
      CREATE INDEX idx_fornitori_tipo ON fornitori (id_tenant, id_tipo);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE fornitori ADD COLUMN tipo VARCHAR(64) NULL;
      UPDATE fornitori f SET tipo = t.nome FROM tipi_fornitore t WHERE t.id_tipo = f.id_tipo;
      DROP INDEX IF EXISTS idx_fornitori_tipo;
      ALTER TABLE fornitori DROP COLUMN id_tipo;
      DROP TABLE IF EXISTS tipi_fornitore;
    `);
  },
};

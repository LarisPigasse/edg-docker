'use strict';

/**
 * Migration: soglie dei segnali dell'Analisi (2026-11-23, fase D)
 *
 * impostazioni.analisi   le soglie del tenant (consumo alto, consumo in
 *                        crescita, km al mese, disponibilità, peso dei guasti,
 *                        struttura, margine); vuoto = i valori iniziali
 *                        (impostazioni/limiti.ts), sempre entro i limiti
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`ALTER TABLE impostazioni ADD COLUMN analisi JSONB NOT NULL DEFAULT '{}'::jsonb;`);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`ALTER TABLE impostazioni DROP COLUMN IF EXISTS analisi;`);
  },
};

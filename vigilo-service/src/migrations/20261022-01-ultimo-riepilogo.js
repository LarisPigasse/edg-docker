'use strict';

/**
 * Migration: giorno dell'ultimo riepilogo degli avvisi (blocco B8c-2, ADR093)
 *
 * ultimo_riepilogo_il  il riepilogo di un tenant parte una volta al giorno,
 *                      al primo giro dopo il suo orario nei giorni lavorativi
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`ALTER TABLE impostazioni ADD COLUMN ultimo_riepilogo_il DATE NULL;`);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`ALTER TABLE impostazioni DROP COLUMN IF EXISTS ultimo_riepilogo_il;`);
  },
};

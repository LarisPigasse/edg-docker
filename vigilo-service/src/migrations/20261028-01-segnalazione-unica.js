'use strict';

/**
 * Migration: una sola segnalazione in attesa per scadenza (blocco B9c, ADR101)
 *
 * La segnalazione "fatto" dell'addetto è una registrazione "da-confermare":
 * finché l'ufficio non decide, per la stessa scadenza non ne nasce un'altra,
 * nemmeno con due richieste nello stesso istante. L'indice serve anche a
 * trovare in fretta le scadenze segnalate (elenco, dashboard, avvisi).
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX uq_registrazioni_in_attesa ON registrazioni (id_scadenza) WHERE stato = 'da-confermare';
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS uq_registrazioni_in_attesa;`);
  },
};

'use strict';

/**
 * Migration: contatti del referente e "Seguito da" sull'anagrafica (ADR086)
 *
 * - telefono_referente, email_referente: la persona di riferimento presso il
 *   cliente (o il partner); `email` resta l'indirizzo dell'azienda.
 * - id_operatore_referente: l'operatore EDG che segue il cliente ("Seguito
 *   da"). Stesso database degli operatori: vincolo vero, ON DELETE RESTRICT
 *   come anagrafiche → settori e operatori → reparti; un operatore che segue
 *   qualche cliente non si elimina, il crudFactory lo disattiva (ADR014).
 *
 * Serve anche alle email a preparazione completata di Vigilo (ADR084): al
 * referente del cliente e all'operatore che lo segue.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE anagrafiche
        ADD COLUMN telefono_referente VARCHAR(64) NULL,
        ADD COLUMN email_referente VARCHAR(64) NULL,
        ADD COLUMN id_operatore_referente INTEGER NULL REFERENCES operatori (id_operatore) ON DELETE RESTRICT ON UPDATE CASCADE;
      CREATE INDEX idx_anagrafiche_id_operatore_referente ON anagrafiche (id_operatore_referente);
      COMMENT ON COLUMN anagrafiche.telefono_referente IS 'Telefono del referente presso il cliente (ADR086)';
      COMMENT ON COLUMN anagrafiche.email_referente IS 'Email del referente presso il cliente (ADR086)';
      COMMENT ON COLUMN anagrafiche.id_operatore_referente IS 'Operatore EDG che segue il cliente: Seguito da (ADR086)';
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE anagrafiche
        DROP COLUMN IF EXISTS id_operatore_referente,
        DROP COLUMN IF EXISTS email_referente,
        DROP COLUMN IF EXISTS telefono_referente;
    `);
  },
};

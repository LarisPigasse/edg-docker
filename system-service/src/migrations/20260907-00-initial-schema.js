'use strict';

/**
 * Migration: 00-initial-schema
 *
 * Questa migration NON crea né modifica tabelle.
 * Le tabelle sono già state create tramite lo script SQL
 * migrations/2026-09-07-initial-schema.sql.
 *
 * Scopo: registrare in SequelizeMeta il punto di partenza dello schema
 * in modo che le migration future possano procedere da qui.
 *
 * UP   → no-op (schema già esistente)
 * DOWN → no-op (non distruggiamo dati in rollback della migration base)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('[Migration] 00-initial-schema: schema già presente, nessuna operazione.');
  },

  async down(queryInterface, Sequelize) {
    console.log('[Migration] 00-initial-schema: rollback baseline ignorato per sicurezza.');
  },
};

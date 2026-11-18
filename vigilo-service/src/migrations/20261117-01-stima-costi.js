'use strict';

/**
 * Migration: stima dei costi di un servizio, parametri (2026-11-17, fase 1)
 *
 * impostazioni.stima       i parametri generali del tenant (costo orario del
 *                          conducente, velocità media, ore di guida al giorno,
 *                          diaria, pedaggio per km); i valori mancanti prendono
 *                          quelli iniziali (impostazioni/limiti.ts)
 * costi_aziendali          per tenant e anno, a consuntivo o a preventivo: i
 *                          costi aziendali per macro voce (JSONB, € per voce)
 *                          e le ore di servizio annue, da cui il costo
 *                          aziendale per ora di servizio
 */

const AUDIT = `
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  creato_da     INTEGER NULL,
  modificato_da INTEGER NULL`;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE impostazioni
        ADD COLUMN stima JSONB NOT NULL DEFAULT '{}'::jsonb;

      CREATE TABLE costi_aziendali (
        id_costi      SERIAL PRIMARY KEY,
        uuid_costi    UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        id_tenant     INTEGER NOT NULL,
        anno          INTEGER NOT NULL CHECK (anno BETWEEN 2000 AND 2100),
        stato         VARCHAR(16) NOT NULL CHECK (stato IN ('consuntivo', 'preventivo')),
        voci          JSONB NOT NULL DEFAULT '{}'::jsonb,
        ore_servizio  NUMERIC(12, 2) NULL CHECK (ore_servizio IS NULL OR ore_servizio > 0),
        note          VARCHAR(1024) NULL,
        ${AUDIT},
        UNIQUE (id_tenant, anno)
      );
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS costi_aziendali;
      ALTER TABLE impostazioni DROP COLUMN IF EXISTS stima;
    `);
  },
};

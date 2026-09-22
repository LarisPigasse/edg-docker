'use strict';

/**
 * Migration: anagrafiche.tipo perde 'agente'
 *
 * Gli agenti sono stati ridefiniti come operatori interni assegnati a uno
 * specifico reparto (es. "Commerciale"), non più come un tipo di anagrafica
 * - vedi discussione del 17/09/2026. anagrafiche.tipo si riduce quindi ai
 * due soli rapporti commerciali che Express Delivery gestisce direttamente:
 * 'cliente' e 'partner'.
 *
 * Il CHECK originale (migrations/2026-09-07-initial-schema.sql) era inline
 * e senza nome esplicito: il nome effettivo assegnato da Postgres non è
 * garantito, quindi qui lo si cerca dinamicamente invece di indovinarlo -
 * più robusto, e da qui in avanti il vincolo ha un nome esplicito
 * (anagrafiche_tipo_check) per non ripresentare il problema in futuro.
 *
 * Se esistono ancora righe con tipo='agente' l'operazione si ferma con un
 * errore leggibile invece di un generico fallimento del CHECK: vanno
 * riclassificate manualmente prima di riprovare.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      DECLARE
        agente_count integer;
        check_name text;
      BEGIN
        SELECT count(*) INTO agente_count FROM anagrafiche WHERE tipo = 'agente';
        IF agente_count > 0 THEN
          RAISE EXCEPTION 'Impossibile applicare la migration: % anagrafiche hanno ancora tipo agente. Riclassificale manualmente (cliente o partner) prima di rieseguire.', agente_count;
        END IF;

        SELECT con.conname INTO check_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
        WHERE rel.relname = 'anagrafiche' AND con.contype = 'c' AND att.attname = 'tipo'
        LIMIT 1;

        IF check_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE anagrafiche DROP CONSTRAINT %I', check_name);
        END IF;

        ALTER TABLE anagrafiche ADD CONSTRAINT anagrafiche_tipo_check CHECK (tipo IN ('partner', 'cliente'));
      END $$;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE anagrafiche DROP CONSTRAINT IF EXISTS anagrafiche_tipo_check;
      ALTER TABLE anagrafiche ADD CONSTRAINT anagrafiche_tipo_check CHECK (tipo IN ('partner', 'cliente', 'agente'));
    `);
  },
};

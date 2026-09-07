-- Migration: Schema iniziale system-service (edg_system)
-- Date: 2026-09-07
-- Description: Tabelle primitive e anagrafiche per la gestione di operatori
--              interni EDG e di partner/clienti/agenti esterni.
--
-- Convenzione adottata per tutte le tabelle di system-service (e di ogni
-- servizio futuro basato su Postgres):
--   - nomi tabella e campo in italiano, snake_case; restano in inglese solo
--     i campi standard created_at / updated_at / is_active;
--   - PK intera autoincrementante chiamata id_<nome_tabella_singolare>
--     (mai "id" generico);
--   - identificativo pubblico separato uuid_<nome_tabella_singolare>,
--     tipo UUID nativo, generato lato DB con gen_random_uuid();
--   - i concetti che sono in realta' un elenco chiuso/gestibile (es. reparto)
--     diventano una tabella primitiva dedicata, referenziata con una FK
--     intera id_<tabella_primitiva> — mai un varchar libero;
--   - un CHECK enum si usa solo se i valori ammessi non potranno mai essere
--     modificati o ampliati in futuro (es. anagrafiche.tipo);
--   - le tabelle elementari/di lookup (es. reparti) non hanno created_at/
--     updated_at: non serve storicizzarle e non vengono quasi mai modificate.

-- ============================================================================
-- REPARTI (tabella primitiva)
-- ============================================================================

CREATE TABLE reparti (
  id_reparto   SERIAL PRIMARY KEY,
  uuid_reparto UUID NOT NULL DEFAULT gen_random_uuid(),
  reparto      VARCHAR(64) NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT uq_reparti_uuid UNIQUE (uuid_reparto),
  CONSTRAINT uq_reparti_reparto UNIQUE (reparto)
);

COMMENT ON TABLE reparti IS 'Tabella primitiva: elenco reparti aziendali';

-- ============================================================================
-- OPERATORI (personale interno EDG)
-- ============================================================================

CREATE TABLE operatori (
  id_operatore   SERIAL PRIMARY KEY,
  uuid_operatore UUID NOT NULL DEFAULT gen_random_uuid(),
  nome           VARCHAR(64) NOT NULL,
  cognome        VARCHAR(64) NOT NULL,
  id_reparto     INTEGER NOT NULL REFERENCES reparti (id_reparto) ON DELETE RESTRICT ON UPDATE CASCADE,
  telefono       VARCHAR(64),
  email          VARCHAR(64),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_operatori_uuid UNIQUE (uuid_operatore)
);

CREATE INDEX idx_operatori_id_reparto ON operatori (id_reparto);
CREATE INDEX idx_operatori_is_active ON operatori (is_active);

COMMENT ON TABLE operatori IS 'Anagrafica del personale interno EDG';

-- ============================================================================
-- ANAGRAFICHE (partner / cliente / agente — sempre aziende)
-- ============================================================================

CREATE TABLE anagrafiche (
  id_anagrafica   SERIAL PRIMARY KEY,
  uuid_anagrafica UUID NOT NULL DEFAULT gen_random_uuid(),
  tipo            VARCHAR(20) NOT NULL CHECK (tipo IN ('partner', 'cliente', 'agente')),
  id_tenant       INTEGER NOT NULL,
  ragione_sociale VARCHAR(256) NOT NULL,
  partita_iva     VARCHAR(32),
  codice_fiscale  VARCHAR(32),
  indirizzo       VARCHAR(256),
  cap             VARCHAR(16),
  citta           VARCHAR(128),
  provincia       VARCHAR(4),
  telefono        VARCHAR(64),
  email           VARCHAR(64),
  referente       VARCHAR(64),
  note            TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_anagrafiche_uuid UNIQUE (uuid_anagrafica)
);

CREATE INDEX idx_anagrafiche_tipo ON anagrafiche (tipo);
CREATE INDEX idx_anagrafiche_id_tenant ON anagrafiche (id_tenant);
CREATE INDEX idx_anagrafiche_is_active ON anagrafiche (is_active);

COMMENT ON COLUMN anagrafiche.id_tenant IS 'Riferimento applicativo al tenant di auth-service — nessuna FK reale (servizio/DB diverso), stesso pattern gia'' usato per accounts.entityId';
COMMENT ON TABLE anagrafiche IS 'Anagrafica di partner, clienti e agenti esterni (sempre aziende)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- SELECT * FROM reparti;
-- SELECT o.id_operatore, o.nome, o.cognome, r.reparto FROM operatori o JOIN reparti r ON r.id_reparto = o.id_reparto;
-- SELECT id_anagrafica, tipo, ragione_sociale, id_tenant FROM anagrafiche;

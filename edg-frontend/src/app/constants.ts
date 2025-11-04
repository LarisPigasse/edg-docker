// src/app/constants.ts
export const APP_DATA = {
  // Valori fissi (non cambiano tra ambienti)
  DEFAULT_DEBOUNCE_MS: 300,
  DEFAULT_PAGINATION_SIZE: 16,
  MAX_FILE_SIZE: 8 * 1024 * 1024, // 8MB

  // API related constants
  API_TIMEOUT_MS: 30000,
  RETRY_ATTEMPTS: 3,

  // UI constants
  TOAST_DURATION_MS: 5000,
  ANIMATION_DURATION_MS: 200,

  // Timeout sessione in minuti
  SESSION_TIMEOUT: 32,
} as const;

// Costanti per i messaggi di notifica
export const MESSAGES = {
  // Errori
  ERROR: {
    GENERIC: "Si è verificato un errore. Riprova più tardi.",
    CONNECTION: "Errore di connessione. Verifica la tua connessione internet.",
    UNAUTHORIZED: "Non sei autorizzato ad accedere a questa risorsa.",
    NOT_FOUND: "La risorsa richiesta non è stata trovata.",
    VALIDATION: "Verifica i dati inseriti e riprova.",
  },

  // Successi
  SUCCESS: {
    SAVED: "Dati salvati con successo.",
    DELETED: "Elemento eliminato con successo.",
    UPDATED: "Dati aggiornati con successo.",
  },

  // Conferme
  CONFIRM: {
    DELETE: "Sei sicuro di voler eliminare questo elemento?",
    CANCEL: "Sei sicuro di voler annullare? Le modifiche non salvate andranno perse.",
    LOGOUT: "Sei sicuro di voler effettuare il logout?",
  },
} as const;

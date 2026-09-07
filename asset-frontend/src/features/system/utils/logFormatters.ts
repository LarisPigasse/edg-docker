/**
 * Utilities per formattare dati logs
 */

import type { LogEvent, EventCategory, EventSeverity } from '../types';

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Formatta timestamp in formato leggibile
 * @example "2026-02-09T10:30:00Z" -> "09/02/2026 10:30"
 */
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Formatta timestamp in formato relativo
 * @example "2 minuti fa", "3 ore fa", "ieri"
 */
export const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Pochi secondi fa';
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minuto' : 'minuti'} fa`;
  if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'ora' : 'ore'} fa`;
  if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? 'giorno' : 'giorni'} fa`;

  return formatTimestamp(timestamp);
};

// ============================================================================
// CATEGORY FORMATTING
// ============================================================================

/**
 * Traduce categoria in italiano
 */
export const getCategoryLabel = (category: EventCategory | 'LEGACY'): string => {
  const labels: Record<string, string> = {
    AUTH: 'Autenticazione',
    DATA: 'Dati',
    EMAIL: 'Email',
    SYSTEM: 'Sistema',
    AUDIT: 'Audit',
    SECURITY: 'Sicurezza',
    LEGACY: 'Legacy',
  };

  return labels[category] || category;
};

/**
 * Restituisce colore per categoria (Tailwind classes)
 */
export const getCategoryColor = (category: EventCategory | 'LEGACY'): string => {
  const colors: Record<string, string> = {
    AUTH: 'bg-blue-100 text-blue-800',
    DATA: 'bg-green-100 text-green-800',
    EMAIL: 'bg-purple-100 text-purple-800',
    SYSTEM: 'bg-gray-100 text-gray-800',
    AUDIT: 'bg-yellow-100 text-yellow-800',
    SECURITY: 'bg-red-100 text-red-800',
    LEGACY: 'bg-neutral-100 text-neutral-600',
  };

  return colors[category] || 'bg-gray-100 text-gray-600';
};

// ============================================================================
// SEVERITY FORMATTING
// ============================================================================

/**
 * Traduce severità in italiano
 */
export const getSeverityLabel = (severity: EventSeverity): string => {
  const labels: Record<EventSeverity, string> = {
    info: 'Info',
    warning: 'Avviso',
    error: 'Errore',
    critical: 'Critico',
  };

  return labels[severity] || severity;
};

/**
 * Restituisce colore per severità (Tailwind classes)
 */
export const getSeverityColor = (severity: EventSeverity): string => {
  const colors: Record<EventSeverity, string> = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
    critical: 'bg-red-600 text-white',
  };

  return colors[severity] || 'bg-gray-100 text-gray-600';
};

/**
 * Restituisce icona per severità (emoji fallback)
 */
export const getSeverityIcon = (severity: EventSeverity): string => {
  const icons: Record<EventSeverity, string> = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    critical: '🚨',
  };

  return icons[severity] || 'ℹ️';
};

// ============================================================================
// OUTCOME FORMATTING
// ============================================================================

/**
 * Traduce esito in italiano
 */
export const getOutcomeLabel = (esito: 'successo' | 'fallito' | 'parziale'): string => {
  const labels = {
    successo: 'Successo',
    fallito: 'Fallito',
    parziale: 'Parziale',
  };

  return labels[esito] || esito;
};

/**
 * Restituisce colore per esito (Tailwind classes)
 */
export const getOutcomeColor = (esito: 'successo' | 'fallito' | 'parziale'): string => {
  const colors = {
    successo: 'text-green-600',
    fallito: 'text-red-600',
    parziale: 'text-amber-600',
  };

  return colors[esito] || 'text-gray-600';
};

// ============================================================================
// LOG MESSAGE EXTRACTION
// ============================================================================

/**
 * Estrae messaggio principale dal log
 */
export const getLogMessage = (log: LogEvent): string => {
  // 1. Prova con risultato.messaggio
  if (log.risultato.messaggio) {
    return log.risultato.messaggio;
  }

  // 2. Prova con azione.operazione
  if (log.azione.operazione) {
    return log.azione.operazione;
  }

  // 3. Fallback con sottoCategoria
  if (log.sottoCategoria) {
    return log.sottoCategoria.replace(/_/g, ' ');
  }

  // 4. Default
  return 'Evento log';
};

/**
 * Estrae user ID/name dal log
 */
export const getLogUser = (log: LogEvent): string => {
  if (log.origine.tipo === 'utente') {
    const username = log.origine.dettagli?.username;
    return typeof username === 'string' && username ? username : log.origine.id;
  }

  return 'Sistema';
};

// ============================================================================
// EXPORT HELPERS
// ============================================================================

/**
 * Download blob come file
 */
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Genera filename per export con timestamp
 */
export const generateExportFilename = (extension: 'csv' | 'json'): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  return `logs-export-${year}${month}${day}-${hours}${minutes}.${extension}`;
};

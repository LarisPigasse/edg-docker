// src/types/email.types.ts

/**
 * Template email disponibili
 */
export type EmailTemplate =
  | 'auth/password-reset'
  | 'auth/email-verification'
  | 'auth/welcome'
  | 'alerts/security-alert'
  | 'alerts/system-error';

/**
 * Livelli di severità per alert
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Richiesta invio email generico
 */
export interface SendEmailRequest {
  to: string | string[];
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
  from?: string; // Opzionale: default noreply
}

/**
 * Richiesta invio alert di sicurezza
 */
export interface SendAlertRequest {
  title: string;
  message: string;
  severity?: AlertSeverity;
  metadata?: Record<string, any>;
}

/**
 * Risposta API standard
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Configurazione SMTP
 */
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * Modalità email service
 */
export type EmailMode = 'smtp' | 'ethereal' | 'console';

/**
 * Statistiche invio email (per monitoring futuro)
 */
export interface EmailStats {
  sent: number;
  failed: number;
  pending: number;
}

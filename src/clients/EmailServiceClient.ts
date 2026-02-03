// src/clients/EmailServiceClient.ts

/**
 * EMAIL SERVICE CLIENT
 * 
 * Client HTTP per comunicare con l'email-service microservizio.
 * Gestisce l'invio di email e alert tramite chiamate REST.
 */

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, any>;
  from?: string;
}

interface SendAlertRequest {
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export class EmailServiceClient {
  private baseUrl: string;
  private timeout: number = 10000; // 10 secondi

  constructor() {
    this.baseUrl = process.env.EMAIL_SERVICE_URL || 'http://email-service:3002';
  }

  /**
   * Invia email di reset password
   */
  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    await this.sendEmail({
      to: email,
      subject: 'Reset Password - EDG Platform',
      template: 'auth/password-reset',
      data: {
        resetUrl,
        expiryMinutes: 60,
      },
    });
  }

  /**
   * Invia email di benvenuto
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    await this.sendEmail({
      to: email,
      subject: 'Benvenuto su EDG Platform',
      template: 'auth/welcome',
      data: {
        userName,
        loginUrl,
      },
    });
  }

  /**
   * Invia email di verifica account
   */
  async sendEmailVerification(email: string, userName: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    await this.sendEmail({
      to: email,
      subject: 'Verifica la tua email - EDG Platform',
      template: 'auth/email-verification',
      data: {
        userName,
        verificationUrl,
      },
    });
  }

  /**
   * Invia alert di sicurezza
   */
  async sendSecurityAlert(
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'critical' = 'info',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/email/alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          message,
          severity,
          metadata,
        } as SendAlertRequest),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse;
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json() as ApiResponse;

      if (!result.success) {
        throw new Error(result.error || 'Errore invio alert');
      }
    } catch (error) {
      console.error('[EmailServiceClient] Errore invio alert:', error);
      // Non blocchiamo l'operazione se l'invio alert fallisce
      // Gli alert sono notifiche, non critici per il flusso principale
    }
  }

  /**
   * Invia email generica
   */
  private async sendEmail(request: SendEmailRequest): Promise<void> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiResponse;
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json() as ApiResponse;

      if (!result.success) {
        throw new Error(result.error || 'Errore invio email');
      }

      console.log(`[EmailServiceClient] Email inviata: ${request.template} -> ${request.to}`);
    } catch (error) {
      console.error('[EmailServiceClient] Errore invio email:', error);
      throw new Error('Impossibile inviare email');
    }
  }

  /**
   * Fetch con timeout
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === 'AbortError') {
        throw new Error('Email service timeout');
      }
      throw error;
    }
  }

  /**
   * Health check del servizio email
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/email/health`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('[EmailServiceClient] Email service non raggiungibile:', error);
      return false;
    }
  }
}

// Singleton
export const emailServiceClient = new EmailServiceClient();

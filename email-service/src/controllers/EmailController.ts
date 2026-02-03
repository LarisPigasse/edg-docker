// src/controllers/EmailController.ts

import { Request, Response } from 'express';
import { smtpService } from '../services/SmtpService';
import { templateService } from '../services/TemplateService';
import type { SendEmailRequest, SendAlertRequest, ApiResponse } from '../types/email.types';

export class EmailController {
  /**
   * POST /email/send
   * Invia email usando un template
   */
  async send(req: Request, res: Response): Promise<void> {
    try {
      const { to, subject, template, data, from }: SendEmailRequest = req.body;

      // Validazione
      if (!to || !subject || !template || !data) {
        res.status(400).json({
          success: false,
          error: 'Parametri mancanti: to, subject, template, data sono richiesti',
        } as ApiResponse);
        return;
      }

      // Genera template
      const { html, text } = templateService.generate(template, data);

      // Invia email
      const result = await smtpService.send({
        to,
        subject,
        html,
        text,
        from,
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Email inviata con successo',
          data: {
            messageId: result.messageId,
            previewUrl: result.previewUrl,
          },
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Errore durante invio email',
        } as ApiResponse);
      }
    } catch (error) {
      console.error('[EmailController] Errore send:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Errore interno',
      } as ApiResponse);
    }
  }

  /**
   * POST /email/alert
   * Invia alert di sicurezza agli amministratori
   */
  async sendAlert(req: Request, res: Response): Promise<void> {
    try {
      const { title, message, severity = 'info', metadata }: SendAlertRequest = req.body;

      // Validazione
      if (!title || !message) {
        res.status(400).json({
          success: false,
          error: 'Parametri mancanti: title e message sono richiesti',
        } as ApiResponse);
        return;
      }

      const { alertsFrom, alertsTo } = smtpService.getEmailAddresses();

      if (!alertsTo) {
        res.status(400).json({
          success: false,
          error: 'EMAIL_ALERTS_TO non configurato',
        } as ApiResponse);
        return;
      }

      const severityEmoji = {
        info: 'ℹ️',
        warning: '⚠️',
        critical: '🛑',
      };

      const subject = `${severityEmoji[severity]} [${severity.toUpperCase()}] ${title}`;

      // Genera template alert
      const { html, text } = templateService.generate('alerts/security-alert', {
        title,
        message,
        severity,
        metadata,
      });

      // Invia alert
      const result = await smtpService.send({
        to: alertsTo,
        subject,
        html,
        text,
        from: alertsFrom,
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Alert inviato con successo',
          data: {
            messageId: result.messageId,
            previewUrl: result.previewUrl,
          },
        } as ApiResponse);
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Errore durante invio alert',
        } as ApiResponse);
      }
    } catch (error) {
      console.error('[EmailController] Errore sendAlert:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Errore interno',
      } as ApiResponse);
    }
  }

  /**
   * GET /email/health
   * Health check del servizio
   */
  async health(req: Request, res: Response): Promise<void> {
    const mode = smtpService.getMode();
    const isConfigured = smtpService.isConfigured();
    const emailAddresses = smtpService.getEmailAddresses();

    res.status(200).json({
      success: true,
      data: {
        service: 'email-service',
        version: '1.0.0',
        mode,
        configured: isConfigured,
        emailAddresses,
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }

  /**
   * GET /email/templates
   * Lista template disponibili
   */
  async listTemplates(req: Request, res: Response): Promise<void> {
    const templates = [
      'auth/password-reset',
      'auth/email-verification',
      'auth/welcome',
      'alerts/security-alert',
      'alerts/system-error',
    ];

    res.status(200).json({
      success: true,
      data: { templates },
    } as ApiResponse);
  }
}

export const emailController = new EmailController();

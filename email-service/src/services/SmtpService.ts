// src/services/SmtpService.ts

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { SmtpConfig, EmailMode } from '../types/email.types';

/**
 * SMTP SERVICE
 * 
 * Gestisce la connessione SMTP e l'invio fisico delle email.
 * Supporta 3 modalità:
 * - SMTP: Invio reale (produzione)
 * - Ethereal: Email fake per testing (sviluppo)
 * - Console: Log in console (fallback)
 */
export class SmtpService {
  private transporter: Transporter | null = null;
  private mode: EmailMode = 'console';
  private noreplyFrom: string;
  private alertsFrom: string;
  private alertsTo: string;

  constructor() {
    this.noreplyFrom = process.env.EMAIL_NOREPLY_FROM || 'noreply@edg.local';
    this.alertsFrom = process.env.EMAIL_ALERTS_FROM || 'alerts@edg.local';
    this.alertsTo = process.env.EMAIL_ALERTS_TO || '';
    
    this.initialize();
  }

  /**
   * Inizializza il transporter SMTP
   */
  private async initialize(): Promise<void> {
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = parseInt(process.env.EMAIL_PORT || '587');
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    // Modalità SMTP reale
    if (emailHost && emailUser && emailPass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: emailHost,
          port: emailPort,
          secure: emailPort === 465,
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

        await this.transporter.verify();
        this.mode = 'smtp';
        
        console.log('✅ [SMTP] Configurato correttamente');
        console.log(`   Host: ${emailHost}:${emailPort}`);
        console.log(`   NoReply: ${this.noreplyFrom}`);
        console.log(`   Alerts From: ${this.alertsFrom}`);
        if (this.alertsTo) {
          console.log(`   Alerts To: ${this.alertsTo}`);
        }
      } catch (error) {
        console.error('❌ [SMTP] Errore configurazione:', error);
        this.mode = 'console';
      }
    }
    // Modalità Ethereal (sviluppo)
    else if (process.env.NODE_ENV === 'development') {
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        
        this.mode = 'ethereal';
        console.log('⚠️ [SMTP] Modalità sviluppo - Ethereal attivo');
        console.log(`   User: ${testAccount.user}`);
      } catch (error) {
        console.warn('⚠️ [SMTP] Impossibile configurare Ethereal, uso console');
        this.mode = 'console';
      }
    }
    // Modalità Console (fallback)
    else {
      console.warn('⚠️ [SMTP] Nessuna configurazione trovata');
      console.warn('   Le email saranno solo logged in console');
      console.warn('   Configura EMAIL_HOST, EMAIL_USER, EMAIL_PASS per abilitare invio');
      this.mode = 'console';
    }
  }

  /**
   * Invia email
   */
  async send(options: {
    to: string | string[];
    subject: string;
    html: string;
    text: string;
    from?: string;
  }): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
    const from = options.from || this.noreplyFrom;
    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    // Modalità console: log senza inviare
    if (this.mode === 'console') {
      console.log('\n📧 [EMAIL] Simulazione invio:');
      console.log(`   To: ${to}`);
      console.log(`   From: ${from}`);
      console.log(`   Subject: ${options.subject}`);
      console.log(`   Text Preview: ${options.text.substring(0, 100)}...`);
      console.log('');
      
      return { success: true, messageId: 'console-mock-id' };
    }

    // Invio reale
    try {
      const info = await this.transporter!.sendMail({
        from: `"EDG Platform" <${from}>`,
        to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      if (this.mode === 'ethereal') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('📧 [EMAIL] Inviata (Ethereal - fake):');
        console.log(`   Preview: ${previewUrl}`);
        return { success: true, messageId: info.messageId, previewUrl: previewUrl || undefined };
      } else {
        console.log('📧 [EMAIL] Inviata con successo:');
        console.log(`   To: ${to}`);
        console.log(`   From: ${from}`);
        console.log(`   MessageID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      console.error('❌ [EMAIL] Errore invio:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Getter per email configurate
   */
  getEmailAddresses() {
    return {
      noreplyFrom: this.noreplyFrom,
      alertsFrom: this.alertsFrom,
      alertsTo: this.alertsTo,
    };
  }

  /**
   * Getter per modalità corrente
   */
  getMode(): EmailMode {
    return this.mode;
  }

  /**
   * Check se email è configurato correttamente
   */
  isConfigured(): boolean {
    return this.mode !== 'console';
  }
}

// Singleton
export const smtpService = new SmtpService();

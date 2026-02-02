// src/services/EmailService.ts

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * EMAIL SERVICE
 * 
 * Supporta 3 modalità:
 * 1. SMTP reale (produzione) - Gmail, Outlook, server custom
 * 2. Ethereal (sviluppo) - Email fake per testing
 * 3. Console (fallback) - Log in console se email non configurata
 */

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: Transporter | null = null;
  private emailEnabled: boolean = false;
  private mode: 'smtp' | 'ethereal' | 'console' = 'console';

  constructor() {
    this.initialize();
  }

  /**
   * Inizializza il transporter email
   */
  private async initialize(): Promise<void> {
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = parseInt(process.env.EMAIL_PORT || '587');
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailFrom = process.env.EMAIL_FROM;

    // Se configurazione SMTP completa → usa SMTP
    if (emailHost && emailUser && emailPass && emailFrom) {
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

        // Verifica connessione
        await this.transporter.verify();
        this.emailEnabled = true;
        this.mode = 'smtp';
        console.log('✅ [EMAIL] SMTP configurato correttamente');
        console.log(`   Host: ${emailHost}`);
        console.log(`   Port: ${emailPort}`);
        console.log(`   From: ${emailFrom}`);
      } catch (error) {
        console.error('❌ [EMAIL] Errore configurazione SMTP:', error);
        this.mode = 'console';
      }
    }
    // Altrimenti in sviluppo → usa Ethereal (email fake)
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
        this.emailEnabled = true;
        this.mode = 'ethereal';
        console.log('⚠️ [EMAIL] Modalità sviluppo - Ethereal attivo');
        console.log(`   User: ${testAccount.user}`);
        console.log(`   Le email NON saranno inviate realmente`);
      } catch (error) {
        console.warn('⚠️ [EMAIL] Impossibile configurare Ethereal, uso console log');
        this.mode = 'console';
      }
    }
    // Altrimenti → fallback console
    else {
      console.warn('⚠️ [EMAIL] Nessuna configurazione email trovata');
      console.warn('   Le email saranno solo logged in console');
      console.warn('   Configura EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_FROM per abilitare invio');
      this.mode = 'console';
    }
  }

  /**
   * Invia email di reset password
   */
  async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const expiryMinutes = 60; // 1 ora

    const subject = 'Reset Password - EDG Platform';
    const html = this.getPasswordResetTemplate(resetUrl, expiryMinutes);
    const text = this.getPasswordResetTextVersion(resetUrl, expiryMinutes);

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Invia email generica
   */
  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    const from = process.env.EMAIL_FROM || 'noreply@edg.local';

    // Modalità console: log email senza inviarla
    if (this.mode === 'console') {
      console.log('\n📧 [EMAIL] Simulazione invio email:');
      console.log(`   To: ${options.to}`);
      console.log(`   From: ${from}`);
      console.log(`   Subject: ${options.subject}`);
      console.log(`   Text: ${options.text}`);
      console.log('');
      return;
    }

    // Invia email realmente
    try {
      const info = await this.transporter!.sendMail({
        from: `"EDG Platform" <${from}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      if (this.mode === 'ethereal') {
        console.log('📧 [EMAIL] Email inviata (Ethereal - fake):');
        console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      } else {
        console.log('📧 [EMAIL] Email inviata con successo:');
        console.log(`   To: ${options.to}`);
        console.log(`   Message ID: ${info.messageId}`);
      }
    } catch (error) {
      console.error('❌ [EMAIL] Errore invio email:', error);
      throw new Error('Impossibile inviare email');
    }
  }

  /**
   * Template HTML per reset password
   */
  private getPasswordResetTemplate(resetUrl: string, expiryMinutes: number): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #007bff;
    }
    .header h1 {
      color: #007bff;
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #007bff;
      color: white !important;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #0056b3;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 20px 0;
    }
    .code {
      background-color: #f8f9fa;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Reset Password</h1>
    </div>
    
    <div class="content">
      <p>Ciao,</p>
      
      <p>Hai richiesto il reset della tua password per EDG Platform.</p>
      
      <p>Clicca sul pulsante qui sotto per reimpostare la tua password:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      
      <p>Oppure copia e incolla questo link nel tuo browser:</p>
      <p class="code">${resetUrl}</p>
      
      <div class="warning">
        <strong>⚠️ Importante:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>Questo link scadrà tra <strong>${expiryMinutes} minuti</strong></li>
          <li>Se non hai richiesto tu questo reset, ignora questa email</li>
          <li>Non condividere mai questo link con nessuno</li>
        </ul>
      </div>
    </div>
    
    <div class="footer">
      <p>Questa è una email automatica, non rispondere a questo messaggio.</p>
      <p>© ${new Date().getFullYear()} EDG Platform. Tutti i diritti riservati.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Versione testuale per client email che non supportano HTML
   */
  private getPasswordResetTextVersion(resetUrl: string, expiryMinutes: number): string {
    return `
Reset Password - EDG Platform

Ciao,

Hai richiesto il reset della tua password per EDG Platform.

Clicca sul link qui sotto per reimpostare la tua password:
${resetUrl}

IMPORTANTE:
- Questo link scadrà tra ${expiryMinutes} minuti
- Se non hai richiesto tu questo reset, ignora questa email
- Non condividere mai questo link con nessuno

Questa è una email automatica, non rispondere a questo messaggio.

© ${new Date().getFullYear()} EDG Platform. Tutti i diritti riservati.
    `.trim();
  }
}

// Singleton instance
export const emailService = new EmailService();

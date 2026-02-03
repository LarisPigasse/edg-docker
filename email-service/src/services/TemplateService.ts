// src/services/TemplateService.ts

import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { EmailTemplate, AlertSeverity } from '../types/email.types';

/**
 * TEMPLATE SERVICE
 * 
 * Gestisce il caricamento e la compilazione dei template email usando Handlebars.
 * I template sono file HTML/TXT separati nella cartella src/templates/
 */
export class TemplateService {
  private templateCache: Map<string, { html: HandlebarsTemplateDelegate; text: HandlebarsTemplateDelegate }> =
    new Map();
  private templatesDir: string;

  constructor() {
    // Path assoluto alla directory templates
    this.templatesDir = path.join(__dirname, '../templates');
    
    // Registra helper Handlebars personalizzati
    this.registerHelpers();
    
    // Pre-carica tutti i template all'avvio
    this.preloadTemplates();
  }

  /**
   * Genera email da template
   */
  generate(template: EmailTemplate, data: Record<string, any>): { html: string; text: string } {
    const compiled = this.templateCache.get(template);

    if (!compiled) {
      throw new Error(`Template non trovato: ${template}`);
    }

    // Aggiungi anno corrente ai dati (per footer copyright)
    const templateData: Record<string, any> = {
      ...data,
      year: new Date().getFullYear(),
      timestamp: new Date().toLocaleString('it-IT', {
        timeZone: 'Europe/Rome',
        dateStyle: 'medium',
        timeStyle: 'medium',
      }),
    };

    // Aggiungi dati specifici per severity (alert)
    if ('severity' in data) {
      templateData.severityColor = this.getSeverityColor(data.severity as AlertSeverity);
    }

    // Compila template con dati
    const html = compiled.html(templateData);
    const text = compiled.text(templateData);

    return { html, text };
  }

  /**
   * Pre-carica tutti i template all'avvio per performance
   */
  private preloadTemplates(): void {
    const templates: EmailTemplate[] = [
      'auth/password-reset',
      'auth/email-verification',
      'auth/welcome',
      'alerts/security-alert',
      'alerts/system-error',
    ];

    templates.forEach((template) => {
      try {
        this.loadTemplate(template);
        console.log(`✅ [TEMPLATE] Template caricato: ${template}`);
      } catch (error) {
        console.error(`❌ [TEMPLATE] Errore caricamento template ${template}:`, error);
        throw error;
      }
    });

    console.log(`✅ [TEMPLATE] ${templates.length} template caricati con successo`);
  }

  /**
   * Carica e compila un template da file
   */
  private loadTemplate(template: EmailTemplate): void {
    // Percorsi file HTML e TXT
    const htmlPath = path.join(this.templatesDir, `${template}.html`);
    const textPath = path.join(this.templatesDir, `${template}.txt`);

    // Verifica che i file esistano
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`Template HTML non trovato: ${htmlPath}`);
    }

    if (!fs.existsSync(textPath)) {
      throw new Error(`Template TXT non trovato: ${textPath}`);
    }

    // Leggi contenuto file
    const htmlSource = fs.readFileSync(htmlPath, 'utf-8');
    const textSource = fs.readFileSync(textPath, 'utf-8');

    // Compila template con Handlebars
    const htmlTemplate = Handlebars.compile(htmlSource);
    const textTemplate = Handlebars.compile(textSource);

    // Salva in cache
    this.templateCache.set(template, {
      html: htmlTemplate,
      text: textTemplate,
    });
  }

  /**
   * Registra helper Handlebars personalizzati
   */
  private registerHelpers(): void {
    // Helper per formattare date
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return date.toLocaleString('it-IT', {
        timeZone: 'Europe/Rome',
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
    });

    // Helper per uppercase
    Handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Helper per lowercase
    Handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });
  }

  /**
   * Ottieni colore per livello severity
   */
  private getSeverityColor(severity: AlertSeverity): string {
    const colors = {
      info: '#17a2b8',
      warning: '#ffc107',
      critical: '#dc3545',
    };

    return colors[severity] || colors.info;
  }

  /**
   * Ottieni lista template disponibili
   */
  getAvailableTemplates(): EmailTemplate[] {
    return Array.from(this.templateCache.keys()) as EmailTemplate[];
  }

  /**
   * Reload template (utile per hot-reload in sviluppo)
   */
  reloadTemplate(template: EmailTemplate): void {
    this.templateCache.delete(template);
    this.loadTemplate(template);
    console.log(`🔄 [TEMPLATE] Template ricaricato: ${template}`);
  }

  /**
   * Reload tutti i template
   */
  reloadAllTemplates(): void {
    this.templateCache.clear();
    this.preloadTemplates();
    console.log('🔄 [TEMPLATE] Tutti i template ricaricati');
  }
}

// Singleton
export const templateService = new TemplateService();

// src/routes/email.routes.ts

import { Router } from 'express';
import { emailController } from '../controllers/EmailController';

const router = Router();

/**
 * POST /email/send
 * Invia email usando un template
 * 
 * Body:
 * {
 *   "to": "user@example.com",
 *   "subject": "Reset Password",
 *   "template": "auth/password-reset",
 *   "data": {
 *     "resetUrl": "https://...",
 *     "expiryMinutes": 60
 *   }
 * }
 */
router.post('/send', (req, res) => emailController.send(req, res));

/**
 * POST /email/alert
 * Invia alert di sicurezza agli amministratori
 * 
 * Body:
 * {
 *   "title": "Security Breach",
 *   "message": "Unauthorized access detected",
 *   "severity": "critical",
 *   "metadata": { ... }
 * }
 */
router.post('/alert', (req, res) => emailController.sendAlert(req, res));

/**
 * GET /email/health
 * Health check del servizio
 */
router.get('/health', (req, res) => emailController.health(req, res));

/**
 * GET /email/templates
 * Lista template disponibili
 */
router.get('/templates', (req, res) => emailController.listTemplates(req, res));

export default router;

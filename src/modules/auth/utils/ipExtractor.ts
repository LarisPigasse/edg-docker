// src/modules/auth/utils/ipExtractor.ts
import { Request } from 'express';

/**
 * Estrae l'IP reale del client dalla richiesta.
 * Controlla prima gli header impostati dal gateway/proxy,
 * poi fallback su req.ip
 */
export function extractClientIp(req: Request): string | undefined {
  // 1. Controlla X-Real-IP (impostato dal gateway)
  const xRealIp = req.headers['x-real-ip'];
  if (xRealIp && typeof xRealIp === 'string') {
    return xRealIp.trim();
  }

  // 2. Controlla X-Forwarded-For (primo IP nella lista)
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const ips = (typeof xForwardedFor === 'string' ? xForwardedFor : xForwardedFor[0])
      .split(',')
      .map(ip => ip.trim());
    if (ips[0]) {
      return ips[0];
    }
  }

  // 3. Fallback su req.ip (connessione diretta)
  return req.ip;
}

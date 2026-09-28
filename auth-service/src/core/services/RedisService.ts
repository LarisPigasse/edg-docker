// src/core/services/RedisService.ts

import Redis from 'ioredis';

/**
 * Servizio Redis per la gestione della blacklist account.
 *
 * Quando un account viene disattivato, il suo accountId viene inserito
 * in Redis con un TTL pari alla durata dell'access token. Il gateway e
 * l'authMiddleware controllano questa blacklist dopo la validazione JWT
 * per bloccare immediatamente l'accesso senza attendere la scadenza del token.
 *
 * Pattern chiave: `blocked:{accountId}` → valore `1`, TTL = JWT_ACCESS_EXPIRY
 */

class RedisService {
  private client: Redis | null = null;
  private connected = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn('⚠️  [Redis] REDIS_URL non configurato — blacklist disabilitata');
      return;
    }

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    this.client.on('connect', () => {
      this.connected = true;
      console.log('✅ [Redis] Connesso');
    });

    this.client.on('error', err => {
      this.connected = false;
      console.error('❌ [Redis] Errore connessione:', err.message);
    });

    this.client.on('close', () => {
      this.connected = false;
    });
  }

  /**
   * Converte la stringa di durata JWT (es. "15m", "1h", "7d") in secondi.
   */
  private parseTTL(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900; // fallback: 15 minuti
    }
  }

  /**
   * Aggiunge un account alla blacklist.
   * TTL = durata access token (da env JWT_ACCESS_EXPIRY).
   */
  async blockAccount(accountId: number): Promise<void> {
    if (!this.client || !this.connected) return;
    const ttl = this.parseTTL(process.env.JWT_ACCESS_EXPIRY || '15m');
    await this.client.setex(`blocked:${accountId}`, ttl, '1');
    console.log(`🔒 [Redis] Account ${accountId} bloccato per ${ttl}s`);
  }

  /**
   * Rimuove un account dalla blacklist (usato alla riattivazione).
   */
  async unblockAccount(accountId: number): Promise<void> {
    if (!this.client || !this.connected) return;
    await this.client.del(`blocked:${accountId}`);
    console.log(`🔓 [Redis] Account ${accountId} rimosso dalla blacklist`);
  }

  /**
   * Verifica se un account è nella blacklist.
   */
  async isAccountBlocked(accountId: number): Promise<boolean> {
    if (!this.client || !this.connected) return false;
    const result = await this.client.get(`blocked:${accountId}`);
    return result === '1';
  }

  /**
   * Aggiunge una sessione specifica alla blacklist.
   * TTL = durata access token.
   */
  async blockSession(sessionId: number): Promise<void> {
    if (!this.client || !this.connected) return;
    const ttl = this.parseTTL(process.env.JWT_ACCESS_EXPIRY || '15m');
    await this.client.setex(`blocked:session:${sessionId}`, ttl, '1');
    console.log(`🔒 [Redis] Sessione ${sessionId} bloccata per ${ttl}s`);
  }

  /**
   * Verifica se una sessione specifica è nella blacklist.
   */
  async isSessionBlocked(sessionId: number): Promise<boolean> {
    if (!this.client || !this.connected) return false;
    const result = await this.client.get(`blocked:session:${sessionId}`);
    return result === '1';
  }

  /**
   * Verifica se Redis è disponibile.
   */
  isAvailable(): boolean {
    return this.connected && this.client !== null;
  }
}

// Singleton — unica istanza condivisa in tutta l'applicazione
export const redisService = new RedisService();
export default redisService;

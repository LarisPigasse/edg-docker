// middleware/resilientRateLimitStore.js
//
// Store per express-rate-limit condiviso fra le due istanze del gateway
// tramite Redis, con ripiego automatico in memoria (ADR040).
//
// Perche': con lo store in memoria di default ogni istanza conta per conto
// suo — con due gateway in HA il limite anti brute-force su /auth vale di
// fatto quasi il doppio e non e' coerente. In Redis il contatore e' unico.
//
// Garanzia richiesta: se Redis non funziona NON si crea alcun problema.
//  - Redis non connesso      -> si usa subito il MemoryStore locale (come prima)
//  - Redis lento o in errore -> il comando scade (commandTimeout del client) e
//                               la stessa richiesta viene contata in memoria
//  - nessuna richiesta viene mai bloccata o rallentata a causa di Redis
// Nel peggiore dei casi si torna esattamente al comportamento precedente
// (limite per singola istanza), mai a un limite assente o a un errore.
//
// Contatore a finestra fissa: INCR + PTTL in un'unica transazione; la
// scadenza (windowMs) si imposta al primo colpo della finestra.
const { MemoryStore } = require('express-rate-limit');

class ResilientRateLimitStore {
  /**
   * @param {{ client: import('ioredis').Redis | null, prefix?: string }} opts
   */
  constructor({ client, prefix = 'rl:' }) {
    this.client = client;
    this.prefix = prefix;
    this.fallback = new MemoryStore();
    // I contatori in Redis sono condivisi fra le istanze del gateway
    this.localKeys = false;
    this.usingFallback = false;
  }

  init(options) {
    this.windowMs = options.windowMs;
    this.fallback.init(options);
  }

  redisReady() {
    return !!this.client && this.client.status === 'ready';
  }

  /** Registra (una sola volta per cambio di stato) il passaggio fra Redis e memoria */
  switchTo(fallback, reason) {
    if (this.usingFallback === fallback) return;
    this.usingFallback = fallback;
    if (fallback) console.warn(`⚠️  [RateLimit] Redis non disponibile (${reason}): limite in memoria locale`);
    else console.log('✅ [RateLimit] Limite condiviso su Redis');
  }

  async increment(key) {
    if (this.redisReady()) {
      try {
        const k = this.prefix + key;
        const [[incrErr, hits], [ttlErr, ttl]] = await this.client.multi().incr(k).pttl(k).exec();
        if (incrErr || ttlErr) throw incrErr || ttlErr;

        let remainingMs = ttl;
        if (remainingMs < 0) {
          // Primo colpo della finestra: fissa la scadenza
          await this.client.pexpire(k, this.windowMs);
          remainingMs = this.windowMs;
        }
        this.switchTo(false);
        return { totalHits: hits, resetTime: new Date(Date.now() + remainingMs) };
      } catch (err) {
        this.switchTo(true, err.message);
      }
    } else {
      this.switchTo(true, `stato ${this.client ? this.client.status : 'assente'}`);
    }
    return this.fallback.increment(key);
  }

  async decrement(key) {
    if (this.redisReady()) {
      try {
        await this.client.decr(this.prefix + key);
        return;
      } catch {
        /* ripiego sotto */
      }
    }
    await this.fallback.decrement(key);
  }

  async resetKey(key) {
    if (this.redisReady()) {
      try {
        await this.client.del(this.prefix + key);
      } catch {
        /* ignorato: la chiave scade comunque da sola */
      }
    }
    await this.fallback.resetKey(key);
  }
}

module.exports = { ResilientRateLimitStore };

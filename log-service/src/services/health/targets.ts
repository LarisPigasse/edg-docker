// src/services/health/targets.ts
//
// Servizi osservati dall'HealthMonitor (ADR038), raggruppati come nella
// scheda "Salute" della pagina SISTEMA → Info. Host e URL sono i nomi dei
// container sulla rete Docker "internal", sovrascrivibili via env.
//
// Traefik non e' nell'elenco: vive solo sulla rete "external" e log-service
// non lo raggiunge. Un Traefik fermo si manifesta comunque come frontend
// irraggiungibile; i gateway dietro di lui sono invece osservati qui.
import { httpProbe, mongoProbe, mysqlProbe, postgresProbe, redisProbe, ProbeResult } from './probes';

export type HealthGroup = 'gateway' | 'service' | 'database';

export interface HealthTarget {
  id: string;
  name: string;
  group: HealthGroup;
  probe: () => Promise<ProbeResult>;
}

const env = (key: string, fallback: string) => process.env[key] || fallback;

export const HEALTH_TARGETS: HealthTarget[] = [
  // Gateway (HA: due istanze)
  { id: 'api-gateway-1', name: 'API Gateway 1', group: 'gateway',
    probe: () => httpProbe(`${env('GATEWAY_1_URL', 'http://api-gateway-1:8080')}/health`) },
  { id: 'api-gateway-2', name: 'API Gateway 2', group: 'gateway',
    probe: () => httpProbe(`${env('GATEWAY_2_URL', 'http://api-gateway-2:8080')}/health`) },

  // Microservizi
  { id: 'auth-service', name: 'Auth Service', group: 'service',
    probe: () => httpProbe(`${env('AUTH_SERVICE_URL', 'http://auth-service:3001')}/health`) },
  { id: 'system-service', name: 'System Service', group: 'service',
    probe: () => httpProbe(`${env('SYSTEM_SERVICE_URL', 'http://system-service:3004')}/health`) },
  { id: 'vehicle-service', name: 'Vehicle Service', group: 'service',
    probe: () => httpProbe(`${env('VEHICLE_SERVICE_URL', 'http://vehicle-service:3003')}/health`) },
  { id: 'email-service', name: 'Email Service', group: 'service',
    probe: () => httpProbe(`${env('EMAIL_SERVICE_URL', 'http://email-service:3002')}/health`) },

  // Database
  { id: 'mongodb', name: 'MongoDB (log)', group: 'database', probe: mongoProbe },
  { id: 'mysql', name: 'MySQL (auth)', group: 'database',
    probe: () => mysqlProbe(env('MYSQL_HOST', 'auth-mysql')) },
  { id: 'postgres', name: 'PostgreSQL', group: 'database',
    probe: () => postgresProbe(env('POSTGRES_HOST', 'edg-postgres')) },
  { id: 'redis', name: 'Redis', group: 'database',
    probe: () => redisProbe(env('REDIS_HOST', 'edg-redis')) },
];

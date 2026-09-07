// src/features/system/api/systemApi.ts

const LOG_SERVICE_URL = import.meta.env.VITE_LOG_SERVICE_URL ?? '';

export type ServiceStatus = 'UP' | 'DOWN' | 'DEGRADED';

export interface ServiceHealth {
  id:           string;
  name:         string;
  status:       ServiceStatus;
  responseTime: number | null;
  error?:       string;
  checkedAt:    string;
}

export interface SystemStats {
  logs24h:      number;
  critici24h:   number;
  errori24h:    number;
  alertRules:   number;
  alertsWeek:   number;
  alertsFailed: number;
}

export interface LastAlert {
  _id:       string;
  ruleName:  string;
  sentTo:    string;
  status:    'SENT' | 'FAILED';
  createdAt: string;
}

export interface SystemHealthData {
  services:    ServiceHealth[];
  stats:       SystemStats;
  lastAlert:   LastAlert | null;
  generatedAt: string;
}

export const systemApi = {
  async getHealth(): Promise<SystemHealthData> {
    const response = await fetch(`${LOG_SERVICE_URL}/api/system/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.data as SystemHealthData;
  },
};

export default systemApi;

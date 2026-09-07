import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { ProxyOptions } from 'vite';
import type { ClientRequest } from 'http';
import path from 'path';

/**
 * VIGILO (servizio: asset-frontend) — configurazione Vite
 *
 * Porte dei frontend EDG (girano sull'host, non in docker-compose):
 *   pro-frontend   → 5173   app-frontend   → 5174
 *   edg-frontend   → 5175   asset-frontend → 5176  ← questo progetto
 *
 * ─── Perché il proxy ────────────────────────────────────────────────────────
 * VITE_API_URL / VITE_API_BASE_URL sono vuote (.env.development): il codice
 * produce URL relativi (`/auth/login`, `/api/…`) che il browser invia alla
 * stessa origine del dev server. È questo proxy a inoltrarli a Traefik, che
 * bilancia i due API Gateway.
 *
 * ─── Perché si rimuove l'header Origin ──────────────────────────────────────
 * Anche per una richiesta same-origin il browser invia `Origin` su POST/PUT/
 * DELETE. Il proxy la inoltrerebbe tale e quale al gateway, che applica il
 * middleware CORS su /auth e rifiuta ogni origine non elencata in
 * CORS_ORIGINS — dove `http://localhost:5176` non c'è. Il rifiuto arriva come
 * pagina HTML di errore di Express, che il frontend prova a leggere come JSON:
 * è l'errore «Unexpected token '<', "<!DOCTYPE"… is not valid JSON».
 *
 * Dopo il proxy la richiesta è però server-to-server e un Origin di browser non
 * ha più senso: togliendolo si imbocca il ramo che il gateway prevede già per
 * le chiamate interne (`if (!origin) return callback(null, true)`).
 *
 * In alternativa si può aggiungere `http://localhost:5176` a CORS_ORIGINS nel
 * docker-compose e valorizzare VITE_API_URL=http://localhost: questo template
 * funziona in entrambi i modi, ma così com'è non richiede modifiche alla
 * piattaforma.
 */

/**
 * L'header Origin del browser non deve sopravvivere al proxy: oltre il salto
 * la richiesta è server-to-server. Rimosso anche Referer, per coerenza.
 */
const stripBrowserOrigin: ProxyOptions['configure'] = proxy => {
  proxy.on('proxyReq', (proxyReq: ClientRequest) => {
    proxyReq.removeHeader('origin');
    proxyReq.removeHeader('referer');
  });
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  /** Entry point della piattaforma: Traefik su :80, load balancer dei gateway. */
  const platformTarget = env.VITE_PROXY_TARGET || 'http://localhost';

  /** Log service: esposto direttamente sull'host. */
  const logServiceTarget = env.VITE_PROXY_LOG_TARGET || 'http://localhost:4001';

  return {
    plugins: [react(), tailwindcss()],

    server: {
      host: '0.0.0.0',
      port: 5176,
      strictPort: true,
      watch: {
        usePolling: true,
        interval: 1000,
      },
      // HMR: lascia che Vite usi l'host della richiesta automaticamente
      hmr: true,
      allowedHosts: ['asset.edg.local', 'asset-frontend', 'localhost', '.localhost', 'api-gateway', 'host.docker.internal'],
      headers: {
        'Cache-Control': 'no-cache',
      },
      proxy: {
        // Autenticazione e account → auth-service via gateway
        '/auth': {
          target: platformTarget,
          changeOrigin: true,
          secure: false,
          configure: stripBrowserOrigin,
        },
        // API applicative → microservizi via gateway
        '/api': {
          target: platformTarget,
          changeOrigin: true,
          secure: false,
          configure: stripBrowserOrigin,
        },
        // Log service: non passa dal gateway.
        // VITE_LOG_SERVICE_URL=/log-api → qui si toglie il prefisso.
        '/log-api': {
          target: logServiceTarget,
          changeOrigin: true,
          secure: false,
          configure: stripBrowserOrigin,
          rewrite: p => p.replace(/^\/log-api/, ''),
        },
      },
    },

    resolve: {
      alias: {
        // Alias unico del progetto — rispecchia "paths" in config/typescript/tsconfig.app.json
        '@': path.resolve(__dirname, './src'),
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      chunkSizeWarningLimit: 1000,
    },

    preview: {
      port: 5176,
      strictPort: true,
    },
  };
});

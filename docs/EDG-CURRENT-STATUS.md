EDG PLATFORM - STATO CORRENTE E ROADMAP
Versione: 2.1.0
Data: 22 Ottobre 2025
Stato: ✅ Production-Ready (Base Funzionante)

📋 INDICE
Panoramica Sistema

Architettura Implementata

Stack Tecnologico

Struttura Progetto

Configurazione Completa

Problemi Risolti

Stato Componenti

Prossimi Step

Comandi Utili

Riferimenti Documentazione

1. PANORAMICA SISTEMA
   Obiettivo del Progetto
   Creare una piattaforma microservizi completa con:

3 portali web separati (Operatori, Clienti, Partner)

Backend API con autenticazione JWT e RBAC

Logging centralizzato

API Gateway unico per routing subdomain

Architettura production-ready

Stato Attuale
✅ Completato e Funzionante:

Backend Auth Service (Express.js + TypeScript + MySQL)

Backend Log Service (Express.js + MongoDB)

API Gateway con routing subdomain

Pro Frontend (React 18 + Vite 6 + Tailwind CSS)

Docker Compose orchestration

File hosts configurati per sviluppo locale

⏳ Da Implementare:

App Frontend (per clienti)

EDG Frontend (per partner)

Login UI e autenticazione frontend

Dashboard e routing protetto

Integrazione completa API frontend/backend

2. ARCHITETTURA IMPLEMENTATA
   Architettura High-Level
   text
   Internet/Browser
   │
   └─→ http://localhost/ (porta 80)
   http://pro.edg.local/
   http://app.edg.local/ (future)
   http://edg.edg.local/ (future)
   │
   └─→ API Gateway (Express.js, porta 8080 interno)
   │
   ├─→ /auth/_ → Auth Service (porta 3001)
   │ └─→ MySQL (porta 3306)
   │
   ├─→ /log/_ → Log Service (porta 3002)
   │ └─→ MongoDB (porta 27017)
   │
   └─→ /\* → Frontend Services
   ├─→ pro.edg.local → Pro Frontend (porta 5173)
   ├─→ app.edg.local → App Frontend (porta 5174) [da creare]
   └─→ edg.edg.local → EDG Frontend (porta 5175) [da creare]
   Pattern Architetturale
   BFF (Backend For Frontend):

Tutti i frontend passano attraverso il gateway

Gateway gestisce routing subdomain-based

Nessun CORS issue (same-origin)

WebSocket per HMR (Hot Module Replacement)

3. STACK TECNOLOGICO
   Backend
   Componente Tecnologia Versione Porta
   Auth Service Express.js + TypeScript 4.18.2 3001
   Log Service Express.js + JavaScript 4.18.2 3002
   API Gateway Express.js + http-proxy-middleware 4.18.2 8080 (80 external)
   Database Auth MySQL 8.0 3306
   Database Log MongoDB 7.0 27017
   Container Docker + Docker Compose Latest -
   Frontend
   Componente Tecnologia Versione Porta
   Framework React 18.3.1 -
   Build Tool Vite 6.0.1 5173
   Styling Tailwind CSS 4.0.0-beta.6 -
   Language TypeScript 5.6.2 -
   Autenticazione
   JWT (Access + Refresh tokens)

RBAC (Role-Based Access Control)

Deny-First Logic per permessi

Bcrypt per hash password

Cookie-based refresh tokens

4. STRUTTURA PROGETTO
   text
   edg-docker/
   │
   ├── auth-service/ # Servizio autenticazione
   │ ├── src/
   │ │ ├── controllers/ # Login, register, RBAC
   │ │ ├── middleware/ # JWT verification, RBAC check
   │ │ ├── models/ # User, Role, Permission (Sequelize)
   │ │ ├── routes/ # API routes
   │ │ ├── utils/ # JWT, bcrypt helpers
   │ │ └── server.ts # Entry point
   │ ├── scripts/
   │ │ └── roles.seed.ts # Seed ruoli base (Admin, User, Guest)
   │ ├── Dockerfile
   │ ├── package.json
   │ └── tsconfig.json
   │
   ├── log-service/ # Servizio logging centralizzato
   │ ├── src/
   │ │ ├── models/ # Log schema (MongoDB)
   │ │ ├── routes/ # API logs
   │ │ └── server.js
   │ ├── Dockerfile
   │ └── package.json
   │
   ├── api-gateway/ # Gateway API con routing subdomain
   │ ├── gateway.js # Express proxy con routing dinamico
   │ ├── Dockerfile
   │ └── package.json
   │
   ├── pro-frontend/ # Frontend operatori (React)
   │ ├── config/
   │ │ └── vite.config.ts # Vite config (porta 5173)
   │ ├── src/
   │ │ ├── components/ # React components (da organizzare)
   │ │ ├── App.tsx
   │ │ └── main.tsx
   │ ├── public/
   │ ├── Dockerfile
   │ ├── package.json
   │ └── tsconfig.json
   │
   ├── app-frontend/ # Frontend clienti [DA CREARE]
   │ └── (duplica da pro-frontend, cambia porta 5174)
   │
   ├── edg-frontend/ # Frontend partner [DA CREARE]
   │ └── (duplica da pro-frontend, cambia porta 5175)
   │
   ├── docker-compose.yml # Orchestrazione completa
   ├── .env # Variabili ambiente
   │
   └── docs/ # Documentazione completa
   ├── EDG-PLATFORM-DOCUMENTATION.md
   ├── EDG-API-REFERENCE.md
   ├── TESTING-GUIDE.md
   ├── RBAC-SYSTEM.md
   └── ... (altri docs)
5. CONFIGURAZIONE COMPLETA
   5.1 File Hosts (Windows/Mac/Linux)
   Percorso:

Windows: C:\Windows\System32\drivers\etc\hosts

Mac/Linux: /etc/hosts

Contenuto:

text

# EDG Platform - Development Environment

127.0.0.1 pro.edg.local
127.0.0.1 app.edg.local
127.0.0.1 edg.edg.local
127.0.0.1 api.edg.local
127.0.0.1 edg.local
5.2 Docker Compose (.env)
File: edg-docker/.env

bash

# Node Environment

NODE_ENV=development

# MySQL (Auth Service)

MYSQL_ROOT_PASSWORD=root_password_changeme
MYSQL_DATABASE=edg_auth
MYSQL_USER=edg_user
MYSQL_PASSWORD=edg_password_changeme

# MongoDB (Log Service)

MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=admin_password_changeme
MONGO_DATABASE=edg_logs

# JWT Secrets (CAMBIA IN PRODUZIONE!)

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Service Ports

AUTH_PORT=3001
LOG_PORT=3002

# Log Service API Key

LOG_SERVICE_API_KEY=your-log-service-api-key-change-in-production
5.3 API Gateway Config
File: api-gateway/gateway.js

Configurazione Chiave:

javascript
const PORT = parseInt(process.env.PORT || '8080', 10);

// ✅ CRUCIALE: Ascolta su 0.0.0.0 per tutte le interfacce
const server = app.listen(PORT, '0.0.0.0', () => {
console.log(`🎧 Listening on:      0.0.0.0:${PORT}`);
});

// Multi-frontend routing
const FRONTENDS = {
pro: {
url: 'http://pro-frontend:5173',
subdomains: ['pro.edg.local', 'pro.edgdominio.com'],
name: 'Pro (Operators)',
},
app: {
url: 'http://app-frontend:5174',
subdomains: ['app.edg.local', 'app.edgdominio.com'],
name: 'App (Clients)',
},
edg: {
url: 'http://edg-frontend:5175',
subdomains: ['edg.edg.local', 'edg.edgdominio.com'],
name: 'EDG (Partners)',
},
};
Variabili Ambiente docker-compose.yml:

text
api-gateway:
environment:
PORT: 8080 # ✅ IMPORTANTE: 8080, non 80!
AUTH_SERVICE_URL: http://auth-service:3001
LOG_SERVICE_URL: http://log-service:3002
FRONTEND_PRO_URL: http://pro-frontend:5173
FRONTEND_APP_URL: http://app-frontend:5174
FRONTEND_EDG_URL: http://edg-frontend:5175
ports: - '80:8080' # ✅ Host 80 → Container 8080
5.4 Vite Frontend Config
File: pro-frontend/config/vite.config.ts

typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
plugins: [react(), tailwindcss()],

server: {
host: '0.0.0.0',
port: 5173, // Pro: 5173, App: 5174, EDG: 5175
strictPort: true,
allowedHosts: [
'pro-frontend',
'pro.edg.local',
'localhost',
'api-gateway',
],
watch: {
usePolling: true,
interval: 1000,
},
hmr: {
clientPort: 5173,
},
},

resolve: {
alias: {
'@': path.resolve(**dirname, '../src'),
'@components': path.resolve(**dirname, '../src/components'),
'@utils': path.resolve(**dirname, '../src/utils'),
'@types': path.resolve(**dirname, '../src/types'),
},
},

build: {
outDir: 'dist',
sourcemap: false,
minify: 'esbuild',
},
}); 6. PROBLEMI RISOLTI
Problema 1: ERR_EMPTY_RESPONSE su Subdomain
Sintomo: http://pro.edg.local ritornava ERR_EMPTY_RESPONSE

Causa:

Container gateway unhealthy

Node.js non ascoltava sulla porta

Variabile PORT=80 invece di PORT=8080

Porta 80 è privilegiata (<1024) e richiede root

Soluzione:

javascript
// gateway.js
const server = app.listen(PORT, '0.0.0.0', () => { ... });
text

# docker-compose.yml

api-gateway:
environment:
PORT: 8080 # ✅ Non 80!
ports: - '80:8080'
Problema 2: Healthcheck Falliva
Sintomo: Container unhealthy anche se Node.js girava

Causa: Healthcheck usava porta sbagliata o Node non ascoltava su 0.0.0.0

Soluzione:

text
healthcheck:
test: ['CMD-SHELL', 'wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1']

# ^^^^ Porta interna container

start_period: 20s
Problema 3: Hot Reload Non Funzionava
Sintomo: Modifiche frontend non si aggiornavan automaticamente

Soluzione:

Gateway con proxy WebSocket:

javascript
server.on('upgrade', (req, socket, head) => {
const frontend = getFrontendByHostname(hostname);
wsProxy.upgrade(req, socket, head);
});
Vite config con watch.usePolling: true per Docker

7. STATO COMPONENTI
   ✅ Completati e Funzionanti
   Componente Versione Status Note
   MySQL Database 8.0 ✅ Healthy Port 3306
   MongoDB Database 7.0 ✅ Healthy Port 27017
   Auth Service 2.0 ✅ Healthy JWT + RBAC completo
   Log Service 2.0 ✅ Healthy Logging centralizzato
   API Gateway 2.1 ✅ Healthy Routing subdomain ready
   Pro Frontend 1.0 ✅ Running Hot reload attivo
   Docker Orchestration - ✅ Working Tutti i servizi up
   File Hosts Config - ✅ Configured Subdomain locali attivi
   ⏳ Da Creare
   Componente Priorità Effort Note
   App Frontend (Clienti) 🔴 Alta 1h Duplica da pro-frontend, porta 5174
   EDG Frontend (Partner) 🔴 Alta 1h Duplica da pro-frontend, porta 5175
   Login UI 🔴 Alta 3h Form + integrazione /auth/login
   Dashboard Layout 🟡 Media 4h Layout base + routing
   Auth Context 🔴 Alta 2h Context API per auth state
   Protected Routes 🔴 Alta 2h React Router guards
   API Service Layer 🟡 Media 3h Axios wrapper + error handling
   User Profile Page 🟢 Bassa 2h Display user info
   Role Management UI 🟢 Bassa 6h Admin panel per RBAC
8. PROSSIMI STEP
   Fase 1: Setup Multi-Frontend (1-2 ore)
   Obiettivo: Avere 3 frontend operativi con routing subdomain

Step 1.1: Duplica Frontend
bash
cd edg-docker

# Crea app-frontend (clienti)

cp -r pro-frontend app-frontend

# Crea edg-frontend (partner)

cp -r pro-frontend edg-frontend
Step 1.2: Modifica Porte Vite
app-frontend/config/vite.config.ts:

typescript
server: {
port: 5174, // ← Cambia da 5173
allowedHosts: ['app-frontend', 'app.edg.local', 'localhost', 'api-gateway'],
hmr: { clientPort: 5174 },
}
edg-frontend/config/vite.config.ts:

typescript
server: {
port: 5175, // ← Cambia da 5173
allowedHosts: ['edg-frontend', 'edg.edg.local', 'localhost', 'api-gateway'],
hmr: { clientPort: 5175 },
}
Step 1.3: Aggiorna docker-compose.yml
Aggiungi sezioni per app-frontend e edg-frontend (similari a pro-frontend)

Step 1.4: Test
bash
docker-compose build
docker-compose up -d
Verifica:

http://pro.edg.local → Pro Frontend

http://app.edg.local → App Frontend

http://edg.edg.local → EDG Frontend

Fase 2: Implementazione Login (3-4 ore)
Obiettivo: Login funzionante con JWT

Step 2.1: Auth Service Layer
File: pro-frontend/src/services/authService.ts

typescript
export const authService = {
async login(email: string, password: string) {
const response = await fetch('/auth/login', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ email, password }),
});

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();

},

async getProfile(token: string) {
const response = await fetch('/auth/me', {
headers: { 'Authorization': `Bearer ${token}` },
});
return response.json();
},

async refreshToken() {
const response = await fetch('/auth/refresh', {
method: 'POST',
credentials: 'include', // Invia cookie refresh
});
return response.json();
},
};
Step 2.2: Auth Context
File: pro-frontend/src/contexts/AuthContext.tsx

typescript
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface User {
id: number;
email: string;
username: string;
roles: string[];
}

interface AuthContextType {
user: User | null;
token: string | null;
isAuthenticated: boolean;
login: (email: string, password: string) => Promise<void>;
logout: () => void;
loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
const [user, setUser] = useState<User | null>(null);
const [token, setToken] = useState<string | null>(
localStorage.getItem('accessToken')
);
const [loading, setLoading] = useState(true);

useEffect(() => {
if (token) {
authService.getProfile(token)
.then(setUser)
.catch(() => {
localStorage.removeItem('accessToken');
setToken(null);
})
.finally(() => setLoading(false));
} else {
setLoading(false);
}
}, [token]);

const login = async (email: string, password: string) => {
const data = await authService.login(email, password);
setToken(data.accessToken);
localStorage.setItem('accessToken', data.accessToken);
setUser(data.user);
};

const logout = () => {
setToken(null);
setUser(null);
localStorage.removeItem('accessToken');
};

return (
<AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout, loading }}>
{children}
</AuthContext.Provider>
);
}

export const useAuth = () => {
const context = useContext(AuthContext);
if (!context) throw new Error('useAuth must be used within AuthProvider');
return context;
};
Step 2.3: Login Page
File: pro-frontend/src/pages/LoginPage.tsx

typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const { login } = useAuth();
const navigate = useNavigate();

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }

};

return (
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
<div className="bg-white p-8 rounded-lg shadow-xl w-96">
<h1 className="text-3xl font-bold text-center mb-6">EDG Platform</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>

);
}
Step 2.4: Protected Route
File: pro-frontend/src/components/ProtectedRoute.tsx

typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
const { isAuthenticated, loading } = useAuth();

if (loading) {
return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}

if (!isAuthenticated) {
return <Navigate to="/login" replace />;
}

return <>{children}</>;
}
Step 2.5: Router Setup
File: pro-frontend/src/main.tsx

typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
<React.StrictMode>
<AuthProvider>
<BrowserRouter>
<Routes>
<Route path="/login" element={<LoginPage />} />
<Route
path="/dashboard"
element={
<ProtectedRoute>
<DashboardPage />
</ProtectedRoute>
}
/>
<Route path="/" element={<Navigate to="/dashboard" replace />} />
</Routes>
</BrowserRouter>
</AuthProvider>
</React.StrictMode>
);
Fase 3: Dashboard e Layout (4-5 ore)
Step 3.1: Layout Component
File: pro-frontend/src/components/Layout.tsx

typescript
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Layout({ children }: { children: React.ReactNode }) {
const { user, logout } = useAuth();
const navigate = useNavigate();

const handleLogout = () => {
logout();
navigate('/login');
};

return (
<div className="min-h-screen bg-gray-100">
<nav className="bg-white shadow-md">
<div className="container mx-auto px-4 py-3 flex justify-between items-center">
<h1 className="text-xl font-bold text-blue-600">EDG Platform</h1>

          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>

);
}
Step 3.2: Dashboard Page
File: pro-frontend/src/pages/DashboardPage.tsx

typescript
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

export function DashboardPage() {
const { user } = useAuth();

return (
<Layout>
<h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Benvenuto</h2>
          <p className="text-gray-600">{user?.username}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Ruoli</h2>
          <div className="flex gap-2">
            {user?.roles.map(role => (
              <span key={role} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {role}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Email</h2>
          <p className="text-gray-600">{user?.email}</p>
        </div>
      </div>
    </Layout>

);
} 9. COMANDI UTILI
Docker Management
bash

# Start tutti i servizi

docker-compose up -d

# Stop tutti i servizi

docker-compose down

# Rebuild specifico servizio

docker-compose build api-gateway
docker-compose build pro-frontend

# Restart specifico servizio

docker-compose restart api-gateway

# Logs real-time

docker-compose logs -f api-gateway
docker-compose logs -f pro-frontend

# Verifica status

docker-compose ps

# Entra in container

docker exec -it api-gateway sh
docker exec -it pro-frontend sh

# Rebuild completo senza cache

docker-compose build --no-cache
docker-compose up -d
Debugging
bash

# Verifica porta in ascolto

docker exec -it api-gateway netstat -tlnp | grep 8080

# Test health endpoint

docker exec -it api-gateway wget -O- http://localhost:8080/health

# Verifica processo Node

docker exec -it api-gateway ps aux | grep node

# Logs errori

docker-compose logs --tail=100 api-gateway | grep ERROR
Database
bash

# Accedi a MySQL

docker exec -it auth-mysql mysql -u edg_user -p

# Password: edg_password_changeme

# Accedi a MongoDB

docker exec -it log-mongodb mongosh -u admin -p

# Password: admin_password_changeme

# Backup MySQL

docker exec auth-mysql mysqldump -u edg_user -p edg_auth > backup.sql

# Restore MySQL

docker exec -i auth-mysql mysql -u edg_user -p edg_auth < backup.sql
Frontend Development
bash

# Installa nuove dipendenze

docker exec -it pro-frontend npm install react-router-dom

# Build production

docker exec -it pro-frontend npm run build

# Verifica build

docker exec -it pro-frontend ls -la dist/ 10. RIFERIMENTI DOCUMENTAZIONE
Documenti Esistenti
Documento Contenuto Path
EDG-PLATFORM-DOCUMENTATION.md Architettura completa, deployment, troubleshooting docs/
EDG-API-REFERENCE.md API endpoints Auth e Log services docs/
TESTING-GUIDE.md Test auth, RBAC, endpoints protetti docs/
RBAC-SYSTEM.md Sistema permessi, wildcards, deny-first docs/
RBAC-DENIALS.md Logica negazione permessi docs/
SEED-GUIDE.md Script seed ruoli base docs/
QUICK-START.md Quick start 10 minuti docs/
CHANGELOG.md Changelog versioni docs/
Link Utili
React Router: https://reactrouter.com/

Tailwind CSS: https://tailwindcss.com/

Vite: https://vitejs.dev/

Express.js: https://expressjs.com/

JWT: https://jwt.io/

Docker Compose: https://docs.docker.com/compose/

📊 METRICHE PROGETTO
Stato Avanzamento
Completato: 65%

Backend: 95% ✅

Frontend: 40% ⏳

DevOps: 100% ✅

Documentazione: 90% ✅

Tempo Stimato Completamento
Fase Tempo Priorità
Multi-frontend setup 2h 🔴 Alta
Login UI 3h 🔴 Alta
Dashboard base 4h 🔴 Alta
Protected routes 2h 🔴 Alta
User profile 2h 🟡 Media
Role management UI 6h 🟢 Bassa
TOTALE 19h -
🎯 PUNTI CHIAVE DA RICORDARE
Configurazione Critica
Porta Gateway: Sempre PORT: 8080 in docker-compose, non 80

Node Binding: Sempre app.listen(PORT, '0.0.0.0') per Docker

File Hosts: Necessario per subdomain locali

WebSocket: Gestito nel gateway per HMR Vite

Healthcheck: Usa porta interna container (8080), non esterna

Architettura Decisioni
Opzione A (Frontend dietro Gateway): Scelta finale per simulare produzione

Same-Origin: Frontend e API sullo stesso dominio, no CORS

Subdomain Routing: Basato su hostname, non su path

BFF Pattern: Gateway funge da Backend For Frontend

Problemi Comuni e Soluzioni
Problema Soluzione
ERR_EMPTY_RESPONSE Verifica PORT: 8080 e 0.0.0.0 binding
Container unhealthy Verifica healthcheck porta corretta
Hot reload non funziona Verifica WebSocket proxy e usePolling: true
CORS errors Verifica che frontend passi per gateway
Subdomain non funziona Verifica file hosts e cache DNS
📞 CONTATTI E SUPPORTO
Progetto: EDG Platform
Versione Documento: 2.1.0
Data Ultimo Aggiornamento: 22 Ottobre 2025

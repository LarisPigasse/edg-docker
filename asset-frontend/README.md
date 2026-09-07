# Vigilo

🛡️ **Scadenze, manutenzioni e controlli periodici.** Frontend della piattaforma EDG.

> Il progetto vive nella cartella `asset-frontend` ed è pubblicato come servizio
> `asset-frontend`: **Vigilo** è il nome del prodotto, `asset-frontend` quello
> tecnico usato da Docker, Traefik e dal gateway.

[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.10-38B2AC.svg)](https://tailwindcss.com/)

> Derivato da `pro-frontend`, il frontend più maturo della piattaforma, di cui eredita
> integralmente design system, autenticazione, gestione account e strumenti di sistema.
> Ne è stato escluso il solo modulo legato a `vehicle-service`.
>
> **Stato: template funzionante e vuoto di dominio.** Si esegue il login e si arriva
> alla home di Vigilo. Lo sviluppo del modulo Asset è tutto da fare.

---

## 🧭 Cosa c'è dentro

| Area | Stato | Descrizione |
|------|-------|-------------|
| `core/` | ✅ completo | 30+ componenti UI, hook, servizi HTTP, utility |
| `features/auth` | ✅ completo | Login, reset e cambio password, `PrivateRoute`, slice Redux |
| `features/accounts` | ✅ completo | Anagrafica account e sessioni attive (auth-service) |
| `features/system` | ✅ completo | Logs, alert rules, health dei microservizi (log-service) |
| `features/assets` | 🟡 scheletro | Perimetro del nuovo modulo: api, hook CRUD, tipi, pagina vuota |

Il modulo **Asset** è deliberatamente privo di dominio: contiene solo l'impalcatura
tecnica e le convenzioni da seguire. Vedi [`src/features/assets/README.md`](./src/features/assets/README.md).

---

## 🚀 Quick Start

```bash
# 1. Dipendenze (il lock file è allineato: npm ci dà build riproducibili)
npm ci

# 2. Dev server → http://localhost:5176
npm run dev

# Altri comandi
npm run build        # type-check + build di produzione in dist/
npm run type-check   # solo controllo dei tipi
npm run lint         # ESLint
npm run preview      # anteprima della build
```

`.env.development` è già pronto: non serve configurare nulla per partire, basta che lo
stack EDG sia in esecuzione (`docker-compose up -d` nella cartella `edg-docker`).

### Porte dei frontend EDG

I frontend girano sull'host, non dentro `docker-compose`:

| Progetto | Porta | Host di sviluppo |
|----------|-------|------------------|
| pro-frontend | 5173 | `pro.edg.local` |
| app-frontend | 5174 | `app.edg.local` |
| edg-frontend | 5175 | `edg.edg.local` |
| **asset-frontend** | **5176** | **`asset.edg.local`** |

---

## 🔌 Integrazione con la piattaforma

Il frontend parla **solo** con l'API Gateway, che instrada verso i microservizi. Traefik
fa da entry point e bilancia i due gateway, con failover automatico.

```
asset-frontend :5176
        │  URL relativi (/auth, /api) → proxy di Vite
        ▼
   Traefik :80  ──►  api-gateway-1 :8080
                └►  api-gateway-2 :8080
                          │
        ┌─────────────────┼──────────────────┐
        ▼                 ▼                  ▼
  auth-service      email-service      (asset-service)
     :3001              :3002            da realizzare
```

**Perché il proxy.** `VITE_API_URL` e `VITE_API_BASE_URL` sono vuote: il codice produce
URL relativi, che il browser invia alla stessa origine del dev server. È il proxy di
Vite (`vite.config.ts`) a inoltrarli a Traefik. Nessuna richiesta cross-origin, quindi
**non serve toccare `CORS_ORIGINS` nel docker-compose** per far funzionare questo
frontend sulla porta 5176. In produzione lo stesso ruolo lo svolge nginx.

Il **log-service** è interrogato a parte, con il prefisso `/log-api` che il proxy
riscrive su `http://localhost:4001`.

### Da fare lato piattaforma quando nascerà `asset-service`

- [ ] Definire i permessi `asset.read` / `asset.write` in `auth-service`
- [ ] Attivarli in `App.tsx` sulle route del modulo (oggi protette dalla sola autenticazione)
- [ ] Allineare `ASSETS_BASE` (`src/features/assets/api/apiHelpers.ts`) al path esposto dal gateway
- [ ] Aggiungere la rotta `/api/assets` al gateway e `asset.edg.local` ai `FRONTEND_*_SUBDOMAINS`

---

## 📁 Struttura del progetto

```
asset-frontend/
├── config/                 # ESLint e TypeScript (fuori dalla root, per tenerla pulita)
├── docker/                 # Dockerfile multi-stage + nginx per la SPA
├── docs/                   # Documentazione del progetto
├── public/                 # Asset serviti così come sono
└── src/
    ├── app/                # Redux store, slice UI, middleware di persistenza
    ├── assets/             # Immagini e loghi (varianti light/dark)
    ├── config/             # ⚙️ routes, navigazione, layout, brand — il pannello di controllo
    ├── core/               # Design system e servizi condivisi
    │   ├── components/     # actions · data · feedback · form · info · layout · navigation · ui
    │   ├── hooks/          # useClickOutside, useMediaQuery, useThemedImage
    │   ├── services/       # apiService (classe) e apiFetch (con refresh token automatico)
    │   └── utils/          # cn, date, iconMap
    ├── features/           # Moduli applicativi: auth · accounts · system · assets
    ├── pages/              # Home, Explorer dei componenti, 404
    └── styles/             # Variabili CSS del tema, tipografia, globali
```

---

## 🎨 Theming

Due strati soltanto: **CSS custom properties → tema Tailwind → uso diretto nelle classi**.

```css
:root       { --bg-primary: #ffffff; --text-primary: #111827; }
.dark       { --bg-primary: #1a1f2e; --text-primary: #f8fafc; }
@theme      { --color-bg-primary: var(--bg-primary); }
```

```tsx
<div className='bg-bg-primary text-text-primary border border-border-default'>
  Contenuto con theming automatico
</div>
```

Il tema si applica aggiungendo o togliendo la classe `.dark` al documento; la scelta
dell'utente è persistita dal middleware Redux.

---

## 🧩 Aggiungere una sezione

1. Dichiara la route in `src/config/routes.config.ts`
2. Aggiungi la voce in `src/config/navigation.config.ts`
3. Crea la pagina in `src/features/<modulo>/pages/`
4. Montala in `src/App.tsx` dentro `<PrivateRoute>` (lazy loading)

Tre file di configurazione, nessuna modifica al core.

---

## 📚 Documentazione

| Documento | Descrizione |
|-----------|-------------|
| [docs/COMPONENTS.md](./docs/COMPONENTS.md) | Catalogo completo dei componenti |
| [docs/DOCUMENTATION.md](./docs/DOCUMENTATION.md) | Architettura, theming, convenzioni |
| [docs/SCHEMA.md](./docs/SCHEMA.md) | Mappa del filesystem |
| [docs/CHANGELOG.md](./docs/CHANGELOG.md) | Cronologia delle modifiche |
| [src/features/assets/README.md](./src/features/assets/README.md) | Convenzioni del modulo Asset |

L'**Explorer** (`/sistema/explorer`) è la documentazione viva: 30+ componenti con
scheda tecnica ed esempi interattivi, direttamente in applicazione.

---

## 📄 Licenza

Rilasciato sotto licenza **MIT**.

---

**Creato con ❤️ da EDG Team**

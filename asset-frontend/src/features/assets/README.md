# Modulo Asset

Perimetro applicativo della gestione asset/veicoli di prossima generazione.
Oggi contiene **solo l'impalcatura**: nessuna entità di dominio, nessuna chiamata
reale, la pagina è vuota. È il punto in cui va scritta tutta la logica nuova.

## Struttura

```
features/assets/
├── api/                  # client HTTP — parla SOLO con l'API Gateway
│   ├── apiHelpers.ts     # base URL, buildQuery, factory CRUD
│   └── index.ts
├── components/           # componenti specifici del modulo (ancora vuoto)
│   └── index.ts
├── hooks/                # stato + orchestrazione (niente JSX)
│   ├── useCrudResource.ts
│   └── index.ts
├── pages/                # pagine montate in App.tsx
│   ├── AssetDashboard.tsx
│   └── index.ts
├── types/                # contratti verso il backend
│   ├── api.types.ts
│   └── index.ts
├── utils/                # funzioni pure di dominio
│   └── index.ts
└── index.ts              # barrel: unico punto d'accesso al modulo
```

## Regole del modulo

1. **Un solo entry point.** Chi sta fuori dal modulo importa da
   `features/assets`, mai dai file interni.
2. **Il core non conosce il modulo.** La dipendenza va in una direzione sola:
   `features/assets → core`. Se un componente serve a due moduli, si promuove
   in `src/core/components/`.
3. **Niente URL diretti ai microservizi.** Ogni chiamata passa da
   `ASSETS_BASE`, che punta all'API Gateway.
4. **Le pagine non fanno fetch.** La pagina compone; l'hook orchestra; l'api
   parla HTTP. Tre strati, tre responsabilità.
5. **Tipi allineati al backend.** `types/` è il contratto: se cambia il
   microservizio, si aggiorna qui e il compilatore trova il resto.

## Aggiungere una risorsa — checklist

Esempio: entità `Category`.

**1. Tipi** — `types/categories.types.ts`

```ts
export interface Category {
  id: number;
  name: string;
  active: boolean;
}

export interface CategoryFilters extends BaseFilters {
  active?: boolean;
}

export type CreateCategoryData = Omit<Category, 'id'>;
export type UpdateCategoryData = Partial<CreateCategoryData>;
```

Ri-esportare da `types/index.ts`.

**2. API** — `api/categories.api.ts`

```ts
import { createResourceApi } from './apiHelpers';
import type { Category, CategoryFilters, CreateCategoryData, UpdateCategoryData } from '../types';

export const categoriesApi = createResourceApi<Category, CategoryFilters, CreateCategoryData, UpdateCategoryData>(
  '/categories'
);
```

**3. Hook** — `hooks/useCategories.ts`

```ts
import { useCrudResource } from './useCrudResource';
import { categoriesApi } from '../api/categories.api';
import type { CategoryFilters } from '../types';

const DEFAULT_FILTERS: CategoryFilters = { page: 1, limit: 20 };

export const useCategories = () => useCrudResource(categoriesApi, DEFAULT_FILTERS);
```

**4. Pagina** — `pages/Categories.tsx`, con `PageHeader` + `Table` dal core.

**5. Route** — `src/config/routes.config.ts`, poi `navigation.config.ts`,
poi il `<Route>` in `App.tsx` dentro un `<PrivateRoute>`.

## Permessi

Le route del modulo sono per ora protette dalla sola autenticazione. Quando
`auth-service` esporrà i permessi del nuovo microservizio, aggiungere in
`App.tsx`:

- `requiredPermission='asset.read'` sulle pagine di sola lettura
- `requiredPermission='asset.write'` sulle pagine di modifica

Attenzione: `PrivateRoute` con un permesso inesistente reindirizza alla home,
quindi il permesso va creato lato backend **prima** di dichiararlo qui.

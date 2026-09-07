// src/pages/index.ts
// Barrel delle pagine condivise (fuori dai moduli).
//
// ⚠️ Esporre qui SOLO le pagine caricate in modo eager.
// `Explorer` e `NotFound` sono importate con `lazy()` in App.tsx: ri-esportarle
// da questo barrel le rimetterebbe nel chunk principale, annullando il code
// splitting (Vite lo segnala con "dynamically imported but also statically
// imported"). Importarle sempre dal loro path diretto.
//
// ✅ BEST PRACTICE:
// - Solo named exports per i componenti
// - Niente `export type` per componenti senza interfacce esplicite

export { default as Dashboard } from './Dashboard';

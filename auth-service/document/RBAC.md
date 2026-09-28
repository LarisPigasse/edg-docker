# Sistema Autorizzazioni RBAC - EDG Auth Service

Documentazione completa del sistema di autorizzazione basato su permessi composti, wildcards e negazioni esplicite.

**Versione:** 2.1 (con Deny First)  
**Data:** Ottobre 2025

---

## Indice

1. [Panoramica](#panoramica)
2. [Concetto Core](#concetto-core)
3. [Architettura Permessi](#architettura-permessi)
4. [Moduli e Azioni](#moduli-e-azioni)
5. [Ruoli Predefiniti](#ruoli-predefiniti)
6. [Sistema "Deny First"](#sistema-deny-first)
7. [Logica di Autorizzazione](#logica-di-autorizzazione)
8. [Esempi Pratici](#esempi-pratici)
9. [Implementazione](#implementazione)
10. [Best Practices](#best-practices)

---

## Panoramica

### Filosofia del Sistema

Il sistema RBAC di EDG Auth Service è progettato per:

- **Massima Flessibilità** - Supporta qualsiasi workflow presente e futuro
- **Chiarezza Totale** - Nessun comportamento implicito o nascosto
- **Scalabilità** - Facilmente estendibile con nuovi moduli e azioni
- **Standard Industriale** - Pattern usato da AWS IAM, Azure RBAC, Kubernetes

### Perché Questo Sistema?

Abbiamo scelto **permessi composti espliciti con wildcards** perché:

1. **Nessuna ambiguità** - `spedizioni.create` significa SOLO creare (non implica read)
2. **Workflow complessi** - Supporta qualsiasi combinazione di permessi
3. **Debug facile** - Immediato capire quale permesso manca
4. **Future-proof** - Aggiungere moduli/azioni è banale

### Confronto con Altri Sistemi

| Sistema | EDG RBAC | Gerarchico | Bidimensionale |
|---------|----------|------------|----------------|
| **Esplicito** | ✅ | ❌ Implicito | ✅ |
| **Wildcards** | ✅ | ❌ | ❌ |
| **Negazioni** | ✅ | ❌ | ⚠️ |
| **Scalabile** | ✅ | ⚠️ | ⚠️ |
| **Facile debug** | ✅ | ❌ | ✅ |

---

## Concetto Core

### Struttura Permessi: `modulo.azione`

Tutti i permessi seguono il formato composto:

```typescript
'spedizioni.read'    // Visualizzare spedizioni
'spedizioni.create'  // Creare nuove spedizioni
'gestione.update'    // Modificare configurazioni
'report.export'      // Esportare report
```

### Wildcards

```typescript
'spedizioni.*'  // Tutte le azioni su spedizioni
'gestione.*'    // Tutte le azioni su gestione
'*'             // Accesso completo (solo root)
```

### Negazioni Esplicite

```typescript
'!spedizioni.delete'  // Nega eliminazione (anche se ha spedizioni.*)
'!sistema.*'          // Nega accesso a tutto il modulo sistema
```

### Regole Fondamentali

1. **Ogni permesso è esplicito** - Nessun permesso implicito
2. **Wildcard modulo (`modulo.*`)** - Garantisce TUTTE le azioni
3. **Wildcard globale (`*`)** - Solo per root
4. **Negazioni vincono sempre** - Una singola negazione blocca qualsiasi permesso positivo
5. **Nessuna gerarchia** - `create` NON implica `read`

---

## Architettura Permessi

### Formula di Verifica

```typescript
function hasPermission(
  userPermissions: string[],
  module: string,
  action: string
): boolean {
  // FASE 1: Verifica negazioni (Deny First)
  if (userPermissions.includes(`!${module}.*`)) return false;
  if (userPermissions.includes(`!${module}.${action}`)) return false;

  // FASE 2: Verifica permessi positivi
  if (userPermissions.includes('*')) return true;
  if (userPermissions.includes(`${module}.*`)) return true;
  if (userPermissions.includes(`${module}.${action}`)) return true;

  // FASE 3: Default deny
  return false;
}
```

### Esempio Completo

```typescript
// Utente con questi permessi
const permissions = [
  'spedizioni.*',         // Allow: tutto su spedizioni
  '!spedizioni.delete',   // Deny: ma NON eliminazione
  'report.read',          // Allow: solo lettura report
  'gestione.update'       // Allow: solo modifica gestione
];

// Test
hasPermission(permissions, 'spedizioni', 'read')    // ✅ true (ha spedizioni.*)
hasPermission(permissions, 'spedizioni', 'create')  // ✅ true (ha spedizioni.*)
hasPermission(permissions, 'spedizioni', 'delete')  // ❌ false (negazione!)
hasPermission(permissions, 'report', 'read')        // ✅ true (ha report.read)
hasPermission(permissions, 'report', 'create')      // ❌ false (non ha report.create)
hasPermission(permissions, 'gestione', 'update')    // ✅ true (ha gestione.update)
hasPermission(permissions, 'gestione', 'read')      // ❌ false (non ha gestione.read)
```

---

## Moduli e Azioni

### Moduli del Sistema

| Modulo | Descrizione | Accessibile a |
|--------|-------------|---------------|
| **spedizioni** | Gestione ordini e tracking | Tutti i ruoli |
| **gestione** | Amministrazione sistema (utenti, ruoli) | Admin, root |
| **report** | Dashboard, analytics, export | Tutti (limitato) |
| **sistema** | Config critiche, backup | Solo root |

### Azioni Standard

Ogni modulo supporta queste azioni:

| Azione | Descrizione | Esempio |
|--------|-------------|---------|
| `read` | Visualizzare | Vedere lista ordini |
| `create` | Creare | Creare nuovo ordine |
| `update` | Modificare | Aggiornare stato |
| `delete` | Eliminare | Eliminare ordine |

### Azioni Speciali

| Azione | Moduli | Descrizione |
|--------|--------|-------------|
| `export` | report, spedizioni | Esportare dati (Excel, PDF) |
| `approve` | spedizioni, gestione | Approvare (workflow) |

---

## Ruoli Predefiniti

### 1. root (Super Admin)

```typescript
{
  name: 'root',
  permissions: ['*'],
  description: 'Accesso completo al sistema'
}
```

**Può fare:**
- ✅ Tutto su tutti i moduli
- ✅ Configurazioni sistema critiche
- ✅ Backup e manutenzione

**Quando usarlo:**
- Super amministratore
- Owner del sistema

### 2. admin

```typescript
{
  name: 'admin',
  permissions: [
    'spedizioni.*',
    'gestione.*',
    'report.*'
    // NO 'sistema.*'
  ],
  description: 'Amministratore completo (no sistema)'
}
```

**Può fare:**
- ✅ Gestione completa spedizioni
- ✅ Gestione utenti e ruoli
- ✅ Tutti i report
- ❌ NON può modificare config sistema

**Quando usarlo:**
- Manager operativi
- Responsabili di area

### 3. operatore

```typescript
{
  name: 'operatore',
  permissions: [
    'spedizioni.*',
    'report.read',
    'report.create',
    'report.export'
  ],
  description: 'Operatore standard'
}
```

**Può fare:**
- ✅ Gestione completa spedizioni
- ✅ Visualizzare report
- ✅ Creare ed esportare report
- ❌ NON può gestire utenti

**Quando usarlo:**
- Operatori quotidiani
- Staff operativo

### 4. guest

```typescript
{
  name: 'guest',
  permissions: [
    'spedizioni.read',
    'report.read'
  ],
  description: 'Solo lettura'
}
```

**Può fare:**
- ✅ Visualizzare spedizioni
- ✅ Visualizzare report
- ❌ Nessuna modifica

**Quando usarlo:**
- Clienti esterni
- Account demo

### Matrice Permessi

```
┌─────────────┬───────────────────────────────────────┐
│ Modulo      │ read create update delete export      │
├─────────────┼───────────────────────────────────────┤
│ ROOT        │  ✅     ✅     ✅     ✅     ✅  (*)  │
├─────────────┼───────────────────────────────────────┤
│ ADMIN       │                                       │
│  spedizioni │  ✅     ✅     ✅     ✅     ✅       │
│  gestione   │  ✅     ✅     ✅     ✅     ✅       │
│  report     │  ✅     ✅     ✅     ✅     ✅       │
│  sistema    │  ❌     ❌     ❌     ❌     ❌       │
├─────────────┼───────────────────────────────────────┤
│ OPERATORE   │                                       │
│  spedizioni │  ✅     ✅     ✅     ✅     ✅       │
│  gestione   │  ❌     ❌     ❌     ❌     ❌       │
│  report     │  ✅     ✅     ❌     ❌     ✅       │
│  sistema    │  ❌     ❌     ❌     ❌     ❌       │
├─────────────┼───────────────────────────────────────┤
│ GUEST       │                                       │
│  spedizioni │  ✅     ❌     ❌     ❌     ❌       │
│  gestione   │  ❌     ❌     ❌     ❌     ❌       │
│  report     │  ✅     ❌     ❌     ❌     ❌       │
│  sistema    │  ❌     ❌     ❌     ❌     ❌       │
└─────────────┴───────────────────────────────────────┘
```

---

## Sistema "Deny First"

### Concetto

Il sistema implementa il pattern **"Deny First"** usato da AWS IAM, Azure RBAC, Kubernetes:

> **Una singola negazione supera qualsiasi numero di permessi positivi**

### Algoritmo (3 Fasi)

```
┌──────────────────────────────────────┐
│ FASE 1: Verifica Negazioni          │
│ - Esiste !modulo.* ?     → NEGA     │
│ - Esiste !modulo.azione? → NEGA     │
└──────────────────────────────────────┘
              ↓ (se nessuna negazione)
┌──────────────────────────────────────┐
│ FASE 2: Verifica Permessi Positivi  │
│ - Ha * ?              → CONSENTI     │
│ - Ha modulo.* ?       → CONSENTI     │
│ - Ha modulo.azione ?  → CONSENTI     │
└──────────────────────────────────────┘
              ↓ (se nessun permesso)
┌──────────────────────────────────────┐
│ FASE 3: Default Deny                │
│ → NEGA                               │
└──────────────────────────────────────┘
```

### Formato Negazioni

```typescript
'!modulo.azione'  // Nega azione specifica
'!modulo.*'       // Nega tutte le azioni del modulo
// NOTA: '!*' non esiste (bloccherebbe tutto)
```

### Esempi Pratici

**Esempio 1: Operatore Senior**

Può fare tutto TRANNE eliminare:

```typescript
permissions: [
  'spedizioni.*',        // Allow: tutto
  '!spedizioni.delete'   // Deny: eliminazione
]

hasPermission(..., 'spedizioni', 'create')  // ✅ true
hasPermission(..., 'spedizioni', 'delete')  // ❌ false (negazione!)
```

**Esempio 2: Admin Limitato**

Accesso root TRANNE sistema:

```typescript
permissions: [
  '*',            // Allow: tutto
  '!sistema.*'    // Deny: intero modulo sistema
]

hasPermission(..., 'gestione', 'delete')  // ✅ true
hasPermission(..., 'sistema', 'read')     // ❌ false (negazione!)
```

**Esempio 3: Supervisore**

Gestione completa MA non può eliminare o approvare:

```typescript
permissions: [
  'spedizioni.*',
  '!spedizioni.delete',
  '!spedizioni.approve',
  'report.*',
  '!report.delete'
]
```

---

## Logica di Autorizzazione

### Caso d'Uso 1: Operatore Crea Spedizione

```typescript
// Permessi operatore
permissions: ['spedizioni.*', 'report.read']

// Request
POST /spedizioni
requirePermission('spedizioni', 'create')

// Verifica
hasPermission(['spedizioni.*', ...], 'spedizioni', 'create')
→ ✅ true (ha spedizioni.*)

// Risultato
✅ ACCESSO CONSENTITO
```

### Caso d'Uso 2: Guest Tenta Modifica

```typescript
// Permessi guest
permissions: ['spedizioni.read', 'report.read']

// Request
PUT /spedizioni/123
requirePermission('spedizioni', 'update')

// Verifica
hasPermission(['spedizioni.read', ...], 'spedizioni', 'update')
→ ❌ false (ha solo .read)

// Risultato
❌ 403 Forbidden
```

### Caso d'Uso 3: Admin con Negazione

```typescript
// Permessi admin limitato
permissions: ['*', '!sistema.*']

// Request
POST /sistema/backup
requirePermission('sistema', 'create')

// Verifica
FASE 1: Esiste !sistema.* ? → ✅ SÌ
→ ❌ NEGA subito (non controlla *)

// Risultato
❌ 403 Forbidden (negazione vince)
```

---

## Implementazione

### PermissionChecker Class

```typescript
export class PermissionChecker {
  static hasPermission(
    userPermissions: string[],
    module: string,
    action: string
  ): boolean {
    // FASE 1: Deny First
    if (userPermissions.includes(`!${module}.*`)) {
      return false;
    }
    if (userPermissions.includes(`!${module}.${action}`)) {
      return false;
    }

    // FASE 2: Allow
    if (userPermissions.includes('*')) {
      return true;
    }
    if (userPermissions.includes(`${module}.*`)) {
      return true;
    }
    if (userPermissions.includes(`${module}.${action}`)) {
      return true;
    }

    // FASE 3: Default deny
    return false;
  }

  static hasAllPermissions(
    userPermissions: string[],
    requirements: Array<{ module: string; action: string }>
  ): boolean {
    return requirements.every(req =>
      this.hasPermission(userPermissions, req.module, req.action)
    );
  }

  static hasAnyPermission(
    userPermissions: string[],
    requirements: Array<{ module: string; action: string }>
  ): boolean {
    return requirements.some(req =>
      this.hasPermission(userPermissions, req.module, req.action)
    );
  }
}
```

### Middleware Express

```typescript
export const requirePermission = (module: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const account = (req as any).account;

    if (!account || !account.permissions) {
      return res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta'
      });
    }

    const hasAccess = PermissionChecker.hasPermission(
      account.permissions,
      module,
      action
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Permessi insufficienti',
        required: { module, action, permission: `${module}.${action}` },
        message: `Questo endpoint richiede il permesso: ${module}.${action}`
      });
    }

    next();
  };
};
```

### Utilizzo nelle Route

```typescript
import { Router } from 'express';
import { authenticate } from './authMiddleware';
import { requirePermission } from './permissionMiddleware';

const router = Router();

// SPEDIZIONI
router.get('/spedizioni',
  authenticate,
  requirePermission('spedizioni', 'read'),
  getShipmentsHandler
);

router.post('/spedizioni',
  authenticate,
  requirePermission('spedizioni', 'create'),
  createShipmentHandler
);

router.delete('/spedizioni/:id',
  authenticate,
  requirePermission('spedizioni', 'delete'),
  deleteShipmentHandler
);

// GESTIONE (solo admin)
router.post('/users',
  authenticate,
  requirePermission('gestione', 'create'),
  createUserHandler
);

// SISTEMA (solo root)
router.post('/sistema/backup',
  authenticate,
  requirePermission('sistema', 'create'),
  backupHandler
);

export default router;
```

---

## Best Practices

### ✅ DO

**1. Usa negazioni per eccezioni chiare**

```typescript
// ✅ Buono
permissions: ['spedizioni.*', '!spedizioni.delete']
```

**2. Documenta l'intenzione**

```typescript
{
  name: 'operatore_senior',
  description: 'Può fare tutto TRANNE eliminare',
  permissions: ['spedizioni.*', '!spedizioni.delete']
}
```

**3. Usa wildcards quando sensato**

```typescript
// ✅ Buono: Conciso e chiaro
permissions: ['*', '!sistema.*']

// ❌ Cattivo: Verboso
permissions: [
  'spedizioni.*',
  'gestione.*',
  'report.*',
  // ...lista infinita
]
```

**4. Principio del minimo privilegio**

Assegna sempre il minimo necessario. Meglio aggiungere dopo che togliere.

### ❌ DON'T

**1. Non abusare delle negazioni**

```typescript
// ❌ Cattivo: Troppi deny
permissions: [
  'spedizioni.*',
  '!spedizioni.delete',
  '!spedizioni.approve',
  '!spedizioni.export',
  // ...altre 10 negazioni
]

// ✅ Buono: Elenca solo ciò che serve
permissions: [
  'spedizioni.read',
  'spedizioni.create',
  'spedizioni.update'
]
```

**2. Non creare negazioni ridondanti**

```typescript
// ❌ Cattivo: Nega cosa non ha
permissions: [
  'spedizioni.read',
  '!gestione.delete'  // Non ha gestione.* quindi inutile
]
```

**3. Non creare contraddizioni**

```typescript
// ❌ Cattivo: Contraddittorio
permissions: [
  '!spedizioni.*',   // Nega tutto
  'spedizioni.read'  // Ma poi consente lettura?
]
// Risultato: Negazione vince, non può leggere
```

### Testing

**Test che negazioni funzionino:**

```typescript
describe('Permission check con negazioni', () => {
  test('Negazione blocca anche con wildcard', () => {
    const permissions = ['spedizioni.*', '!spedizioni.delete'];

    expect(hasPermission(permissions, 'spedizioni', 'read')).toBe(true);
    expect(hasPermission(permissions, 'spedizioni', 'delete')).toBe(false);
  });

  test('Negazione ha priorità su permessi positivi', () => {
    const permissions = ['*', '!sistema.*'];

    expect(hasPermission(permissions, 'gestione', 'read')).toBe(true);
    expect(hasPermission(permissions, 'sistema', 'read')).toBe(false);
  });
});
```

---

## Espansione Futura

### Aggiungere Nuovo Modulo

```typescript
// Nuovo modulo: clienti
INSERT INTO role_permissions VALUES (NULL, 2, 'clienti.*');  // admin
INSERT INTO role_permissions VALUES (NULL, 3, 'clienti.read');  // operatore
```

### Aggiungere Nuova Azione

```typescript
// Nuova azione: archive
router.post('/spedizioni/:id/archive',
  authenticate,
  requirePermission('spedizioni', 'archive')
);

INSERT INTO role_permissions VALUES (NULL, 2, 'spedizioni.archive');
```

### Creare Ruolo Custom

```typescript
{
  name: 'supervisore',
  description: 'Operatore senior con accesso report completo',
  isSystem: false,
  permissions: [
    'spedizioni.*',
    'report.*',
    'gestione.read'  // Solo visualizzazione
  ]
}
```

---

## Riepilogo

### Vantaggi del Sistema

✅ **Chiarezza** - Permessi espliciti, nessuna magia  
✅ **Flessibilità** - Supporta qualsiasi workflow  
✅ **Sicurezza** - Negazioni proteggono da errori  
✅ **Standard** - Pattern industriale consolidato  
✅ **Scalabilità** - Facile aggiungere moduli/azioni  

### Quando Usare Negazioni

**USA quando:**
- Vuoi dare accesso quasi completo con poche eccezioni
- Devi temporaneamente bloccare un'azione
- Hai wildcard ma vuoi rimuovere singole azioni

**NON USARE quando:**
- È più semplice elencare solo i permessi necessari
- Il ruolo ha pochissimi permessi
- Crei contraddizioni

---

**Ultimo aggiornamento:** 21 Gennaio 2026  
**Sistema:** RBAC v2.1 con Deny First  
**Mantieni aggiornato quando:** Aggiungi moduli, azioni o ruoli

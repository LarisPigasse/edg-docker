# Sistema di Negazioni RBAC - "Deny First"

**Versione:** 2.1 (con Negazioni Esplicite)  
**Data:** Ottobre 2025  
**Progetto:** EDG Auth Service

---

## Indice

1. [Introduzione](#introduzione)
2. [Logica "Deny First"](#logica-deny-first)
3. [Formato Negazioni](#formato-negazioni)
4. [Esempi Pratici](#esempi-pratici)
5. [Casi d'Uso Reali](#casi-duso-reali)
6. [Best Practices](#best-practices)
7. [Testing](#testing)

---

## Introduzione

Il sistema RBAC di EDG Auth Service implementa il pattern **"Deny First"**, lo stesso usato da:

- ✅ AWS IAM (Amazon Web Services)
- ✅ Azure RBAC (Microsoft)
- ✅ Google Cloud IAM
- ✅ Kubernetes RBAC

### Perché "Deny First"?

**Problema senza negazioni:**

```typescript
// Come dare accesso completo MA togliere eliminazione?
permissions: ['spedizioni.*']; // Può fare TUTTO, incluso delete

// Soluzione naive:
permissions: ['spedizioni.read', 'spedizioni.create', 'spedizioni.update'];
// ❌ Verboso, difficile da mantenere, non scala
```

**Soluzione con negazioni:**

```typescript
permissions: ['spedizioni.*', '!spedizioni.delete'];
// ✅ Chiaro, compatto, scalabile
```

---

## Logica "Deny First"

### Algoritmo di Verifica

Quando un utente tenta un'azione, il sistema segue **3 fasi**:

```
┌─────────────────────────────────────────────────┐
│ FASE 1: Verifica Negazioni Esplicite           │
├─────────────────────────────────────────────────┤
│ ❓ Esiste !modulo.* ?                           │
│    → ❌ NEGA subito (return false)              │
│                                                 │
│ ❓ Esiste !modulo.azione ?                      │
│    → ❌ NEGA subito (return false)              │
└─────────────────────────────────────────────────┘
                    ⬇️
┌─────────────────────────────────────────────────┐
│ FASE 2: Verifica Permessi Positivi             │
├─────────────────────────────────────────────────┤
│ ❓ Ha permesso * ?                              │
│    → ✅ CONSENTI (return true)                  │
│                                                 │
│ ❓ Ha permesso modulo.* ?                       │
│    → ✅ CONSENTI (return true)                  │
│                                                 │
│ ❓ Ha permesso modulo.azione ?                  │
│    → ✅ CONSENTI (return true)                  │
└─────────────────────────────────────────────────┘
                    ⬇️
┌─────────────────────────────────────────────────┐
│ FASE 3: Default Deny                           │
├─────────────────────────────────────────────────┤
│ ❌ NEGA (return false)                          │
└─────────────────────────────────────────────────┘
```

### Regola Fondamentale

> **Una singola negazione supera qualsiasi numero di permessi positivi**

```typescript
permissions: ['*', 'spedizioni.*', 'spedizioni.delete', '!spedizioni.delete'];
//           ✅    ✅              ✅                    ❌

// Risultato: NON può eliminare
// La negazione vince SEMPRE
```

---

## Formato Negazioni

### Sintassi

Usa il prefisso `!` (punto esclamativo):

```typescript
'!modulo.azione'; // Nega una specifica azione
'!modulo.*'; // Nega tutte le azioni del modulo
```

### Tipi di Negazioni

| Tipo                    | Formato          | Cosa Blocca        | Esempio              |
| ----------------------- | ---------------- | ------------------ | -------------------- |
| **Negazione Specifica** | `!modulo.azione` | Solo quella azione | `!spedizioni.delete` |
| **Negazione Wildcard**  | `!modulo.*`      | Tutto il modulo    | `!sistema.*`         |

**NOTA:** Non esiste `!*` (negazione globale) - sarebbe inutile perché bloccherebbe tutto.

---

## Esempi Pratici

### Esempio 1: Operatore Senior

**Requisito:** Può fare tutto sulle spedizioni TRANNE eliminare

```typescript
permissions: [
  'spedizioni.*',        // Allow: tutto su spedizioni
  '!spedizioni.delete'   // Deny: eliminazione
]

// Test:
hasPermission('spedizioni', 'read')    → ✅ true  (coperto da spedizioni.*)
hasPermission('spedizioni', 'create')  → ✅ true  (coperto da spedizioni.*)
hasPermission('spedizioni', 'update')  → ✅ true  (coperto da spedizioni.*)
hasPermission('spedizioni', 'delete')  → ❌ false (negazione esplicita!)
```

### Esempio 2: Admin Limitato

**Requisito:** Accesso root MA senza configurazioni sistema

```typescript
permissions: [
  '*',              // Allow: tutto
  '!sistema.*'      // Deny: intero modulo sistema
]

// Test:
hasPermission('spedizioni', 'delete')  → ✅ true  (coperto da *)
hasPermission('gestione', 'create')    → ✅ true  (coperto da *)
hasPermission('sistema', 'read')       → ❌ false (negato da !sistema.*)
hasPermission('sistema', 'backup')     → ❌ false (negato da !sistema.*)
```

### Esempio 3: Supervisore

**Requisito:** Accesso completo MA non può eliminare né approvare

```typescript
permissions: [
  'spedizioni.*',
  '!spedizioni.delete',
  '!spedizioni.approve',
  'report.*',
  '!report.delete',
  'gestione.read',
  'gestione.update'
]

// Test:
hasPermission('spedizioni', 'read')    → ✅ true
hasPermission('spedizioni', 'create')  → ✅ true
hasPermission('spedizioni', 'delete')  → ❌ false (negato)
hasPermission('spedizioni', 'approve') → ❌ false (negato)
hasPermission('report', 'export')      → ✅ true
hasPermission('report', 'delete')      → ❌ false (negato)
hasPermission('gestione', 'read')      → ✅ true
hasPermission('gestione', 'update')    → ✅ true
hasPermission('gestione', 'delete')    → ❌ false (non ha permesso)
```

### Esempio 4: Auditor

**Requisito:** Solo lettura su TUTTO

```typescript
permissions: ['spedizioni.read', 'gestione.read', 'report.read', 'sistema.read'];

// Nota: Qui NON servono negazioni perché non ha permessi di scrittura
```

---

## Casi d'Uso Reali

### 1. Operatore in Formazione

**Scenario:** Nuovo assunto che può vedere e creare, ma non modificare/eliminare

```typescript
{
  name: 'operatore_junior',
  permissions: [
    'spedizioni.read',
    'spedizioni.create',
    '!spedizioni.update',   // Opzionale (non ha già il permesso)
    '!spedizioni.delete'    // Opzionale (non ha già il permesso)
  ]
}
```

**NOTA:** Le negazioni qui sono ridondanti ma documentano esplicitamente l'intenzione.

### 2. Partner Esterno

**Scenario:** Può gestire i suoi ordini ma non eliminarli

```typescript
{
  name: 'partner_esterno',
  permissions: [
    'spedizioni.read',
    'spedizioni.create',
    'spedizioni.update',
    '!spedizioni.delete',    // Critico: previene eliminazioni
    'report.read'
  ]
}
```

### 3. Admin Temporaneo

**Scenario:** Admin per 1 mese, poi diventa operatore

```typescript
// Durante il mese (ruolo admin_temp):
{
  name: 'admin_temp',
  permissions: [
    'spedizioni.*',
    'gestione.*',
    '!gestione.delete',      // Non può eliminare account
    'report.*'
  ]
}

// Dopo il mese (cambia roleId a 'operatore'):
// Automaticamente perde tutti i permessi admin
```

### 4. Contabile

**Scenario:** Vede tutto ma modifica solo fatture

```typescript
{
  name: 'contabile',
  permissions: [
    'spedizioni.read',
    'gestione.read',
    'report.*',
    'accounting.*'           // Modulo futuro
  ]
}
```

---

## Best Practices

### ✅ DO

**1. Usa negazioni per eccezioni chiare**

```typescript
// ✅ BUONO: Chiaro ed esplicito
permissions: ['spedizioni.*', '!spedizioni.delete'];
```

**2. Documenta l'intenzione**

```typescript
{
  name: 'operatore_senior',
  description: 'Può fare tutto TRANNE eliminare', // ← Spiega il perché
  permissions: ['spedizioni.*', '!spedizioni.delete']
}
```

**3. Usa wildcard quando sensato**

```typescript
// ✅ BUONO: Admin senza accesso sistema
permissions: ['*', '!sistema.*'];

// ❌ CATTIVO: Verboso e difficile da mantenere
permissions: [
  'spedizioni.*',
  'gestione.*',
  'report.*',
  'accounting.*',
  'warehouse.*', // ...lista infinita
];
```

**4. Testa sempre le negazioni**

```typescript
// Dopo aver creato un ruolo con negazioni, testa:
hasPermission(userPermissions, 'modulo', 'azione_negata');
// Deve ritornare false!
```

### ❌ DON'T

**1. Non abusare delle negazioni**

```typescript
// ❌ CATTIVO: Troppe eccezioni = ruolo confuso
permissions: [
  'spedizioni.*',
  '!spedizioni.delete',
  '!spedizioni.approve',
  '!spedizioni.export',
  '!spedizioni.archive',
  // ... altre 10 negazioni
];

// ✅ BUONO: Definisci solo ciò che serve
permissions: ['spedizioni.read', 'spedizioni.create', 'spedizioni.update'];
```

**2. Non creare negazioni ridondanti**

```typescript
// ❌ CATTIVO: Negazione inutile (non ha già il permesso)
permissions: [
  'spedizioni.read',
  '!gestione.delete', // Non ha gestione.* quindi inutile
];

// ✅ BUONO: Nega solo dove c'è ambiguità
permissions: [
  'spedizioni.*',
  '!spedizioni.delete', // Utile: senza questa, potrebbe eliminare
];
```

**3. Non creare contraddizioni**

```typescript
// ❌ CATTIVO: Contraddittorio
permissions: [
  '!spedizioni.*', // Nega tutto
  'spedizioni.read', // Ma poi consente lettura?
];
// Risultato: La negazione vince, non può leggere

// ✅ BUONO: Chiaro e coerente
permissions: [
  'spedizioni.*', // Consente tutto...
  '!spedizioni.delete', // ...tranne eliminazione
];
```

---

## Testing

### Test Unitari

```typescript
describe('PermissionChecker con negazioni', () => {
  test('Negazione specifica blocca anche con wildcard', () => {
    const permissions = ['spedizioni.*', '!spedizioni.delete'];

    expect(hasPermission(permissions, 'spedizioni', 'read')).toBe(true);
    expect(hasPermission(permissions, 'spedizioni', 'delete')).toBe(false);
  });

  test('Negazione wildcard blocca tutto il modulo', () => {
    const permissions = ['*', '!sistema.*'];

    expect(hasPermission(permissions, 'spedizioni', 'read')).toBe(true);
    expect(hasPermission(permissions, 'sistema', 'read')).toBe(false);
    expect(hasPermission(permissions, 'sistema', 'backup')).toBe(false);
  });

  test('Negazione ha priorità su qualsiasi permesso positivo', () => {
    const permissions = ['*', 'spedizioni.*', 'spedizioni.delete', '!spedizioni.delete'];

    expect(hasPermission(permissions, 'spedizioni', 'delete')).toBe(false);
  });

  test('Senza negazioni, comportamento normale', () => {
    const permissions = ['spedizioni.read', 'spedizioni.create'];

    expect(hasPermission(permissions, 'spedizioni', 'read')).toBe(true);
    expect(hasPermission(permissions, 'spedizioni', 'delete')).toBe(false);
  });
});
```

### Test Manuali (curl)

```bash
# 1. Crea ruolo con negazione
npm run seed:roles

# 2. Crea account con ruolo operatore_senior
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "senior@edg.com",
    "password": "Test123!@#",
    "accountType": "operatore",
    "entityId": "123e4567-e89b-12d3-a456-426614174000",
    "roleId": 5
  }'

# 3. Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "senior@edg.com",
    "password": "Test123!@#",
    "accountType": "operatore"
  }'

# 4. Decodifica JWT su jwt.io
# Dovresti vedere:
# "permissions": ["spedizioni.*", "!spedizioni.delete"]

# 5. Tenta DELETE (dovrebbe fallire con 403)
curl -X DELETE http://localhost:3001/spedizioni/123 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response attesa:
# {
#   "success": false,
#   "error": "Permessi insufficienti",
#   "message": "Questo endpoint richiede il permesso: spedizioni.delete"
# }
```

---

## Riepilogo

### Vantaggi Sistema Negazioni

✅ **Sicurezza:** Blocca accessi anche con permessi wildcard  
✅ **Flessibilità:** Crea ruoli complessi con eccezioni  
✅ **Chiarezza:** Esplicita cosa NON si può fare  
✅ **Standard:** Usato dai leader del settore (AWS, Azure, GCP)  
✅ **Scalabilità:** Facile aggiungere eccezioni senza riscrivere tutto

### Quando Usare

**USA negazioni quando:**

- ✅ Vuoi dare accesso quasi completo con poche eccezioni
- ✅ Devi temporaneamente bloccare un'azione specifica
- ✅ Hai bisogno di controllo granulare su wildcard

**NON usare negazioni quando:**

- ❌ È più semplice elencare solo i permessi necessari
- ❌ Il ruolo ha pochissimi permessi (usa lista positiva)
- ❌ Crei contraddizioni o confusione

---

**Documento creato per:** EDG Auth Service  
**Sistema:** RBAC con Permessi Composti, Wildcards e Negazioni Esplicite  
**Versione:** 2.1 - Sistema "Deny First"  
**Mantenere aggiornato:** Quando si aggiungono nuovi pattern o casi d'uso

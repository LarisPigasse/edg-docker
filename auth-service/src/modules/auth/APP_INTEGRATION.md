# Istruzioni Aggiornate per app.ts

## 🔧 Modifiche da Fare in app.ts

### **STEP 1: Import (in cima al file, circa riga 20)**

**TROVA:**
```typescript
import { createAuthRouter } from './modules/auth/routes/auth.routes';
import accountRoutes from './modules/auth/routes/account.routes';
```

**SOSTITUISCI CON:**
```typescript
import { createAuthRouter } from './modules/auth/routes/auth.routes';
import { createAccountRouter } from './modules/auth/routes/account.routes';
```

---

### **STEP 2: Registrazione Route (circa riga 130)**

**TROVA questa sezione:**
```typescript
    // 5. REGISTRA LE ROUTE
    console.log('\n🔧 [APP] Fase 8: Registrazione route nel server Express');
    server.registerModuleRoutes();

    console.log('   ✅ Route registrate con successo!');

    // 6. ✅ CRITICO: Registra error handlers DOPO le route!
```

**SOSTITUISCI CON:**
```typescript
    // 5. REGISTRA LE ROUTE
    console.log('\n🔧 [APP] Fase 8: Registrazione route nel server Express');
    server.registerModuleRoutes();

    console.log('   ✅ Route registrate con successo!');

    // 5.1 CREA E REGISTRA ROUTER ACCOUNTS
    console.log('\n🔧 [APP] Fase 8.1: Creazione e registrazione router accounts');
    const app = server.getApp();
    const accountRouter = createAccountRouter(Account, Role);
    app.use('/auth/accounts', accountRouter);
    console.log('   ✅ Router accounts creato e registrato!');

    // 6. ✅ CRITICO: Registra error handlers DOPO le route!
```

---

### **STEP 3: Rimuovi Dichiarazione Duplicata di `app`**

**TROVA (circa riga 143):**
```typescript
    // 7. Avvia server HTTP
    console.log('\n🔧 [APP] Fase 10: Avvio server HTTP');
    const app = server.getApp();  // <-- RIMUOVI QUESTA LINEA
    app.listen(config.port, () => {
```

**SOSTITUISCI CON:**
```typescript
    // 7. Avvia server HTTP
    console.log('\n🔧 [APP] Fase 10: Avvio server HTTP');
    // const app già dichiarato sopra (riga ~133)
    app.listen(config.port, () => {
```

---

## ✅ Risultato Finale

Dopo le modifiche, `app.ts` dovrebbe avere questa sequenza:

```typescript
// Import in cima
import { createAccountRouter } from './modules/auth/routes/account.routes';

// ... nel startServer() ...

// 5. REGISTRA LE ROUTE
server.registerModuleRoutes();

// 5.1 ACCOUNTS ROUTER
const app = server.getApp();
const accountRouter = createAccountRouter(Account, Role);
app.use('/auth/accounts', accountRouter);

// 6. ERROR HANDLERS
server.setupErrorHandlers();

// 7. AVVIA SERVER
app.listen(config.port, () => {
  // ...
});
```

---

## 🎯 Nota Importante

Questo approccio usa il **pattern factory** come le altre route (`createAuthRouter`, `createAccountRouter`), passando i modelli inizializzati al constructor del controller.

È lo stesso pattern usato per `AuthController` e `SessionController` nel tuo codice esistente.

// src/modules/auth/types/auth.types.ts

// ============================================================================
// ACCOUNT TYPES
// ============================================================================

// 'partner' e 'agente' non sono mai stati usati (nessuna validazione li
// ammetteva davvero, vedi accountSchemas.ts): un partner e' un account
// 'cliente' collegato a un'anagrafica di tipo partner, un agente e' un
// account 'operatore' - vedi discussione del 17/09/2026.
export type AccountType = 'operatore' | 'cliente';

export interface AccountAttributes {
  id: number; // ✅ AGGIORNATO: number invece di string (pattern dual-key)
  uuid: string; // ✅ NUOVO: UUID pubblico
  email: string;
  password?: string;
  accountType: AccountType;
  entityId: string;
  tenantId: number; // ✅ NUOVO (ADR009): FK verso tenants. Mai null a regime.
  roleId: number; // ✅ NUOVO: FK verso roles
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SESSION & RESET TOKEN TYPES
// ============================================================================

export interface SessionAttributes {
  id: number; // ✅ AGGIORNATO: number invece di string
  accountId: number; // ✅ AGGIORNATO: number
  refreshToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isRevoked: boolean;
  createdAt: Date;
}

export interface ResetTokenAttributes {
  id: number; // ✅ AGGIORNATO: number invece di string
  token: string;
  accountId: number; // ✅ AGGIORNATO: number
  expiresAt: Date;
  used: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ============================================================================
// RBAC TYPES (NUOVO)
// ============================================================================

export interface RoleAttributes {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermissionAttributes {
  id: number;
  roleId: number;
  permission: string;
  createdAt: Date;
}

// Moduli disponibili nel sistema
export type Module = 'spedizioni' | 'gestione' | 'report' | 'sistema' | '*'; // wildcard globale

// Azioni disponibili
export type Action = 'read' | 'create' | 'update' | 'delete' | 'approve' | 'export' | '*'; // wildcard azioni

// Un permesso è una stringa nel formato 'modulo.azione' o wildcard
export type Permission = string; // es: 'spedizioni.read', 'gestione.*', '*'

// ============================================================================
// MULTI-TENANT FEATURE TOGGLING (ADR009)
// ============================================================================

// Moduli applicativi attivabili per tenant (feature toggling).
// Concetto distinto da `Module` sopra: quello è il dominio dei permessi RBAC
// (es. 'spedizioni.read'), questo è "quali moduli il tenant ha acquistato/attivato"
// (es. mostrare o no la voce Vehicles/Vigilo nel menu).
// ADR047: le chiavi vere stanno nel catalogo (tabella modules); questo tipo
// elenca solo quelle note al codice. 'vehicles' e' stato sostituito da 'vigilo'.
export type FeatureModule = 'vigilo' | 'spedizioni' | 'tracking' | '*'; // wildcard = tutti i moduli (tenant di sistema EDG)

export interface TenantAttributes {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  sector?: string | null; // ADR047: settore di attivita, vale per tutti i moduli
  isSystem: boolean;
  isActive: boolean;
  defaultLocale?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ADR047: la riga di tenant_modules e' ora un'attivazione (stato, periodo, config)
export type { ActivationAttributes as TenantModuleAttributes } from './module.types';

// ============================================================================
// REQUEST/RESPONSE DTOs
// ============================================================================

export interface RegisterRequest {
  email: string;
  password: string;
  accountType: AccountType;
  entityId: string;
  roleId: number; // ✅ NUOVO: ruolo da assegnare
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseAccount {
  id: number;
  email: string;
  accountType: AccountType;
  tenantId: number; // ✅ NUOVO (ADR009)
  roleId: number;
  permissions: string[]; // ✅ AGGIUNTO: Array di permessi dell'utente
  roleName?: string; // ✅ AGGIUNTO: Nome del ruolo per UI/debug
  modules: string[]; // ✅ NUOVO (ADR009): moduli attivi del tenant, solo per UX frontend. Valori attesi: FeatureModule
  tenantName?: string | null; // ✅ NUOVO: nome del tenant, solo per la pagina profilo (display, non usato per la sicurezza)
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  account: LoginResponseAccount;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ============================================================================
// JWT TOKEN PAYLOAD
// ============================================================================

export interface AuthTokenPayload {
  accountId: number; // ✅ AGGIORNATO: number
  email: string;
  accountType: AccountType;
  tenantId: number; // ✅ NUOVO (ADR009): usato dal moduleGuard del gateway per la verifica di sicurezza
  roleId: number; // ✅ NUOVO
  permissions: string[]; // ✅ NUOVO: array di permessi ['spedizioni.*', 'report.read', ...]
  modules: string[]; // ✅ NUOVO (ADR009): moduli attivi del tenant ['vehicles', 'vigilo', ...] o ['*']. Valori attesi: FeatureModule
  sessionId?: number; // ✅ AGGIORNATO: number

  // JWT standard fields (aggiunti automaticamente da jsonwebtoken)
  iat?: number; // issued at
  exp?: number; // expiration
  iss?: string; // issuer
}

// ============================================================================
// EXTENDED REQUEST TYPE
// ============================================================================

export interface RequestWithAccount extends Request {
  account?: AccountAttributes;
  accountId?: number; // ✅ AGGIORNATO: number
}

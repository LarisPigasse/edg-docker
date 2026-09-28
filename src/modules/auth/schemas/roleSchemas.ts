// =============================================================================
// EDG Auth Service - Schema Joi: Role (permessi)
// =============================================================================
import Joi from 'joi';

// Formato di un permesso: modulo.azione o modulo.* (jolly di modulo), con
// prefisso opzionale "!" per negazione esplicita — stesso formato letto da
// rbac.ts/permissionMiddleware.ts in system-service/vehicle-service e da
// requireRoot() qui in auth-service. Il jolly globale '*' non rientra in
// questo pattern (non contiene un punto): va rifiutato esplicitamente dal
// controller, non solo escluso dalla regex — vedi updateRolePermissions in
// AccountController.ts.
const PERMISSION_PATTERN = /^!?[a-z]+\.(\*|[a-z]+)$/;

export const roleSchemas = {
  updatePermissions: Joi.object({
    permissions: Joi.array()
      .items(
        Joi.string().pattern(PERMISSION_PATTERN).label('Permesso').messages({
          'string.pattern.base': 'Formato permesso non valido (atteso "modulo.azione" o "modulo.*")',
        })
      )
      .label('Permessi')
      .required()
      .messages({
        'any.required': "L'elenco permessi è obbligatorio",
      }),
  }),
};

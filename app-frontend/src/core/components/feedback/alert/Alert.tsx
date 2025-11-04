// src/core/components/ui/Alert.tsx
import React from "react";
import { AlertTriangle, Info, CheckCircle, XCircle, X } from "lucide-react";
import { ThemedSurface, ThemedText } from "../../atomic";
import { cn } from "../../../utils";

export type AlertVariant = "info" | "success" | "warning" | "danger";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variante visiva dell'alert */
  variant?: AlertVariant;
  /** Titolo dell'alert */
  title?: string;
  /** Contenuto dell'alert */
  children: React.ReactNode;
  /** Mostra pulsante di chiusura */
  closable?: boolean;
  /** Callback per chiusura */
  onClose?: () => void;
  /** Icona personalizzata (sovrascrive quella di default) */
  icon?: React.ReactNode;
  /** Nascondi icona completamente */
  hideIcon?: boolean;
  /** Classi CSS aggiuntive */
  className?: string;
}

/**
 * Alert - Componente per messaggi informativi in-page.
 *
 * Features:
 * - 4 varianti semantiche con colori appropriati
 * - Icone automatiche per ogni variante
 * - Supporto titolo + contenuto
 * - Dismissible con pulsante close
 * - Integrazione completa theme system
 * - In-flow positioning (non overlay)
 * - Accessibility con ARIA role
 *
 * @example
 * <Alert variant="success" title="Successo" closable onClose={handleClose}>
 *   L'operazione è stata completata con successo.
 * </Alert>
 */
export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  children,
  closable = false,
  onClose,
  icon,
  hideIcon = false,
  className = "",
  ...props
}) => {
  // Configurazione varianti con CSS custom properties del theme
  const variantConfig = {
    info: {
      surface: "info" as const,
      textColor: "text-modal-info-text",
      iconColor: "text-modal-info-text",
      icon: Info,
    },
    success: {
      surface: "primary" as const, // Usiamo primary con override colore custom
      textColor: "text-modal-success-text",
      iconColor: "text-modal-success-text",
      icon: CheckCircle,
    },
    warning: {
      surface: "primary" as const, // Usiamo primary con override colore custom
      textColor: "text-modal-warning-text",
      iconColor: "text-modal-warning-text",
      icon: AlertTriangle,
    },
    danger: {
      surface: "primary" as const, // Usiamo primary con override colore custom
      textColor: "text-modal-danger-text",
      iconColor: "text-modal-danger-text",
      icon: XCircle,
    },
  };

  const config = variantConfig[variant];
  const IconComponent = icon || config.icon;

  // CSS custom per background delle varianti
  const backgroundClasses = {
    info: "bg-modal-info-bg",
    success: "bg-modal-success-bg",
    warning: "bg-modal-warning-bg",
    danger: "bg-modal-danger-bg",
  };

  return (
    <ThemedSurface
      variant={config.surface}
      borderVariant="thin"
      className={cn("rounded-lg p-4", backgroundClasses[variant], className)}
      role="alert"
      aria-live="polite"
      {...props}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        {!hideIcon && (
          <div className="flex-shrink-0 mt-0.5">
            {React.isValidElement(IconComponent) ? (
              IconComponent
            ) : (
              <IconComponent className={cn("w-5 h-5", config.iconColor)} />
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <ThemedText variant="primary" className={cn("font-semibold mb-1", config.textColor)} as="h4">
              {title}
            </ThemedText>
          )}

          <ThemedText variant="primary" className={cn("text-sm leading-relaxed", config.textColor)}>
            {children}
          </ThemedText>
        </div>

        {/* Close Button */}
        {closable && onClose && (
          <button
            onClick={onClose}
            className={cn(
              "flex-shrink-0 ml-2 p-1 rounded-lg transition-colors",
              "hover:bg-black/10 dark:hover:bg-white/10",
              config.iconColor
            )}
            aria-label="Chiudi alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </ThemedSurface>
  );
};

export default Alert;

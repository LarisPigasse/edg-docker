// src/core/components/ui/ConfirmModal.tsx
import React from "react";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { ThemedSurface, ThemedText } from "../../atomic";
import { Button } from "..";
import { Modal } from "..";
import { cn } from "../../../utils";

export type ConfirmVariant = "default" | "danger" | "warning" | "success" | "info";

interface ConfirmModalProps {
  /** Stato aperto/chiuso del modal */
  isOpen: boolean;
  /** Callback per chiusura modal */
  onClose: () => void;
  /** Callback per conferma */
  onConfirm: () => void;
  /** Titolo del modal */
  title: string;
  /** Messaggio di conferma */
  message: string;
  /** Variante visiva del modal */
  variant?: ConfirmVariant;
  /** Testo del pulsante di conferma */
  confirmText?: string;
  /** Testo del pulsante di annullamento */
  cancelText?: string;
  /** Stato loading del pulsante conferma */
  isLoading?: boolean;
  /** Testo durante loading */
  loadingText?: string;
  /** Dettagli aggiuntivi */
  details?: string;
}

/**
 * ConfirmModal component integrato nel theme system EDG.
 * Modal specializzato per conferme usando CSS custom properties e componenti atomici.
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = "default",
  confirmText,
  cancelText = "Annulla",
  isLoading = false,
  loadingText = "Elaborazione...",
  details,
}) => {
  // 🎨 Configuration per varianti - USA IL NOSTRO THEME SYSTEM
  const variantConfig = {
    default: {
      icon: Info,
      iconColor: "text-text-info",
      iconBg: "bg-modal-info-bg",
      confirmButton: "primary" as const,
      defaultConfirmText: "Conferma",
    },
    danger: {
      icon: XCircle,
      iconColor: "text-modal-danger-text",
      iconBg: "bg-modal-danger-bg",
      confirmButton: "danger" as const,
      defaultConfirmText: "Elimina",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-modal-warning-text",
      iconBg: "bg-modal-warning-bg",
      confirmButton: "warning" as const,
      defaultConfirmText: "Procedi",
    },
    success: {
      icon: CheckCircle,
      iconColor: "text-modal-success-text",
      iconBg: "bg-modal-success-bg",
      confirmButton: "success" as const,
      defaultConfirmText: "Conferma",
    },
    info: {
      icon: Info,
      iconColor: "text-modal-info-text",
      iconBg: "bg-modal-info-bg",
      confirmButton: "info" as const,
      defaultConfirmText: "Ok",
    },
  };

  const config = variantConfig[variant];
  const IconComponent = config.icon;
  const finalConfirmText = confirmText || config.defaultConfirmText;

  // 🎯 Handle confirm
  const handleConfirm = () => {
    onConfirm();
  };

  // 🎨 Footer con pulsanti - USA THEMEDDSURFACE
  const footer = (
    <div className="flex items-center justify-end space-x-3">
      <Button variant="ghost" onClick={onClose} disabled={isLoading}>
        {cancelText}
      </Button>
      <Button variant={config.confirmButton} onClick={handleConfirm} isLoading={isLoading} loadingText={loadingText}>
        {finalConfirmText}
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" footer={footer} preventClose={isLoading}>
      {/* Content con ThemedSurface */}
      <ThemedSurface variant="modal" borderVariant="none" className="p-6">
        {/* Icon + Message */}
        <div className="flex items-start space-x-4">
          {/* Icon Container - USA CSS CUSTOM PROPERTIES */}
          <ThemedSurface
            variant="modal"
            borderVariant="none"
            className={cn("flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center", config.iconBg)}
          >
            <IconComponent className={cn("w-6 h-6", config.iconColor)} />
          </ThemedSurface>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Message */}
            <ThemedText variant="primary" className="leading-relaxed">
              {message}
            </ThemedText>

            {/* Details */}
            {details && (
              <ThemedText variant="secondary" className="mt-3 text-sm leading-relaxed">
                {details}
              </ThemedText>
            )}
          </div>
        </div>
      </ThemedSurface>
    </Modal>
  );
};

export default ConfirmModal;
export type { ConfirmVariant };

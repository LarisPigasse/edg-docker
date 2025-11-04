// src/core/components/ui/toast/Toast.context.ts
import { createContext } from "react";

// Tipi
export type ToastSeverity = "default" | "danger";
export type ToastPosition = "top-right" | "bottom-right";

export interface ToastProps {
  title?: string;
  description?: string;
  severity?: ToastSeverity;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastItem extends ToastProps {
  id: string;
}

// Definiamo un nuovo tipo per la funzione toast e le sue varianti
type ToastFunction = (props: ToastProps) => void;

interface ToastVariants {
  danger: (props: Omit<ToastProps, "severity">) => void;
}

// Il contesto ora espone un unico oggetto `toast` che è sia una funzione sia un oggetto con metodi
export type ToastContextValue = ToastFunction & ToastVariants;

// Creazione del Contesto
export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

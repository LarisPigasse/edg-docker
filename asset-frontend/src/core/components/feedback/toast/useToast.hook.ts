// src/core/components/ui/toast/useToast.hook.ts
import { useContext } from "react";
import { ToastContext } from "./Toast.context";

/**
 * Hook per accedere al sistema di notifiche Toast da qualsiasi componente.
 * Deve essere usato all'interno di un ToastProvider.
 */
export const useToast = () => useContext(ToastContext);

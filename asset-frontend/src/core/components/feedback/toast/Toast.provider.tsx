// src/core/components/ui/toast/Toast.provider.tsx
import React, { useState, useCallback } from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { ToastContext, type ToastProps, type ToastItem } from "./Toast.context";
import { Toaster } from "./Toast";

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Definiamo la funzione base `toast`
  const toast = useCallback((props: ToastProps) => {
    const id = Date.now().toString() + Math.random();
    setToasts((prev) => [...prev, { ...props, id }]);
  }, []);

  // Definiamo la variante `danger`
  const danger = useCallback(
    (props: Omit<ToastProps, "severity">) => {
      toast({ ...props, severity: "danger" });
    },
    [toast]
  );

  // Uniamo la funzione base con le sue varianti in un unico oggetto
  const toastFunction = Object.assign(toast, {
    danger: danger,
  });

  return (
    <RadixToast.Provider swipeDirection="right">
      {/* Forniamo l'oggetto completo al contesto */}
      <ToastContext.Provider value={toastFunction}>
        {children}
        <Toaster toasts={toasts} setToasts={setToasts} />
      </ToastContext.Provider>
    </RadixToast.Provider>
  );
};

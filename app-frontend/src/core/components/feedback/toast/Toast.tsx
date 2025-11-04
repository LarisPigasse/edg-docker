// src/core/components/ui/toast/Toast.tsx
import React from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { X, Info, AlertTriangle } from "lucide-react";
import { ThemedSurface, ThemedText } from "../../atomic";
import { Button } from "../../ui";
import { cn } from "../../../utils";
import type { ToastItem, ToastPosition } from "./Toast.context";

/**
 * Toaster: il contenitore che renderizza i toast. Gestito da ToastProvider.
 */
export const Toaster: React.FC<{
  toasts: ToastItem[];
  setToasts: React.Dispatch<React.SetStateAction<ToastItem[]>>;
  position?: ToastPosition;
}> = ({ toasts, setToasts, position = "bottom-right" }) => {
  const positionClasses: Record<ToastPosition, string> = {
    "top-right": "top-0 right-0",
    "bottom-right": "bottom-0 right-0",
  };

  return (
    <RadixToast.Viewport className={cn("fixed p-6 flex flex-col gap-3 z-[100]", positionClasses[position])}>
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          {...toast}
          onOpenChange={(open) => !open && setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
        />
      ))}
    </RadixToast.Viewport>
  );
};

/**
 * Il componente visivo per il singolo toast. Gestito da Toaster.
 */
const ToastComponent: React.FC<RadixToast.ToastProps & ToastItem> = ({
  title,
  description,
  severity = "default",
  action,
  ...props
}) => {
  const titleColor = severity === "danger" ? "text-text-error" : "text-text-primary";
  const Icon = severity === "danger" ? AlertTriangle : Info;

  return (
    <RadixToast.Root
      {...props}
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out",
        "data-[state=closed]:fade-out-80 data-[state=open]:fade-in-0",
        "data-[swipe=end]:slide-out-to-right-full",
        "data-[state=open]:slide-in-from-bottom-full data-[state=open]:sm:slide-in-from-right-full"
      )}
    >
      <ThemedSurface
        variant="modal"
        borderVariant="default"
        className="w-full max-w-sm rounded-lg shadow-lg p-4 flex items-start gap-4"
      >
        <div className="flex-shrink-0 mt-1">
          <Icon className={cn("h-5 w-5", severity === "danger" ? "text-text-error" : "text-text-secondary")} />
        </div>

        <div className="flex-1">
          {title && (
            <RadixToast.Title asChild>
              <ThemedText as="h3" weight="semibold" className={titleColor}>
                {title}
              </ThemedText>
            </RadixToast.Title>
          )}
          {description && (
            <RadixToast.Description asChild>
              <ThemedText variant="secondary" className="text-sm mt-1">
                {description}
              </ThemedText>
            </RadixToast.Description>
          )}
          {action && (
            <div className="mt-3">
              <Button variant="ghost" size="sm" onClick={action.onClick}>
                {action.label}
              </Button>
            </div>
          )}
        </div>

        <RadixToast.Close asChild>
          <button className="p-1 rounded-full hover:bg-bg-hover transition-colors -mt-1 -mr-1">
            <X className="h-4 w-4 text-text-secondary" />
          </button>
        </RadixToast.Close>
      </ThemedSurface>
    </RadixToast.Root>
  );
};

// src/core/components/ui/sheet/Sheet.tsx
import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ThemedSurface, ThemedText } from "../../atomic";
import { cn } from "../../../utils";

export type SheetSide = "top" | "bottom" | "left" | "right";

interface SheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: SheetSide;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  className?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onOpenChange,
  children,
  side = "right",
  title,
  description,
  footer,
  className,
}) => {
  const sideConfig: Record<SheetSide, string> = {
    top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
    bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
    left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
    right:
      "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed z-50 gap-4 bg-bg-modal shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
            sideConfig[side],
            className
          )}
        >
          <ThemedSurface variant="modal" className="h-full flex flex-col">
            {/* Header */}
            {(title || description) && (
              <div className="flex flex-col space-y-1.5 text-center sm:text-left p-6 border-b border-border-default">
                {title && (
                  <Dialog.Title asChild>
                    <ThemedText as="h2" weight="semibold">
                      {title}
                    </ThemedText>
                  </Dialog.Title>
                )}
                {description && (
                  <Dialog.Description asChild>
                    <ThemedText variant="secondary" className="text-sm">
                      {description}
                    </ThemedText>
                  </Dialog.Description>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 border-t border-border-default">
                {footer}
              </div>
            )}

            <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
              <X className="h-4 w-4 text-text-secondary" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </ThemedSurface>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Sheet;

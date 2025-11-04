// src/core/components/ui/tabs/Tabs.tsx
import React, { useState } from "react";
import { ThemedSurface } from "../atomic";
import { Button } from ".";
import { cn } from "../../../utils";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

// ✨ NUOVO: Tipi esportati
export type TabsVariant = "default" | "pills" | "underline";
export type TabsSize = "sm" | "md" | "lg";

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: TabItem[];
  defaultTab?: string;
  variant?: TabsVariant;
  size?: TabsSize;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultTab,
  variant = "default",
  size = "md",
  onTabChange,
  className = "",
  ...props
}) => {
  // ... (tutto il resto del codice del componente rimane invariato)
};

export default Tabs;

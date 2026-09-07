// src/core/components/ui/tabs/Tabs.tsx
import React, { useState } from "react";


import { cn } from "../../../utils";

export interface TabItem {
  id: string;
  label: React.ReactNode;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  size: _size = "md",
  onTabChange,
  className = "",
  ...props
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || (items.length > 0 ? items[0].id : ""));

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const currentTab = items.find((item) => item.id === activeTab);

  // Varianti visive
  const variantClasses = {
    default: "border-b border-border-default",
    pills: "p-1 bg-bg-secondary rounded-lg",
    underline: "border-b-2 border-transparent",
  };

  const tabClasses = {
    default: (isActive: boolean) =>
      cn(
        "px-4 py-2 -mb-px border-b-2 transition-colors",
        isActive
          ? "border-violet-600 text-violet-600 font-medium"
          : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong"
      ),
    pills: (isActive: boolean) =>
      cn(
        "px-4 py-1.5 rounded-md transition-all",
        isActive
          ? "bg-bg-primary text-text-primary shadow-sm"
          : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
      ),
    underline: (isActive: boolean) =>
      cn(
        "px-4 py-2 border-b-2 transition-colors",
        isActive
          ? "border-violet-600 text-violet-600"
          : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-default"
      ),
  };

  return (
    <div className={cn("w-full", className)} {...props}>
      {/* Tab List */}
      <div className={cn("flex overflow-x-auto no-scrollbar", variantClasses[variant])}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => !item.disabled && handleTabClick(item.id)}
            disabled={item.disabled}
            className={cn(
              "whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 rounded-sm",
              tabClasses[variant](activeTab === item.id),
              item.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {currentTab && (
          <div key={currentTab.id} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
            {currentTab.content}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tabs;

// src/core/components/ui/Table.tsx
import React, { ReactNode } from "react";
import { cn } from "../../../utils/";
import { ActionMenu, EditAction, DeleteAction } from "../../actions";
import type { Action } from "../../actions";
import { X } from "lucide-react";

export interface TableColumn<T> {
  header: string | (() => ReactNode);
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
  sortable?: boolean;
  /** Rende la cella cliccabile come link */
  clickable?: boolean;
  /** Callback per celle cliccabili */
  onCellClick?: (item: T) => void;
  /** Variante colore per celle cliccabili */
  clickVariant?: "primary" | "secondary" | "danger" | "success";
}

/** Configurazione azioni per ogni riga */
export interface TableRowActions<T> {
  /** Abilita colonna azioni */
  enabled: boolean;
  /** Posizione della colonna azioni */
  position?: "start" | "end";
  /** Header della colonna azioni */
  header?: string;
  /** Azioni personalizzate */
  actions?: (item: T) => Action[];
  /** Azioni predefinite */
  quickActions?: {
    /** Azione di modifica */
    edit?: {
      enabled: boolean;
      onEdit: (item: T) => void;
      canEdit?: (item: T) => boolean;
      showLabel?: boolean;
    };
    /** Azione di eliminazione */
    delete?: {
      enabled: boolean;
      onDelete: (item: T) => void;
      canDelete?: (item: T) => boolean;
      requireConfirmation?: boolean;
      getItemName?: (item: T) => string;
      showLabel?: boolean;
    };
  };
  /** Modalità di visualizzazione */
  mode?: "menu" | "buttons" | "mixed";
}

export type TableSize = "sm" | "md" | "lg";

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  size?: TableSize;
  striped?: boolean;
  hoverable?: boolean;
  /** Callback per click su intera riga */
  onRowClick?: (item: T) => void;
  /** Configurazione azioni riga */
  rowActions?: TableRowActions<T>;
}

/**
 * Componente Table semplificato per il theme system EDG.
 * Per tabelle complesse con sorting/filtering/pagination usare TanStack Table.
 */
function Table<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyMessage = "Nessun dato disponibile",
  className = "",
  size = "md",
  striped = false,
  hoverable = true,
  onRowClick,
  rowActions,
}: TableProps<T>) {
  // 📏 Size variants con CSS custom properties
  const sizeClasses = {
    sm: "text-sm",
    md: "text-sm",
    lg: "text-base",
  };

  const cellPaddingClasses = {
    sm: "px-3 py-2",
    md: "px-4 py-3",
    lg: "px-6 py-4",
  };

  const headerPaddingClasses = {
    sm: "px-3 py-2",
    md: "px-4 py-3",
    lg: "px-6 py-4",
  };

  // 📊 Prepare columns with actions (MOVED BEFORE EARLY RETURNS)
  const preparedColumns = React.useMemo(() => {
    const cols = [...columns];

    if (rowActions?.enabled) {
      const actionsColumn: TableColumn<T> = {
        header: rowActions.header || "Azioni",
        accessor: () => null, // Will be overridden in render
        className: "w-20", // Fixed width for actions
      };

      if (rowActions.position === "start") {
        cols.unshift(actionsColumn);
      } else {
        cols.push(actionsColumn);
      }
    }

    return cols;
  }, [columns, rowActions]);

  // 🔄 Loading state
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500"></div>
          <span className="text-text-secondary">Caricamento in corso...</span>
        </div>
      </div>
    );
  }

  // 📭 Empty state
  if (data.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center">
        <X className="h-10 w-10 mb-4" strokeWidth={1.5} />
        <p className="text-text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  // 🎯 Row click handler
  const handleRowClick = (item: T) => {
    if (onRowClick) {
      onRowClick(item);
    }
  };

  // 🎨 Get clickable cell classes
  const getClickableCellClasses = (column: TableColumn<T>) => {
    if (!column.clickable) return "";

    const variantClasses = {
      primary: "text-violet-600 hover:text-violet-700 cursor-pointer",
      secondary: "text-text-secondary hover:text-text-primary cursor-pointer",
      danger: "text-red-600 hover:text-red-700 cursor-pointer",
      success: "text-green-600 hover:text-green-700 cursor-pointer",
    };

    return cn(
      "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-sm",
      variantClasses[column.clickVariant || "primary"]
    );
  };

  // 🛠️ Generate actions for row
  const generateRowActions = (item: T): Action[] => {
    if (!rowActions?.enabled) return [];

    const actions: Action[] = [];

    // Custom actions first
    if (rowActions.actions) {
      actions.push(...rowActions.actions(item));
    }

    // Quick actions
    if (rowActions.quickActions?.edit?.enabled) {
      const editConfig = rowActions.quickActions.edit;
      const canEdit = editConfig.canEdit?.(item) ?? true;

      actions.push({
        id: "edit",
        label: "Modifica",
        onClick: () => editConfig.onEdit(item),
        disabled: !canEdit,
        variant: "default",
      });
    }

    if (rowActions.quickActions?.delete?.enabled) {
      const deleteConfig = rowActions.quickActions.delete;
      const canDelete = deleteConfig.canDelete?.(item) ?? true;

      actions.push({
        id: "delete",
        label: "Elimina",
        onClick: () => {
          if (deleteConfig.requireConfirmation) {
            const itemName = deleteConfig.getItemName?.(item) || "questo elemento";
            if (window.confirm(`Sei sicuro di voler eliminare ${itemName}?`)) {
              deleteConfig.onDelete(item);
            }
          } else {
            deleteConfig.onDelete(item);
          }
        },
        disabled: !canDelete,
        variant: "danger",
        divider: rowActions.quickActions?.edit?.enabled, // Add divider if edit is also enabled
      });
    }

    return actions;
  };

  // 🎨 Render actions cell
  const renderActionsCell = (item: T) => {
    if (!rowActions?.enabled) return null;

    const actions = generateRowActions(item);
    if (actions.length === 0) return null;

    const mode = rowActions.mode || "menu";

    switch (mode) {
      case "buttons":
        return (
          <div className="flex items-center space-x-1">
            {rowActions.quickActions?.edit?.enabled && (
              <EditAction
                item={item}
                onEdit={rowActions.quickActions.edit.onEdit}
                canEdit={rowActions.quickActions.edit.canEdit}
                showLabel={rowActions.quickActions.edit.showLabel}
                size={size === "sm" ? "xs" : "xs"}
              />
            )}
            {rowActions.quickActions?.delete?.enabled && (
              <DeleteAction
                item={item}
                onDelete={rowActions.quickActions.delete.onDelete}
                canDelete={rowActions.quickActions.delete.canDelete}
                requireConfirmation={rowActions.quickActions.delete.requireConfirmation}
                getItemName={rowActions.quickActions.delete.getItemName}
                showLabel={rowActions.quickActions.delete.showLabel}
                size={size === "sm" ? "xs" : "xs"}
              />
            )}
          </div>
        );

      case "mixed": {
        // Show primary actions as buttons, others in menu
        const secondaryActions = actions.filter((a) => !["edit", "delete"].includes(a.id));

        return (
          <div className="flex items-center space-x-1">
            {/* Render primary actions as individual buttons */}
            {rowActions.quickActions?.edit?.enabled && (
              <EditAction
                item={item}
                onEdit={rowActions.quickActions.edit.onEdit}
                canEdit={rowActions.quickActions.edit.canEdit}
                showLabel={rowActions.quickActions.edit.showLabel}
                size={size === "sm" ? "xs" : "xs"}
              />
            )}
            {rowActions.quickActions?.delete?.enabled && (
              <DeleteAction
                item={item}
                onDelete={rowActions.quickActions.delete.onDelete}
                canDelete={rowActions.quickActions.delete.canDelete}
                requireConfirmation={rowActions.quickActions.delete.requireConfirmation}
                getItemName={rowActions.quickActions.delete.getItemName}
                showLabel={rowActions.quickActions.delete.showLabel}
                size={size === "sm" ? "xs" : "xs"}
              />
            )}
            {/* Render secondary actions in menu */}
            {secondaryActions.length > 0 && (
              <ActionMenu actions={secondaryActions} size={size === "sm" ? "sm" : "md"} align="end" />
            )}
          </div>
        );
      }

      case "menu":
      default:
        return <ActionMenu actions={actions} size={size === "sm" ? "sm" : "md"} align="end" />;
    }
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className={cn("min-w-full divide-y divide-border-default", sizeClasses[size])}>
        {/* 📊 Table Header */}
        <thead className="bg-bg-secondary">
          <tr>
            {preparedColumns.map((column, index) => (
              <th
                key={index}
                className={cn(
                  headerPaddingClasses[size],
                  "text-xs font-medium text-text-secondary uppercase tracking-wider",
                  column.className?.includes("text-right") ? "text-right" : "text-left",
                  column.className
                )}
              >
                <div className="flex items-center space-x-1">
                  <span>{typeof column.header === "function" ? column.header() : column.header}</span>
                  {column.sortable && (
                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                      />
                    </svg>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* 📋 Table Body */}
        <tbody className="bg-bg-primary divide-y divide-border-default">
          {data.map((item, rowIndex) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => handleRowClick(item)}
              className={cn("transition-colors duration-200", {
                "hover:bg-bg-hover": hoverable,
                "bg-bg-secondary/30": striped && rowIndex % 2 === 1,
                "cursor-pointer": onRowClick,
              })}
            >
              {preparedColumns.map((column, colIndex) => {
                // Handle actions column
                const isActionsColumn =
                  rowActions?.enabled &&
                  ((rowActions.position === "start" && colIndex === 0) ||
                    (rowActions.position !== "start" && colIndex === preparedColumns.length - 1));

                if (isActionsColumn) {
                  return (
                    <td
                      key={colIndex}
                      className={cn(cellPaddingClasses[size], "whitespace-nowrap", column.className)}
                      onClick={(e) => e.stopPropagation()} // Prevent row click
                    >
                      {renderActionsCell(item)}
                    </td>
                  );
                }

                // Handle regular columns
                const cellContent = typeof column.accessor === "function" ? column.accessor(item) : item[column.accessor];

                const isClickableCell = column.clickable;

                return (
                  <td
                    key={colIndex}
                    onClick={
                      isClickableCell
                        ? (e) => {
                            e.stopPropagation(); // Prevent row click
                            if (column.onCellClick) {
                              column.onCellClick(item);
                            }
                          }
                        : undefined
                    }
                    className={cn(
                      cellPaddingClasses[size],
                      "whitespace-nowrap text-text-primary",
                      getClickableCellClasses(column),
                      column.className
                    )}
                  >
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
export type { TableColumn, TableSize, TableRowActions };

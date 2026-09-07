// src/core/components/ui/Table.tsx
import React, { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../../utils/';
import { ActionMenu, EditAction, DeleteAction } from '../../actions';
import type { Action } from '../../actions';
import { X, ArrowUp, ArrowDown, ArrowUpDown, ChevronRight } from 'lucide-react';

export interface TableColumn<T> {
  header: string | (() => ReactNode);
  accessor: keyof T | ((item: T) => ReactNode);
  /** Renderer opzionale per la visualizzazione — usato quando accessor è una chiave stringa
   *  ma si vuole mostrare un valore formattato/styled diverso dal raw value.
   *  Il sorting avviene sul valore di accessor, la visualizzazione usa render. */
  render?: (item: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  clickable?: boolean;
  onCellClick?: (item: T) => void;
  clickVariant?: 'primary' | 'secondary' | 'danger' | 'success';
}

/** Configurazione azioni per ogni riga */
export interface TableRowActions<T> {
  /** Abilita colonna azioni */
  enabled: boolean;
  /** Posizione della colonna azioni */
  position?: 'start' | 'end';
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
  mode?: 'menu' | 'buttons' | 'mixed';
}

export type TableSize = 'sm' | 'md' | 'lg';

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
  /** Riga di dettaglio opzionale sotto la riga, per pochi campi extra —
   *  alternativa più leggera di una modal quando i dati da mostrare sono pochi */
  expandable?: {
    render: (item: T) => ReactNode;
  };
}

// Sorting configuration
interface SortConfig<T> {
  key: keyof T | string;
  direction: 'asc' | 'desc';
}

/**
 * Componente Table con sorting client-side per il theme system EDG.
 * Supporta ordinamento su colonne con sortable=true.
 * Per tabelle enterprise con server-side sorting, usare TanStack Table.
 */
function Table<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'Nessun dato disponibile',
  className = '',
  size = 'md',
  striped = false,
  hoverable = true,
  onRowClick,
  rowActions,
  expandable,
}: TableProps<T>) {
  // 🔄 Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null);

  // 📂 Expanded rows state (solo se `expandable` è passato)
  const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set());

  const toggleExpanded = (key: string | number) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // 📏 Size variants con CSS custom properties
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
  };

  const cellPaddingClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const headerPaddingClasses = {
    sm: 'px-3 py-3',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  // 📊 Sort data based on current config
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    const sorted = [...data].sort((a, b) => {
      // Get column definition
      const column = columns.find(col => {
        if (typeof col.accessor === 'function') return false;
        return col.accessor === sortConfig.key;
      });

      if (!column || typeof column.accessor === 'function') return 0;

      const aValue = a[column.accessor];
      const bValue = b[column.accessor];

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        // Fallback to string comparison
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortConfig, columns]);

  // 📊 Prepare columns with actions
  const preparedColumns = React.useMemo(() => {
    const cols = [...columns];

    if (rowActions?.enabled) {
      const actionsColumn: TableColumn<T> = {
        header: rowActions.header || 'Azioni',
        accessor: () => null, // Will be overridden in render
        className: 'w-20', // Fixed width for actions
      };

      if (rowActions.position === 'start') {
        cols.unshift(actionsColumn);
      } else {
        cols.push(actionsColumn);
      }
    }

    return cols;
  }, [columns, rowActions]);

  // 🎯 Handle column header click for sorting
  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable || typeof column.accessor === 'function') return;

    const key = column.accessor as keyof T;

    setSortConfig(current => {
      // If clicking same column, toggle direction
      if (current && current.key === key) {
        return current.direction === 'asc' ? { key, direction: 'desc' } : null; // Third click removes sorting
      }
      // New column, start with ascending
      return { key, direction: 'asc' };
    });
  };

  // 🎨 Get sorting icon for column
  const getSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable || typeof column.accessor === 'function') return null;

    const key = column.accessor as keyof T;
    const isActive = sortConfig?.key === key;

    if (!isActive) {
      return <ArrowUpDown className='w-4 h-4 text-text-placeholder' />;
    }

    return sortConfig.direction === 'asc' ? (
      <ArrowUp className='w-4 h-4 text-violet-600' />
    ) : (
      <ArrowDown className='w-4 h-4 text-violet-600' />
    );
  };

  // 🔄 Loading state
  if (isLoading) {
    return (
      <div className='p-8 text-center'>
        <div className='flex items-center justify-center space-x-2'>
          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500'></div>
          <span className='text-text-secondary'>Caricamento in corso...</span>
        </div>
      </div>
    );
  }

  // 📭 Empty state
  if (data.length === 0) {
    return (
      <div className='p-8 text-center flex flex-col items-center justify-center'>
        <X className='h-10 w-10 mb-4' strokeWidth={1.5} />
        <p className='text-text-secondary'>{emptyMessage}</p>
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
    if (!column.clickable) return '';

    const variantClasses = {
      primary: 'text-violet-600 hover:text-violet-700 cursor-pointer',
      secondary: 'text-text-secondary hover:text-text-primary cursor-pointer',
      danger: 'text-red-600 hover:text-red-700 cursor-pointer',
      success: 'text-green-600 hover:text-green-700 cursor-pointer',
    };

    return cn(
      'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-sm',
      variantClasses[column.clickVariant || 'primary']
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
        id: 'edit',
        label: 'Modifica',
        onClick: () => editConfig.onEdit(item),
        disabled: !canEdit,
        variant: 'default',
      });
    }

    if (rowActions.quickActions?.delete?.enabled) {
      const deleteConfig = rowActions.quickActions.delete;
      const canDelete = deleteConfig.canDelete?.(item) ?? true;

      actions.push({
        id: 'delete',
        label: 'Elimina',
        onClick: () => {
          if (deleteConfig.requireConfirmation) {
            const itemName = deleteConfig.getItemName?.(item) || 'questo elemento';
            if (window.confirm(`Sei sicuro di voler eliminare ${itemName}?`)) {
              deleteConfig.onDelete(item);
            }
          } else {
            deleteConfig.onDelete(item);
          }
        },
        disabled: !canDelete,
        variant: 'danger',
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

    const mode = rowActions.mode || 'menu';

    switch (mode) {
      case 'buttons':
        return (
          <div className='flex items-center space-x-1'>
            {rowActions.quickActions?.edit?.enabled && (
              <EditAction
                item={item}
                onEdit={rowActions.quickActions.edit.onEdit}
                canEdit={rowActions.quickActions.edit.canEdit}
                showLabel={rowActions.quickActions.edit.showLabel}
                size={size === 'sm' ? 'xs' : 'xs'}
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
                size={size === 'sm' ? 'xs' : 'xs'}
              />
            )}
          </div>
        );

      case 'mixed': {
        // Show primary actions as buttons, others in menu
        const secondaryActions = actions.filter(a => !['edit', 'delete'].includes(a.id));

        return (
          <div className='flex items-center space-x-1'>
            {/* Render primary actions as individual buttons */}
            {rowActions.quickActions?.edit?.enabled && (
              <EditAction
                item={item}
                onEdit={rowActions.quickActions.edit.onEdit}
                canEdit={rowActions.quickActions.edit.canEdit}
                showLabel={rowActions.quickActions.edit.showLabel}
                size={size === 'sm' ? 'xs' : 'xs'}
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
                size={size === 'sm' ? 'xs' : 'xs'}
              />
            )}
            {/* Render secondary actions in menu */}
            {secondaryActions.length > 0 && (
              <ActionMenu actions={secondaryActions} size={size === 'sm' ? 'sm' : 'md'} align='end' />
            )}
          </div>
        );
      }

      case 'menu':
      default:
        return <ActionMenu actions={actions} size={size === 'sm' ? 'sm' : 'md'} align='end' />;
    }
  };

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className={cn('min-w-full divide-y divide-border-default', sizeClasses[size])}>
        {/* 📊 Table Header */}
        <thead className='bg-bg-secondary'>
          <tr>
            {expandable && <th className={cn(headerPaddingClasses[size], 'w-10')}></th>}
            {preparedColumns.map((column, index) => (
              <th
                key={index}
                onClick={() => handleSort(column)}
                className={cn(
                  headerPaddingClasses[size],
                  'text-xs font-medium text-text-secondary uppercase tracking-wider',
                  column.className?.includes('text-right') ? 'text-right' : 'text-left',
                  column.sortable && 'cursor-pointer hover:bg-bg-hover transition-colors',
                  column.className
                )}
              >
                <div className='flex items-center space-x-1'>
                  <span>{typeof column.header === 'function' ? column.header() : column.header}</span>
                  {column.sortable && getSortIcon(column)}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* 📋 Table Body */}
        <tbody className='bg-bg-primary divide-y divide-border-default'>
          {sortedData.map((item, rowIndex) => {
            const key = keyExtractor(item);
            const isExpanded = expandable ? expandedKeys.has(key) : false;

            return (
              <React.Fragment key={key}>
                <tr
                  onClick={() => handleRowClick(item)}
                  className={cn(
                    'transition-colors duration-200',
                    hoverable && 'hover:bg-bg-hover',
                    striped && rowIndex % 2 === 1 && 'bg-bg-secondary/30',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {expandable && (
                    <td
                      className={cn(cellPaddingClasses[size], 'whitespace-nowrap')}
                      onClick={e => {
                        e.stopPropagation(); // Non attivare onRowClick
                        toggleExpanded(key);
                      }}
                    >
                      <ChevronRight
                        className={cn(
                          'w-4 h-4 text-text-secondary transition-transform duration-200 cursor-pointer',
                          isExpanded && 'rotate-90'
                        )}
                      />
                    </td>
                  )}

                  {preparedColumns.map((column, colIndex) => {
                    // Handle actions column
                    const isActionsColumn =
                      rowActions?.enabled &&
                      ((rowActions.position === 'start' && colIndex === 0) ||
                        (rowActions.position !== 'start' && colIndex === preparedColumns.length - 1));

                    if (isActionsColumn) {
                      return (
                        <td
                          key={colIndex}
                          className={cn(cellPaddingClasses[size], 'whitespace-nowrap', column.className)}
                          onClick={e => e.stopPropagation()} // Prevent row click
                        >
                          {renderActionsCell(item)}
                        </td>
                      );
                    }

                    // Handle regular columns
                    const cellContent =
                      typeof column.accessor === 'function'
                        ? column.accessor(item)
                        : column.render
                          ? column.render(item)
                          : item[column.accessor];

                    const isClickableCell = column.clickable;

                    return (
                      <td
                        key={colIndex}
                        onClick={
                          isClickableCell
                            ? e => {
                                e.stopPropagation(); // Prevent row click
                                if (column.onCellClick) {
                                  column.onCellClick(item);
                                }
                              }
                            : undefined
                        }
                        className={cn(
                          cellPaddingClasses[size],
                          'whitespace-nowrap text-text-primary',
                          getClickableCellClasses(column),
                          column.className
                        )}
                      >
                        {cellContent as ReactNode}
                      </td>
                    );
                  })}
                </tr>

                {expandable && isExpanded && (
                  <tr className='bg-bg-secondary/30'>
                    <td colSpan={preparedColumns.length + 1} className={cellPaddingClasses[size]}>
                      {expandable.render(item)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Table;

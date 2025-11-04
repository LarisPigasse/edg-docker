// src/core/components/ui/table/Table.data.ts
import type { ComponentData } from "../../../../core/types";

export const tableData: ComponentData = {
  id: "table",
  title: "Table",
  description:
    "Un componente tabella flessibile per la visualizzazione di dati, con supporto integrato per azioni sulle righe, stati di caricamento e celle cliccabili.",
  category: "data",
  importPath: 'import { Table, type TableColumn, type TableRowActions } from "../core/components/ui";',
  origin: "Custom Component",
  dependence: "ActionMenu, EditAction, DeleteAction",
  props: [
    { name: "data", type: "T[]", required: true, description: "L'array di oggetti da visualizzare nella tabella." },
    {
      name: "columns",
      type: "TableColumn<T>[]",
      required: true,
      description: "La configurazione delle colonne della tabella.",
    },
    {
      name: "keyExtractor",
      type: "(item: T) => string | number",
      required: true,
      description: "Funzione per estrarre una chiave univoca da ogni riga.",
    },
    {
      name: "rowActions",
      type: "TableRowActions<T>",
      description: "Configurazione per la colonna delle azioni (es. modifica, elimina).",
    },
    {
      name: "isLoading",
      type: "boolean",
      defaultValue: "false",
      description: "Mostra uno stato di caricamento al posto della tabella.",
    },
    {
      name: "emptyMessage",
      type: "string",
      defaultValue: '"Nessun dato disponibile"',
      description: "Messaggio da visualizzare quando l'array 'data' è vuoto.",
    },
    { name: "size", type: '"sm" | "md" | "lg"', defaultValue: '"md"', description: "La dimensione del padding delle celle." },
    { name: "striped", type: "boolean", defaultValue: "false", description: "Applica uno sfondo a righe alternate." },
    { name: "hoverable", type: "boolean", defaultValue: "true", description: "Abilita l'effetto hover sulle righe." },
    { name: "onRowClick", type: "(item: T) => void", description: "Callback eseguita quando si clicca su un'intera riga." },
  ],
  examples: [
    {
      title: "Tabella Base",
      description: "Un esempio di tabella semplice con righe a strisce e cliccabili.",
      code: `const users = [{ id: 1, name: 'Mario Rossi', email: 'mario@rossi.it' }];
const columns = [
  { header: 'Nome', accessor: 'name' },
  { header: 'Email', accessor: 'email', clickable: true, onCellClick: (user) => alert(user.email) }
];

<Table 
  data={users} 
  columns={columns} 
  keyExtractor={(user) => user.id}
  striped
  onRowClick={(user) => console.log(user)}
/>`,
    },
    {
      title: "Tabella con Azioni",
      description: "Esempio di come configurare una colonna di azioni con pulsanti di modifica ed eliminazione.",
      code: `const rowActions = {
  enabled: true,
  mode: 'buttons',
  quickActions: {
    edit: { enabled: true, onEdit: (item) => console.log('Edit', item) },
    delete: { enabled: true, onDelete: (item) => console.log('Delete', item) }
  }
};

<Table data={data} columns={columns} keyExtractor={...} rowActions={rowActions} />`,
    },
  ],
  notes:
    "Questo componente è ideale per la visualizzazione di dati semplici. Per funzionalità avanzate come ordinamento, paginazione e filtri, si consiglia di utilizzare una libreria specializzata come TanStack Table.",
};

// src/core/components/data/stat-card/StatCard.data.ts
import type { ComponentData } from '../../../../core/types';

export const statCardData: ComponentData = {
  id: 'statCard',
  title: 'Stat Card',
  description:
    'Card per la visualizzazione di un indicatore numerico (KPI) con icona, colore semantico e stato di caricamento.',
  category: 'data',
  importPath: 'import { StatCard } from "../core/components/data";',
  origin: 'Custom Component',
  dependence: 'Card, Skeleton',
  props: [
    { name: 'title', type: 'string', required: true, description: 'Etichetta del KPI.' },
    { name: 'value', type: 'string | number', required: true, description: 'Valore principale mostrato in grande.' },
    { name: 'icon', type: 'React.ReactNode', required: true, description: 'Icona nel badge colorato a destra.' },
    {
      name: 'color',
      type: 'string',
      required: true,
      description: 'Classi Tailwind per lo sfondo del badge icona (es. "bg-sky-500 dark:bg-sky-600").',
    },
    { name: 'loading', type: 'boolean', defaultValue: 'false', description: 'Mostra uno skeleton al posto del contenuto.' },
    {
      name: 'alert',
      type: 'boolean',
      defaultValue: 'false',
      description: 'Evidenzia la card in rosso per segnalare una criticità.',
    },
    { name: 'subtitle', type: 'string', description: 'Testo secondario sotto il valore principale.' },
    { name: 'onClick', type: '() => void', description: 'Se presente, rende la card cliccabile.' },
  ],
  examples: [
    {
      title: 'KPI semplice',
      description: 'Una card statica, senza interazione.',
      code: `import { Users } from "lucide-react";

<StatCard
  title="Autisti attivi"
  value={24}
  subtitle="su 27 totali"
  icon={<Users className="w-6 h-6 text-white" />}
  color="bg-violet-500 dark:bg-violet-600"
/>`,
    },
    {
      title: 'Con criticità e navigazione',
      description: 'La combinazione "alert + onClick" usata nella Dashboard Veicoli.',
      code: `import { CalendarClock } from "lucide-react";

<StatCard
  title="Scadenze veicoli"
  value={3}
  subtitle="5 in avvicinamento"
  icon={<CalendarClock className="w-6 h-6 text-white" />}
  color="bg-red-500 dark:bg-red-600"
  alert
  onClick={() => navigate("/veicoli/scadenze")}
/>`,
    },
  ],
  notes:
    'Originariamente definito localmente in system/InfoPage.tsx; promosso a componente condiviso per essere riusato nella Dashboard del modulo Veicoli. Il prop onClick è stato aggiunto in questa occasione — retrocompatibile con tutti gli usi esistenti.',
};

// src/core/components/ui/info-card/InfoCard.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const infoCardData: ComponentData = {
  id: "infoCard",
  title: "Info Card",
  description:
    "Una card specializzata, usata nel Component Explorer, per rappresentare un componente del design system in modo visivo e cliccabile.",
  category: "ui",
  importPath: 'import { InfoCard } from "../core/components/ui";',
  origin: "Custom Component",
  dependence: "",
  props: [
    { name: "title", type: "string", required: true, description: "Il nome del componente da visualizzare." },
    { name: "description", type: "string", description: "Una breve descrizione opzionale del componente." },
    {
      name: "category",
      type: '"ui" | "form" | "navigation" | "feedback" | "data" | "layout"',
      required: true,
      description: "La categoria del componente, che ne determina il colore.",
    },
    { name: "onClick", type: "() => void", required: true, description: "La funzione da eseguire al click sulla card." },
    { name: "disabled", type: "boolean", defaultValue: "false", description: "Disabilita la card, rendendola non cliccabile." },
  ],
  examples: [
    {
      title: "Varianti per Categoria",
      description: "Ogni categoria ha un colore associato per una rapida identificazione visiva.",
      code: `<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
  <InfoCard title="Button" category="ui" onClick={() => {}} />
  <InfoCard title="Input" category="form" onClick={() => {}} />
  <InfoCard title="UserMenu" category="navigation" onClick={() => {}} />
  <InfoCard title="Alert" category="feedback" onClick={() => {}} />
  <InfoCard title="Table" category="data" onClick={() => {}} />
  <InfoCard title="MainLayout" category="layout" onClick={() => {}} />
</div>`,
    },
    {
      title: "Stato Disabilitato",
      description: "Una InfoCard può essere disabilitata per rappresentare componenti in arrivo o non disponibili.",
      code: `<InfoCard title="Componente Futuro" category="ui" onClick={() => {}} disabled />`,
    },
    {
      title: "Con Descrizione",
      description: "La descrizione fornisce un contesto aggiuntivo sul componente.",
      code: `<InfoCard 
  title="DatePicker" 
  description="Componente avanzato per la selezione di date con calendario."
  category="form"
  onClick={() => {}}
/>`,
    },
  ],
  notes:
    "Questo componente è stato creato appositamente per l'interfaccia del Component Explorer. La sua altezza è fissa per garantire uniformità nella griglia di visualizzazione. Utilizza classi CSS custom (es. bg-category-ui) definite in global.css per la colorazione.",
};

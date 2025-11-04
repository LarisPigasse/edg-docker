// src/core/components/ui/navigation-menu/NavigationMenu.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const navigationMenuData: ComponentData = {
  id: "navigationMenu",
  title: "Navigation Menu",
  description:
    "Un menu di navigazione multi-livello, accessibile e altamente personalizzabile, con layout a tendina (flyout) e supporto per mega menu.",
  category: "navigation",
  importPath: 'import { NavigationMenu, type NavigationMenuItem } from "../core/components/ui";',
  origin: "Radix UI + Custom Component",
  dependence: "@radix-ui/react-navigation-menu",
  props: [
    {
      name: "items",
      type: "NavigationMenuItem[]",
      required: true,
      description: "L'array di oggetti che definisce la struttura e il contenuto del menu.",
    },
    {
      name: "orientation",
      type: '"horizontal" | "vertical"',
      defaultValue: '"horizontal"',
      description: "L'orientamento della barra del menu principale.",
    },
    {
      name: "triggerVariant",
      type: '"default" | "ghost" | "minimal"',
      defaultValue: '"default"',
      description: "Lo stile dei pulsanti (trigger) che aprono i sottomenu.",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      defaultValue: '"md"',
      description: "La dimensione generale del componente (testo, padding, icone).",
    },
    { name: "disabled", type: "boolean", defaultValue: "false", description: "Disabilita l'intero menu di navigazione." },
  ],
  examples: [
    {
      title: "Menu Semplice a Lista",
      description: "Un sottomenu base con un elenco di link.",
      code: `const menuItems: NavigationMenuItem[] = [{
  trigger: "Prodotti",
  layout: "list",
  content: [
    { title: "Panoramica", href: "/products", description: "Scopri la nostra offerta." },
    { title: "Prezzi", href: "/pricing", description: "Confronta i nostri piani." },
    { title: "Integrazioni", href: "/integrations", badge: { text: "New" } },
  ]
}];

<NavigationMenu items={menuItems} />`,
    },
    {
      title: "Mega Menu a Griglia",
      description: "Un sottomenu complesso con link organizzati in gruppi e colonne, ideale per siti con molte sezioni.",
      code: `const megaMenuItems: NavigationMenuItem[] = [{
  trigger: "Soluzioni",
  layout: "mega",
  content: [
    { 
      title: "Per Ruolo",
      links: [
        { title: "Sviluppatori", href: "/solutions/devs" },
        { title: "Designers", href: "/solutions/designers" },
        { title: "Project Managers", href: "/solutions/pm" },
      ]
    },
    { 
      title: "Per Settore",
      links: [
        { title: "E-commerce", href: "/solutions/ecommerce" },
        { title: "Fintech", href: "/solutions/fintech", external: true },
        { title: "Sanità", href: "/solutions/health" },
      ]
    }
  ]
}];

<NavigationMenu items={megaMenuItems} />`,
    },
  ],
  notes:
    "Il componente è basato su Radix UI per garantire massima accessibilità. La struttura dati passata alla prop 'items' è fondamentale per definire l'aspetto e il comportamento del menu. È possibile combinare diversi tipi di layout nello stesso menu.",
};

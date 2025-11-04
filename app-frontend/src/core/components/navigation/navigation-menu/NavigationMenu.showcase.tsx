// src/core/components/ui/navigation-menu/NavigationMenu.showcase.tsx
import React from "react";
import { NavigationMenu, type NavigationMenuItem } from "./NavigationMenu";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";
import { Code, Book, LifeBuoy, Rocket, Users, Building, ShoppingCart, BarChart } from "lucide-react";

const sampleMenuItems: NavigationMenuItem[] = [
  {
    trigger: "Getting Started",
    layout: "list",
    content: [
      { title: "Introduzione", href: "#", description: "Inizia da qui per una panoramica." },
      { title: "Installazione", href: "#", description: "Come integrare il template." },
      { title: "Struttura del Progetto", href: "#", description: "Scopri l'organizzazione dei file." },
    ],
  },
  {
    trigger: "Componenti",
    layout: "mega",
    width: "xl",
    content: [
      {
        title: "Form",
        links: [
          { title: "Input", href: "#", icon: <Code size={16} /> },
          { title: "Button", href: "#", icon: <Rocket size={16} /> },
          { title: "Select", href: "#", icon: <BarChart size={16} />, badge: { text: "New", variant: "success" } },
        ],
      },
      {
        title: "UI",
        links: [
          { title: "Card", href: "#", icon: <ShoppingCart size={16} /> },
          { title: "Modal", href: "#", icon: <Building size={16} /> },
          { title: "Badge", href: "#", icon: <Users size={16} /> },
        ],
      },
      {
        title: "Risorse",
        links: [
          { title: "Documentazione", href: "#", icon: <Book size={16} />, external: true },
          { title: "Supporto", href: "#", icon: <LifeBuoy size={16} /> },
        ],
      },
    ],
  },
  {
    trigger: "Link Semplice",
    layout: "list",
    content: [{ title: "Pagina Esterna", href: "https://google.com", external: true }],
  },
  {
    trigger: "Disabilitato",
    disabled: true,
    content: [],
  },
];

export const NavigationMenuShowcase: React.FC = () => {
  return (
    <div className="space-y-8">
      <TitledSurface title="Navigazione Orizzontale (Default)" padding="lg">
        <div className="p-4 rounded-lg bg-bg-secondary">
          <NavigationMenu items={sampleMenuItems} />
        </div>
      </TitledSurface>

      <TitledSurface title="Navigazione Verticale" variant="secondary" padding="lg">
        <div className="p-4 rounded-lg bg-bg-primary max-w-xs">
          <NavigationMenu items={sampleMenuItems} orientation="vertical" />
        </div>
      </TitledSurface>

      <TitledSurface title="Stili dei Trigger e Dimensioni" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" weight="semibold" className="mb-3" block>
              Trigger 'ghost' (size 'sm')
            </ThemedText>
            <NavigationMenu items={sampleMenuItems} triggerVariant="ghost" size="sm" />
          </div>
          <div>
            <ThemedText variant="label" weight="semibold" className="mb-3" block>
              Trigger 'minimal' (size 'lg')
            </ThemedText>
            <NavigationMenu items={sampleMenuItems} triggerVariant="minimal" size="lg" />
          </div>
        </div>
      </TitledSurface>
    </div>
  );
};

export default NavigationMenuShowcase;

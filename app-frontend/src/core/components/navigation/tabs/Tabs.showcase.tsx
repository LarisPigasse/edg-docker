// src/core/components/ui/tabs/Tabs.showcase.tsx
import React from "react";
import Tabs from "./Tabs";
import type { TabItem } from "./Tabs";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";
import { Palette, SquarePen, Settings, Bell } from "lucide-react";
import { Button } from "../../ui";
import { Input, Switch } from "../../form";

// ✨ Definiamo i dati per le schede, con icone nel label come nell'esempio
const showcaseItems: TabItem[] = [
  {
    id: "theme",
    label: (
      <>
        <Palette size={16} />
        <span>Tema</span>
      </>
    ),
    content: (
      <div className="p-4 space-y-4 max-w-md">
        <ThemedText as="h3" className="font-semibold">
          Impostazioni Tema
        </ThemedText>
        <ThemedText variant="secondary">Personalizza l'aspetto dell'applicazione.</ThemedText>
        <Switch label="Modalità Scura" description="Attiva il tema scuro per l'interfaccia." />
      </div>
    ),
  },
  {
    id: "profile",
    label: (
      <>
        <SquarePen size={16} />
        <span>Profilo</span>
      </>
    ),
    content: (
      <div className="p-4 space-y-4 max-w-md">
        <Input label="Nome Utente" defaultValue="LarisPigasse" />
        <Input label="Email" type="email" defaultValue="laris.pigasse@example.com" />
        <Button>Salva Profilo</Button>
      </div>
    ),
  },
  {
    id: "notifications",
    label: (
      <>
        <Bell size={16} />
        <span>Notifiche</span>
      </>
    ),
    content: (
      <div className="p-4 space-y-4 max-w-md">
        <Switch label="Notifiche Email" checked />
        <Switch label="Notifiche Push" />
      </div>
    ),
  },
  {
    id: "disabled",
    label: (
      <>
        <Settings size={16} />
        <span>Admin</span>
      </>
    ),
    content: <></>,
    disabled: true,
  },
];

export const TabsShowcase: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* ✨ Esempio principale che imita lo stile di Showcase.tsx */}
      <TitledSurface title="Esempio Principale (Stile 'Underline')" padding="lg">
        <ThemedText variant="secondary" className="mb-4">
          Questa variante utilizza una linea inferiore per indicare la scheda attiva, ideale per header e navigazioni
          principali.
        </ThemedText>
        <Tabs items={showcaseItems} defaultTab="profile" variant="underline" size="md" />
      </TitledSurface>

      <TitledSurface title="Altre Varianti Visive" variant="secondary" padding="lg">
        <div className="space-y-8">
          <div>
            <ThemedText variant="label" weight="semibold" className="mb-3" block>
              Variante 'Pills'
            </ThemedText>
            <Tabs items={showcaseItems} defaultTab="profile" variant="pills" size="sm" />
          </div>
          <div>
            <ThemedText variant="label" weight="semibold" className="mb-3" block>
              Variante 'Default'
            </ThemedText>
            <Tabs items={showcaseItems} defaultTab="profile" variant="default" size="md" />
          </div>
        </div>
      </TitledSurface>
    </div>
  );
};

export default TabsShowcase;

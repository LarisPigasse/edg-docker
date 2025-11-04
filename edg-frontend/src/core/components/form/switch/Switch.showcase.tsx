// src/core/components/ui/switch/Switch.showcase.tsx
import React, { useState } from "react";
import Switch from "./Switch";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";

export const SwitchShowcase: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="space-y-8">
      <TitledSurface title="Interazione e Stati" padding="lg">
        <div className="max-w-md space-y-6">
          <Switch
            label="Abilita Notifiche"
            description="Riceverai aggiornamenti in tempo reale."
            checked={notifications}
            onCheckedChange={setNotifications}
          />
          <Switch
            label="Tema Scuro"
            description="Attiva la modalità scura per l'interfaccia."
            checked={darkMode}
            onCheckedChange={setDarkMode}
          />
        </div>
      </TitledSurface>

      <TitledSurface title="Dimensioni" variant="secondary" padding="lg">
        <div className="max-w-md space-y-6">
          <Switch label="Piccolo" size="sm" />
          <Switch label="Medio (default)" size="md" checked />
          <Switch label="Grande" size="lg" />
        </div>
      </TitledSurface>

      <TitledSurface title="Stati Speciali" padding="lg">
        <div className="max-w-md space-y-6">
          <Switch label="Impostazione Obbligatoria" error="Questa opzione deve essere attivata per procedere." required />
          <Switch label="Opzione Disabilitata (Off)" disabled />
          <Switch label="Opzione Disabilitata (On)" disabled checked />
        </div>
      </TitledSurface>
    </div>
  );
};

export default SwitchShowcase;

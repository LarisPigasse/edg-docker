// src/core/components/ui/tooltip/Tooltip.showcase.tsx
import React from "react";
import Tooltip from "./Tooltip";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";
import { Button } from "../../ui";
import { Settings, HelpCircle, Archive } from "lucide-react";

export const TooltipShowcase: React.FC = () => {
  return (
    <div className="space-y-8">
      <TitledSurface title="Posizionamento del Tooltip" padding="lg">
        <ThemedText variant="secondary" className="mb-6">
          Usa la prop `side` per definire la posizione preferita del tooltip. Radix UI gestirà automaticamente le collisioni con
          i bordi dello schermo.
        </ThemedText>
        <div className="flex flex-wrap items-center justify-center gap-4 p-8">
          <Tooltip content="Appare in alto (default)">
            <Button>Top</Button>
          </Tooltip>
          <Tooltip content="Appare a destra" side="right">
            <Button>Right</Button>
          </Tooltip>
          <Tooltip content="Appare in basso" side="bottom">
            <Button>Bottom</Button>
          </Tooltip>
          <Tooltip content="Appare a sinistra" side="left">
            <Button>Left</Button>
          </Tooltip>
        </div>
      </TitledSurface>

      <TitledSurface title="Dimensioni e Uso con Icone" variant="secondary" padding="lg">
        <div className="flex flex-wrap items-center justify-center gap-6 p-8">
          <Tooltip content="Impostazioni" size="sm">
            <Button variant="outline" className="p-2">
              <Settings className="h-5 w-5" />
            </Button>
          </Tooltip>
          <Tooltip content="Archivia il documento" size="md">
            <Button variant="outline" className="p-2">
              <Archive className="h-5 w-5" />
            </Button>
          </Tooltip>
          <Tooltip content="Questo è un tooltip di dimensioni grandi, utile per spiegazioni un po' più lunghe." size="lg">
            <Button variant="outline" className="p-2">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </Tooltip>
        </div>
      </TitledSurface>
    </div>
  );
};

export default TooltipShowcase;

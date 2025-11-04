// src/core/components/ui/separator/Separator.showcase.tsx
import React from "react";
import Separator from "./Separator";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";
import { Button } from "../../ui";

export const SeparatorShowcase: React.FC = () => {
  return (
    <TitledSurface title="Separator Components" padding="lg">
      <div className="space-y-8">
        {/* Separator Base */}
        <div>
          <ThemedText variant="label" className="text-sm font-medium mb-4 block">
            Separator Orizzontali, con testo decorativo
          </ThemedText>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-4 border border-border-default rounded-lg">
              <p className="text-sm text-text-secondary">Contenuto sezione 1</p>
              <Separator className="my-4" />
              <p className="text-sm text-text-secondary">Contenuto sezione 2</p>
              <Separator variant="subtle" className="my-4" />
              <p className="text-sm text-text-secondary">Contenuto con separator sottile</p>
            </div>
            <div className="p-4 border border-border-default rounded-lg space-y-4">
              <div className="text-center">
                <h4 className="font-semibold text-text-primary">Login</h4>
                <p className="text-sm text-text-secondary">Inserisci le tue credenziali</p>
              </div>
              <Separator>OR</Separator>
              <div className="text-center">
                <h4 className="font-semibold text-text-primary">Social Login</h4>
                <p className="text-sm text-text-secondary">Accedi con i tuoi social</p>
              </div>
            </div>

            <div className="p-4 border border-border-default rounded-lg space-y-4">
              <div>
                <h4 className="font-semibold text-text-primary">Progetti 2024</h4>
                <p className="text-sm text-text-secondary">Progetti dell'anno corrente</p>
              </div>
              <Separator>2023</Separator>
              <div>
                <h4 className="font-semibold text-text-primary">Progetti Precedenti</h4>
                <p className="text-sm text-text-secondary">Archivio progetti anni passati</p>
              </div>
            </div>
          </div>
        </div>

        {/* Separator Verticali */}
        <div>
          <ThemedText variant="label" className="text-sm font-medium mb-4 block">
            Separator Verticali
          </ThemedText>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 border border-border-default rounded-lg">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-text-primary">Dashboard</span>
                <Separator orientation="vertical" className="h-5" />
                <span className="text-sm text-text-primary">Progetti</span>
                <Separator orientation="vertical" className="h-5" variant="subtle" />
                <span className="text-sm text-text-primary">Impostazioni</span>
              </div>
            </div>

            <div className="p-4 border border-border-default rounded-lg">
              <div className="flex items-center justify-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary">1,234</div>
                  <div className="text-xs text-text-secondary">Users</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary">€45K</div>
                  <div className="text-xs text-text-secondary">Revenue</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary">98%</div>
                  <div className="text-xs text-text-secondary">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TitledSurface>
  );
};

export default SeparatorShowcase;

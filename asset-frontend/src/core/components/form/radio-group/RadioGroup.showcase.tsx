// src/core/components/ui/radio-group/RadioGroup.showcase.tsx
import React, { useState } from "react";
import RadioGroup from "./RadioGroup";
import type { RadioOption } from "./RadioGroup";
import { TitledSurface } from "../../layout";


const planOptions: RadioOption[] = [
  { value: "free", label: "Piano Free", description: "Funzionalità di base, ideale per iniziare." },
  { value: "pro", label: "Piano Pro", description: "Accesso a tutte le funzionalità avanzate." },
  { value: "enterprise", label: "Piano Enterprise", description: "Supporto dedicato e SLA personalizzati.", disabled: true },
];

const paymentOptions: RadioOption[] = [
  { value: "card", label: "Carta di Credito" },
  { value: "paypal", label: "PayPal" },
  { value: "bank", label: "Bonifico Bancario" },
];

export const RadioGroupShowcase: React.FC = () => {
  const [plan, setPlan] = useState("pro");
  const [payment, setPayment] = useState("");

  return (
    <div className="space-y-8">
      <TitledSurface title="Orientamento e Descrizioni" padding="lg">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <span className="text-text-secondary mb-4 font-semibold block">
              Vertical (Default)
            </span>
            <RadioGroup label="Scegli il tuo piano" options={planOptions} value={plan} onValueChange={setPlan} />
          </div>
          <div>
            <span className="text-text-secondary mb-4 font-semibold block">
              Horizontal
            </span>
            <RadioGroup
              label="Metodo di Pagamento"
              orientation="horizontal"
              options={paymentOptions}
              value={payment}
              onValueChange={setPayment}
            />
          </div>
        </div>
      </TitledSurface>

      <TitledSurface title="Stati e Dimensioni" variant="secondary" padding="lg">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <span className="text-text-secondary mb-4 font-semibold block">
              Stato di Errore
            </span>
            <RadioGroup
              label="Conferma la tua scelta"
              options={[
                { value: "a", label: "Opzione A" },
                { value: "b", label: "Opzione B" },
              ]}
              error="È richiesta una selezione per procedere."
              required
            />
          </div>
          <div>
            <span className="text-text-secondary mb-4 font-semibold block">
              Stato Disabilitato
            </span>
            <RadioGroup
              label="Opzioni non disponibili"
              options={[
                { value: "d1", label: "Scelta 1" },
                { value: "d2", label: "Scelta 2" },
              ]}
              disabled
              defaultValue="d1"
            />
          </div>
          <div className="md:col-span-2">
            <span className="text-text-secondary mb-4 font-semibold block">
              Dimensioni Diverse
            </span>
            <div className="space-y-6">
              <RadioGroup
                label="Dimensione Small"
                size="sm"
                options={[
                  { value: "s1", label: "Piccolo 1" },
                  { value: "s2", label: "Piccolo 2" },
                ]}
              />
              <RadioGroup
                label="Dimensione Medium (Default)"
                size="md"
                options={[
                  { value: "m1", label: "Medio 1" },
                  { value: "m2", label: "Medio 2" },
                ]}
              />
              <RadioGroup
                label="Dimensione Large"
                size="lg"
                options={[
                  { value: "l1", label: "Largo 1" },
                  { value: "l2", label: "Largo 2" },
                ]}
              />
            </div>
          </div>
        </div>
      </TitledSurface>
    </div>
  );
};

export default RadioGroupShowcase;

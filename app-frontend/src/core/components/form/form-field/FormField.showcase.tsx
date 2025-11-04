// src/core/components/ui/form-field/FormField.showcase.tsx
import React, { useState } from "react";
import FormField from "./FormField";
import { TitledSurface } from "../../layout";
import { Input, Checkbox, RadioGroup } from "../";
import { Button } from "../../ui";
import { ThemedText } from "../../atomic";

export const FormFieldShowcase: React.FC = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [promo, setPromo] = useState(false);
  const [plan, setPlan] = useState("");

  const handleValidation = () => {
    if (!email) {
      setEmailError("L'indirizzo email è obbligatorio.");
    } else if (!email.includes("@")) {
      setEmailError("Il formato dell'email non è valido.");
    } else {
      setEmailError(undefined);
      alert("Validazione superata!");
    }
  };

  return (
    <div className="space-y-8">
      {/* Caso 1: hideLabel */}
      <TitledSurface title="Caso d'uso: con Label Interna (hideLabel)" padding="lg">
        <div className="space-y-4 mb-8">
          <ThemedText variant="secondary">
            Quando il componente figlio (come `Input` o `Select`) ha già una sua etichetta interna (es. floating label), usiamo
            `hideLabel` su `FormField`. Il wrapper si occupa così solo del layout, del testo di aiuto e dei messaggi di errore.
          </ThemedText>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <ThemedText as="h3" variant="label" weight="semibold">
              Esempio Interattivo (con errore)
            </ThemedText>
            <FormField hideLabel error={emailError}>
              <Input
                id="showcase-email"
                label="La tua Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(undefined);
                }}
                required
              />
            </FormField>
            <Button size="sm" onClick={handleValidation}>
              Valida Email
            </Button>
          </div>

          <div className="space-y-6">
            <ThemedText as="h3" variant="label" weight="semibold">
              Esempio con Helper Text
            </ThemedText>
            <FormField hideLabel helperText="La password deve contenere almeno 8 caratteri.">
              <Input id="showcase-password" type="password" label="Password" required />
            </FormField>
          </div>
        </div>
      </TitledSurface>

      {/* Caso 2: Label Esterna */}
      <TitledSurface title="Caso d'uso: con Label Esterna" variant="secondary" padding="lg">
        <div className="space-y-4 mb-8">
          <ThemedText variant="secondary">
            Quando il componente figlio è un gruppo (come `RadioGroup` o un set di `Checkbox`), `FormField` fornisce l'etichetta
            principale, la descrizione e la gestione degli errori per l'intero gruppo.
          </ThemedText>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <ThemedText as="h3" variant="label" weight="semibold">
              Esempio con RadioGroup
            </ThemedText>
            <FormField
              label="Piano di Abbonamento"
              description="Scegli il piano più adatto a te."
              required
              error={!plan ? "Devi selezionare un piano." : undefined}
            >
              <RadioGroup
                options={[
                  { value: "free", label: "Free", description: "Funzionalità base" },
                  { value: "pro", label: "Pro", description: "Funzionalità avanzate" },
                ]}
                value={plan}
                onValueChange={setPlan}
              />
            </FormField>
          </div>
          <div className="space-y-6">
            <ThemedText as="h3" variant="label" weight="semibold">
              Esempio con Checkbox
            </ThemedText>
            <FormField label="Consensi" helperText="Puoi modificare le preferenze in seguito.">
              <div className="space-y-3 pt-2">
                <Checkbox id="promo-cb" label="Ricevi offerte promozionali" checked={promo} onCheckedChange={setPromo} />
                <Checkbox id="terms-cb" label="Accetto i termini e condizioni" required />
              </div>
            </FormField>
          </div>
        </div>
      </TitledSurface>

      {/* Personalizzazione */}
      <TitledSurface title="Personalizzazione Spacing e Dimensioni" padding="lg">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <ThemedText as="h3" variant="label" weight="semibold">
              Effetto dello `spacing`
            </ThemedText>
            <FormField label="Spacing 'tight'" spacing="tight" helperText="Testo di aiuto">
              <Input label="Campo" />
            </FormField>
            <FormField label="Spacing 'normal' (default)" spacing="normal" helperText="Testo di aiuto">
              <Input label="Campo" />
            </FormField>
            <FormField label="Spacing 'loose'" spacing="loose" helperText="Testo di aiuto">
              <Input label="Campo" />
            </FormField>
          </div>
          <div className="space-y-6">
            <ThemedText as="h3" variant="label" weight="semibold">
              Effetto della `size`
            </ThemedText>
            <FormField label="Size 'sm'" size="sm" helperText="Testo di aiuto piccolo">
              <Checkbox label="Opzione piccola" size="sm" />
            </FormField>
            <FormField label="Size 'md' (default)" size="md" helperText="Testo di aiuto medio">
              <Checkbox label="Opzione media" size="md" />
            </FormField>
            <FormField label="Size 'lg'" size="lg" helperText="Testo di aiuto grande">
              <Checkbox label="Opzione grande" size="lg" />
            </FormField>
          </div>
        </div>
      </TitledSurface>
    </div>
  );
};

export default FormFieldShowcase;

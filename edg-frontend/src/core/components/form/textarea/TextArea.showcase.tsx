// src/core/components/ui/textarea/TextArea.showcase.tsx
import React, { useState } from "react";
import TextArea from "./TextArea";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";

export const TextAreaShowcase: React.FC = () => {
  const [comment, setComment] = useState("");

  return (
    <div className="space-y-8">
      <TitledSurface title="Funzionalità Principali" padding="lg">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <ThemedText variant="label" weight="semibold" className="mb-2" block>
              Auto-Resize (Default)
            </ThemedText>
            <TextArea label="Descrizione Evento" helperText="Il campo si espanderà mentre scrivi." />
          </div>
          <div>
            <ThemedText variant="label" weight="semibold" className="mb-2" block>
              Contatore Caratteri
            </ThemedText>
            <TextArea
              label="Il tuo feedback"
              showCharCount
              maxLength={200}
              minRows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
      </TitledSurface>

      <TitledSurface title="Configurazioni e Stati" variant="secondary" padding="lg">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <ThemedText variant="label" weight="semibold" className="mb-2" block>
              Senza Auto-Resize
            </ThemedText>
            <TextArea
              label="Note fisse"
              autoResize={false}
              rows={5}
              defaultValue="Quest'area ha 5 righe fisse e non si adatta al contenuto."
            />
          </div>
          <div className="space-y-8">
            <div>
              <ThemedText variant="label" weight="semibold" className="mb-2" block>
                Stato di Errore
              </ThemedText>
              <TextArea label="Motivazione" error="Questo campo è obbligatorio." required />
            </div>
            <div>
              <ThemedText variant="label" weight="semibold" className="mb-2" block>
                Stato Disabilitato
              </ThemedText>
              <TextArea label="Commento non modificabile" disabled defaultValue="Questo testo è bloccato." />
            </div>
          </div>
        </div>
      </TitledSurface>
    </div>
  );
};

export default TextAreaShowcase;

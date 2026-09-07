// src/core/components/ui/textarea/TextArea.showcase.tsx
import React, { useState } from "react";
import TextArea from "./TextArea";
import { TitledSurface } from "../../layout";


export const TextAreaShowcase: React.FC = () => {
  const [comment, setComment] = useState("");

  return (
    <div className="space-y-8">
      <TitledSurface title="Funzionalità Principali" padding="lg">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
              <span className="text-text-secondary mb-2 font-semibold block">
              Auto-Resize (Default)
            </span>
            <TextArea label="Descrizione Evento" helperText="Il campo si espanderà mentre scrivi." />
          </div>
          <div>
              <span className="text-text-secondary mb-2 font-semibold block">
              Contatore Caratteri
            </span>
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
              <span className="text-text-secondary mb-2 font-semibold block">
              Senza Auto-Resize
            </span>
            <TextArea
              label="Note fisse"
              autoResize={false}
              rows={5}
              defaultValue="Quest'area ha 5 righe fisse e non si adatta al contenuto."
            />
          </div>
          <div className="space-y-8">
            <div>
                <span className="text-text-secondary mb-2 font-semibold block">
                Stato di Errore
              </span>
              <TextArea label="Motivazione" error="Questo campo è obbligatorio." required />
            </div>
            <div>
                <span className="text-text-secondary mb-2 font-semibold block">
                Stato Disabilitato
              </span>
              <TextArea label="Commento non modificabile" disabled defaultValue="Questo testo è bloccato." />
            </div>
          </div>
        </div>
      </TitledSurface>
    </div>
  );
};

export default TextAreaShowcase;

// src/core/components/ui/time-picker/TimePicker.showcase.tsx
import React, { useState } from "react";
import TimePicker from "./TimePicker";
import type { TimeValue } from "./TimePicker";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";

export const TimePickerShowcase: React.FC = () => {
  const [time24, setTime24] = useState<TimeValue | undefined>({ hours: 14, minutes: 30 });
  const [time12, setTime12] = useState<TimeValue | undefined>();
  const [meetingTime, setMeetingTime] = useState<TimeValue | undefined>();

  return (
    <div className="space-y-8">
      <TitledSurface title="Formati e Interazione" padding="lg">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <ThemedText variant="label" weight="semibold" className="mb-2" block>
              Formato 24h (step 15min)
            </ThemedText>
            <TimePicker label="Orario di Fine" value={time24} onChange={setTime24} format="24h" step={15} />
          </div>
          <div>
            <ThemedText variant="label" weight="semibold" className="mb-2" block>
              Formato 12h (step 30min)
            </ThemedText>
            <TimePicker label="Orario Pausa" value={time12} onChange={setTime12} format="12h" step={30} />
          </div>
        </div>
      </TitledSurface>

      <TitledSurface title="Validazione e Stati" variant="secondary" padding="lg">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <ThemedText variant="label" weight="semibold" className="mb-2" block>
              Orari Lavorativi
            </ThemedText>
            <TimePicker
              label="Orario Riunione"
              value={meetingTime}
              onChange={setMeetingTime}
              minTime={{ hours: 9, minutes: 0 }}
              maxTime={{ hours: 17, minutes: 30 }}
              helperText="Dalle 9:00 alle 17:30"
            />
          </div>
          <div className="space-y-8">
            <ThemedText variant="label" weight="semibold" className="mb-2" block>
              Stati Speciali
            </ThemedText>
            <TimePicker label="Campo con Errore" error="L'orario non è disponibile." required />
            <TimePicker label="Campo Disabilitato" value={{ hours: 10, minutes: 0 }} disabled />
          </div>
        </div>
      </TitledSurface>
    </div>
  );
};

export default TimePickerShowcase;

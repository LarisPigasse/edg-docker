// src/core/components/ui/date-picker/DatePicker.showcase.tsx
import React, { useState } from "react";
import DatePicker from "./DatePicker";
import { TitledSurface } from "../../layout";


export const DatePickerShowcase: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [eventDate, setEventDate] = useState<Date | undefined>();

  const minPromoDate = new Date();
  const maxPromoDate = new Date();
  maxPromoDate.setMonth(maxPromoDate.getMonth() + 1);

  return (
    <div className="space-y-8">
      <TitledSurface title="DatePicker Interattivo" padding="lg">
        <div className="max-w-sm mx-auto">
          <DatePicker label="Seleziona una data" value={selectedDate} onChange={setSelectedDate} />
          <p className="text-sm mt-4 text-center text-text-secondary">
            Data selezionata: {selectedDate ? selectedDate.toLocaleDateString() : "Nessuna"}
          </p>
        </div>
      </TitledSurface>

      <TitledSurface title="Validazione e Limiti" variant="secondary" padding="lg">
        <div className="max-w-sm mx-auto space-y-4">
          <p className="text-sm text-text-secondary">
            Questo campo accetta solo date nel prossimo mese e mostra un errore se vuoto.
          </p>
          <DatePicker
            label="Data Promozione"
            value={eventDate}
            onChange={setEventDate}
            minDate={minPromoDate}
            maxDate={maxPromoDate}
            error={!eventDate ? "Questo campo è obbligatorio." : ""}
            required
            fullWidth
          />
        </div>
      </TitledSurface>

      <TitledSurface title="Formati e Dimensioni" padding="lg">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <span className="mb-2 block text-text-secondary">
              Formato YYYY-MM-DD (size lg)
            </span>
            <DatePicker label="Data di Scadenza" format="YYYY-MM-DD" size="lg" />
          </div>
          <div>
            <span className="mb-2 block text-text-secondary">
              Formato MM/DD/YYYY (size sm)
            </span>
            <DatePicker label="Data di Nascita" format="MM/DD/YYYY" size="sm" />
          </div>
        </div>
      </TitledSurface>

      <TitledSurface title="Stato Disabilitato" variant="info" padding="lg">
        <div className="max-w-sm">
          <DatePicker label="Campo Disabilitato" value={new Date()} disabled />
        </div>
      </TitledSurface>
    </div>
  );
};

export default DatePickerShowcase;

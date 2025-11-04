// src/core/components/ui/sheet/Sheet.showcase.tsx
import React, { useState } from "react";
import { Sheet, type SheetSide } from "./Sheet";
import { TitledSurface } from "..";
import { ThemedText } from "../../atomic";
import { Button } from "../../ui";
import { Input, Label } from "../../form";

export const SheetShowcase: React.FC = () => {
  const [openSide, setOpenSide] = useState<SheetSide | null>(null);

  const renderSheetContent = () => (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" defaultValue="Laris Pigasse" />
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="username">Username</Label>
        <Input id="username" defaultValue="@larispigasse" />
      </div>
    </div>
  );

  const renderSheetFooter = () => <Button onClick={() => setOpenSide(null)}>Salva Modifiche</Button>;

  return (
    <>
      <TitledSurface title="Apri Sheet" padding="lg">
        <ThemedText variant="secondary" className="mb-4">
          Clicca un pulsante per aprire un pannello `Sheet` dal lato corrispondente.
        </ThemedText>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" onClick={() => setOpenSide("top")}>
            Top
          </Button>
          <Button variant="outline" onClick={() => setOpenSide("bottom")}>
            Bottom
          </Button>
          <Button variant="outline" onClick={() => setOpenSide("left")}>
            Left
          </Button>
          <Button variant="outline" onClick={() => setOpenSide("right")}>
            Right
          </Button>
        </div>
      </TitledSurface>

      <Sheet
        isOpen={!!openSide}
        onOpenChange={(isOpen) => !isOpen && setOpenSide(null)}
        side={openSide ?? "right"}
        title="Modifica Profilo"
        description="Apporta le modifiche al tuo profilo qui. Clicca 'Salva' quando hai finito."
        footer={renderSheetFooter()}
      >
        {renderSheetContent()}
      </Sheet>
    </>
  );
};

export default SheetShowcase;

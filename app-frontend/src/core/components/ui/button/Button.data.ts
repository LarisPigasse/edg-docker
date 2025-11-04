// src/core/components/ui/button/Button.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const buttonData: ComponentData = {
  id: "button",
  title: "Button",
  description: "Pulsanti per azioni primarie e secondarie con varianti multiple e stati di caricamento",
  category: "ui",
  importPath: 'import { Button } from "../core/components/ui";',
  origin: "custom component",
  dependence: "",
  props: [
    {
      name: "variant",
      type: '"primary" | "secondary" | "outline" | "danger" | "success" | "ghost" | "link" | "info" | "warning"',
      required: false,
      defaultValue: '"primary"',
      description: "Variante visiva del pulsante",
    },
    {
      name: "size",
      type: '"xs" | "sm" | "md" | "lg"',
      required: false,
      defaultValue: '"md"',
      description: "Dimensione del pulsante",
    },
    {
      name: "isLoading",
      type: "boolean",
      required: false,
      defaultValue: "false",
      description: "Mostra spinner di caricamento",
    },
    {
      name: "loadingText",
      type: "string",
      required: false,
      description: "Testo personalizzato durante il caricamento",
    },
    {
      name: "leftIcon",
      type: "ReactNode",
      required: false,
      description: "Icona a sinistra del testo",
    },
    {
      name: "rightIcon",
      type: "ReactNode",
      required: false,
      description: "Icona a destra del testo",
    },
    {
      name: "fullWidth",
      type: "boolean",
      required: false,
      defaultValue: "false",
      description: "Occupa tutta la larghezza disponibile",
    },
    {
      name: "disabled",
      type: "boolean",
      required: false,
      defaultValue: "false",
      description: "Disabilita il pulsante",
    },
    {
      name: "onClick",
      type: "(event: MouseEvent) => void",
      required: false,
      description: "Callback per il click del pulsante",
    },
    {
      name: "type",
      type: '"button" | "submit" | "reset"',
      required: false,
      defaultValue: '"button"',
      description: "Tipo HTML del pulsante",
    },
    {
      name: "className",
      type: "string",
      required: false,
      description: "Classi CSS aggiuntive",
    },
  ],
  examples: [
    {
      title: "Button Base",
      description: "Pulsanti con varianti principali",
      code: `<div className="flex gap-3">
  <Button variant="primary">Salva</Button>
  <Button variant="secondary">Annulla</Button>
  <Button variant="outline">Preview</Button>
</div>`,
    },
    {
      title: "Button con Icone",
      description: "Pulsanti con icone a sinistra o destra",
      code: `import { Plus, Download, ArrowRight } from "lucide-react";

<div className="flex gap-3">
  <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
    Nuovo
  </Button>
  <Button variant="outline" rightIcon={<Download className="w-4 h-4" />}>
    Scarica
  </Button>
  <Button variant="ghost" rightIcon={<ArrowRight className="w-4 h-4" />}>
    Continua
  </Button>
</div>`,
    },
    {
      title: "Stati Loading",
      description: "Pulsanti con stato di caricamento e testo personalizzato",
      code: `const [isSubmitting, setIsSubmitting] = useState(false);

<div className="flex gap-3">
  <Button 
    variant="primary" 
    isLoading={isSubmitting}
    loadingText="Salvando..."
    onClick={() => handleSave()}
  >
    Salva Documento
  </Button>
  
  <Button 
    variant="secondary" 
    isLoading={isSubmitting}
    disabled={isSubmitting}
  >
    {isSubmitting ? 'Elaborazione...' : 'Elabora'}
  </Button>
</div>`,
    },
    {
      title: "Dimensioni Button",
      description: "Button in tutte le dimensioni disponibili",
      code: `<div className="flex items-center gap-3">
  <Button size="xs" variant="primary">Extra Small</Button>
  <Button size="sm" variant="primary">Small</Button>
  <Button size="md" variant="primary">Medium</Button>
  <Button size="lg" variant="primary">Large</Button>
</div>`,
    },
    {
      title: "Varianti Semantiche",
      description: "Button con colori semantici per diverse azioni",
      code: `<div className="grid grid-cols-2 gap-3">
  <Button variant="success">Conferma</Button>
  <Button variant="danger">Elimina</Button>
  <Button variant="warning">Attenzione</Button>
  <Button variant="info">Informazioni</Button>
  <Button variant="ghost">Neutrale</Button>
  <Button variant="link">Link Style</Button>
</div>`,
    },
    {
      title: "Button in Form",
      description: "Integrazione con form e stati disabled",
      code: `<form className="space-y-4">
  <div className="grid grid-cols-2 gap-3">
    <input 
      type="text" 
      placeholder="Nome utente"
      className="px-3 py-2 border rounded"
    />
    <input 
      type="email" 
      placeholder="Email"
      className="px-3 py-2 border rounded"
    />
  </div>
  
  <div className="flex gap-3">
    <Button 
      type="submit" 
      variant="primary"
      fullWidth
    >
      Registrati
    </Button>
    
    <Button 
      type="button" 
      variant="outline"
      onClick={() => resetForm()}
    >
      Reset
    </Button>
  </div>
  
  <Button 
    variant="secondary"
    disabled
    fullWidth
  >
    Pulsante Disabilitato
  </Button>
</form>`,
    },
    {
      title: "Button Group",
      description: "Gruppi di pulsanti per toolbar e azioni multiple",
      code: `import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

<div className="space-y-4">
  {/* Text formatting toolbar */}
  <div className="flex">
    <Button 
      variant="ghost" 
      size="sm"
      leftIcon={<Bold className="w-4 h-4" />}
      className="rounded-r-none border-r-0"
    >
      Bold
    </Button>
    <Button 
      variant="ghost" 
      size="sm"
      leftIcon={<Italic className="w-4 h-4" />}
      className="rounded-none border-r-0"
    >
      Italic
    </Button>
    <Button 
      variant="ghost" 
      size="sm"
      leftIcon={<Underline className="w-4 h-4" />}
      className="rounded-l-none"
    >
      Underline
    </Button>
  </div>
  
  {/* Alignment buttons */}
  <div className="flex gap-1">
    <Button variant="outline" size="sm" leftIcon={<AlignLeft className="w-4 h-4" />} />
    <Button variant="outline" size="sm" leftIcon={<AlignCenter className="w-4 h-4" />} />
    <Button variant="outline" size="sm" leftIcon={<AlignRight className="w-4 h-4" />} />
  </div>
</div>`,
    },
  ],
  notes:
    "Usa variant='primary' per azioni principali, 'secondary' per azioni secondarie, 'outline' per azioni neutre. loadingText sovrascrive il children durante il loading. fullWidth utile per form e mobile.",
};

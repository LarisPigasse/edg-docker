export const accordionData: ComponentData = {
  id: "accordion",
  title: "Accordion",
  description: "Componente per contenuti collassibili organizzati in sezioni con animazioni smooth e accessibility completa",
  category: "ui",
  importPath: 'import { Accordion } from "../core/components/ui";',
  origin: "radix-ui primitives",
  dependence: "@radix-ui/react-accordion",
  props: [
    {
      name: "type",
      type: '"single" | "multiple"',
      required: false,
      defaultValue: '"single"',
      description: "Modalità accordion - single (un item aperto) o multiple (più items aperti)",
    },
    {
      name: "items",
      type: "AccordionItem[]",
      required: true,
      description: "Array di items dell'accordion con value, title, content e disabled opzionale",
    },
    {
      name: "defaultValue",
      type: "string | string[]",
      required: false,
      description: "Valore/i di default aperti (string per single, array per multiple)",
    },
    {
      name: "collapsible",
      type: "boolean",
      required: false,
      defaultValue: "true",
      description: "Se type='single', permette di chiudere tutti gli item",
    },
    {
      name: "variant",
      type: '"default" | "bordered" | "separated"',
      required: false,
      defaultValue: '"default"',
      description: "Variante visiva dell'accordion",
    },
    {
      name: "size",
      type: '"sm" | "md" | "lg"',
      required: false,
      defaultValue: '"md"',
      description: "Dimensione dell'accordion (padding, font-size, icon)",
    },
    {
      name: "onValueChange",
      type: "(value: string | string[]) => void",
      required: false,
      description: "Callback chiamata quando cambia lo stato di apertura",
    },
    {
      name: "className",
      type: "string",
      required: false,
      description: "Classi CSS aggiuntive per il container",
    },
  ],
  examples: [
    {
      title: "Accordion Base",
      description: "Accordion semplice con modalità single collapsible",
      code: `const faqItems = [
  {
    value: "item1",
    title: "Cos'è React?",
    content: "React è una libreria JavaScript per costruire interfacce utente, sviluppata da Meta."
  },
  {
    value: "item2", 
    title: "Come installare React?",
    content: "Puoi creare un nuovo progetto React usando 'npx create-react-app' o Vite per prestazioni migliori."
  },
  {
    value: "item3",
    title: "Cos'è JSX?",
    content: "JSX è un'estensione della sintassi JavaScript che permette di scrivere HTML-like syntax nei componenti React."
  }
];

<Accordion
  type="single"
  collapsible
  items={faqItems}
  defaultValue="item1"
/>`,
    },
    {
      title: "Accordion Multiple",
      description: "Accordion che permette apertura di più item contemporaneamente",
      code: `const settingsItems = [
  {
    value: "account",
    title: "Impostazioni Account",
    content: (
      <div className="space-y-3">
        <p>Gestisci le tue informazioni personali e preferenze account.</p>
        <button className="px-4 py-2 bg-violet-600 text-white rounded">
          Modifica Profilo
        </button>
      </div>
    )
  },
  {
    value: "privacy",
    title: "Privacy e Sicurezza", 
    content: "Controlla chi può vedere i tuoi contenuti e come vengono utilizzati i tuoi dati."
  },
  {
    value: "notifications",
    title: "Notifiche",
    content: "Personalizza quando e come ricevere notifiche via email e push."
  }
];

<Accordion
  type="multiple"
  items={settingsItems}
  defaultValue={["account", "privacy"]}
  variant="bordered"
/>`,
    },
    {
      title: "Varianti Visive",
      description: "Accordion con diverse varianti di styling",
      code: `const items = [
  { value: "1", title: "Default Style", content: "Accordion con stile default, separatori sottili." },
  { value: "2", title: "Bordered Cards", content: "Ogni item ha un bordo completo con angoli arrotondati." },
  { value: "3", title: "Separated Cards", content: "Items separati con background diverso e spaziatura." }
];

{/* Default variant */}
<Accordion type="single" items={items} variant="default" />

{/* Bordered variant */}
<Accordion type="single" items={items} variant="bordered" />

{/* Separated variant */}
<Accordion type="single" items={items} variant="separated" />`,
    },
    {
      title: "Dimensioni Accordion",
      description: "Accordion con diverse dimensioni per diversi contesti",
      code: `const compactItems = [
  { value: "s1", title: "Small Accordion", content: "Perfetto per sidebar o spazi limitati." },
  { value: "s2", title: "Compact Info", content: "Testo e spaziature più piccole." }
];

const largeItems = [
  { value: "l1", title: "Large Accordion", content: "Ideale per contenuti principali con più importanza visiva." },
  { value: "l2", title: "Prominent Display", content: "Font size e padding maggiori per migliore leggibilità." }
];

{/* Small size */}
<Accordion items={compactItems} size="sm" variant="bordered" />

{/* Medium size (default) */}
<Accordion items={items} size="md" />

{/* Large size */}
<Accordion items={largeItems} size="lg" variant="separated" />`,
    },
    {
      title: "Accordion con Contenuto Complesso",
      description: "Accordion con contenuti ricchi: liste, form, immagini",
      code: `const advancedItems = [
  {
    value: "features",
    title: "🚀 Features Principali",
    content: (
      <div className="space-y-4">
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Animazioni smooth con Radix UI</li>
          <li>Keyboard navigation completa</li>
          <li>Support per contenuti complessi</li>
          <li>Theme integration automatica</li>
        </ul>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
            Accessibile
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
            Responsive
          </span>
        </div>
      </div>
    )
  },
  {
    value: "contact",
    title: "📞 Contatti",
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Email:</strong><br />
            support@example.com
          </div>
          <div>
            <strong>Telefono:</strong><br />
            +39 123 456 7890
          </div>
        </div>
        <button className="w-full py-2 bg-violet-600 text-white rounded hover:bg-violet-700">
          Contattaci Ora
        </button>
      </div>
    )
  },
  {
    value: "disabled",
    title: "🔒 Sezione Disabilitata",
    content: "Questo contenuto non è accessibile.",
    disabled: true
  }
];

<Accordion
  type="single"
  items={advancedItems}
  variant="separated"
  size="lg"
  collapsible
/>`,
    },
    {
      title: "Accordion Controllato",
      description: "Accordion con stato controllato e callback personalizzate",
      code: `const [openSections, setOpenSections] = useState<string[]>([]);
const [analytics, setAnalytics] = useState({ totalOpens: 0, lastOpened: null });

const helpItems = [
  { value: "getting-started", title: "Come iniziare", content: "Guida introduttiva per nuovi utenti..." },
  { value: "advanced", title: "Funzionalità avanzate", content: "Scopri le feature più potenti..." },
  { value: "troubleshooting", title: "Risoluzione problemi", content: "Soluzioni ai problemi più comuni..." }
];

const handleAccordionChange = (value: string[]) => {
  setOpenSections(value);
  setAnalytics(prev => ({
    totalOpens: prev.totalOpens + 1,
    lastOpened: value[value.length - 1] || null
  }));
};

<div className="space-y-4">
  <Accordion
    type="multiple"
    items={helpItems}
    value={openSections}
    onValueChange={handleAccordionChange}
    variant="bordered"
  />
  
  <div className="p-3 bg-gray-100 rounded text-sm">
    <p>Sezioni aperte: {openSections.length}</p>
    <p>Aperture totali: {analytics.totalOpens}</p>
    {analytics.lastOpened && (
      <p>Ultima aperta: {analytics.lastOpened}</p>
    )}
  </div>
</div>`,
    },
    {
      title: "FAQ Accordion",
      description: "Esempio pratico di FAQ con ricerca e categorizzazione",
      code: `const [searchTerm, setSearchTerm] = useState("");

const allFaqs = [
  { value: "billing-1", title: "Come funziona la fatturazione?", content: "La fatturazione avviene mensilmente...", category: "billing" },
  { value: "billing-2", title: "Posso cambiare piano?", content: "Sì, puoi cambiare piano in qualsiasi momento...", category: "billing" },
  { value: "tech-1", title: "Come integro l'API?", content: "L'integrazione API richiede...", category: "technical" },
  { value: "tech-2", title: "Limiti di rate limiting?", content: "I limiti dipendono dal tuo piano...", category: "technical" }
];

const filteredFaqs = allFaqs.filter(faq => 
  faq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  faq.content.toLowerCase().includes(searchTerm.toLowerCase())
);

<div className="space-y-4">
  <input
    type="text"
    placeholder="Cerca nelle FAQ..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full px-4 py-2 border rounded-lg"
  />
  
  <Accordion
    type="single"
    items={filteredFaqs}
    variant="default"
    collapsible
  />
  
  {filteredFaqs.length === 0 && (
    <p className="text-center text-gray-500 py-8">
      Nessuna FAQ trovata per "{searchTerm}"
    </p>
  )}
</div>`,
    },
  ],
  notes:
    "Usa type='single' per FAQ, type='multiple' per settings. Variant 'separated' per contenuti importanti. Radix UI garantisce accessibility completa con ARIA attributes e keyboard navigation.",
};

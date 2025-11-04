// src/core/components/ui/badge/Badge.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const badgeData: ComponentData = {
  id: "badge",
  title: "Badge",
  description:
    "Etichette semantiche per stati, categorizzazioni e informazioni brevi con auto-mapping intelligente degli status testuali",
  category: "ui",
  importPath: 'import { Badge } from "../core/components/ui";',
  origin: "custom component",
  dependence: "",
  props: [
    {
      name: "children",
      type: "ReactNode",
      required: false,
      description: "Contenuto del badge (testo, numero, icona). Ha priorità su 'text'",
    },
    {
      name: "text",
      type: "string",
      required: false,
      description: "Testo alternativo al children. Utilizzato solo se children non è presente",
    },
    {
      name: "variant",
      type: '"default" | "success" | "warning" | "danger" | "info"',
      required: false,
      defaultValue: '"default"',
      description: "Variante semantica del badge. Viene sovrascritta se 'status' è presente",
    },
    {
      name: "size",
      type: '"xs" | "sm" | "md"',
      required: false,
      defaultValue: '"xs"',
      description: "Dimensione del badge",
    },
    {
      name: "status",
      type: "string",
      required: false,
      description:
        "Status testuale che viene mappato automaticamente alla variante appropriata. Ha priorità su 'variant'. Supporta: attivo, inattivo, eliminato, completato, pendente, errore, nuovo, bozza, pubblicato, scaduto, in_elaborazione, approvato, rifiutato",
    },
    {
      name: "className",
      type: "string",
      required: false,
      description: "Classi CSS aggiuntive per personalizzazione",
    },
  ],
  examples: [
    {
      title: "Badge Base",
      description: "Badge con varianti semantiche standard",
      code: `<div className="flex flex-wrap gap-2">
  <Badge variant="default">Default</Badge>
  <Badge variant="success">Success</Badge>
  <Badge variant="warning">Warning</Badge>
  <Badge variant="danger">Danger</Badge>
  <Badge variant="info">Info</Badge>
</div>`,
    },
    {
      title: "Auto-mapping Status",
      description: "Badge che si colorano automaticamente in base al contenuto testuale",
      code: `// Il badge riconosce automaticamente questi status e applica il colore giusto
<div className="flex flex-wrap gap-2">
  <Badge status="completato">Completato</Badge>      {/* → success */}
  <Badge status="pendente">In Lavorazione</Badge>    {/* → warning */}
  <Badge status="errore">Failed</Badge>              {/* → danger */}
  <Badge status="nuovo">New Feature</Badge>          {/* → info */}
  <Badge status="attivo">Online</Badge>              {/* → success */}
  <Badge status="inattivo">Offline</Badge>           {/* → warning */}
  <Badge status="bozza">Bozza</Badge>                {/* → default */}
</div>

// Status supportati:
// success: attivo, completato, pubblicato, approvato
// warning: inattivo, pendente, in_elaborazione
// danger: eliminato, errore, scaduto, rifiutato
// info: nuovo
// default: bozza, altri non mappati`,
    },
    {
      title: "Dimensioni Badge",
      description: "Badge in tutte le dimensioni disponibili",
      code: `<div className="flex items-center gap-3">
  <Badge size="xs" variant="info">XS Size</Badge>
  <Badge size="sm" variant="info">SM Size</Badge>
  <Badge size="md" variant="info">MD Size</Badge>
</div>

{/* Con numeri per confronto dimensioni */}
<div className="flex items-center gap-2 mt-3">
  <Badge size="xs" variant="danger">99+</Badge>
  <Badge size="sm" variant="warning">42</Badge>
  <Badge size="md" variant="success">7</Badge>
</div>`,
    },
    {
      title: "Badge con Icone",
      description: "Badge integrati con icone Lucide React",
      code: `import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Star,
  Crown,
  Zap,
  Circle
} from "lucide-react";

<div className="flex flex-wrap gap-2">
  <Badge variant="success" size="sm">
    <CheckCircle className="w-3 h-3 mr-1" />
    Verified
  </Badge>
  
  <Badge variant="warning" size="sm">
    <AlertTriangle className="w-3 h-3 mr-1" />
    Warning
  </Badge>
  
  <Badge variant="info" size="sm">
    <Star className="w-3 h-3 mr-1" />
    Premium
  </Badge>
  
  {/* Status indicator con dot */}
  <Badge variant="success" size="sm">
    <Circle className="w-2 h-2 mr-1 fill-current" />
    Online
  </Badge>
</div>`,
    },
    {
      title: "Badge Numerici e Notifiche",
      description: "Badge per contatori, notifiche e statistiche",
      code: `<div className="space-y-4">
  {/* Notification badges */}
  <div className="flex items-center gap-4">
    <div className="relative">
      <button className="p-2 rounded-lg bg-bg-secondary">
        <Mail className="w-5 h-5" />
      </button>
      <Badge 
        variant="danger" 
        size="xs" 
        className="absolute -top-1 -right-1"
      >
        12
      </Badge>
    </div>
    
    <div className="relative">
      <button className="p-2 rounded-lg bg-bg-secondary">
        <Bell className="w-5 h-5" />
      </button>
      <Badge 
        variant="info" 
        size="xs" 
        className="absolute -top-1 -right-1"
      >
        99+
      </Badge>
    </div>
  </div>
  
  {/* Counter badges */}
  <div className="flex gap-3">
    <Badge variant="default" size="sm">Items: 24</Badge>
    <Badge variant="success" size="sm">Completed: 18</Badge>
    <Badge variant="warning" size="sm">Pending: 6</Badge>
  </div>
</div>`,
    },
    {
      title: "Badge con text prop",
      description: "Uso alternativo con prop 'text' invece di children",
      code: `// Entrambi producono lo stesso risultato
<Badge text="Via text prop" variant="info" />
<Badge variant="info">Via children</Badge>

// children ha priorità su text
<Badge text="Questo non si vede" variant="warning">
  Questo si vede
</Badge>`,
    },
    {
      title: "Badge in Tabelle e Liste",
      description: "Uso pratico in interfacce di dati",
      code: `const users = [
  { name: "Alice", status: "attivo", role: "admin", tasks: 3 },
  { name: "Bob", status: "inattivo", role: "user", tasks: 0 },
  { name: "Carol", status: "pendente", role: "editor", tasks: 12 }
];

<div className="space-y-3">
  {users.map((user, index) => (
    <div 
      key={index} 
      className="flex items-center justify-between p-3 border rounded-lg"
    >
      <div className="flex items-center gap-3">
        <span className="font-medium">{user.name}</span>
        {/* Auto-mapping dello status */}
        <Badge status={user.status} size="xs">
          {user.status}
        </Badge>
        {/* Variant esplicita per il ruolo */}
        <Badge variant="default" size="xs">
          {user.role}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        {user.tasks > 0 && (
          <Badge variant="info" size="xs">
            {user.tasks} tasks
          </Badge>
        )}
        <button className="text-sm text-violet-600 hover:text-violet-700">
          Modifica
        </button>
      </div>
    </div>
  ))}
</div>`,
    },
    {
      title: "Override e Priorità",
      description: "Come funziona la priorità tra status e variant",
      code: `// status ha priorità su variant
<Badge status="attivo" variant="danger">
  Attivo
</Badge>
// Risultato: badge verde (success) perché status="attivo" mappa a success

// Se status non è mappato, usa default
<Badge status="unknown_status">
  Unknown
</Badge>
// Risultato: badge con variant="default"

// Se non c'è status, usa variant
<Badge variant="warning">
  Warning
</Badge>
// Risultato: badge giallo (warning)

// Customizzazione con className
<Badge 
  variant="info" 
  className="font-bold uppercase tracking-wide"
>
  Custom Style
</Badge>`,
    },
    {
      title: "Tags System Simulato",
      description: "Esempio di sistema tags con rimozione simulata",
      code: `const [tags, setTags] = useState([
  { id: 1, label: "React", variant: "info" },
  { id: 2, label: "TypeScript", variant: "success" },
  { id: 3, label: "Tailwind", variant: "warning" }
]);

// Simulazione rimozione tag (click sul badge)
<div className="flex flex-wrap gap-2">
  {tags.map(tag => (
    <button
      key={tag.id}
      onClick={() => setTags(tags.filter(t => t.id !== tag.id))}
      className="group"
    >
      <Badge variant={tag.variant} size="sm">
        {tag.label}
        <span className="ml-2 opacity-60 group-hover:opacity-100">×</span>
      </Badge>
    </button>
  ))}
</div>

// Nota: per un vero sistema removibile, considera di estendere
// il componente Badge con props removable e onRemove`,
    },
  ],
  notes:
    "Usa 'status' prop per auto-mapping semantico automatico. Status supportati: attivo→success, inattivo→warning, errore→danger, nuovo→info, etc. La prop 'status' ha priorità su 'variant'. Per badge numerici nelle notifiche, usa size='xs' e posizionamento absolute. Il componente usa role='status' per accessibility.",
};

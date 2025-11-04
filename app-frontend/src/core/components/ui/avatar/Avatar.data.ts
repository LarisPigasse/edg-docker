// src/core/components/ui/avatar/Avatar.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const avatarData: ComponentData = {
  id: "avatar",
  title: "Avatar",
  description: "Avatar utenti con fallback intelligente, status indicators e forme personalizzabili per profili e liste",
  category: "ui",
  importPath: 'import { Avatar } from "../core/components/ui";',
  origin: "custom component",
  dependence: "",
  props: [
    {
      name: "src",
      type: "string",
      required: false,
      description: "URL dell'immagine avatar",
    },
    {
      name: "alt",
      type: "string",
      required: false,
      description: "Testo alternativo per l'immagine",
    },
    {
      name: "initials",
      type: "string",
      required: false,
      description: "Iniziali da mostrare come fallback (max 2 caratteri)",
    },
    {
      name: "fallback",
      type: "ReactNode",
      required: false,
      description: "Fallback personalizzato (icona o elemento)",
    },
    {
      name: "size",
      type: '"xs" | "sm" | "md" | "lg" | "xl"',
      required: false,
      defaultValue: '"md"',
      description: "Dimensione dell'avatar",
    },
    {
      name: "shape",
      type: '"circle" | "square" | "rounded"',
      required: false,
      defaultValue: '"circle"',
      description: "Forma dell'avatar",
    },
    {
      name: "variant",
      type: '"primary" | "secondary" | "success" | "warning" | "danger" | "info"',
      required: false,
      defaultValue: '"primary"',
      description: "Variante colore per initials/fallback",
    },
    {
      name: "status",
      type: '"online" | "offline" | "busy" | "away"',
      required: false,
      description: "Indicatore di stato utente",
    },
    {
      name: "statusPosition",
      type: '"top-right" | "bottom-right" | "top-left" | "bottom-left"',
      required: false,
      defaultValue: '"bottom-right"',
      description: "Posizione dell'indicatore di stato",
    },
    {
      name: "clickable",
      type: "boolean",
      required: false,
      defaultValue: "false",
      description: "Avatar cliccabile con hover effects",
    },
    {
      name: "onClick",
      type: "() => void",
      required: false,
      description: "Callback per click (richiede clickable=true)",
    },
    {
      name: "bordered",
      type: "boolean",
      required: false,
      defaultValue: "false",
      description: "Aggiunge border bianco intorno all'avatar",
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
      title: "Avatar Base",
      description: "Avatar con immagine e fallback automatico",
      code: `<div className="flex items-center gap-4">
  <Avatar 
    src="/user1.jpg" 
    alt="John Doe" 
    size="md" 
  />
  
  <Avatar 
    src="/invalid-url.jpg" 
    alt="Jane Smith" 
    initials="JS" 
    variant="primary"
  />
  
  <Avatar 
    initials="AB" 
    variant="secondary" 
    size="md"
  />
</div>`,
    },
    {
      title: "Dimensioni Avatar",
      description: "Avatar in tutte le dimensioni disponibili",
      code: `<div className="flex items-center gap-4">
  <Avatar initials="XS" size="xs" variant="primary" />
  <Avatar initials="SM" size="sm" variant="secondary" />
  <Avatar initials="MD" size="md" variant="success" />
  <Avatar initials="LG" size="lg" variant="warning" />
  <Avatar initials="XL" size="xl" variant="danger" />
</div>`,
    },
    {
      title: "Forme e Varianti",
      description: "Avatar con forme diverse e varianti colore",
      code: `<div className="space-y-4">
  {/* Forme diverse */}
  <div className="flex items-center gap-4">
    <Avatar initials="CI" shape="circle" variant="primary" />
    <Avatar initials="SQ" shape="square" variant="secondary" />
    <Avatar initials="RO" shape="rounded" variant="info" />
  </div>
  
  {/* Varianti colore */}
  <div className="flex items-center gap-4">
    <Avatar initials="PR" variant="primary" />
    <Avatar initials="SC" variant="secondary" />
    <Avatar initials="SU" variant="success" />
    <Avatar initials="WA" variant="warning" />
    <Avatar initials="DA" variant="danger" />
    <Avatar initials="IN" variant="info" />
  </div>
</div>`,
    },
    {
      title: "Status Indicators",
      description: "Avatar con indicatori di stato utente",
      code: `<div className="flex items-center gap-6">
  <Avatar 
    src="/user1.jpg" 
    alt="Online User" 
    status="online" 
    statusPosition="bottom-right"
    size="lg"
  />
  
  <Avatar 
    initials="BU" 
    status="busy" 
    statusPosition="top-right"
    variant="danger"
    size="lg"
  />
  
  <Avatar 
    initials="AW" 
    status="away" 
    statusPosition="bottom-left"
    variant="warning"
    size="lg"
  />
  
  <Avatar 
    initials="OF" 
    status="offline" 
    variant="secondary"
    size="lg"
  />
</div>`,
    },
    {
      title: "Avatar Interattivi",
      description: "Avatar cliccabili con azioni personalizzate",
      code: `const handleAvatarClick = (user: string) => {
  console.log(\`Clicked on \${user} avatar\`);
  // Apri profilo utente, menu, etc.
};

<div className="flex items-center gap-4">
  <Avatar 
    src="/user1.jpg"
    alt="Profile Avatar"
    clickable
    onClick={() => handleAvatarClick('John')}
    bordered
    size="lg"
    status="online"
  />
  
  <Avatar 
    initials="JS"
    variant="primary"
    clickable
    onClick={() => handleAvatarClick('Jane')}
    size="md"
    status="busy"
  />
</div>`,
    },
    {
      title: "Avatar Group",
      description: "Gruppo di avatar sovrapposti per team/collaboratori",
      code: `<div className="flex -space-x-2">
  <Avatar 
    src="/user1.jpg" 
    alt="User 1" 
    size="md" 
    bordered
    className="z-30"
  />
  <Avatar 
    src="/user2.jpg" 
    alt="User 2" 
    size="md" 
    bordered
    className="z-20"
  />
  <Avatar 
    initials="JS" 
    variant="primary" 
    size="md" 
    bordered
    className="z-10"
  />
  <Avatar 
    initials="+5" 
    variant="secondary" 
    size="md" 
    bordered
    clickable
    onClick={() => showAllMembers()}
  />
</div>`,
    },
    {
      title: "Avatar in Lista Utenti",
      description: "Uso pratico in liste e tabelle",
      code: `const users = [
  { id: 1, name: "John Doe", avatar: "/john.jpg", status: "online" },
  { id: 2, name: "Jane Smith", avatar: null, initials: "JS", status: "busy" },
  { id: 3, name: "Bob Wilson", avatar: "/bob.jpg", status: "away" },
  { id: 4, name: "Alice Brown", avatar: null, initials: "AB", status: "offline" },
];

<div className="space-y-3">
  {users.map((user) => (
    <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover">
      <Avatar
        src={user.avatar}
        alt={user.name}
        initials={user.initials}
        status={user.status}
        clickable
        onClick={() => openUserProfile(user.id)}
        size="md"
        variant={user.status === 'online' ? 'success' : 'secondary'}
      />
      <div>
        <p className="font-medium text-text-primary">{user.name}</p>
        <p className="text-sm text-text-secondary capitalize">{user.status}</p>
      </div>
    </div>
  ))}
</div>`,
    },
  ],
  notes:
    "Initials sono limitate a 2 caratteri e uppercase automatico. Status indicator con border bianco per contrast. Loading state con skeleton per immagini. Keyboard navigation completa per clickable avatars.",
};

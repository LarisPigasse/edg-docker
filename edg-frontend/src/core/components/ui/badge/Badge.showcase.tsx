// src/core/components/ui/badge/Badge.showcase.tsx
import React, { useState } from "react";
import Badge from "./Badge";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Star,
  Crown,
  Zap,
  Mail,
  Bell,
  User,
  Clock,
  Calendar,
  Package,
  ShoppingCart,
  Download,
  Upload,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Circle,
} from "lucide-react";

/**
 * BadgeShowcase - Showcase completo per il Badge component.
 *
 * Dimostra tutte le features del Badge:
 * - Tutte le varianti (default, success, warning, danger, info)
 * - Tutte le dimensioni (xs, sm, md)
 * - Auto-mapping degli status
 * - Badge con icone
 * - Badge numerici e contatori
 * - Uso in contesti reali (tabelle, card, notifiche)
 */
export const BadgeShowcase: React.FC = () => {
  // State per esempi interattivi
  const [notifications, setNotifications] = useState(12);
  const [emailCount, setEmailCount] = useState(5);
  const [cartItems, setCartItems] = useState(3);
  
  // Simulazione tags removibili (esempio concettuale)
  const [tags, setTags] = useState([
    { id: 1, label: "React", variant: "info" as const },
    { id: 2, label: "TypeScript", variant: "success" as const },
    { id: 3, label: "Tailwind CSS", variant: "warning" as const },
    { id: 4, label: "Vite", variant: "default" as const },
  ]);

  // Dati esempio per tabella
  const users = [
    { id: 1, name: "Alice Johnson", status: "attivo", role: "Admin", lastSeen: "2 min fa", tasks: 12 },
    { id: 2, name: "Bob Smith", status: "inattivo", role: "Editor", lastSeen: "1 ora fa", tasks: 5 },
    { id: 3, name: "Carol White", status: "pendente", role: "User", lastSeen: "3 giorni fa", tasks: 0 },
    { id: 4, name: "David Brown", status: "completato", role: "Manager", lastSeen: "Online", tasks: 8 },
    { id: 5, name: "Eve Davis", status: "errore", role: "Developer", lastSeen: "5 min fa", tasks: 23 },
  ];

  // Progetti esempio
  const projects = [
    { name: "Website Redesign", status: "in_elaborazione", priority: "high", completion: 75 },
    { name: "Mobile App", status: "completato", priority: "medium", completion: 100 },
    { name: "API Development", status: "nuovo", priority: "high", completion: 0 },
    { name: "Database Migration", status: "errore", priority: "critical", completion: 45 },
    { name: "UI Components", status: "approvato", priority: "low", completion: 90 },
  ];

  return (
    <div className="space-y-8">
      {/* Varianti Base */}
      <TitledSurface title="Varianti Badge" variant="primary" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Varianti Semantiche
            </ThemedText>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Con Testo Descrittivo
            </ThemedText>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">Operazione Completata</Badge>
              <Badge variant="warning">Richiede Attenzione</Badge>
              <Badge variant="danger">Errore Critico</Badge>
              <Badge variant="info">Nuova Funzionalità</Badge>
              <Badge variant="default">Stato Neutro</Badge>
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Dimensioni */}
      <TitledSurface title="Dimensioni Badge" variant="secondary" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Confronto Dimensioni
            </ThemedText>
            <div className="flex items-center flex-wrap gap-3">
              <Badge size="xs" variant="info">Extra Small (xs)</Badge>
              <Badge size="sm" variant="info">Small (sm)</Badge>
              <Badge size="md" variant="info">Medium (md)</Badge>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Dimensioni con Numeri
            </ThemedText>
            <div className="flex items-center gap-3">
              <Badge size="xs" variant="danger">99+</Badge>
              <Badge size="sm" variant="warning">42</Badge>
              <Badge size="md" variant="success">7</Badge>
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Auto-mapping Status */}
      <TitledSurface title="Auto-mapping Intelligente" variant="modal" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Status Automatici - Il badge si colora in base al contenuto
            </ThemedText>
            <div className="flex flex-wrap gap-2">
              <Badge status="attivo">Attivo</Badge>
              <Badge status="inattivo">Inattivo</Badge>
              <Badge status="completato">Completato</Badge>
              <Badge status="pendente">Pendente</Badge>
              <Badge status="errore">Errore</Badge>
              <Badge status="nuovo">Nuovo</Badge>
              <Badge status="bozza">Bozza</Badge>
              <Badge status="pubblicato">Pubblicato</Badge>
              <Badge status="scaduto">Scaduto</Badge>
              <Badge status="in_elaborazione">In Elaborazione</Badge>
              <Badge status="approvato">Approvato</Badge>
              <Badge status="rifiutato">Rifiutato</Badge>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Override con Variant Esplicita
            </ThemedText>
            <div className="flex flex-wrap gap-2">
              <Badge status="attivo" variant="danger">Attivo (ma forzato danger)</Badge>
              <Badge variant="success">Success (senza status)</Badge>
              <Badge status="unknown_status">Unknown Status (default)</Badge>
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Badge con Icone */}
      <TitledSurface title="Badge con Icone" variant="info" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Icone Leading
            </ThemedText>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" size="sm">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verificato
              </Badge>
              <Badge variant="warning" size="sm">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Attenzione
              </Badge>
              <Badge variant="danger" size="sm">
                <XCircle className="w-3 h-3 mr-1" />
                Errore
              </Badge>
              <Badge variant="info" size="sm">
                <Info className="w-3 h-3 mr-1" />
                Info
              </Badge>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Badge Premium/Special
            </ThemedText>
            <div className="flex flex-wrap gap-2">
              <Badge variant="warning" size="sm">
                <Star className="w-3 h-3 mr-1" />
                Premium
              </Badge>
              <Badge variant="info" size="sm">
                <Crown className="w-3 h-3 mr-1" />
                VIP
              </Badge>
              <Badge variant="success" size="sm">
                <Zap className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Status con Icone
            </ThemedText>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" size="sm">
                <Circle className="w-2 h-2 mr-1 fill-current" />
                Online
              </Badge>
              <Badge variant="danger" size="sm">
                <Circle className="w-2 h-2 mr-1" />
                Offline
              </Badge>
              <Badge variant="warning" size="sm">
                <Circle className="w-2 h-2 mr-1 fill-current animate-pulse" />
                Away
              </Badge>
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Badge Numerici e Notifiche */}
      <TitledSurface title="Badge Numerici e Notifiche" variant="secondary" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Notification Badges
            </ThemedText>
            <div className="flex items-center gap-6">
              {/* Email */}
              <div className="relative">
                <button 
                  className="p-3 rounded-lg bg-bg-secondary hover:bg-bg-hover transition-colors"
                  onClick={() => setEmailCount(prev => prev + 1)}
                >
                  <Mail className="w-5 h-5" />
                </button>
                {emailCount > 0 && (
                  <Badge 
                    variant="danger" 
                    size="xs" 
                    className="absolute -top-1 -right-1 min-w-[20px]"
                  >
                    {emailCount > 99 ? "99+" : emailCount}
                  </Badge>
                )}
              </div>

              {/* Notifications */}
              <div className="relative">
                <button 
                  className="p-3 rounded-lg bg-bg-secondary hover:bg-bg-hover transition-colors"
                  onClick={() => setNotifications(prev => prev + 1)}
                >
                  <Bell className="w-5 h-5" />
                </button>
                {notifications > 0 && (
                  <Badge 
                    variant="info" 
                    size="xs" 
                    className="absolute -top-1 -right-1 min-w-[20px]"
                  >
                    {notifications}
                  </Badge>
                )}
              </div>

              {/* Cart */}
              <div className="relative">
                <button 
                  className="p-3 rounded-lg bg-bg-secondary hover:bg-bg-hover transition-colors"
                  onClick={() => setCartItems(prev => prev + 1)}
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
                {cartItems > 0 && (
                  <Badge 
                    variant="success" 
                    size="xs" 
                    className="absolute -top-1 -right-1 min-w-[20px]"
                  >
                    {cartItems}
                  </Badge>
                )}
              </div>

              <button
                className="text-sm text-text-secondary hover:text-text-primary"
                onClick={() => {
                  setEmailCount(0);
                  setNotifications(0);
                  setCartItems(0);
                }}
              >
                Azzera contatori
              </button>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Statistiche e Contatori
            </ThemedText>
            <div className="flex flex-wrap gap-3">
              <Badge variant="default" size="sm">Totale: 1,234</Badge>
              <Badge variant="success" size="sm">Completati: 892</Badge>
              <Badge variant="warning" size="sm">In Attesa: 342</Badge>
              <Badge variant="danger" size="sm">Falliti: 12</Badge>
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Badge in Tabelle */}
      <TitledSurface title="Badge in Tabelle e Liste" variant="modal" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Lista Utenti
            </ThemedText>
            <div className="space-y-2">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-3 border border-border-default rounded-lg hover:bg-bg-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-bg-secondary rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-text-secondary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">{user.name}</span>
                        <Badge status={user.status} size="xs">
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default" size="xs">{user.role}</Badge>
                        <span className="text-xs text-text-secondary">• {user.lastSeen}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {user.tasks > 0 && (
                      <Badge variant="info" size="xs">
                        {user.tasks} task
                      </Badge>
                    )}
                    <button className="text-sm text-violet-600 hover:text-violet-700">
                      Dettagli
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Badge in Cards/Progetti */}
      <TitledSurface title="Badge in Card e Progetti" variant="info" padding="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project, index) => (
            <div key={index} className="p-4 border border-border-default rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-text-primary">{project.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge status={project.status} size="xs">
                      {project.status.replace('_', ' ')}
                    </Badge>
                    <Badge 
                      variant={
                        project.priority === 'critical' ? 'danger' :
                        project.priority === 'high' ? 'warning' :
                        project.priority === 'medium' ? 'info' :
                        'default'
                      } 
                      size="xs"
                    >
                      {project.priority}
                    </Badge>
                  </div>
                </div>
                <Badge 
                  variant={project.completion === 100 ? 'success' : 'default'} 
                  size="sm"
                >
                  {project.completion}%
                </Badge>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-bg-secondary rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    project.completion === 100 ? 'bg-green-500' :
                    project.completion > 50 ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`}
                  style={{ width: `${project.completion}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </TitledSurface>

      {/* Tags System (Esempio concettuale) */}
      <TitledSurface title="Sistema Tags (Esempio Concettuale)" variant="secondary" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Tags Selezionabili - Click per simulare rimozione
            </ThemedText>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
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
            {tags.length === 0 && (
              <div className="text-sm text-text-secondary">
                Tutti i tag sono stati rimossi. 
                <button 
                  className="ml-2 text-violet-600 hover:text-violet-700"
                  onClick={() => setTags([
                    { id: 1, label: "React", variant: "info" as const },
                    { id: 2, label: "TypeScript", variant: "success" as const },
                    { id: 3, label: "Tailwind CSS", variant: "warning" as const },
                    { id: 4, label: "Vite", variant: "default" as const },
                  ])}
                >
                  Ripristina
                </button>
              </div>
            )}
            <p className="text-sm text-text-secondary mt-2">
              {tags.length} tag selezionati
            </p>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Filtri Attivi
            </ThemedText>
            <div className="flex flex-wrap gap-2">
              <Badge variant="info" size="sm">
                Categoria: Development
                <span className="ml-2 opacity-60">×</span>
              </Badge>
              <Badge variant="info" size="sm">
                Anno: 2024
                <span className="ml-2 opacity-60">×</span>
              </Badge>
              <Badge variant="info" size="sm">
                Stato: Attivo
                <span className="ml-2 opacity-60">×</span>
              </Badge>
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Use Cases Speciali */}
      <TitledSurface title="Use Cases Speciali" variant="primary" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Version e Release
            </ThemedText>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" size="sm">v2.0.0</Badge>
              <Badge variant="info" size="sm">Beta</Badge>
              <Badge variant="warning" size="sm">Alpha</Badge>
              <Badge variant="danger" size="sm">Deprecated</Badge>
              <Badge variant="default" size="sm">Legacy</Badge>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Connettività e Sistema
            </ThemedText>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" size="sm">
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </Badge>
              <Badge variant="danger" size="sm">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
              <Badge variant="warning" size="sm">
                <BatteryLow className="w-3 h-3 mr-1" />
                Low Battery
              </Badge>
              <Badge variant="info" size="sm">
                <Download className="w-3 h-3 mr-1" />
                Downloading
              </Badge>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Date e Tempi
            </ThemedText>
            <div className="flex flex-wrap gap-2">
              <Badge variant="danger" size="sm">
                <Clock className="w-3 h-3 mr-1" />
                Scade Oggi
              </Badge>
              <Badge variant="warning" size="sm">
                <Calendar className="w-3 h-3 mr-1" />
                Scade tra 3 giorni
              </Badge>
              <Badge variant="info" size="sm">
                <Clock className="w-3 h-3 mr-1" />
                Ultimo accesso: 2h fa
              </Badge>
            </div>
          </div>
        </div>
      </TitledSurface>
    </div>
  );
};

export default BadgeShowcase;
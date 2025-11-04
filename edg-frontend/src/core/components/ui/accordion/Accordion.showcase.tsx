// src/core/components/ui/accordion/Accordion.showcase.tsx
import React, { useState } from "react";
import Accordion from "./Accordion";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";
import { Badge, Button } from "../";
import {
  Star,
  Shield,
  Zap,
  Settings,
  HelpCircle,
  FileText,
  Users,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  Bookmark,
} from "lucide-react";

/**
 * AccordionShowcase - Showcase completo per il Accordion component.
 *
 * Dimostra tutte le features dell'Accordion:
 * - Single/Multiple mode con esempi pratici
 * - Tutte e 3 le varianti visive (default, bordered, separated)
 * - Tutte le dimensioni (sm, md, lg)
 * - Accordion controllati con state management
 * - Contenuti complessi (JSX, form, liste, immagini)
 * - Item disabilitati e stati speciali
 * - Use cases reali (FAQ, Settings, Help, Features)
 * - Analytics e tracking delle interazioni
 */
export const AccordionShowcase: React.FC = () => {
  // State per dimostrazioni interattive
  const [controlledValue, setControlledValue] = useState<string>("faq-1");
  const [multipleValues, setMultipleValues] = useState<string[]>(["account", "notifications"]);
  const [analyticsData, setAnalyticsData] = useState({
    totalInteractions: 0,
    lastOpened: null as string | null,
    openSections: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data per esempi realistici
  const basicFaqItems = [
    {
      value: "faq-1",
      title: "Cos'è React e perché usarlo?",
      content:
        "React è una libreria JavaScript per costruire interfacce utente, sviluppata da Meta. È popolare per la sua component-based architecture, virtual DOM per performance ottimali, e il vasto ecosistema di tools e librerie.",
    },
    {
      value: "faq-2",
      title: "Come installare e configurare React?",
      content:
        "Puoi creare un nuovo progetto React usando 'npx create-react-app my-app' per una configurazione standard, oppure 'npm create vite@latest my-app -- --template react-ts' per un setup più moderno con Vite e TypeScript.",
    },
    {
      value: "faq-3",
      title: "Qual è la differenza tra props e state?",
      content:
        "Props sono dati immutabili passati dal componente parent, mentre state è lo stato interno mutabile del componente. Props fluiscono verso il basso (top-down), state è locale al componente.",
    },
    {
      value: "faq-4",
      title: "Come gestire gli eventi in React?",
      content:
        "React usa SyntheticEvents che wrappano gli eventi nativi del browser. Puoi gestire eventi usando handlers come onClick, onChange, onSubmit passati come props ai JSX elements.",
    },
  ];

  const settingsItems = [
    {
      value: "account",
      title: "👤 Impostazioni Account",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Gestisci le tue informazioni personali, preferenze e configurazioni dell'account.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
              Modifica Profilo
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Shield className="w-4 h-4" />}>
              Sicurezza
            </Button>
          </div>
          <div className="flex gap-2">
            <Badge variant="success" size="xs">
              Verificato
            </Badge>
            <Badge variant="info" size="xs">
              Premium
            </Badge>
          </div>
        </div>
      ),
    },
    {
      value: "privacy",
      title: "🔒 Privacy e Sicurezza",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Controlla chi può vedere i tuoi contenuti e come vengono utilizzati i tuoi dati.
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked className="rounded" />
              Profilo pubblico
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" />
              Notifiche email
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked className="rounded" />
              Analisi anonime
            </label>
          </div>
        </div>
      ),
    },
    {
      value: "notifications",
      title: "🔔 Notifiche",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">Personalizza quando e come ricevere notifiche via email, push e in-app.</p>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Email digest giornaliero</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span>Push notifications</span>
              <input type="checkbox" className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span>SMS per sicurezza</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
          </div>
        </div>
      ),
    },
    {
      value: "billing",
      title: "💳 Fatturazione",
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Piano attuale:</span>
            <Badge variant="info">Pro Monthly</Badge>
          </div>
          <div className="text-sm text-text-secondary">Prossima fatturazione: 15 Gennaio 2025</div>
          <Button variant="primary" size="sm" fullWidth>
            Gestisci Fatturazione
          </Button>
        </div>
      ),
    },
  ];

  const featureItems = [
    {
      value: "performance",
      title: "⚡ Performance Ottimizzate",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">Animazioni smooth con Radix UI e CSS transitions ottimizzate.</p>
          <ul className="text-sm space-y-1 list-disc list-inside text-text-secondary">
            <li>Collapse/expand con animation duration 200ms</li>
            <li>Chevron rotation sincronizzata</li>
            <li>GPU acceleration per transforms</li>
            <li>No layout thrashing durante animazioni</li>
          </ul>
          <div className="flex gap-2">
            <Badge variant="success" size="xs">
              Smooth
            </Badge>
            <Badge variant="info" size="xs">
              60 FPS
            </Badge>
          </div>
        </div>
      ),
    },
    {
      value: "accessibility",
      title: "♿ Accessibility Completa",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">Radix UI garantisce WCAG 2.1 compliance e screen reader support.</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Keyboard nav
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              ARIA attributes
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Focus management
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Screen readers
            </div>
          </div>
        </div>
      ),
    },
    {
      value: "customization",
      title: "🎨 Personalizzazione",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">3 varianti visive e 3 dimensioni per adattarsi a ogni design.</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 border rounded text-xs">
              <div className="font-medium">Default</div>
              <div className="text-text-secondary">Minimal</div>
            </div>
            <div className="p-2 border rounded text-xs">
              <div className="font-medium">Bordered</div>
              <div className="text-text-secondary">Cards</div>
            </div>
            <div className="p-2 border rounded text-xs">
              <div className="font-medium">Separated</div>
              <div className="text-text-secondary">Spaced</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const helpItems = [
    {
      value: "getting-started",
      title: "🚀 Come iniziare",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">Guida passo-passo per iniziare con i nostri componenti.</p>
          <ol className="text-sm space-y-2 list-decimal list-inside text-text-secondary">
            <li>Installa le dipendenze necessarie</li>
            <li>Importa il componente desiderato</li>
            <li>Configura le props base</li>
            <li>Personalizza styling e comportamento</li>
          </ol>
          <Button variant="primary" size="sm" leftIcon={<FileText className="w-4 h-4" />}>
            Leggi la Documentazione
          </Button>
        </div>
      ),
    },
    {
      value: "advanced",
      title: "⚙️ Funzionalità Avanzate",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">Scopri le feature più potenti e i pattern avanzati.</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-500" />
              <span>Controlled state</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-500" />
              <span>Multiple mode</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-violet-500" />
              <span>Custom content</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-500" />
              <span>Disabled items</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      value: "troubleshooting",
      title: "🔧 Risoluzione Problemi",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">Soluzioni ai problemi più comuni e debugging tips.</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Animation non funziona:</strong> Verifica che le animazioni CSS siano attive
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Content non visibile:</strong> Controlla overflow e height del container
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      value: "contact",
      title: "📞 Contatti e Supporto",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-violet-500" />
              <span>support@example.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-violet-500" />
              <span>+39 123 456 7890</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-violet-500" />
              <span>Lun-Ven 9:00-18:00</span>
            </div>
          </div>
          <Button variant="primary" size="sm" fullWidth leftIcon={<HelpCircle className="w-4 h-4" />}>
            Apri Ticket di Supporto
          </Button>
        </div>
      ),
    },
  ];

  // Items per ricerca FAQ
  const allFaqItems = [
    { value: "react-basics", title: "Che cos'è React?", content: "React è una libreria JavaScript...", category: "basics" },
    { value: "react-install", title: "Come installare React?", content: "Usa create-react-app o Vite...", category: "setup" },
    { value: "jsx-syntax", title: "Cos'è JSX?", content: "JSX è una sintassi simile a HTML...", category: "basics" },
    {
      value: "components",
      title: "Come creare componenti?",
      content: "I componenti sono funzioni che ritornano JSX...",
      category: "development",
    },
    {
      value: "props-state",
      title: "Props vs State?",
      content: "Props sono immutabili, state è mutabile...",
      category: "concepts",
    },
    {
      value: "hooks-intro",
      title: "Cosa sono gli Hooks?",
      content: "Gli hooks permettono di usare state nei function components...",
      category: "advanced",
    },
  ];

  const filteredFaqItems = allFaqItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers per interazioni
  const handleSingleChange = (value: string) => {
    setControlledValue(value);
    updateAnalytics(value, "single");
  };

  const handleMultipleChange = (values: string[]) => {
    setMultipleValues(values);
    updateAnalytics(values[values.length - 1], "multiple");
  };

  const updateAnalytics = (lastValue: string, type: string) => {
    setAnalyticsData((prev) => ({
      totalInteractions: prev.totalInteractions + 1,
      lastOpened: lastValue,
      openSections: type === "multiple" ? multipleValues.length : controlledValue ? 1 : 0,
    }));
  };

  return (
    <div className="space-y-8">
      {/* Accordion Types */}
      <TitledSurface title="Tipi di Accordion" variant="primary" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Single Mode (Collapsible)
            </ThemedText>
            <Accordion type="single" items={basicFaqItems.slice(0, 3)} defaultValue="faq-1" collapsible variant="default" />
            <ThemedText variant="secondary" className="text-sm mt-2">
              Solo un item può essere aperto alla volta. Collapsible permette di chiudere tutto.
            </ThemedText>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Multiple Mode
            </ThemedText>
            <Accordion
              type="multiple"
              items={settingsItems.slice(0, 3)}
              defaultValue={["account", "notifications"]}
              variant="bordered"
            />
            <ThemedText variant="secondary" className="text-sm mt-2">
              Più item possono essere aperti contemporaneamente. Ideale per settings e configurazioni.
            </ThemedText>
          </div>
        </div>
      </TitledSurface>

      {/* Accordion Variants */}
      <TitledSurface title="Varianti Visive" variant="secondary" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Default - Minimalista
            </ThemedText>
            <Accordion
              type="single"
              items={[
                { value: "d1", title: "Default Style", content: "Separatori sottili tra gli item, design pulito e minimale." },
                { value: "d2", title: "Perfetto per FAQ", content: "Ideale per FAQ, help center e contenuti informativi." },
              ]}
              variant="default"
              collapsible
            />
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Bordered - Card Style
            </ThemedText>
            <Accordion
              type="single"
              items={[
                {
                  value: "b1",
                  title: "Bordered Cards",
                  content: "Ogni item ha un bordo completo con angoli arrotondati, stile card.",
                },
                {
                  value: "b2",
                  title: "Professional Look",
                  content: "Aspetto più formale e strutturato, perfetto per dashboard.",
                },
              ]}
              variant="bordered"
              collapsible
            />
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Separated - Spacing Emphasis
            </ThemedText>
            <Accordion
              type="single"
              items={[
                {
                  value: "s1",
                  title: "Separated Items",
                  content: "Items separati con spaziatura e background diversi per maggiore enfasi.",
                },
                {
                  value: "s2",
                  title: "Visual Hierarchy",
                  content: "Ottimo per contenuti importanti che richiedono attenzione visiva.",
                },
              ]}
              variant="separated"
              collapsible
            />
          </div>
        </div>
      </TitledSurface>

      {/* Accordion Sizes */}
      <TitledSurface title="Dimensioni Accordion" variant="modal" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Small - Compact Spaces
            </ThemedText>
            <Accordion
              type="single"
              items={[
                {
                  value: "sm1",
                  title: "Small Accordion",
                  content: "Perfetto per sidebar, drawer e spazi limitati. Font e padding ridotti.",
                },
                { value: "sm2", title: "Compact Design", content: "Mantiene leggibilità riducendo l'ingombro visivo." },
              ]}
              size="sm"
              variant="bordered"
              collapsible
            />
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Medium - Standard (Default)
            </ThemedText>
            <Accordion
              type="single"
              items={[
                {
                  value: "md1",
                  title: "Medium Accordion",
                  content: "Dimensione standard per la maggior parte dei casi d'uso. Equilibrio tra compattezza e leggibilità.",
                },
                { value: "md2", title: "Versatile Usage", content: "Adatto per contenuti principali, FAQ, documentazione." },
              ]}
              size="md"
              variant="default"
              collapsible
            />
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Large - Prominent Display
            </ThemedText>
            <Accordion
              type="single"
              items={[
                {
                  value: "lg1",
                  title: "Large Accordion",
                  content: "Font size e padding maggiori per contenuti di maggiore importanza. Ottima leggibilità.",
                },
                {
                  value: "lg2",
                  title: "Feature Highlights",
                  content: "Ideale per presentare features, vantaggi competitivi, contenuti hero.",
                },
              ]}
              size="lg"
              variant="separated"
              collapsible
            />
          </div>
        </div>
      </TitledSurface>

      {/* Interactive Examples */}
      <TitledSurface title="Accordion Interattivi" variant="info" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Accordion Controllato
            </ThemedText>
            <Accordion
              type="single"
              items={basicFaqItems}
              value={controlledValue}
              onValueChange={handleSingleChange}
              variant="bordered"
              collapsible
            />
            <div className="mt-3 p-3 bg-bg-secondary rounded-lg">
              <ThemedText variant="primary" className="text-sm font-medium mb-1" block>
                Stato Controllato
              </ThemedText>
              <ThemedText variant="secondary" className="text-xs">
                Valore attuale: {controlledValue || "Nessuno"}
              </ThemedText>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Multiple con Analytics
            </ThemedText>
            <Accordion
              type="multiple"
              items={settingsItems}
              value={multipleValues}
              onValueChange={handleMultipleChange}
              variant="separated"
            />
            <div className="mt-3 p-3 bg-bg-info rounded-lg">
              <ThemedText variant="primary" className="text-sm font-medium mb-2" block>
                📊 Analytics Dashboard
              </ThemedText>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <ThemedText variant="primary" className="text-lg font-bold" block>
                    {analyticsData.totalInteractions}
                  </ThemedText>
                  <ThemedText variant="secondary" className="text-xs">
                    Interazioni
                  </ThemedText>
                </div>
                <div>
                  <ThemedText variant="primary" className="text-lg font-bold" block>
                    {multipleValues.length}
                  </ThemedText>
                  <ThemedText variant="secondary" className="text-xs">
                    Sezioni Aperte
                  </ThemedText>
                </div>
                <div>
                  <ThemedText variant="primary" className="text-lg font-bold" block>
                    {analyticsData.lastOpened ? "✓" : "–"}
                  </ThemedText>
                  <ThemedText variant="secondary" className="text-xs">
                    Ultima Azione
                  </ThemedText>
                </div>
              </div>
              {analyticsData.lastOpened && (
                <ThemedText variant="secondary" className="text-xs mt-2 text-center">
                  Ultima sezione: {analyticsData.lastOpened}
                </ThemedText>
              )}
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Complex Content */}
      <TitledSurface title="Contenuti Complessi" variant="secondary" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Features con Componenti Integrati
            </ThemedText>
            <Accordion type="single" items={featureItems} variant="separated" size="md" collapsible />
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Help Center con Item Disabilitato
            </ThemedText>
            <Accordion
              type="single"
              items={[
                ...helpItems,
                {
                  value: "beta-features",
                  title: "🚧 Funzionalità Beta (Prossimamente)",
                  content: "Queste funzionalità saranno disponibili nella prossima release.",
                  disabled: true,
                },
              ]}
              variant="default"
              collapsible
            />
          </div>
        </div>
      </TitledSurface>

      {/* Searchable FAQ */}
      <TitledSurface title="FAQ con Ricerca" variant="modal" padding="lg">
        <div className="space-y-4">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              FAQ React - Cerca nelle domande
            </ThemedText>
            <input
              type="text"
              placeholder="Cerca nelle FAQ... (es. 'hooks', 'component', 'jsx')"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {filteredFaqItems.length > 0 ? (
            <Accordion type="single" items={filteredFaqItems} variant="default" collapsible />
          ) : searchTerm ? (
            <div className="text-center py-8">
              <HelpCircle className="w-12 h-12 text-text-secondary mx-auto mb-3" />
              <ThemedText variant="primary" className="font-medium mb-1" block>
                Nessuna FAQ trovata
              </ThemedText>
              <ThemedText variant="secondary" className="text-sm">
                Prova con termini di ricerca diversi come "react", "component" o "jsx"
              </ThemedText>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <ThemedText variant="secondary" className="text-sm">
                Digita per cercare nelle FAQ...
              </ThemedText>
            </div>
          )}

          {searchTerm && filteredFaqItems.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Info className="w-4 h-4" />
              <span>
                Trovate {filteredFaqItems.length} FAQ per "{searchTerm}"
              </span>
            </div>
          )}
        </div>
      </TitledSurface>

      {/* Real-world Use Cases */}
      <TitledSurface title="Casi d'Uso Reali" variant="info" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Dashboard Settings
            </ThemedText>
            <Accordion
              type="multiple"
              items={[
                {
                  value: "profile-settings",
                  title: "👤 Profilo Utente",
                  content: (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-violet-600" />
                        </div>
                        <div>
                          <ThemedText variant="primary" className="font-medium">
                            Giovanni Rossi
                          </ThemedText>
                          <ThemedText variant="secondary" className="text-sm">
                            giovanni@example.com
                          </ThemedText>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm">
                          Modifica
                        </Button>
                        <Button variant="outline" size="sm">
                          Avatar
                        </Button>
                      </div>
                    </div>
                  ),
                },
                {
                  value: "subscription",
                  title: "💎 Abbonamento Pro",
                  content: (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Piano attuale:</span>
                        <Badge variant="info">Pro Annual</Badge>
                      </div>
                      <div className="text-sm text-text-secondary">
                        <div>Rinnovo: 15 Marzo 2025</div>
                        <div>€99/anno (risparmi €21)</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm">
                          Upgrade
                        </Button>
                        <Button variant="outline" size="sm">
                          Fatture
                        </Button>
                      </div>
                    </div>
                  ),
                },
                {
                  value: "team-members",
                  title: "👥 Team (3/5 membri)",
                  content: (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {[
                          { name: "Alice Bianchi", role: "Admin", avatar: "AB" },
                          { name: "Marco Verdi", role: "Editor", avatar: "MV" },
                          { name: "Sara Neri", role: "Viewer", avatar: "SN" },
                        ].map((member, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-violet-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                {member.avatar}
                              </div>
                              <div>
                                <div className="text-sm font-medium">{member.name}</div>
                                <div className="text-xs text-text-secondary">{member.role}</div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              •••
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" fullWidth leftIcon={<Users className="w-4 h-4" />}>
                        Invita Membri
                      </Button>
                    </div>
                  ),
                },
              ]}
              defaultValue={["profile-settings", "subscription"]}
              variant="separated"
              size="md"
            />
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Product Features Showcase
            </ThemedText>
            <Accordion
              type="single"
              items={[
                {
                  value: "analytics",
                  title: "📊 Analytics Avanzate",
                  content: (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-bg-secondary rounded">
                          <div className="text-2xl font-bold text-violet-600">1.2M</div>
                          <div className="text-sm text-text-secondary">Views</div>
                        </div>
                        <div className="p-3 bg-bg-secondary rounded">
                          <div className="text-2xl font-bold text-green-600">+23%</div>
                          <div className="text-sm text-text-secondary">Growth</div>
                        </div>
                        <div className="p-3 bg-bg-secondary rounded">
                          <div className="text-2xl font-bold text-blue-600">87%</div>
                          <div className="text-sm text-text-secondary">Retention</div>
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary">
                        Dashboard completa con metriche real-time, segmentazione avanzata e export dati.
                      </p>
                    </div>
                  ),
                },
                {
                  value: "automation",
                  title: "🤖 Automazione Workflow",
                  content: (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Zap className="w-8 h-8 text-amber-500" />
                        <div>
                          <ThemedText variant="primary" className="font-medium">
                            Smart Triggers
                          </ThemedText>
                          <ThemedText variant="secondary" className="text-sm">
                            Automatizza azioni basate su eventi
                          </ThemedText>
                        </div>
                      </div>
                      <ul className="text-sm space-y-1 list-disc list-inside text-text-secondary ml-4">
                        <li>Email notifications automatiche</li>
                        <li>Assegnazione task intelligente</li>
                        <li>Sync con calendari esterni</li>
                        <li>Backup automatici giornalieri</li>
                      </ul>
                    </div>
                  ),
                },
                {
                  value: "integrations",
                  title: "🔗 Integrazioni (50+ app)",
                  content: (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-3">
                        {["Slack", "GitHub", "Gmail", "Drive", "Zoom", "Figma", "Trello", "+43"].map((app, i) => (
                          <div key={i} className="p-2 border border-border-default rounded text-center text-xs">
                            {app}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-text-secondary">
                        Connetti i tuoi tool preferiti con un click. API REST e webhook supportati.
                      </p>
                      <Button variant="primary" size="sm" leftIcon={<Star className="w-4 h-4" />}>
                        Esplora Integrations
                      </Button>
                    </div>
                  ),
                },
              ]}
              variant="bordered"
              size="lg"
              collapsible
            />
          </div>
        </div>
      </TitledSurface>

      {/* Summary Stats */}
      <TitledSurface title="Statistiche Accordion" variant="primary" padding="lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <ThemedText variant="primary" className="text-3xl font-bold" block>
              2
            </ThemedText>
            <ThemedText variant="secondary" className="text-sm">
              Modi
            </ThemedText>
            <ThemedText variant="secondary" className="text-xs">
              Single/Multiple
            </ThemedText>
          </div>
          <div>
            <ThemedText variant="primary" className="text-3xl font-bold" block>
              3
            </ThemedText>
            <ThemedText variant="secondary" className="text-sm">
              Varianti
            </ThemedText>
            <ThemedText variant="secondary" className="text-xs">
              Visual Styles
            </ThemedText>
          </div>
          <div>
            <ThemedText variant="primary" className="text-3xl font-bold" block>
              3
            </ThemedText>
            <ThemedText variant="secondary" className="text-sm">
              Dimensioni
            </ThemedText>
            <ThemedText variant="secondary" className="text-xs">
              Size Options
            </ThemedText>
          </div>
          <div>
            <ThemedText variant="primary" className="text-3xl font-bold" block>
              ♿
            </ThemedText>
            <ThemedText variant="secondary" className="text-sm">
              Accessible
            </ThemedText>
            <ThemedText variant="secondary" className="text-xs">
              WCAG 2.1
            </ThemedText>
          </div>
        </div>

        <div className="mt-6 p-4 bg-bg-info rounded-lg">
          <ThemedText variant="primary" className="font-medium mb-2" block>
            🎯 Accordion Component Features
          </ThemedText>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Radix UI per keyboard navigation e screen reader support</li>
            <li>• Animazioni smooth con GPU acceleration (200ms duration)</li>
            <li>• Contenuti ricchi supportati (JSX, form, liste, immagini)</li>
            <li>• Controlled/uncontrolled modes con callback onValueChange</li>
            <li>• Theme integration completa con CSS custom properties</li>
            <li>• Collapsible mode per single accordion (chiudi tutto)</li>
          </ul>
        </div>
      </TitledSurface>
    </div>
  );
};

export default AccordionShowcase;

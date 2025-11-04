// src/features/shared/Explorer.tsx
import React, { useState, useMemo } from "react";
import { InfoCard } from "../core/components/ui";
import { HeaderGroup } from "../core/components/layout";
import type { ComponentCategory } from "../core/components/ui/";
import type { ComponentData } from "../data/";
import ExplorerModal from "./ExplorerModal";
import { tableData, TableShowcase, tableLinkData, TableLinkShowcase } from "../core/components/data/";
import { cardData, CardShowcase, separatorData, SeparatorShowcase, sheetData, SheetShowcase } from "../core/components/layout/";
import {
  commandData,
  CommandShowcase,
  navigationMenuData,
  NavigationMenuShowcase,
  tabsData,
  TabsShowcase,
} from "../core/components/navigation";
import {
  checkboxData,
  CheckboxShowcase,
  datePickerData,
  DatePickerShowcase,
  formFieldData,
  FormFieldShowcase,
  labelData,
  LabelShowcase,
  inputData,
  InputShowcase,
  multiSelectData,
  MultiSelectShowcase,
  radioGroupData,
  RadioGroupShowcase,
  selectData,
  SelectShowcase,
  switchData,
  SwitchShowcase,
  textAreaData,
  TextAreaShowcase,
  timePickerData,
  TimePickerShowcase,
} from "../core/components/form";
import {
  alertData,
  AlertShowcase,
  progressData,
  ProgressShowcase,
  skeletonData,
  SkeletonShowcase,
  spinnerData,
  SpinnerShowcase,
  toastData,
  ToastShowcase,
  tooltipData,
  TooltipShowcase,
} from "../core/components/feedback";
import {
  buttonData,
  ButtonShowcase,
  avatarData,
  AvatarShowcase,
  accordionData,
  AccordionShowcase,
  badgeData,
  BadgeShowcase,
  confirmModalData,
  ConfirmModalShowcase,
  infoCardData,
  InfoCardShowcase,
  modalData,
  ModalShowcase,
} from "../core/components/ui";

// Definizione dei componenti ristrutturati
interface RestructuredComponent {
  data: ComponentData;
  showcase: React.ComponentType;
}

// Registry dei componenti ristrutturati (importati dal barrel file)
const RESTRUCTURED_COMPONENTS: Record<string, RestructuredComponent> = {
  accordion: {
    data: accordionData,
    showcase: AccordionShowcase,
  },
  alert: {
    data: alertData,
    showcase: AlertShowcase,
  },
  avatar: {
    data: avatarData,
    showcase: AvatarShowcase,
  },
  badge: {
    data: badgeData,
    showcase: BadgeShowcase,
  },
  button: {
    data: buttonData,
    showcase: ButtonShowcase,
  },
  card: {
    data: cardData,
    showcase: CardShowcase,
  },
  checkbox: {
    data: checkboxData,
    showcase: CheckboxShowcase,
  },
  command: {
    data: commandData,
    showcase: CommandShowcase,
  },
  confirmModal: {
    data: confirmModalData,
    showcase: ConfirmModalShowcase,
  },
  datePicker: {
    data: datePickerData,
    showcase: DatePickerShowcase,
  },
  formField: {
    data: formFieldData,
    showcase: FormFieldShowcase,
  },
  infoCard: {
    data: infoCardData,
    showcase: InfoCardShowcase,
  },
  input: {
    data: inputData,
    showcase: InputShowcase,
  },
  label: {
    data: labelData,
    showcase: LabelShowcase,
  },
  modal: {
    data: modalData,
    showcase: ModalShowcase,
  },
  multiSelect: {
    data: multiSelectData,
    showcase: MultiSelectShowcase,
  },
  navigationMenu: {
    data: navigationMenuData,
    showcase: NavigationMenuShowcase,
  },
  progress: {
    data: progressData,
    showcase: ProgressShowcase,
  },
  radioGroup: {
    data: radioGroupData,
    showcase: RadioGroupShowcase,
  },
  select: {
    data: selectData,
    showcase: SelectShowcase,
  },
  separator: {
    data: separatorData,
    showcase: SeparatorShowcase,
  },
  sheet: {
    data: sheetData,
    showcase: SheetShowcase,
  },
  skeleton: {
    data: skeletonData,
    showcase: SkeletonShowcase,
  },
  spinner: {
    data: spinnerData,
    showcase: SpinnerShowcase,
  },
  switch: {
    data: switchData,
    showcase: SwitchShowcase,
  },
  table: {
    data: tableData,
    showcase: TableShowcase,
  },
  tableLink: {
    data: tableLinkData,
    showcase: TableLinkShowcase,
  },
  tabs: {
    data: tabsData,
    showcase: TabsShowcase,
  },
  textArea: {
    data: textAreaData,
    showcase: TextAreaShowcase,
  },
  timePicker: {
    data: timePickerData,
    showcase: TimePickerShowcase,
  },
  toast: {
    data: toastData,
    showcase: ToastShowcase,
  },
  tooltip: {
    data: tooltipData,
    showcase: TooltipShowcase,
  },
};

// Lista componenti per l'Explorer
const RESTRUCTURED_COMPONENTS_LIST = Object.values(RESTRUCTURED_COMPONENTS).map((comp) => comp.data);

interface ExplorerProps {
  /** Categoria da filtrare (opzionale) */
  categoryFilter?: ComponentCategory;
  /** Query di ricerca iniziale */
  initialSearch?: string;
  /** Titolo personalizzato */
  title?: string;
  /** Sottotitolo personalizzato */
  subtitle?: string;
  /** Classi CSS aggiuntive */
  className?: string;
}

/**
 * Explorer - Esplora componenti ristrutturati con co-locazione.
 *
 * Features:
 * - Lista solo componenti ristrutturati (cartella + 3 files)
 * - Search e filtri per categoria
 * - Modal con tabs: Informazioni + Esempi live
 * - Import da barrel file per data + showcase
 * - Gradual migration - aggiungiamo componenti quando ristrutturati
 */
const Explorer: React.FC<ExplorerProps> = ({
  categoryFilter,
  initialSearch = "",
  title = "Component Explorer",
  subtitle = "Componenti strutturati con co-locazione",
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | "all">(categoryFilter || "all");
  const [selectedComponent, setSelectedComponent] = useState<RestructuredComponent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filtra e cerca componenti
  const filteredComponents = useMemo(() => {
    let components = RESTRUCTURED_COMPONENTS_LIST;

    // Filtra per categoria
    if (selectedCategory !== "all") {
      components = components.filter((comp) => comp.category === selectedCategory);
    }

    // Filtra per ricerca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      components = components.filter(
        (comp) =>
          comp.title.toLowerCase().includes(query) ||
          comp.description.toLowerCase().includes(query) ||
          comp.id.toLowerCase().includes(query)
      );
    }

    return components;
  }, [searchQuery, selectedCategory]);

  // Categorie disponibili per il filtro
  const availableCategories = useMemo(() => {
    const categories = Array.from(new Set(RESTRUCTURED_COMPONENTS_LIST.map((comp) => comp.category)));
    return categories.sort();
  }, []);

  // Handle card click
  const handleCardClick = (componentData: ComponentData) => {
    const componentKey = componentData.id;
    const restructuredComponent = RESTRUCTURED_COMPONENTS[componentKey];

    if (restructuredComponent) {
      setSelectedComponent(restructuredComponent);
      setModalOpen(true);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedComponent(null);
  };

  // Get stats
  const totalComponents = RESTRUCTURED_COMPONENTS_LIST.length;
  const filteredCount = filteredComponents.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <HeaderGroup
          title={title}
          // subtitle={`${filteredCount} ${subtitle} • ${filteredCount} di ${totalComponents} componenti`}
          spacing="tight"
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cerca componenti ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ComponentCategory | "all")}
            className="w-full px-4 py-2 border border-border-default rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          >
            <option value="all">Tutte le categorie</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Info */}
      {searchQuery && (
        <div className="text-sm text-text-secondary">
          {filteredCount > 0 ? (
            <>
              Trovati <strong>{filteredCount}</strong> componenti per "{searchQuery}"
            </>
          ) : (
            <>Nessun componente trovato per "{searchQuery}"</>
          )}
        </div>
      )}

      {/* Components Grid */}
      {filteredComponents.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filteredComponents.map((component) => (
            <InfoCard
              key={component.id}
              title={component.title}
              description={component.description}
              category={component.category}
              onClick={() => handleCardClick(component)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔧</div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Nessun componente ristrutturato trovato</h3>
          <p className="text-text-secondary mb-4">
            {searchQuery || selectedCategory !== "all"
              ? "Prova a modificare i filtri di ricerca o la categoria selezionata."
              : "I componenti verranno aggiunti man mano che vengono ristrutturati."}
          </p>
          {(searchQuery || selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              Mostra tutti i componenti
            </button>
          )}

          {/* Next Components Preview */}
          {!searchQuery && selectedCategory === "all" && (
            <div className="mt-8 p-4 bg-bg-secondary rounded-lg">
              <div className="text-sm font-medium text-text-primary mb-2">Prossimi Componenti da Ristrutturare:</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {["Avatar", "TimePicker", "NavigationMenu", "DatePicker", "Skeleton"].map((name) => (
                  <span
                    key={name}
                    className="px-2 py-1 bg-bg-primary text-text-secondary text-xs rounded border border-border-default"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Explorer Modal */}
      {selectedComponent && <ExplorerModal isOpen={modalOpen} component={selectedComponent} onClose={handleModalClose} />}
    </div>
  );
};

export default Explorer;

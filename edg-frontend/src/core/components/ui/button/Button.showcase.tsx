// src/core/components/ui/button/Button.showcase.tsx
import React, { useState } from "react";
import Button from "./Button";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";
import {
  Plus,
  Download,
  ArrowRight,
  Save,
  Send,
  Trash2,
  Edit3,
  Eye,
  Heart,
  Star,
  Share,
  Settings,
  User,
  Lock,
  Unlock,
  Check,
  X,
  AlertTriangle,
  Info,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Search,
} from "lucide-react";

/**
 * ButtonShowcase - Showcase completo per il Button component.
 *
 * Dimostra tutte le features del Button:
 * - Tutte le varianti (primary, secondary, outline, etc.)
 * - Tutte le dimensioni (xs, sm, md, lg)
 * - Stati loading con loadingText personalizzato
 * - Icone leading e trailing
 * - Stati disabled e fullWidth
 * - Button groups e toolbar patterns
 * - Form integration e use cases reali
 */
export const ButtonShowcase: React.FC = () => {
  // State per dimostrazioni interattive
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(42);
  const [isLiked, setIsLiked] = useState(false);

  // Simula operazione async
  const handleAsyncOperation = async (operation: string) => {
    setIsLoading(true);
    setActiveButton(operation);

    // Simula delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsLoading(false);
    setActiveButton(null);
    console.log(`${operation} completed!`);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsSubmitting(false);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  return (
    <div className="space-y-8">
      {/* Button Variants */}
      <TitledSurface title="Button Variants" variant="primary" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Varianti Principali
            </ThemedText>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Varianti Semantiche
            </ThemedText>
            <div className="flex flex-wrap gap-3">
              <Button variant="success" leftIcon={<Check className="w-4 h-4" />}>
                Success
              </Button>
              <Button variant="danger" leftIcon={<X className="w-4 h-4" />}>
                Danger
              </Button>
              <Button variant="warning" leftIcon={<AlertTriangle className="w-4 h-4" />}>
                Warning
              </Button>
              <Button variant="info" leftIcon={<Info className="w-4 h-4" />}>
                Info
              </Button>
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Button Sizes */}
      <TitledSurface title="Button Sizes" variant="secondary" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Tutte le Dimensioni
            </ThemedText>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="xs" variant="outline">
                Extra Small
              </Button>
              <Button size="sm" variant="outline">
                Small
              </Button>
              <Button size="md" variant="outline">
                Medium
              </Button>
              <Button size="lg" variant="outline">
                Large
              </Button>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Full Width Buttons
            </ThemedText>
            <div className="space-y-2">
              <Button variant="primary" fullWidth>
                Full Width Primary
              </Button>
              <Button variant="outline" fullWidth>
                Full Width Outline
              </Button>
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Button with Icons */}
      <TitledSurface title="Button con Icone" variant="modal" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Icone Leading (Sinistra)
            </ThemedText>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                Nuovo
              </Button>
              <Button variant="secondary" leftIcon={<Save className="w-4 h-4" />}>
                Salva
              </Button>
              <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
                Scarica
              </Button>
              <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}>
                Elimina
              </Button>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Icone Trailing (Destra)
            </ThemedText>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continua
              </Button>
              <Button variant="secondary" rightIcon={<Send className="w-4 h-4" />}>
                Invia
              </Button>
              <Button variant="outline" rightIcon={<Eye className="w-4 h-4" />}>
                Visualizza
              </Button>
              <Button variant="ghost" rightIcon={<Edit3 className="w-4 h-4" />}>
                Modifica
              </Button>
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Loading States */}
      <TitledSurface title="Stati Loading" variant="info" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Loading con Testo Personalizzato
            </ThemedText>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                isLoading={isLoading && activeButton === "save"}
                loadingText="Salvando..."
                onClick={() => handleAsyncOperation("save")}
              >
                Salva Documento
              </Button>
              <Button
                variant="secondary"
                isLoading={isLoading && activeButton === "send"}
                loadingText="Invio in corso..."
                onClick={() => handleAsyncOperation("send")}
              >
                Invia Email
              </Button>
              <Button
                variant="danger"
                isLoading={isLoading && activeButton === "delete"}
                loadingText="Eliminando..."
                onClick={() => handleAsyncOperation("delete")}
              >
                Elimina File
              </Button>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Loading Senza Testo Personalizzato
            </ThemedText>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                isLoading={isLoading && activeButton === "process"}
                onClick={() => handleAsyncOperation("process")}
              >
                Elabora Dati
              </Button>
              <Button
                variant="ghost"
                isLoading={isLoading && activeButton === "upload"}
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => handleAsyncOperation("upload")}
              >
                Upload File
              </Button>
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Interactive Examples */}
      <TitledSurface title="Esempi Interattivi" variant="secondary" padding="lg">
        <div className="space-y-6">
          {/* Like Button */}
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Like Button Interattivo
            </ThemedText>
            <div className="flex items-center gap-3">
              <Button
                variant={isLiked ? "primary" : "outline"}
                leftIcon={<Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />}
                onClick={handleLike}
              >
                {isLiked ? "Liked" : "Like"} ({likeCount})
              </Button>
              <Button variant="ghost" leftIcon={<Share className="w-4 h-4" />}>
                Condividi
              </Button>
            </div>
          </div>

          {/* Form Submission */}
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Form Submission
            </ThemedText>
            <form className="space-y-4 max-w-md">
              <input
                type="email"
                placeholder="La tua email"
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-primary"
                disabled={isSubmitting}
              />
              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  loadingText="Inviando..."
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  fullWidth
                >
                  Iscriviti alla Newsletter
                </Button>
              </div>
            </form>
          </div>
        </div>
      </TitledSurface>

      {/* Button Groups */}
      <TitledSurface title="Button Groups" variant="modal" padding="lg">
        <div className="space-y-6">
          {/* Toolbar */}
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Text Editor Toolbar
            </ThemedText>
            <div className="flex">
              <Button variant="ghost" size="sm" leftIcon={<Bold className="w-4 h-4" />} className="rounded-r-none border-r-0" />
              <Button variant="ghost" size="sm" leftIcon={<Italic className="w-4 h-4" />} className="rounded-none border-r-0" />
              <Button variant="ghost" size="sm" leftIcon={<Underline className="w-4 h-4" />} className="rounded-l-none" />
            </div>
          </div>

          {/* Alignment */}
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Alignment Controls
            </ThemedText>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" leftIcon={<AlignLeft className="w-4 h-4" />} />
              <Button variant="outline" size="sm" leftIcon={<AlignCenter className="w-4 h-4" />} />
              <Button variant="outline" size="sm" leftIcon={<AlignRight className="w-4 h-4" />} />
            </div>
          </div>

          {/* Action Groups */}
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Action Groups
            </ThemedText>
            <div className="flex flex-wrap gap-3">
              <div className="flex gap-2">
                <Button variant="primary" size="sm">
                  Salva
                </Button>
                <Button variant="outline" size="sm">
                  Annulla
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="success" size="sm" leftIcon={<Check className="w-4 h-4" />}>
                  Approva
                </Button>
                <Button variant="danger" size="sm" leftIcon={<X className="w-4 h-4" />}>
                  Rifiuta
                </Button>
              </div>
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* States and Edge Cases */}
      <TitledSurface title="Stati Speciali" variant="info" padding="lg">
        <div className="space-y-6">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Stati Disabled
            </ThemedText>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" disabled>
                Primary Disabled
              </Button>
              <Button variant="secondary" disabled>
                Secondary Disabled
              </Button>
              <Button variant="outline" disabled>
                Outline Disabled
              </Button>
              <Button variant="danger" disabled leftIcon={<Trash2 className="w-4 h-4" />}>
                Delete Disabled
              </Button>
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Icon Only Buttons
            </ThemedText>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Settings className="w-4 h-4" />}
                className="px-2"
                title="Impostazioni"
              />
              <Button variant="outline" size="sm" leftIcon={<User className="w-4 h-4" />} className="px-2" title="Profilo" />
              <Button variant="outline" size="sm" leftIcon={<Search className="w-4 h-4" />} className="px-2" title="Cerca" />
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} className="px-2" title="Aggiungi" />
            </div>
          </div>

          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Security Buttons
            </ThemedText>
            <div className="flex flex-wrap gap-3">
              <Button variant="success" leftIcon={<Unlock className="w-4 h-4" />}>
                Sblocca Account
              </Button>
              <Button variant="warning" leftIcon={<Lock className="w-4 h-4" />}>
                Blocca Account
              </Button>
              <Button variant="danger" leftIcon={<AlertTriangle className="w-4 h-4" />}>
                Sospendi Utente
              </Button>
            </div>
          </div>
        </div>
      </TitledSurface>
    </div>
  );
};

export default ButtonShowcase;

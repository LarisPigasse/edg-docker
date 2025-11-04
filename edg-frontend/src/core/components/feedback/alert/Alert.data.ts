// src/core/components/ui/alert/Alert.data.ts
import type { ComponentData } from "../../../types/ComponentData";

export const alertData: ComponentData = {
  id: "alert",
  title: "Alert",
  description: "Componente per messaggi informativi in-page con varianti semantiche, icone automatiche e supporto dismissible",
  category: "feedback",
  importPath: 'import { Alert } from "../core/components/ui";',
  origin: "custom component",
  dependence: "lucide-react",
  props: [
    {
      name: "children",
      type: "ReactNode",
      required: true,
      description: "Contenuto dell'alert (messaggio principale)",
    },
    {
      name: "variant",
      type: '"info" | "success" | "warning" | "danger"',
      required: false,
      defaultValue: '"info"',
      description: "Variante semantica dell'alert che determina colori e icona",
    },
    {
      name: "title",
      type: "string",
      required: false,
      description: "Titolo opzionale dell'alert",
    },
    {
      name: "closable",
      type: "boolean",
      required: false,
      defaultValue: "false",
      description: "Mostra pulsante di chiusura (richiede onClose)",
    },
    {
      name: "onClose",
      type: "() => void",
      required: false,
      description: "Callback chiamata quando l'alert viene chiuso",
    },
    {
      name: "icon",
      type: "ReactNode",
      required: false,
      description: "Icona personalizzata che sovrascrive quella di default per la variante",
    },
    {
      name: "hideIcon",
      type: "boolean",
      required: false,
      defaultValue: "false",
      description: "Nasconde completamente l'icona",
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
      title: "Alert Base",
      description: "Alert semplici con le 4 varianti semantiche",
      code: `<div className="space-y-3">
  <Alert variant="info">
    Questa è un'informazione importante da comunicare all'utente.
  </Alert>
  
  <Alert variant="success">
    Operazione completata con successo! I dati sono stati salvati.
  </Alert>
  
  <Alert variant="warning">
    Attenzione: questa azione non può essere annullata.
  </Alert>
  
  <Alert variant="danger">
    Errore durante il salvataggio. Riprova più tardi.
  </Alert>
</div>`,
    },
    {
      title: "Alert con Titolo",
      description: "Alert con titolo e messaggio strutturato",
      code: `<div className="space-y-3">
  <Alert variant="info" title="Informazioni Account">
    Il tuo account verrà aggiornato automaticamente entro 24 ore.
  </Alert>
  
  <Alert variant="success" title="Pagamento Confermato">
    Il pagamento è stato elaborato con successo. Riceverai una email di conferma.
  </Alert>
  
  <Alert variant="warning" title="Limite Raggiunto">
    Hai utilizzato il 90% dello spazio di archiviazione disponibile.
  </Alert>
  
  <Alert variant="danger" title="Sessione Scaduta">
    La tua sessione è scaduta. Effettua nuovamente l'accesso per continuare.
  </Alert>
</div>`,
    },
    {
      title: "Alert Dismissible",
      description: "Alert che possono essere chiusi dall'utente",
      code: `const [showAlert, setShowAlert] = useState(true);
const [showSuccess, setShowSuccess] = useState(true);

<div className="space-y-3">
  {showAlert && (
    <Alert
      variant="info"
      title="Nuovo Aggiornamento"
      closable
      onClose={() => setShowAlert(false)}
    >
      È disponibile una nuova versione dell'applicazione. 
      Aggiorna per accedere alle ultime funzionalità.
    </Alert>
  )}
  
  {showSuccess && (
    <Alert
      variant="success"
      closable
      onClose={() => setShowSuccess(false)}
    >
      File caricato con successo!
    </Alert>
  )}
  
  {!showAlert && !showSuccess && (
    <button 
      onClick={() => {
        setShowAlert(true);
        setShowSuccess(true);
      }}
      className="text-sm text-violet-600 hover:text-violet-700"
    >
      Mostra di nuovo gli alert
    </button>
  )}
</div>`,
    },
    {
      title: "Alert con Icone Personalizzate",
      description: "Override dell'icona di default o rimozione completa",
      code: `import { Shield, Zap, Download, Lock } from "lucide-react";

<div className="space-y-3">
  {/* Icona personalizzata */}
  <Alert 
    variant="info" 
    icon={<Shield className="w-5 h-5 text-blue-600" />}
  >
    Il tuo account è protetto con autenticazione a due fattori.
  </Alert>
  
  <Alert 
    variant="warning" 
    icon={<Zap className="w-5 h-5 text-yellow-600" />}
  >
    Consumo energetico elevato rilevato.
  </Alert>
  
  {/* Senza icona */}
  <Alert variant="success" hideIcon>
    Preferenze salvate automaticamente.
  </Alert>
</div>`,
    },
    {
      title: "Alert con Contenuto Complesso",
      description: "Alert con HTML strutturato e link",
      code: `<Alert variant="info" title="Termini di Servizio Aggiornati">
  <div className="space-y-2">
    <p>
      Abbiamo aggiornato i nostri termini di servizio per migliorare 
      la tua esperienza.
    </p>
    <div className="flex gap-3">
      <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
        Leggi le modifiche
      </a>
      <a href="#" className="text-gray-600 hover:text-gray-700 text-sm">
        Visualizza più tardi
      </a>
    </div>
  </div>
</Alert>

<Alert variant="warning" title="Azione Richiesta">
  <div className="space-y-2">
    <p>Il tuo abbonamento scadrà tra 7 giorni.</p>
    <ul className="list-disc list-inside text-sm space-y-1">
      <li>Perderai l'accesso alle funzionalità premium</li>
      <li>I tuoi progetti rimarranno salvati</li>
      <li>Potrai rinnovare in qualsiasi momento</li>
    </ul>
    <button className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
      Rinnova Ora
    </button>
  </div>
</Alert>`,
    },
    {
      title: "Alert Stack (Notifiche Multiple)",
      description: "Gestione di alert multipli impilati",
      code: `const [alerts, setAlerts] = useState([
  { id: 1, variant: "info", message: "Sincronizzazione in corso..." },
  { id: 2, variant: "success", message: "3 file caricati con successo" },
  { id: 3, variant: "warning", message: "Connessione instabile" }
]);

const removeAlert = (id: number) => {
  setAlerts(alerts.filter(alert => alert.id !== id));
};

<div className="space-y-2">
  {alerts.map(alert => (
    <Alert
      key={alert.id}
      variant={alert.variant}
      closable
      onClose={() => removeAlert(alert.id)}
    >
      {alert.message}
    </Alert>
  ))}
  
  {alerts.length === 0 && (
    <p className="text-sm text-gray-500 text-center py-4">
      Nessuna notifica
    </p>
  )}
</div>`,
    },
    {
      title: "Alert Inline in Form",
      description: "Alert contestuali in form e validazione",
      code: `const [formError, setFormError] = useState("");
const [formSuccess, setFormSuccess] = useState("");

<form className="space-y-4">
  <div>
    <label className="block text-sm font-medium mb-1">Email</label>
    <input 
      type="email" 
      className="w-full px-3 py-2 border rounded-lg"
      placeholder="email@esempio.com"
    />
  </div>
  
  {formError && (
    <Alert 
      variant="danger" 
      closable
      onClose={() => setFormError("")}
    >
      {formError}
    </Alert>
  )}
  
  {formSuccess && (
    <Alert 
      variant="success" 
      closable
      onClose={() => setFormSuccess("")}
    >
      {formSuccess}
    </Alert>
  )}
  
  <button 
    type="submit"
    className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
    onClick={(e) => {
      e.preventDefault();
      // Simula validazione
      if (Math.random() > 0.5) {
        setFormError("Email già registrata");
        setFormSuccess("");
      } else {
        setFormSuccess("Registrazione completata!");
        setFormError("");
      }
    }}
  >
    Registrati
  </button>
</form>`,
    },
    {
      title: "Alert Permanenti vs Temporanei",
      description: "Alert che scompaiono automaticamente dopo un timeout",
      code: `const [tempAlert, setTempAlert] = useState(false);

// Funzione per mostrare alert temporaneo
const showTemporaryAlert = () => {
  setTempAlert(true);
  setTimeout(() => setTempAlert(false), 5000); // Scompare dopo 5 secondi
};

<div className="space-y-3">
  {/* Alert permanente */}
  <Alert variant="info" title="Alert Permanente">
    Questo alert rimane visibile finché non viene chiuso manualmente.
  </Alert>
  
  {/* Alert temporaneo */}
  {tempAlert && (
    <Alert variant="success">
      ✓ Operazione completata! (scomparirà in 5 secondi)
    </Alert>
  )}
  
  <button 
    onClick={showTemporaryAlert}
    className="px-3 py-1.5 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
  >
    Mostra Alert Temporaneo
  </button>
</div>`,
    },
  ],
  notes:
    "Gli Alert sono messaggi in-page (non overlay) per feedback contestuale. Usa variant='danger' per errori, 'warning' per avvisi, 'success' per conferme, 'info' per informazioni. Supporta role='alert' e aria-live='polite' per accessibility. Per notifiche temporanee considera Toast component.",
};

// src/core/components/ui/alert/Alert.showcase.tsx
import React, { useState } from "react";
import Alert from "./Alert";
import { TitledSurface } from "../../layout";
import { ThemedText } from "../../atomic";
import {
  Shield,
  Zap,
  Download,
  Lock,
  Wifi,
  WifiOff,
  Database,
  Server,
  Cloud,
  Mail,
  CreditCard,
  UserCheck,
  FileCheck,
  AlertCircle,
  BellRing,
  Sparkles,
  TrendingUp,
  Package,
  Cpu,
  HardDrive,
} from "lucide-react";

/**
 * AlertShowcase - Showcase completo per il componente Alert.
 *
 * Dimostra tutte le features di Alert:
 * - Tutte le varianti (info, success, warning, danger)
 * - Alert con e senza titolo
 * - Alert dismissible
 * - Icone personalizzate
 * - Contenuto complesso (liste, link, bottoni)
 * - Stack di alert multipli
 * - Alert temporanei con auto-dismiss
 * - Uso in contesti reali (form, sistema, notifiche)
 */
export const AlertShowcase: React.FC = () => {
  // State per alert dismissible
  const [showInfo, setShowInfo] = useState(true);
  const [showSuccess, setShowSuccess] = useState(true);
  const [showWarning, setShowWarning] = useState(true);
  const [showDanger, setShowDanger] = useState(true);

  // State per alert stack
  const [notifications, setNotifications] = useState([
    { id: 1, variant: "info" as const, title: "Aggiornamento Sistema", message: "È disponibile la versione 2.1.0" },
    { id: 2, variant: "success" as const, message: "Backup completato con successo" },
    { id: 3, variant: "warning" as const, message: "Spazio su disco in esaurimento (85% utilizzato)" },
  ]);

  // State per form validation
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // State per alert temporanei
  const [tempAlerts, setTempAlerts] = useState<Array<{ id: number; message: string; variant: "success" | "info" }>>([]);

  // State per sistema monitoring
  const [systemStatus, setSystemStatus] = useState({
    api: true,
    database: true,
    storage: false,
    network: true,
  });

  // Funzioni helper
  const removeNotification = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const addTempAlert = (message: string, variant: "success" | "info" = "success") => {
    const id = Date.now();
    setTempAlerts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setTempAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 5000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    // Simula validazione
    if (Math.random() > 0.5) {
      setFormError("L'email inserita è già registrata nel sistema.");
    } else {
      setFormSuccess("Registrazione completata! Controlla la tua email per confermare l'account.");
      setTimeout(() => setFormSuccess(""), 5000);
    }
  };

  const resetAllAlerts = () => {
    setShowInfo(true);
    setShowSuccess(true);
    setShowWarning(true);
    setShowDanger(true);
  };

  return (
    <div className="space-y-8">
      {/* Varianti Base */}
      <TitledSurface title="Varianti Alert" variant="primary" padding="lg">
        <div className="space-y-4">
          <div>
            <ThemedText variant="label" className="font-medium mb-3" block>
              Varianti Semantiche Base
            </ThemedText>
            <div className="space-y-3">
              <Alert variant="info">Informazione: Questa è un'informazione neutra per l'utente.</Alert>
              <Alert variant="success">Successo: L'operazione è stata completata correttamente.</Alert>
              <Alert variant="warning">Attenzione: Questa azione potrebbe avere conseguenze.</Alert>
              <Alert variant="danger">Errore: Si è verificato un problema durante l'operazione.</Alert>
            </div>
          </div>
        </div>
      </TitledSurface>

      {/* Alert con Titoli */}
      <TitledSurface title="Alert con Titoli" variant="secondary" padding="lg">
        <div className="space-y-3">
          <Alert variant="info" title="Aggiornamento Disponibile">
            È disponibile la versione 3.0 dell'applicazione con nuove funzionalità e miglioramenti delle prestazioni.
          </Alert>

          <Alert variant="success" title="Pagamento Completato">
            Il tuo pagamento di €49.99 è stato elaborato con successo. Riceverai una conferma via email.
          </Alert>

          <Alert variant="warning" title="Manutenzione Programmata">
            Il sistema sarà in manutenzione dalle 02:00 alle 04:00 di domenica. Alcuni servizi potrebbero non essere
            disponibili.
          </Alert>

          <Alert variant="danger" title="Errore di Connessione">
            Impossibile connettersi al server. Controlla la tua connessione internet e riprova.
          </Alert>
        </div>
      </TitledSurface>

      {/* Alert Dismissible */}
      <TitledSurface title="Alert Dismissible" variant="modal" padding="lg">
        <div className="space-y-4">
          <div className="space-y-3">
            {showInfo && (
              <Alert variant="info" title="Nuove Funzionalità" closable onClose={() => setShowInfo(false)}>
                Abbiamo aggiunto il supporto per l'esportazione in PDF e migliorato le performance del dashboard.
              </Alert>
            )}

            {showSuccess && (
              <Alert variant="success" closable onClose={() => setShowSuccess(false)}>
                I tuoi dati sono stati sincronizzati con successo su tutti i dispositivi.
              </Alert>
            )}

            {showWarning && (
              <Alert variant="warning" title="Limite Quasi Raggiunto" closable onClose={() => setShowWarning(false)}>
                Hai utilizzato 4.5 GB dei 5 GB disponibili nel tuo piano.
              </Alert>
            )}

            {showDanger && (
              <Alert variant="danger" closable onClose={() => setShowDanger(false)}>
                La tua password scadrà tra 3 giorni. Aggiornala per mantenere l'accesso.
              </Alert>
            )}
          </div>

          {(!showInfo || !showSuccess || !showWarning || !showDanger) && (
            <button onClick={resetAllAlerts} className="text-sm text-violet-600 hover:text-violet-700">
              Ripristina tutti gli alert
            </button>
          )}
        </div>
      </TitledSurface>

      {/* Alert con Icone Personalizzate */}
      <TitledSurface title="Icone Personalizzate" variant="info" padding="lg">
        <div className="space-y-3">
          <Alert variant="info" icon={<Shield className="w-5 h-5 text-blue-600" />}>
            Protezione attiva: il tuo account è protetto con autenticazione a due fattori.
          </Alert>

          <Alert variant="warning" icon={<Zap className="w-5 h-5 text-yellow-600" />}>
            Consumo energetico elevato rilevato nel data center 2.
          </Alert>

          <Alert variant="success" icon={<Cloud className="w-5 h-5 text-green-600" />}>
            Sincronizzazione cloud completata: 1,234 file aggiornati.
          </Alert>

          <Alert variant="info" icon={<Sparkles className="w-5 h-5 text-purple-600" />} title="Nuova Funzione Premium">
            Prova la nuova funzione di AI Assistant disponibile per gli utenti Pro.
          </Alert>

          <Alert variant="success" hideIcon>
            Alert senza icona per un look più minimale.
          </Alert>
        </div>
      </TitledSurface>

      {/* Alert Stack (Notifiche Multiple) */}
      <TitledSurface title="Stack di Notifiche" variant="secondary" padding="lg">
        <div className="space-y-4">
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Alert
                key={notification.id}
                variant={notification.variant}
                title={notification.title}
                closable
                onClose={() => removeNotification(notification.id)}
              >
                {notification.message}
              </Alert>
            ))}

            {notifications.length === 0 && (
              <div className="text-center py-8 text-text-secondary">
                <BellRing className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nessuna notifica</p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              const newNotification = {
                id: Date.now(),
                variant: ["info", "success", "warning"][Math.floor(Math.random() * 3)] as "info" | "success" | "warning",
                message: [
                  "Nuovo messaggio ricevuto",
                  "File caricato con successo",
                  "Aggiornamento disponibile",
                  "Backup completato",
                  "Sincronizzazione in corso",
                ][Math.floor(Math.random() * 5)],
              };
              setNotifications([...notifications, newNotification]);
            }}
            className="px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm"
          >
            Aggiungi Notifica
          </button>
        </div>
      </TitledSurface>

      {/* Alert con Contenuto Complesso */}
      <TitledSurface title="Contenuto Complesso" variant="modal" padding="lg">
        <div className="space-y-3">
          <Alert variant="info" title="Riepilogo Aggiornamento">
            <div className="space-y-2">
              <p>L'aggiornamento include:</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>Nuova interfaccia dashboard</li>
                <li>Miglioramenti performance (+40%)</li>
                <li>Correzioni di sicurezza critiche</li>
                <li>Supporto per dark mode</li>
              </ul>
              <div className="flex gap-2 mt-3">
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Aggiorna Ora</button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Ricordamelo Dopo</button>
              </div>
            </div>
          </Alert>

          <Alert variant="warning" title="Azione Richiesta" icon={<CreditCard className="w-5 h-5 text-yellow-600" />}>
            <div className="space-y-2">
              <p>Il tuo metodo di pagamento scadrà il 12/2024.</p>
              <p className="text-sm">Per evitare interruzioni del servizio:</p>
              <ol className="list-decimal list-inside text-sm space-y-1 ml-2">
                <li>Vai alle impostazioni di pagamento</li>
                <li>Aggiungi un nuovo metodo di pagamento</li>
                <li>Imposta come predefinito</li>
              </ol>
              <a href="#" className="inline-block mt-2 text-yellow-700 hover:text-yellow-800 text-sm font-medium">
                Aggiorna metodo di pagamento →
              </a>
            </div>
          </Alert>
        </div>
      </TitledSurface>

      {/* Form Validation */}
      <TitledSurface title="Alert in Form" variant="info" padding="lg">
        <form onSubmit={handleFormSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-primary"
              placeholder="email@esempio.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-primary"
              placeholder="••••••••"
              required
            />
          </div>

          {formError && (
            <Alert variant="danger" closable onClose={() => setFormError("")}>
              {formError}
            </Alert>
          )}

          {formSuccess && (
            <Alert
              variant="success"
              closable
              onClose={() => setFormSuccess("")}
              icon={<UserCheck className="w-5 h-5 text-green-600" />}
            >
              {formSuccess}
            </Alert>
          )}

          <button type="submit" className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
            Registrati
          </button>
        </form>
      </TitledSurface>

      {/* System Status */}
      <TitledSurface title="Stato Sistema" variant="secondary" padding="lg">
        <div className="space-y-3">
          {!systemStatus.storage && (
            <Alert variant="danger" title="Storage Critico" icon={<HardDrive className="w-5 h-5 text-red-600" />}>
              Lo spazio su disco è quasi esaurito (98% utilizzato). Libera spazio per evitare problemi.
            </Alert>
          )}

          {systemStatus.api && systemStatus.database && systemStatus.network ? (
            <Alert variant="success" icon={<Server className="w-5 h-5 text-green-600" />}>
              Tutti i sistemi sono operativi e funzionanti correttamente.
            </Alert>
          ) : (
            <Alert variant="warning" title="Problemi Rilevati">
              Alcuni servizi potrebbero avere prestazioni ridotte.
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => setSystemStatus({ ...systemStatus, api: !systemStatus.api })}
              className={`px-3 py-2 rounded text-sm ${
                systemStatus.api ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              API: {systemStatus.api ? "Online" : "Offline"}
            </button>
            <button
              onClick={() => setSystemStatus({ ...systemStatus, database: !systemStatus.database })}
              className={`px-3 py-2 rounded text-sm ${
                systemStatus.database ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              Database: {systemStatus.database ? "Online" : "Offline"}
            </button>
            <button
              onClick={() => setSystemStatus({ ...systemStatus, storage: !systemStatus.storage })}
              className={`px-3 py-2 rounded text-sm ${
                systemStatus.storage ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              Storage: {systemStatus.storage ? "OK" : "Critico"}
            </button>
            <button
              onClick={() => setSystemStatus({ ...systemStatus, network: !systemStatus.network })}
              className={`px-3 py-2 rounded text-sm ${
                systemStatus.network ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              Network: {systemStatus.network ? "Stabile" : "Instabile"}
            </button>
          </div>
        </div>
      </TitledSurface>

      {/* Alert Temporanei */}
      <TitledSurface title="Alert Temporanei (Auto-dismiss)" variant="primary" padding="lg">
        <div className="space-y-4">
          <div className="space-y-2">
            {tempAlerts.map((alert) => (
              <Alert key={alert.id} variant={alert.variant}>
                {alert.message} (scomparirà automaticamente)
              </Alert>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => addTempAlert("✓ File salvato con successo!", "success")}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              Simula Salvataggio
            </button>
            <button
              onClick={() => addTempAlert("📋 Copiato negli appunti", "info")}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Simula Copia
            </button>
            <button
              onClick={() => addTempAlert("🔄 Sincronizzazione completata", "success")}
              className="px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm"
            >
              Simula Sync
            </button>
          </div>

          <p className="text-sm text-text-secondary">
            Gli alert temporanei scompaiono automaticamente dopo 5 secondi. Utili per conferme rapide.
          </p>
        </div>
      </TitledSurface>
    </div>
  );
};

export default AlertShowcase;

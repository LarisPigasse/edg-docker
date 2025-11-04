/**
 * ConnectionStatus Component
 *
 * Displays real-time connection status to backend API
 *
 * Features:
 * - Real-time connection monitoring
 * - Visual status indicators
 * - Retry mechanisms
 * - Customizable polling intervals
 * - Manual connection test
 */

import React, { useState, useEffect, useCallback } from "react";
import { WifiOff, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { ThemedText, ThemedSurface } from "../atomic";
import { Button } from "../ui";
import apiService, { isApiError } from "../../services/apiService";

interface ConnectionStatusProps {
  /**
   * Display variant
   */
  variant?: "indicator" | "detailed";

  /**
   * Polling interval in milliseconds
   */
  pollInterval?: number;

  /**
   * Custom health check endpoint
   */
  healthEndpoint?: string;

  /**
   * Show retry button
   */
  showRetryButton?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Callback when connection status changes
   */
  onStatusChange?: (status: ConnectionState) => void;
}

type ConnectionState = "connected" | "disconnected" | "checking" | "error";

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  variant = "indicator",
  pollInterval = 30000, // 30 seconds
  healthEndpoint = "/health",
  showRetryButton = false,
  className = "",
  onStatusChange,
}) => {
  const [status, setStatus] = useState<ConnectionState>("checking");
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isManualCheck, setIsManualCheck] = useState(false);

  // Check connection status
  const checkConnection = useCallback(
    async (isManual = false) => {
      if (isManual) {
        setIsManualCheck(true);
      }

      setStatus("checking");
      setErrorMessage("");

      try {
        // Use a simple GET request to health endpoint
        await apiService.get(healthEndpoint, { timeout: 5000 });

        setStatus("connected");
        setLastCheck(new Date());
        onStatusChange?.("connected");
      } catch (error) {
        console.error("Connection check failed:", error);

        let newStatus: ConnectionState = "disconnected";
        let message = "Connessione al server non disponibile";

        if (isApiError(error)) {
          if (error.status === 408 || error.message.includes("timeout")) {
            message = "Timeout connessione";
          } else if (error.status && error.status >= 500) {
            newStatus = "error";
            message = "Errore del server";
          }
        } else {
          newStatus = "error";
          message = "Errore di rete";
        }

        setStatus(newStatus);
        setErrorMessage(message);
        setLastCheck(new Date());
        onStatusChange?.(newStatus);
      } finally {
        if (isManual) {
          setIsManualCheck(false);
        }
      }
    },
    [healthEndpoint, onStatusChange]
  );

  // Manual retry
  const handleRetry = () => {
    checkConnection(true);
  };

  // Setup polling
  useEffect(() => {
    // Initial check
    checkConnection();

    // Setup interval if pollInterval > 0
    if (pollInterval > 0) {
      const interval = setInterval(() => {
        checkConnection();
      }, pollInterval);

      return () => clearInterval(interval);
    }
  }, [checkConnection, pollInterval]);

  // Get status icon and color classes
  const getStatusConfig = (currentStatus: ConnectionState) => {
    switch (currentStatus) {
      case "connected":
        return {
          icon: CheckCircle,
          color: "text-green-500",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          label: "Connesso",
          description: "Connessione attiva al server",
        };
      case "disconnected":
        return {
          icon: WifiOff,
          color: "text-red-500",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          label: "Disconnesso",
          description: "Impossibile raggiungere il server",
        };
      case "checking":
        return {
          icon: RefreshCw,
          color: "text-blue-500",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          label: "Verifica...",
          description: "Controllo connessione in corso",
        };
      case "error":
        return {
          icon: AlertCircle,
          color: "text-yellow-500",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          label: "Errore",
          description: "Errore durante la verifica",
        };
    }
  };

  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

  // Format last check time
  const formatLastCheck = (date: Date | null): string => {
    if (!date) return "";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Ora";
    if (diffMins < 60) return `${diffMins}m fa`;

    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h fa`;
  };

  if (variant === "indicator") {
    return (
      <div className={`flex items-center gap-2 ${className}`} title={config.description}>
        <StatusIcon className={`w-4 h-4 ${config.color} ${status === "checking" ? "animate-spin" : ""}`} />
        <ThemedText variant="secondary" className="text-sm">
          {config.label}
        </ThemedText>
      </div>
    );
  }

  return (
    <ThemedSurface variant="primary" borderVariant="default" className={`p-4 rounded-lg ${config.bgColor} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-5 h-5 ${config.color} flex-shrink-0 ${status === "checking" ? "animate-spin" : ""}`} />
          <div>
            <ThemedText variant="primary" className="font-medium">
              {config.label}
            </ThemedText>
            <ThemedText variant="secondary" className="text-sm mt-1">
              {errorMessage || config.description}
            </ThemedText>
            {lastCheck && (
              <ThemedText variant="placeholder" className="text-xs mt-1">
                Ultimo controllo: {formatLastCheck(lastCheck)}
              </ThemedText>
            )}
          </div>
        </div>

        {showRetryButton && status !== "checking" && (
          <Button variant="outline" size="sm" onClick={handleRetry} isLoading={isManualCheck} className="flex-shrink-0">
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>
    </ThemedSurface>
  );
};

export default ConnectionStatus;

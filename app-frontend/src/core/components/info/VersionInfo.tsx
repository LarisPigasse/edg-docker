/**
 * VersionInfo Component
 * 
 * Displays application version information with build details
 * 
 * Features:
 * - Application version from package.json
 * - Build timestamp
 * - Environment indicator
 * - Compact/expanded views
 * - Optional update check
 */

import React from 'react';
import { ThemedText } from '../atomic';
import { Badge } from '../ui';

interface VersionInfoProps {
  /**
   * Display variant
   */
  variant?: 'compact' | 'detailed';
  
  /**
   * Show environment badge
   */
  showEnvironment?: boolean;
  
  /**
   * Show build timestamp
   */
  showBuildTime?: boolean;
  
  /**
   * Custom version override
   */
  version?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const VersionInfo: React.FC<VersionInfoProps> = ({
  variant = 'compact',
  showEnvironment = true,
  showBuildTime = false,
  version,
  className = '',
}) => {
  // Get version from environment or package.json
  const appVersion = version || import.meta.env.VITE_APP_VERSION || '1.0.0';
  const environment = import.meta.env.MODE || 'development';
  const buildTime = import.meta.env.VITE_BUILD_TIME || new Date().toISOString();

  // Format build time
  const formatBuildTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Non disponibile';
    }
  };

  // Get environment badge variant
  const getEnvironmentVariant = (env: string) => {
    switch (env.toLowerCase()) {
      case 'production':
        return 'success';
      case 'development':
        return 'info';
      case 'staging':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <ThemedText variant="secondary" className="text-xs">
          v{appVersion}
        </ThemedText>
        {showEnvironment && (
          <Badge 
            variant={getEnvironmentVariant(environment)} 
            size="sm"
          >
            {environment}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Version */}
      <div className="flex items-center gap-2">
        <ThemedText variant="label" className="text-sm font-medium">
          Versione:
        </ThemedText>
        <ThemedText variant="primary" className="text-sm font-mono">
          {appVersion}
        </ThemedText>
      </div>

      {/* Environment */}
      {showEnvironment && (
        <div className="flex items-center gap-2">
          <ThemedText variant="label" className="text-sm font-medium">
            Ambiente:
          </ThemedText>
          <Badge variant={getEnvironmentVariant(environment)} size="sm">
            {environment}
          </Badge>
        </div>
      )}

      {/* Build Time */}
      {showBuildTime && (
        <div className="flex items-center gap-2">
          <ThemedText variant="label" className="text-sm font-medium">
            Build:
          </ThemedText>
          <ThemedText variant="secondary" className="text-xs font-mono">
            {formatBuildTime(buildTime)}
          </ThemedText>
        </div>
      )}
    </div>
  );
};

export default VersionInfo;
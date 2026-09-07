// src/core/components/feedback/error-boundary/ErrorBoundary.tsx
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import ErrorFallback from './ErrorFallback';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Fallback UI personalizzata (opzionale) */
  fallback?: ReactNode;
  /** Callback chiamata quando si verifica un errore */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Mostra dettagli errore (solo in development) */
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - Cattura errori JavaScript nei componenti figli
 * 
 * Previene che l'intera applicazione crashi mostrando un'UI di fallback.
 * 
 * @example
 * // Wrap dell'intera app
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * 
 * @example
 * // Wrap di una sezione specifica
 * <ErrorBoundary fallback={<div>Errore nel widget</div>}>
 *   <RiskyWidget />
 * </ErrorBoundary>
 * 
 * @example
 * // Con callback per logging
 * <ErrorBoundary onError={(error) => logToService(error)}>
 *   <App />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Aggiorna lo state per mostrare il fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Salva i dettagli dell'errore
    this.setState({ errorInfo });

    // Chiama il callback onError se fornito
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log in console (solo development)
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = import.meta.env.DEV } = this.props;

    if (hasError) {
      // Se è fornito un fallback personalizzato, usalo
      if (fallback) {
        return fallback;
      }

      // Altrimenti usa il fallback di default
      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          onReset={this.handleReset}
          showDetails={showDetails}
        />
      );
    }

    return children;
  }
}

export default ErrorBoundary;

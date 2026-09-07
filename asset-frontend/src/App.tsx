// src/App.tsx
import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './app/store';
import { initializeFromStorage } from './app/slices';
import MainLayout from './core/components/layout/custom/MainLayout';
import { UserMenu, MobileMenu } from './core/components/navigation';
import { ROUTES } from './config';
import { ToastProvider, ErrorBoundary } from './core/components/feedback';
import {
  initializeAuth,
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ChangePasswordPage,
  PrivateRoute,
} from './features/auth';

// ✅ EAGER LOADING — Pagina principale, caricata subito
import { Dashboard } from './pages';

// ✅ LAZY LOADING — Pagine secondarie, caricate on-demand
const Explorer = lazy(() => import('./pages/Explorer'));
const NotFound = lazy(() => import('./pages/NotFound'));

// ── SISTEMA ────────────────────────────────────────────────────────────────
const SessionsPage = lazy(() => import('./features/accounts/pages/SessionsPage'));
const AccountsPage = lazy(() => import('./features/accounts/pages/AccountsPage'));
const LogsListPage = lazy(() => import('./features/system/pages/LogsListPage'));
const InfoPage = lazy(() => import('./features/system/pages/InfoPage'));

// ── ASSET ──────────────────────────────────────────────────────────────────
// Perimetro della futura applicazione di gestione asset/veicoli.
// Aggiungere qui le pagine del modulo man mano che vengono realizzate.
const AssetDashboard = lazy(() => import('./features/assets/pages/AssetDashboard').then(m => ({ default: m.AssetDashboard })));

// Componente per inizializzazione completa del tema e settings
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    store.dispatch(initializeFromStorage());
    store.dispatch(initializeAuth());
  }, []);

  return <>{children}</>;
};

const PageLoadingFallback: React.FC = () => (
  <div className='flex items-center justify-center min-h-[60vh]'>
    <div className='text-center space-y-4'>
      <div className='inline-flex items-center justify-center'>
        <div className='w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin' />
      </div>
      <p className='text-text-secondary text-sm'>Caricamento pagina...</p>
    </div>
  </div>
);

const handleError = (error: Error, _errorInfo: React.ErrorInfo) => {
  console.error('Application error:', error.message);
  if (import.meta.env.DEV && _errorInfo.componentStack) {
    console.error('Component Stack:', _errorInfo.componentStack);
  }
};

const App: React.FC = () => {
  return (
    <ErrorBoundary onError={handleError}>
      <ToastProvider>
        <Provider store={store}>
          <AppInitializer>
            <Router>
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  {/* ✅ Auth Pages: pagine pubbliche FUORI da MainLayout */}
                  <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                  <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
                  <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

                  {/* ✅ Tutte le altre route: DENTRO MainLayout */}
                  <Route
                    path='*'
                    element={
                      <div className='App'>
                        <MainLayout>
                          <Routes>
                            {/* ── Dashboard ───────────────────────────── */}
                            <Route
                              path={ROUTES.HOME}
                              element={
                                <PrivateRoute>
                                  <Dashboard />
                                </PrivateRoute>
                              }
                            />

                            {/* ── Auth ────────────────────────────────── */}
                            <Route
                              path={ROUTES.CHANGE_PASSWORD}
                              element={
                                <PrivateRoute>
                                  <ChangePasswordPage />
                                </PrivateRoute>
                              }
                            />
                            <Route
                              path={ROUTES.SETTINGS}
                              element={
                                <PrivateRoute>
                                  <NotFound />
                                </PrivateRoute>
                              }
                            />

                            {/* ── Asset ───────────────────────────────── */}
                            {/*
                              TODO(asset-service): quando auth-service esporrà i permessi
                              del nuovo modulo, aggiungere requiredPermission='asset.read'
                              (e 'asset.write' sulle pagine di modifica). Finché il permesso
                              non esiste, PrivateRoute lo negherebbe rimandando alla home.
                            */}
                            <Route
                              path={ROUTES.ASSET}
                              element={
                                <PrivateRoute>
                                  <AssetDashboard />
                                </PrivateRoute>
                              }
                            />
                            <Route
                              path={ROUTES.ASSET_DASHBOARD}
                              element={
                                <PrivateRoute>
                                  <AssetDashboard />
                                </PrivateRoute>
                              }
                            />

                            {/* ── Sistema ─────────────────────────────── */}
                            <Route
                              path={ROUTES.SISTEMA_SESSIONS}
                              element={
                                <PrivateRoute requiredPermission='sistema.sessions'>
                                  <SessionsPage />
                                </PrivateRoute>
                              }
                            />
                            <Route
                              path={ROUTES.SISTEMA_LOGS}
                              element={
                                <PrivateRoute requiredPermission='sistema.logs'>
                                  <LogsListPage />
                                </PrivateRoute>
                              }
                            />
                            <Route
                              path={ROUTES.SISTEMA_INFO}
                              element={
                                <PrivateRoute requiredPermission='sistema.info'>
                                  <InfoPage />
                                </PrivateRoute>
                              }
                            />
                            <Route
                              path={ROUTES.SISTEMA_ACCOUNT}
                              element={
                                <PrivateRoute requiredPermission='sistema.accounts'>
                                  <AccountsPage />
                                </PrivateRoute>
                              }
                            />
                            <Route
                              path={ROUTES.SISTEMA_EXPLORER}
                              element={
                                <PrivateRoute requiredPermission='system.explorer'>
                                  <Explorer />
                                </PrivateRoute>
                              }
                            />

                            {/* ── 404 ─────────────────────────────────── */}
                            <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
                            <Route path='*' element={<NotFound />} />
                          </Routes>
                        </MainLayout>

                        <UserMenu />
                        <MobileMenu />
                      </div>
                    }
                  />
                </Routes>
              </Suspense>
            </Router>
          </AppInitializer>
        </Provider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;

// src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./app/store";
import { initializeFromStorage } from "./app/slices";
import MainLayout from "./core/components/layout/custom/MainLayout";
import { Dashboard, NotFound, Explorer } from "./pages";
import { UserMenu, MobileMenu } from "./core/components/navigation";
import { ROUTES } from "./config";
import { ToastProvider } from "./core/components/feedback";

// Componente per inizializzazione completa del tema e settings
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Inizializza l'app con le impostazioni salvate
    // Lo store è già caricato con i dati del localStorage tramite createInitialState
    // Dobbiamo solo applicare il tema al DOM
    store.dispatch(initializeFromStorage());
  }, []);

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <Provider store={store}>
        <AppInitializer>
          <Router>
            <div className="App">
              {/* Layout principale con routing */}
              <MainLayout>
                <Routes>
                  <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                  <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                  <Route path={ROUTES.EXPLORER} element={<Explorer />} />
                  <Route path={ROUTES.SETTINGS} element={<NotFound />} />
                  <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MainLayout>

              {/* Menu components - renderizzati al root level per z-index corretto */}
              <UserMenu />
              <MobileMenu />
            </div>
          </Router>
        </AppInitializer>
      </Provider>
    </ToastProvider>
  );
};

export default App;

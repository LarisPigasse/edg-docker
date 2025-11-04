// src/features/shared/NotFound.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemedSurface, ThemedText } from "../core/components/atomic";
import { ROUTES } from "../config";
import { ArrowLeft, Home } from "lucide-react";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <ThemedSurface variant="base" className="min-h-full flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* 404 Error */}
        <div className="mb-8 text-center">
          <h1 className="text-8xl font-bold text-violet-600 dark:text-violet-400 mb-4">404</h1>
          <h2 className="text-3xl font-bold mb-4">Pagina non trovata</h2>
          <ThemedText variant="secondary" as="p" className="text-lg">
            La pagina che stai cercando non esiste o è stata spostata.
          </ThemedText>
        </div>

        {/* Actions */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* Home Button */}
            <Link to={ROUTES.DASHBOARD} className="flex-shrink-0">
              <ThemedSurface
                variant="contrast"
                textVariant="contrast"
                className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-violet-700 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 w-full sm:w-auto justify-center"
              >
                <Home className="w-5 h-5 mr-2 flex-shrink-0" />
                Vai alla Dashboard
              </ThemedSurface>
            </Link>

            {/* Back Button */}
            <div className="flex-shrink-0">
              <button
                onClick={handleGoBack}
                className="inline-flex items-center px-6 py-3 rounded-lg font-medium border border-border-default text-text-primary bg-bg-primary hover:bg-bg-secondary transition-all duration-200 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 w-full sm:w-auto justify-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2 flex-shrink-0" />
                Torna Indietro
              </button>
            </div>
          </div>
        </div>
      </div>
    </ThemedSurface>
  );
};

export default NotFound;

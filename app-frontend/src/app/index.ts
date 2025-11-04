// Barrel file per la cartella app
export { store } from "./store";
export { useAppDispatch, useAppSelector, useUISettings } from "./hooks";
export { APP_DATA, MESSAGES } from "./constants";

// Re-export dei tipi principali
export type { RootState, AppDispatch } from "./store";

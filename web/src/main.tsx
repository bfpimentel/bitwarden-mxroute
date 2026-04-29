import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { LEGACY_SERVER_URL_STORAGE_KEY, SERVER_URL_STORAGE_KEY } from "./utils/constants";

const migrateServerUrlStorageKey = () => {
  const serverUrl = localStorage.getItem(SERVER_URL_STORAGE_KEY);
  if (serverUrl) return;

  const legacyServerUrl = localStorage.getItem(LEGACY_SERVER_URL_STORAGE_KEY);
  if (!legacyServerUrl) return;

  localStorage.setItem(SERVER_URL_STORAGE_KEY, legacyServerUrl);
  localStorage.removeItem(LEGACY_SERVER_URL_STORAGE_KEY);
};

migrateServerUrlStorageKey();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

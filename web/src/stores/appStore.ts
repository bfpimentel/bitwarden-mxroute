import { create } from "zustand";
import {
  generateOptionsString,
  generateStaticOptionsString,
  loadOptionsConfig,
} from "../utils/alias";
import { SERVER_URL_STORAGE_KEY, TOKEN_STORAGE_KEY } from "../utils/constants";

const DEFAULT_SERVER_URL = "http://localhost:6123";

export type Forwarder = {
  alias: string;
  destinations: string[];
  email: string;
};

type CreateStatus = {
  type: "success" | "error";
  message: string;
};

type AppState = {
  domain: string;
  forwarders: Forwarder[];
  loading: boolean;
  error: string | null;
  showOptionsPopup: boolean;
  staticAlias: string;
  creating: boolean;
  createStatus: CreateStatus | null;
  testLoading: boolean;
  testSuccess: boolean;
  configError: string | null;
  token: string;
  serverUrl: string;
  showTokenInput: boolean;
  savedToken: string;
  savedServerUrl: string;
  isDirty: boolean;
};

type AppActions = {
  setDomain: (domain: string) => void;
  setShowOptionsPopup: (showOptionsPopup: boolean) => void;
  setStaticAlias: (staticAlias: string) => void;
  setToken: (token: string) => void;
  setServerUrl: (serverUrl: string) => void;
  toggleTokenInput: () => void;
  saveConfig: () => void;
  testConfig: () => Promise<void>;
  createAlias: () => Promise<void>;
  createStaticAlias: () => Promise<void>;
  fetchList: () => Promise<void>;
  deleteForwarder: (email: string) => Promise<void>;
  reset: () => void;
};

export type AppStore = AppState & AppActions;

const getStoredValue = (key: string) => localStorage.getItem(key) || "";

const getHeaders = (token: string) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const getIsDirty = ({
  serverUrl,
  token,
  savedServerUrl,
  savedToken,
}: Pick<AppState, "serverUrl" | "token" | "savedServerUrl" | "savedToken">) =>
  serverUrl !== savedServerUrl || token !== savedToken;

export const createInitialAppState = (): AppState => {
  const savedToken = getStoredValue(TOKEN_STORAGE_KEY);
  const savedServerUrl = getStoredValue(SERVER_URL_STORAGE_KEY);
  const serverUrl = savedServerUrl || DEFAULT_SERVER_URL;

  return {
    domain: "",
    forwarders: [],
    loading: false,
    error: null,
    showOptionsPopup: false,
    staticAlias: "",
    creating: false,
    createStatus: null,
    testLoading: false,
    testSuccess: false,
    configError: null,
    token: savedToken,
    serverUrl,
    showTokenInput: !savedToken,
    savedToken,
    savedServerUrl,
    isDirty: getIsDirty({
      serverUrl,
      token: savedToken,
      savedServerUrl,
      savedToken,
    }),
  };
};

export const useAppStore = create<AppStore>((set, get) => ({
  ...createInitialAppState(),

  setDomain: (domain) => set({ domain }),
  setShowOptionsPopup: (showOptionsPopup) => set({ showOptionsPopup }),
  setStaticAlias: (staticAlias) => set({ staticAlias }),
  setToken: (token) => {
    const state = get();
    set({
      token,
      testSuccess: false,
      configError: null,
      isDirty: getIsDirty({ ...state, token }),
    });
  },
  setServerUrl: (serverUrl) => {
    const state = get();
    set({
      serverUrl,
      testSuccess: false,
      configError: null,
      isDirty: getIsDirty({ ...state, serverUrl }),
    });
  },
  toggleTokenInput: () =>
    set((state) => ({ showTokenInput: !state.showTokenInput })),
  saveConfig: () => {
    const { serverUrl, token } = get();
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(SERVER_URL_STORAGE_KEY, serverUrl);
    set({
      savedToken: token,
      savedServerUrl: serverUrl,
      showTokenInput: false,
      isDirty: false,
    });
  },
  testConfig: async () => {
    const { serverUrl, token } = get();

    set({ testLoading: true, configError: null });

    try {
      const baseUrl = serverUrl.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/`, {
        headers: getHeaders(token),
      });
      if (!res.ok) throw new Error(`Status check failed: ${res.statusText}`);
      await res.text();
      set({ testSuccess: true });
    } catch (e) {
      set({
        configError: (e as Error).message || "Failed to connect to server",
      });
    } finally {
      set({ testLoading: false });
    }
  },
  createAlias: async () => {
    const { serverUrl, token } = get();
    const config = loadOptionsConfig();

    if (!serverUrl) {
      set({
        createStatus: { type: "error", message: "Server URL not configured" },
      });
      return;
    }
    if (!config.domain || !config.destination) {
      set({
        createStatus: {
          type: "error",
          message: "Domain and Destination must be configured in Options",
        },
      });
      return;
    }

    const optionsString = generateOptionsString(config);

    set({ creating: true, createStatus: null });

    try {
      const baseUrl = serverUrl.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/add/dummy`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify({ domain: optionsString }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);

      set({
        createStatus: {
          type: "success",
          message: `Created: ${data.data.email}`,
        },
      });

      if (config.domain === get().domain) void get().fetchList();
    } catch (e) {
      set({
        createStatus: {
          type: "error",
          message: String((e as Error).message || e),
        },
      });
    } finally {
      set({ creating: false });
    }
  },
  createStaticAlias: async () => {
    const { serverUrl, token, staticAlias } = get();
    const config = loadOptionsConfig();

    if (!serverUrl) {
      set({
        createStatus: { type: "error", message: "Server URL not configured" },
      });
      return;
    }
    if (!config.domain || !config.destination) {
      set({
        createStatus: {
          type: "error",
          message: "Domain and destination must be configured in Options",
        },
      });
      return;
    }

    const optionsString = generateStaticOptionsString(staticAlias, config);

    set({ creating: true, createStatus: null });

    try {
      const baseUrl = serverUrl.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/add/dummy`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify({ domain: optionsString }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);

      set({
        createStatus: {
          type: "success",
          message: `Created: ${data.data.email}`,
        },
        staticAlias: "",
      });

      if (config.domain === get().domain) void get().fetchList();
    } catch (e) {
      set({
        createStatus: {
          type: "error",
          message: String((e as Error).message || e),
        },
      });
    } finally {
      set({ creating: false });
    }
  },
  fetchList: async () => {
    const { domain, serverUrl, token } = get();
    if (!domain) return;

    set({ loading: true, error: null });
    try {
      const res = await fetch(`${serverUrl}/list/${domain}`, {
        headers: getHeaders(token),
      });
      if (!res.ok) {
        if (res.status === 401)
          throw new Error("Unauthorized: Invalid API Token");
        throw new Error(`Error: ${res.statusText}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        set({ forwarders: data });
      } else {
        console.warn("Received non-array data:", data);
        set({ forwarders: [], error: "Received unexpected data format" });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        set({ error: err.message });
      } else {
        set({ error: String(err) });
      }
    } finally {
      set({ loading: false });
    }
  },
  deleteForwarder: async (email) => {
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;

    const { serverUrl, token } = get();

    try {
      const res = await fetch(
        `${serverUrl}/delete/${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: getHeaders(token),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || res.statusText);
      }

      set((state) => ({
        forwarders: state.forwarders.filter((item) => item.email !== email),
      }));
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Failed to delete: ${err.message}`);
      } else {
        alert("Failed to delete");
      }
    }
  },
  reset: () => set(createInitialAppState()),
}));

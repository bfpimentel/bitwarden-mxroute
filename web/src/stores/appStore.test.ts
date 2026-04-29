import { beforeEach, describe, expect, it, vi } from "vitest";
import { SERVER_URL_STORAGE_KEY, TOKEN_STORAGE_KEY } from "../utils/constants";

type UseAppStore = typeof import("./appStore").useAppStore;

const ALIAS_CONFIG_STORAGE_KEY = "bitwarden_alias_config";
let useAppStore: UseAppStore;

const createStorageMock = () => {
  let values: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(values).length;
    },
    clear: vi.fn(() => {
      values = {};
    }),
    getItem: vi.fn((key: string) => values[key] ?? null),
    key: vi.fn((index: number) => Object.keys(values)[index] ?? null),
    removeItem: vi.fn((key: string) => {
      delete values[key];
    }),
    setItem: vi.fn((key: string, value: string) => {
      values[key] = value;
    }),
  } satisfies Storage;
};

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

describe("app store", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.stubGlobal("localStorage", createStorageMock());
    ({ useAppStore } = await import("./appStore"));
  });

  it("initializes API configuration from localStorage", () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "saved-token");
    localStorage.setItem(
      SERVER_URL_STORAGE_KEY,
      "https://api.example.com",
    );

    useAppStore.getState().reset();

    expect(useAppStore.getState()).toMatchObject({
      token: "saved-token",
      serverUrl: "https://api.example.com",
      showTokenInput: false,
      isDirty: false,
    });
  });

  it("marks config dirty and clears test state when API fields change", () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "saved-token");
    localStorage.setItem(
      SERVER_URL_STORAGE_KEY,
      "https://api.example.com",
    );
    useAppStore.getState().reset();
    useAppStore.setState({ testSuccess: true, configError: "previous error" });

    useAppStore.getState().setServerUrl("https://new-api.example.com");

    expect(useAppStore.getState()).toMatchObject({
      serverUrl: "https://new-api.example.com",
      isDirty: true,
      testSuccess: false,
      configError: null,
    });
  });

  it("saves API configuration to localStorage", () => {
    useAppStore.getState().setServerUrl("https://api.example.com");
    useAppStore.getState().setToken("new-token");

    useAppStore.getState().saveConfig();

    expect(localStorage.getItem(SERVER_URL_STORAGE_KEY)).toBe(
      "https://api.example.com",
    );
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("new-token");
    expect(useAppStore.getState()).toMatchObject({
      showTokenInput: false,
      isDirty: false,
    });
  });

  it("tests server configuration with auth headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    useAppStore.getState().setServerUrl("https://api.example.com/");
    useAppStore.getState().setToken("api-token");

    await useAppStore.getState().testConfig();

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer api-token",
      },
    });
    expect(useAppStore.getState()).toMatchObject({
      testLoading: false,
      testSuccess: true,
      configError: null,
    });
  });

  it("loads forwarders for the selected domain", async () => {
    const forwarders = [
      {
        alias: "alias",
        destinations: ["me@example.com"],
        email: "alias@example.com",
      },
    ];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(forwarders));
    vi.stubGlobal("fetch", fetchMock);
    useAppStore.getState().setServerUrl("https://api.example.com");
    useAppStore.getState().setToken("api-token");
    useAppStore.getState().setDomain("example.com");

    await useAppStore.getState().fetchList();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/list/example.com",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer api-token",
        },
      },
    );
    expect(useAppStore.getState()).toMatchObject({
      forwarders,
      loading: false,
      error: null,
    });
  });

  it("reports unauthorized list requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({}, { status: 401 })),
    );
    useAppStore.getState().setServerUrl("https://api.example.com");
    useAppStore.getState().setDomain("example.com");

    await useAppStore.getState().fetchList();

    expect(useAppStore.getState()).toMatchObject({
      error: "Unauthorized: Invalid API Token",
      loading: false,
    });
  });

  it("creates a generated alias from saved options", async () => {
    localStorage.setItem(
      ALIAS_CONFIG_STORAGE_KEY,
      JSON.stringify({ domain: "example.com", destination: "me@example.com" }),
    );
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { email: "generated@example.com" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    useAppStore.getState().setServerUrl("https://api.example.com/");

    await useAppStore.getState().createAlias();

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/add/dummy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: "domain=example.com,destination=me@example.com",
      }),
    });
    expect(useAppStore.getState()).toMatchObject({
      creating: false,
      createStatus: {
        type: "success",
        message: "Created: generated@example.com",
      },
    });
  });

  it("creates a static alias and clears the static alias input", async () => {
    localStorage.setItem(
      ALIAS_CONFIG_STORAGE_KEY,
      JSON.stringify({ domain: "example.com", destination: "me@example.com" }),
    );
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { email: "service@example.com" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    useAppStore.getState().setServerUrl("https://api.example.com");
    useAppStore.getState().setStaticAlias("service");

    await useAppStore.getState().createStaticAlias();

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/add/dummy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: "domain=example.com,destination=me@example.com,static=service",
      }),
    });
    expect(useAppStore.getState()).toMatchObject({
      staticAlias: "",
      createStatus: {
        type: "success",
        message: "Created: service@example.com",
      },
    });
  });

  it("deletes a confirmed forwarder from state", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal("alert", vi.fn());
    useAppStore.setState({
      serverUrl: "https://api.example.com",
      token: "api-token",
      forwarders: [
        { alias: "one", destinations: [], email: "one@example.com" },
        { alias: "two", destinations: [], email: "two@example.com" },
      ],
    });

    await useAppStore.getState().deleteForwarder("one@example.com");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/delete/one%40example.com",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer api-token",
        },
      },
    );
    expect(useAppStore.getState().forwarders).toEqual([
      { alias: "two", destinations: [], email: "two@example.com" },
    ]);
  });
});

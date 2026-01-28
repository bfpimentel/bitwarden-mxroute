import { useState, useEffect } from "react";
import { ForwarderItem } from "./components/ForwarderItem";
import { OptionsPopup } from "./components/OptionsPopup";
import { Settings, Sliders } from "lucide-react";
import { loadOptionsConfig, generateOptionsString } from "./utils/mxroute";

interface Forwarder {
  alias: string;
  destinations: string[];
  email: string;
}

function App() {
  const [domain, setDomain] = useState("");
  const [forwarders, setForwarders] = useState<Forwarder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Token state
  const [storedToken, setStoredToken] = useState<string>(
    () => localStorage.getItem("mxroute_api_token") || "",
  );
  const [serverUrl, setServerUrl] = useState<string>(
    () => localStorage.getItem("mxroute_server_url") || "http://localhost:6123",
  );
  const [showTokenInput, setShowTokenInput] = useState(
    () => !localStorage.getItem("mxroute_api_token"),
  );
  const [showOptionsPopup, setShowOptionsPopup] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [testLoading, setTestLoading] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Check if configuration has changed from saved values
  const isDirty =
    serverUrl !== (localStorage.getItem("mxroute_server_url") || "") ||
    storedToken !== (localStorage.getItem("mxroute_api_token") || "");

  useEffect(() => {
    setTestSuccess(false);
    setConfigError(null);
  }, [serverUrl, storedToken]);

  const handleTestConfig = async () => {
    setTestLoading(true);
    setConfigError(null);
    try {
      const baseUrl = serverUrl.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/`);
      if (!res.ok) throw new Error(`Status check failed: ${res.statusText}`);
      await res.text();
      setTestSuccess(true);
    } catch (e) {
      setConfigError((e as Error).message || "Failed to connect to server");
    } finally {
      setTestLoading(false);
    }
  };

  const handleSaveToken = () => {
    localStorage.setItem("mxroute_api_token", storedToken);
    localStorage.setItem("mxroute_server_url", serverUrl);
    setShowTokenInput(false);
  };

  const handleCreateAlias = async () => {
    const config = loadOptionsConfig();
    if (!serverUrl) {
      setCreateStatus({ type: "error", message: "Server URL not configured" });
      return;
    }
    if (!config.domain || !config.destination) {
      setCreateStatus({
        type: "error",
        message: "Domain and Destination must be configured in Options",
      });
      return;
    }

    const optionsString = generateOptionsString(config);

    setCreating(true);
    setCreateStatus(null);
    try {
      const baseUrl = serverUrl.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/add/dummy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
        },
        body: JSON.stringify({ domain: optionsString }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);

      setCreateStatus({
        type: "success",
        message: `Created: ${data.data.email}`,
      });
      // Optionally refresh list if domain matches
      if (config.domain === domain) {
        fetchList();
      }
    } catch (e) {
      setCreateStatus({
        type: "error",
        message: String((e as Error).message || e),
      });
    } finally {
      setCreating(false);
    }
  };

  const getHeaders = () => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (storedToken) headers["Authorization"] = `Bearer ${storedToken}`;
    return headers;
  };

  const fetchList = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!domain) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${serverUrl}/list/${domain}`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401)
          throw new Error("Unauthorized: Invalid API Token");
        throw new Error(`Error: ${res.statusText}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setForwarders(data);
      } else {
        console.warn("Received non-array data:", data);
        setForwarders([]);
        setError("Received unexpected data format");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      const res = await fetch(
        `${serverUrl}/delete/${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || res.statusText);
      }

      setForwarders((prev) => prev.filter((item) => item.email !== email));
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Failed to delete: ${err.message}`);
      } else {
        alert("Failed to delete");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            MXRoute Bitwarden Plugin
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowOptionsPopup(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
              title="Generate Options String"
            >
              <Sliders className="w-6 h-6" />
            </button>
            <button
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
              title="API Settings"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        <OptionsPopup
          isOpen={showOptionsPopup}
          onClose={() => setShowOptionsPopup(false)}
        />

        {showTokenInput && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              API Configuration
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Server URL
                </label>
                <input
                  type="text"
                  placeholder="http://localhost:6123"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Server API Token
                </label>
                <div className="flex gap-4">
                  <input
                    type="password"
                    placeholder="Enter Server API Token"
                    value={storedToken}
                    onChange={(e) => setStoredToken(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={
                      isDirty && !testSuccess
                        ? handleTestConfig
                        : handleSaveToken
                    }
                    disabled={
                      (!isDirty &&
                        !testSuccess &&
                        serverUrl === "http://localhost:6123") ||
                      testLoading ||
                      !isDirty
                    }
                    className={`px-6 py-2 rounded font-medium text-white transition-colors ${
                      isDirty
                        ? testSuccess
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {testLoading
                      ? "Testing..."
                      : isDirty
                        ? testSuccess
                          ? "Save"
                          : "Test"
                        : "Saved"}
                  </button>
                </div>
              </div>
              {configError && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
                  {configError}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              These settings are saved in your browser's local storage.
            </p>
          </div>
        )}

        <form
          onSubmit={fetchList}
          className="bg-white p-6 rounded-lg shadow-md mb-8 flex gap-4"
        >
          <input
            type="text"
            placeholder="Enter domain (e.g. example.com)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? "Loading..." : "Fetch List"}
          </button>
          <button
            type="button"
            onClick={handleCreateAlias}
            disabled={creating}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 font-medium whitespace-nowrap"
          >
            {creating ? "Creating..." : "Add Forwarder"}
          </button>
        </form>

        {(createStatus || error) && (
          <div
            className={`border px-4 py-3 rounded mb-6 ${
              createStatus?.type === "success"
                ? "bg-green-100 border-green-400 text-green-700"
                : "bg-red-100 border-red-400 text-red-700"
            }`}
          >
            {createStatus ? createStatus.message : error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700">Forwarders</h2>
          </div>
          {forwarders.length === 0 ? (
            <div className="p-6 text-gray-500 text-center">
              No forwarders found (or none fetched yet).
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {forwarders.map((item, idx) => (
                <ForwarderItem
                  key={item.email || idx}
                  email={item.email}
                  destinations={item.destinations}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

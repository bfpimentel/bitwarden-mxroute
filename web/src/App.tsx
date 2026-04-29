import { ForwarderItem } from "./components/ForwarderItem";
import { OptionsPopup } from "./components/OptionsPopup";
import { Settings, Sliders } from "lucide-react";
import { useAppStore } from "./stores/appStore";

function App() {
  const {
    domain,
    forwarders,
    loading,
    error,
    showOptionsPopup,
    staticAlias,
    creating,
    createStatus,
    testLoading,
    testSuccess,
    configError,
    token,
    serverUrl,
    showTokenInput,
    isDirty,
    setDomain,
    setShowOptionsPopup,
    setStaticAlias,
    setToken,
    setServerUrl,
    toggleTokenInput,
    saveConfig,
    testConfig,
    createAlias,
    createStaticAlias,
    fetchList,
    deleteForwarder,
  } = useAppStore();

  return (
    <div className="min-h-screen w-full bg-black text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-white">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight">
              Bitwarden Alias Provider
            </h1>
            <p className="text-sm text-gray-400 mt-1">Email alias management</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowOptionsPopup(true)}
              className="p-2 border-2 border-white hover:bg-white hover:text-black transition-colors"
              title="Generate Options String"
            >
              <Sliders className="w-5 h-5" />
            </button>
            <button
              onClick={toggleTokenInput}
              className="p-2 border-2 border-white hover:bg-white hover:text-black transition-colors"
              title="API Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <OptionsPopup
          isOpen={showOptionsPopup}
          onClose={() => setShowOptionsPopup(false)}
        />

        {/* API Configuration */}
        {showTokenInput && (
          <div className="mb-8 border-2 border-white p-4">
            <h2 className="text-lg font-bold uppercase mb-4">
              API Configuration
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold mb-1 uppercase">
                  Server URL
                </label>
                <input
                  type="text"
                  placeholder="http://localhost:6123"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="w-full p-2 border-2 border-white bg-black text-white focus:bg-white focus:text-black transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 uppercase">
                  Server API Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Enter Server API Token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="flex-1 p-2 border-2 border-white bg-black text-white focus:bg-white focus:text-black transition-colors"
                  />
                  <button
                    onClick={
                      isDirty && !testSuccess
                        ? () => void testConfig()
                        : saveConfig
                    }
                    disabled={
                      (!isDirty &&
                        !testSuccess &&
                        serverUrl === "http://localhost:6123") ||
                      testLoading ||
                      !isDirty
                    }
                    className={`px-4 py-2 border-2 border-white font-bold uppercase transition-colors ${
                      isDirty
                        ? testSuccess
                          ? "bg-white text-black hover:bg-gray-200"
                          : "bg-black text-white hover:bg-white hover:text-black"
                        : "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
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
                <div className="text-sm border-2 border-white p-2 bg-white text-black">
                  {configError}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3 uppercase">
              Settings saved in browser local storage
            </p>
          </div>
        )}

        {/* Domain Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void fetchList();
          }}
          className="mb-8 border-2 border-white p-4"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Enter domain (e.g. example.com)"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="flex-1 p-2 border-2 border-white bg-black text-white focus:bg-white focus:text-black transition-colors"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border-2 border-white font-bold uppercase hover:bg-white hover:text-black disabled:bg-gray-800 disabled:text-gray-500 disabled:border-gray-700 transition-colors"
              >
                {loading ? "Loading..." : "Fetch"}
              </button>
              <button
                type="button"
                onClick={() => void createAlias()}
                disabled={creating}
                className="px-4 py-2 border-2 border-white font-bold uppercase hover:bg-white hover:text-black disabled:bg-gray-800 disabled:text-gray-500 disabled:border-gray-700 transition-colors whitespace-nowrap"
              >
                {creating ? "Creating..." : "Generate"}
              </button>
            </div>
          </div>
        </form>

        {/* Create Static Alias */}
        <div className="mb-8 border-2 border-white p-4">
          <h2 className="text-lg font-bold uppercase mb-4">
            Create Static Alias
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter alias (e.g. my-service)"
              value={staticAlias}
              onChange={(e) => setStaticAlias(e.target.value)}
              className="flex-1 p-2 border-2 border-white bg-black text-white focus:bg-white focus:text-black transition-colors"
            />
            <button
              type="button"
              onClick={() => void createStaticAlias()}
              disabled={creating || !staticAlias}
              className="px-4 py-2 border-2 border-white font-bold uppercase hover:bg-white hover:text-black disabled:bg-gray-800 disabled:text-gray-500 disabled:border-gray-700 transition-colors whitespace-nowrap"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {(createStatus || error) && (
          <div
            className={`border-2 border-white px-4 py-3 mb-6 font-bold uppercase ${
              createStatus?.type === "success"
                ? "bg-white text-black"
                : "bg-black text-white"
            }`}
          >
            {createStatus ? createStatus.message : error}
          </div>
        )}

        {/* Forwarders List */}
        <div className="border-2 border-white">
          <div className="px-4 py-3 border-b-2 border-white bg-white text-black">
            <h2 className="text-lg font-bold uppercase">Forwarders</h2>
          </div>
          {forwarders.length === 0 ? (
            <div className="p-8 text-center text-gray-400 uppercase text-sm">
              No forwarders found
            </div>
          ) : (
            <div className="divide-y divide-white">
              {forwarders.map((item, idx) => (
                <ForwarderItem
                  key={item.email || idx}
                  email={item.email}
                  destinations={item.destinations}
                  onDelete={deleteForwarder}
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

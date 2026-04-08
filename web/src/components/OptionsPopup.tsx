import { useState, useEffect } from "react";
import { X, Copy, Check } from "lucide-react";
import { loadOptionsConfig, generateOptionsString } from "../utils/alias";

interface OptionsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OptionsPopup({ isOpen, onClose }: OptionsPopupProps) {
  const savedConfig = loadOptionsConfig();

  const [domain, setDomain] = useState(savedConfig.domain || "");
  const [destination, setDestination] = useState(savedConfig.destination || "");
  const [template, setTemplate] = useState(savedConfig.template || "<slug>");
  const [prefix, setPrefix] = useState(savedConfig.prefix || "");
  const [suffix, setSuffix] = useState(savedConfig.suffix || "");
  const [slugLength, setSlugLength] = useState(savedConfig.slugLength || "2");
  const [hexLength, setHexLength] = useState(savedConfig.hexLength || "6");
  const [aliasSeparator, setAliasSeparator] = useState(savedConfig.aliasSeparator || "_");
  const [slugSeparator, setSlugSeparator] = useState(savedConfig.slugSeparator || "_");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const config = {
      domain,
      destination,
      template,
      prefix,
      suffix,
      slugLength,
      hexLength,
      aliasSeparator,
      slugSeparator,
    };
    localStorage.setItem("bitwarden_alias_config", JSON.stringify(config));
  }, [
    domain,
    destination,
    template,
    prefix,
    suffix,
    slugLength,
    hexLength,
    aliasSeparator,
    slugSeparator,
  ]);

  const resultString = generateOptionsString({
    domain,
    destination,
    template,
    prefix,
    suffix,
    slugLength,
    hexLength,
    aliasSeparator,
    slugSeparator,
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resultString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-black border-2 border-white w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b-2 border-white bg-white text-black">
          <h2 className="text-lg font-bold uppercase">Generate Options String</h2>
          <button 
            onClick={onClose} 
            className="border-2 border-black p-1 hover:bg-black hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold mb-1 uppercase">Domain *</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full p-2 border-2 border-white bg-black text-white focus:bg-white focus:text-black outline-none transition-colors"
                placeholder="example.com"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold mb-1 uppercase">Destination *</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full p-2 border-2 border-white bg-black text-white focus:bg-white focus:text-black outline-none transition-colors"
                placeholder="target@email.com"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold mb-1 uppercase">Template</label>
              <input
                type="text"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full p-2 border-2 border-white bg-black text-white focus:bg-white focus:text-black outline-none transition-colors"
                placeholder="<slug><hex>"
              />
              <p className="text-xs text-gray-500 mt-1 uppercase">Allowed: &lt;slug&gt;, &lt;hex&gt;</p>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 uppercase">Prefix</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="w-full p-2 border-2 border-white bg-black text-white focus:bg-white focus:text-black outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 uppercase">Suffix</label>
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                className="w-full p-2 border-2 border-white bg-black text-white focus:bg-white focus:text-black outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 uppercase">Slug Length</label>
              <input
                type="number"
                value={slugLength}
                onChange={(e) => setSlugLength(e.target.value)}
                className="w-full p-2 border-2 border-white bg-black text-white focus:bg-white focus:text-black outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 uppercase">Hex Length</label>
              <input
                type="number"
                value={hexLength}
                onChange={(e) => setHexLength(e.target.value)}
                className="w-full p-2 border-2 border-white bg-black text-white focus:bg-white focus:text-black outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 uppercase">Alias Separator</label>
              <input
                type="text"
                value={aliasSeparator}
                onChange={(e) => setAliasSeparator(e.target.value)}
                className="w-full p-2 border-2 border-white bg-black text-white focus:bg-white focus:text-black outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 uppercase">Slug Separator</label>
              <input
                type="text"
                value={slugSeparator}
                onChange={(e) => setSlugSeparator(e.target.value)}
                className="w-full p-2 border-2 border-white bg-black text-white focus:bg-white focus:text-black outline-none transition-colors"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-white">
            <label className="block text-sm font-bold mb-2 uppercase">Generated Options String</label>
            <div className="flex gap-2 items-start">
              <textarea
                readOnly
                value={resultString}
                className="flex-1 p-2 border-2 border-white bg-black font-mono text-sm text-white focus:outline-none min-h-[80px] resize-y"
              />
              <button
                onClick={copyToClipboard}
                className="border-2 border-white p-2 hover:bg-white hover:text-black transition-colors flex items-center justify-center shrink-0"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

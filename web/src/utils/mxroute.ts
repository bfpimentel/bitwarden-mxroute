export interface MxRouteConfig {
  domain?: string;
  destination?: string;
  template?: string;
  prefix?: string;
  suffix?: string;
  slugLength?: string;
  hexLength?: string;
  aliasSeparator?: string;
  slugSeparator?: string;
}

export const loadOptionsConfig = (): MxRouteConfig => {
  try {
    const saved = localStorage.getItem("mxroute_options_config");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const generateOptionsString = (config: MxRouteConfig): string => {
  const parts = [];

  if (config.domain) parts.push(`domain=${config.domain}`);
  if (config.destination) parts.push(`destination=${config.destination}`);
  if (config.template && config.template !== "<slug>")
    parts.push(`template=${config.template}`);
  if (config.prefix) parts.push(`prefix=${config.prefix}`);
  if (config.suffix) parts.push(`suffix=${config.suffix}`);
  if (config.slugLength && config.slugLength !== "2")
    parts.push(`slug_length=${config.slugLength}`);
  if (config.hexLength && config.hexLength !== "6")
    parts.push(`hex_length=${config.hexLength}`);
  if (config.aliasSeparator && config.aliasSeparator !== "_")
    parts.push(`alias_separator=${config.aliasSeparator}`);
  if (config.slugSeparator && config.slugSeparator !== "_")
    parts.push(`slug_separator=${config.slugSeparator}`);

  return parts.join(",");
};

export const generateStaticOptionsString = (staticAlias: string, config: MxRouteConfig): string => {
  const parts = [];

  if (config.domain) parts.push(`domain=${config.domain}`);
  if (config.destination) parts.push(`destination=${config.destination}`);

  parts.push(`static=${staticAlias}`);

  return parts.join(",");
}

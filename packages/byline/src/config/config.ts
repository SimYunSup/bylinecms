import type { CollectionDefinition, SiteConfig, ClientConfig } from "@/@types/index.js";

let configInstance: SiteConfig | null = null;
let clientConfigInstance: ClientConfig | null = null;

export const getCollectionDefinition = (path: string): CollectionDefinition | null => {
  const config = clientConfigInstance ?? configInstance;
  if (config == null) {
    throw new Error("Byline has not been configured yet. Please call defineConfig in byline.config.ts first.");
  }

  return config.collections.find((collection) => collection.path === path) ?? null;
}

export function defineClientConfig(config: ClientConfig) {
  clientConfigInstance = config;
}

export function defineConfig(config: SiteConfig) {
  configInstance = config;
  // Also set client config from server config.
  const { db, ...clientConfig } = config;
  clientConfigInstance = clientConfig;
}

export function getConfig(): ClientConfig {
  const config = clientConfigInstance ?? configInstance;
  if (config == null) {
    throw new Error("Byline has not been configured yet. Please call defineConfig in byline.config.ts first.");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { db, ...clientConfig } = config as SiteConfig;
  return clientConfig;
}

export function getServerConfig(): SiteConfig {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    throw new Error("getServerConfig cannot be called on the client.");
  }
  if (configInstance == null) {
    throw new Error("Byline has not been configured yet. Please call defineConfig in byline.config.ts first.");
  }
  return configInstance;
}
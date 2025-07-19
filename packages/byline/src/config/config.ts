import type { CollectionDefinition, SiteConfig } from "@/@types/index.js";

let configInstance: SiteConfig | null = null;

export const getCollectionDefinition = (path: string): CollectionDefinition | null => {
  if (configInstance == null) {
    throw new Error("Byline has not been configured yet. Please call defineConfig in byline.config.ts first.");
  }

  return configInstance.collections.find((collection) => collection.path === path) ?? null;
}

export function defineConfig(config: SiteConfig) {
  configInstance = config;
}

export function getConfig(): SiteConfig {
  if (configInstance == null) {
    throw new Error("Byline has not been configured yet. Please call defineConfig in byline.config.ts first.");
  }
  return configInstance;
}
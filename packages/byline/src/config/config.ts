import type { CollectionDefinition, SiteConfig } from "@/@types/index.js";

let config: SiteConfig | null = null;

export const getCollectionDefinition = (path: string): CollectionDefinition | null => {
  if (config == null) {
    throw new Error("Byline has not been configured yet. Please call defineConfig in byline.config.ts first.");
  }

  return config.collections.find((collection) => collection.path === path) ?? null;
}

export function defineConfig(newConfig: SiteConfig) {
  config = newConfig;
}

export function getConfig(): SiteConfig {
  if (config == null) {
    throw new Error("Byline has not been configured yet. Please call defineConfig in byline.config.ts first.");
  }
  return config;
}
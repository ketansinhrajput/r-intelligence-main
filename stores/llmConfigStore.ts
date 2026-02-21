/**
 * LLM Config Store
 * Manages runtime LLM provider configuration (provider-agnostic via OpenAI-compatible API)
 */

import { create } from "zustand";

export interface LLMProviderConfig {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

interface LLMConfigState {
  config: LLMProviderConfig;
  isConfigured: boolean;
}

interface LLMConfigActions {
  setConfig: (config: Partial<LLMProviderConfig>) => void;
  reset: () => void;
}

type LLMConfigStore = LLMConfigState & LLMConfigActions;

const initialConfig: LLMProviderConfig = {
  baseUrl: "",
  apiKey: "",
  modelName: "",
};

export const useLLMConfigStore = create<LLMConfigStore>((set, get) => ({
  config: initialConfig,
  isConfigured: false,

  setConfig: (partial) => {
    const newConfig = { ...get().config, ...partial };
    set({
      config: newConfig,
      isConfigured: !!(newConfig.baseUrl && newConfig.apiKey && newConfig.modelName),
    });
  },

  reset: () => {
    set({ config: initialConfig, isConfigured: false });
  },
}));

// Selectors
export const selectLLMConfig = (state: LLMConfigStore) => state.config;
export const selectIsLLMConfigured = (state: LLMConfigStore) => state.isConfigured;

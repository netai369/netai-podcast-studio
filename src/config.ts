// Configuration module that works in both browser and test environments
// In browser environment, this will be overridden by the actual import.meta.env
// In test environment, we use process.env

declare global {
  interface Window {
    importMetaEnv?: {
      VITE_API_KEY: string;
      VITE_LLM_PROVIDER: string;
      VITE_LLM_URL: string;
      VITE_LLM_KEY: string;
      VITE_TTS_PROVIDER: string;
      VITE_TTS_URL: string;
      MODE: string;
      DEV: boolean;
      PROD: boolean;
      SSR: boolean;
    };
  }
}

// Helper to read environment variables consistently
// Priority: process.env (Node/test) > window.importMetaEnv (browser)
const getEnvVar = (key: string, fallback: string = ''): string => {
  // In Node/test environment
  if (typeof process !== 'undefined' && process.env && Object.keys(process.env).length > 0) {
    return (process.env[key] || fallback);
  }
  // In browser environment
  if (typeof window !== 'undefined' && window.importMetaEnv) {
    return (window.importMetaEnv[key] || fallback);
  }
  return fallback;
};

// Export environment variables
export const VITE_API_KEY = getEnvVar('VITE_API_KEY');
export const VITE_LLM_PROVIDER = getEnvVar('VITE_LLM_PROVIDER', 'gemini');
export const VITE_LLM_URL = getEnvVar('VITE_LLM_URL');
export const VITE_LLM_KEY = getEnvVar('VITE_LLM_KEY');
export const VITE_TTS_PROVIDER = getEnvVar('VITE_TTS_PROVIDER', 'gemini');
export const VITE_TTS_URL = getEnvVar('VITE_TTS_URL');

export const MODE = getEnvVar('NODE_ENV', '') === 'production' || getEnvVar('MODE', '') === 'production' ? 'production' : 'development';

export const DEV = MODE === 'development';

export const PROD = MODE === 'production';

export const SSR = false;

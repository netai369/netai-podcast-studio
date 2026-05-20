// Configuration module that works in both browser and test environments
// In browser environment, this will be overridden by the actual import.meta.env
// In test environment, we use process.env

declare global {
  interface Window {
    importMetaEnv?: {
      VITE_API_KEY: string;
      MODE: string;
      DEV: boolean;
      PROD: boolean;
      SSR: boolean;
    };
  }
}

// Export environment variables - these will be mocked in tests
export const VITE_API_KEY = typeof window !== 'undefined' 
  ? window.importMetaEnv?.VITE_API_KEY || ''
  : process.env.VITE_API_KEY || '';

export const MODE = typeof window !== 'undefined'
  ? window.importMetaEnv?.MODE || 'development'
  : process.env.MODE || 'development';

export const DEV = typeof window !== 'undefined'
  ? window.importMetaEnv?.DEV !== false
  : process.env.NODE_ENV !== 'production';

export const PROD = typeof window !== 'undefined'
  ? window.importMetaEnv?.PROD !== false
  : process.env.NODE_ENV === 'production';

export const SSR = false;
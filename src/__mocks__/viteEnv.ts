// Mock for Vite environment variables
export const importMetaEnv = {
  VITE_API_KEY: 'test-api-key',
  MODE: 'development',
  DEV: true,
  PROD: false,
  SSR: false
};

// This will be used by our jest setup
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: importMetaEnv
    }
  },
  writable: true
});
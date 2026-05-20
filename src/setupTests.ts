// Jest setup file for Svelte testing
import '@testing-library/jest-dom';

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

// Mock environment variables
process.env.VITE_API_KEY = 'test-api-key';

// Mock import.meta.env
(global as any).importMetaEnv = {
  VITE_API_KEY: 'test-api-key',
  MODE: 'development',
  DEV: true,
  PROD: false,
  SSR: false
};

// Mock import.meta before any modules are loaded
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: (global as any).importMetaEnv
    }
  },
  writable: true
});

// Mock browser APIs
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.AudioContext = jest.fn().mockImplementation(() => ({
  createBuffer: jest.fn(),
  decodeAudioData: jest.fn(),
  createBufferSource: jest.fn(),
  createGain: jest.fn(),
  createAnalyser: jest.fn(),
  createScriptProcessor: jest.fn(),
  destination: {},
  currentTime: 0
})) as any;

global.Blob = jest.fn().mockImplementation((parts: any[], options: any) => ({
  size: parts.reduce((sum, part) => sum + part.length, 0),
  type: options?.type || '',
  slice: jest.fn()
})) as any;

global.fetch = jest.fn() as jest.Mock;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock import.meta
(global as any).importMeta = {
  env: (global as any).importMetaEnv
};
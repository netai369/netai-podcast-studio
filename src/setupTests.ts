// Jest setup file for Svelte testing
import '@testing-library/jest-dom';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env.local file and parse environment variables
function loadEnvFile() {
  try {
    const envPath = join(__dirname, '..', '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars: Record<string, string> = {};

    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return envVars;
  } catch (error) {
    console.warn('Could not load .env.local file:', (error as Error).message);
    return {};
  }
}

// Load environment variables from .env.local
const envVars = loadEnvFile();

// Set process.env from .env.local (only if not already set)
Object.entries(envVars).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});

// Log loaded configuration
console.log('Environment variables loaded from .env.local:');
console.log('  VITE_LLM_PROVIDER:', process.env.VITE_LLM_PROVIDER || 'not set');
console.log('  VITE_LLM_URL:', process.env.VITE_LLM_URL || 'not set');
console.log('  VITE_TTS_PROVIDER:', process.env.VITE_TTS_PROVIDER || 'not set');
console.log('  VITE_TTS_URL:', process.env.VITE_TTS_URL || 'not set');

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

// Mock environment variables
const env = {
  VITE_API_KEY: process.env.VITE_API_KEY || 'test-api-key',
  VITE_LLM_PROVIDER: process.env.VITE_LLM_PROVIDER || 'openai',
  VITE_LLM_URL: process.env.VITE_LLM_URL || 'http://localhost:8080',
  VITE_LLM_KEY: process.env.VITE_LLM_KEY || 'test-llm-key',
  VITE_TTS_PROVIDER: process.env.VITE_TTS_PROVIDER || 'openai',
  VITE_TTS_URL: process.env.VITE_TTS_URL || 'http://localhost:8800/v1/audio/speech',
  MODE: process.env.MODE || 'test',
  DEV: process.env.MODE !== 'production',
  PROD: process.env.MODE === 'production',
  SSR: false
};

// Mock import.meta.env
(global as any).importMetaEnv = env;

// Mock import.meta before any modules are loaded
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: env
    }
  },
  writable: true
});

// Mock fetch, Headers, Request, Response for tests (jsdom lacks these)
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;
(global as any).Headers = class {};
(global as any).Request = class {};
(global as any).Response = class {};

// Mock TextEncoder/TextDecoder for EdgeTTS tests
(global as any).TextEncoder = jest.fn().mockImplementation(() => ({
  encode: jest.fn((str: string) => new Uint8Array(Buffer.from(str)))
}));

(global as any).TextDecoder = jest.fn().mockImplementation(() => ({
  decode: jest.fn((bytes: Uint8Array) => Buffer.from(bytes).toString())
}));

// Mock Google GenAI module to avoid ES Module issues
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContentStream: jest.fn().mockImplementation(function* () {
        yield { text: 'This is a test script. ' };
        yield { text: 'It demonstrates the podcast workflow. ' };
        yield { text: 'The script should be generated successfully.' };
      }),
      generateContent: jest.fn().mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              text: '{"title": "Test Podcast", "description": "Test description"}'
            }]
          }
        }]
      })
    }
  })),
  Modality: {
    AUDIO: 'AUDIO'
  },
  Type: {
    OBJECT: 'OBJECT',
    STRING: 'STRING'
  }
}));

(global as any).AudioContext = jest.fn().mockImplementation(() => ({
  createBuffer: jest.fn(),
  decodeAudioData: jest.fn(),
  createBufferSource: jest.fn(),
  createGain: jest.fn(),
  createAnalyser: jest.fn(),
  createScriptProcessor: jest.fn(),
  destination: {},
  currentTime: 0
}));

(global as any).Blob = jest.fn().mockImplementation((parts: any[], options: any) => ({
  size: parts.reduce((sum: number, part: any) => sum + part.length, 0),
  type: options?.type || '',
  slice: jest.fn()
}));

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
  env: env
};
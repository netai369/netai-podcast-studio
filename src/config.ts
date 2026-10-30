// Configuration module that works in the browser build and under Jest.
//
// AUD-204: never inline `process.env` into the client bundle. Only
// `import.meta.env.VITE_*` values are exposed (Vite's documented contract),
// so unrelated build secrets cannot leak into the served JavaScript.
// Jest rewrites `import.meta.env` to `global.importMetaEnv` (see
// jest-import-meta-transform.js) and setupTests.ts populates it from
// process.env for backwards compatibility with .env.local.
type EnvRecord = Record<string, string | boolean | undefined>;

const viteEnv: EnvRecord = (import.meta.env ?? {}) as EnvRecord;

const getEnvVar = (key: string, fallback: string = ''): string => {
  const fromVite = viteEnv[key];
  if (typeof fromVite === 'string' && fromVite !== '') return fromVite;
  // Test-only fallback: setupTests writes .env.local into process.env.
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return fallback;
};

const isProd = (): boolean => {
  const mode = viteEnv.MODE;
  if (typeof mode === 'string') return mode === 'production';
  return typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
};

export const VITE_API_KEY = getEnvVar('VITE_API_KEY');
export const VITE_LLM_PROVIDER = getEnvVar('VITE_LLM_PROVIDER', 'openai');
export const VITE_LLM_URL = getEnvVar('VITE_LLM_URL', '/cascade');
export const VITE_LLM_KEY = getEnvVar('VITE_LLM_KEY');
export const VITE_TTS_PROVIDER = getEnvVar('VITE_TTS_PROVIDER', 'supertonic');
export const VITE_TTS_URL = getEnvVar('VITE_TTS_URL', '/tts/v1/audio/speech');
// Build-time fallback for voice-cloning availability; the runtime value from
// `/config.json` takes precedence (see utils/runtimeConfig.ts).
export const VITE_TTS_VOICE_CLONING = getEnvVar('VITE_TTS_VOICE_CLONING', 'true');

export const MODE = isProd() ? 'production' : (typeof viteEnv.MODE === 'string' ? viteEnv.MODE : 'development');

export const DEV = MODE !== 'production';

export const PROD = MODE === 'production';

export const SSR = false;

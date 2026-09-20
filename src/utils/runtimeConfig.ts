// Runtime configuration, fetched from `/config.json` at start-up.
//
// The app is a static nginx build, so build-time `VITE_*` values cannot be
// changed without rebuilding. Voice cloning availability depends on which TTS
// backend is active on :8800 (PocketTTS supports reference-WAV cloning,
// Supertonic does not), so it must be switchable at runtime: nginx serves
// `config.json`, which can be bind-mounted per deployment.
//
// Precedence: runtime `config.json` > build-time `VITE_TTS_VOICE_CLONING` >
// default (enabled).

import { VITE_TTS_VOICE_CLONING } from '@/config';

export interface RuntimeConfig {
  ttsVoiceCloning?: boolean;
}

const buildTimeVoiceCloning = VITE_TTS_VOICE_CLONING !== 'false';

let cached: RuntimeConfig | null = null;
let pending: Promise<RuntimeConfig> | null = null;

export function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = fetch('/config.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}))
      .then((cfg: RuntimeConfig) => {
        cached = cfg;
        return cfg;
      });
  }
  return pending;
}

export function voiceCloningAvailable(cfg: RuntimeConfig | null = cached): boolean {
  if (cfg && typeof cfg.ttsVoiceCloning === 'boolean') return cfg.ttsVoiceCloning;
  return buildTimeVoiceCloning;
}
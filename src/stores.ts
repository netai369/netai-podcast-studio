import { writable } from 'svelte/store';
import type { BackendConfig, Language } from '@/types';
import { translations } from '@/locales/translations';

// --- Helper Functions ---
// UI-05: provider secrets (API keys) must never touch localStorage — XSS or a
// shared machine would exfiltrate them. They live in memory only (per page
// load); everything else persists as before.
const MEMORY_ONLY_SECRETS = ['openAiKey'] as const;

function stripSecrets<T>(val: T): T {
  if (val === null || typeof val !== 'object') return val;
  const strip = (obj: any) => {
    if (obj === null || typeof obj !== 'object') return;
    for (const k of MEMORY_ONLY_SECRETS) {
      if (k in obj) obj[k] = '';
    }
    for (const v of Object.values(obj)) {
      if (v !== null && typeof v === 'object') strip(v);
    }
  };
  const copy = JSON.parse(JSON.stringify(val));
  strip(copy);
  return copy;
}

function createPersistentStore<T>(key: string, startValue: T) {
  const isBrowser = typeof window !== 'undefined';
  const storedValue = isBrowser ? localStorage.getItem(key) : null;
  const parsed = storedValue ? stripSecrets<T>(JSON.parse(storedValue)) : startValue;

  const store = writable<T>(parsed);

  store.subscribe(val => {
    if (isBrowser) {
      localStorage.setItem(key, JSON.stringify(stripSecrets(val)));
    }
  });

  return store;
}

// --- Settings Store ---
const initialSettings: BackendConfig = {
    llm: { provider: 'openai', openAiUrl: '/cascade', openAiKey: '', model: 'cascade-hybrid-v1' },
    tts: { provider: 'supertonic', openAudioUrl: '/tts/v1/audio/speech', language: 'de', model: 'de_6l' },
    debug: { logLevel: 'INFO' },
};
export const settingsStore = createPersistentStore('podcast_studio_backendConfig', initialSettings);

// Ensure debug section exists for backward compatibility
settingsStore.update(settings => ({
    ...settings,
    debug: settings.debug || { logLevel: 'INFO' }
}));

// NOTE: no settings-change logging here — the settings object carries the
// in-memory API key and must never be written to the console (UI-05).

// --- i18n Store ---
function detectInitialLang(): Language {
    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('netai-lang') as Language | null;
            if (saved && translations[saved]) return saved;
        } catch {
            // private mode / SSR
        }
    }
    if (typeof navigator !== 'undefined' && navigator.language) {
        const nav = navigator.language.split('-')[0].toLowerCase() as Language;
        if (translations[nav]) return nav;
    }
    return 'en';
}

const createI18nStore = () => {
    const defaultLang: Language = detectInitialLang();

    const { subscribe, set } = writable<{ lang: Language, t: (key: string, replacements?: Record<string, string>) => string }>({
        lang: defaultLang,
        t: (key) => key,
    });

    function setLanguage(lang: Language) {
        if (!translations[lang]) {
            console.warn(`Language '${lang}' not found, defaulting to English.`);
            lang = 'en';
        }
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('netai-lang', lang);
            } catch {
                // private mode
            }
        }
        set({ lang, t: (key, replacements) => translate(lang, key, replacements) });
    }

    // Initialize with the default language
    setLanguage(defaultLang);

    return {
        subscribe,
        setLanguage,
    };
};

function translate(lang: Language, key: string, replacements: Record<string, string> = {}): string {
    const keys = key.split('.');
    let result: any = translations[lang] || translations.en;

    for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
            result = result[k];
        } else {
            return key; // Return the key if path is not found
        }
    }

    if (typeof result !== 'string') return key;

    let translated = result;
    for (const placeholder in replacements) {
        translated = translated.replace(`{{${placeholder}}}`, replacements[placeholder]);
    }
    
    return translated;
}

export const i18n = createI18nStore();

import { writable } from 'svelte/store';
import type { BackendConfig, Language } from '@/types';
import { translations } from '@/locales/translations';

// --- Helper Functions ---
function createPersistentStore<T>(key: string, startValue: T) {
  const isBrowser = typeof window !== 'undefined';
  const storedValue = isBrowser ? localStorage.getItem(key) : null;
  const store = writable<T>(storedValue ? JSON.parse(storedValue) : startValue);

  store.subscribe(val => {
    if (isBrowser) {
      localStorage.setItem(key, JSON.stringify(val));
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

// Debug: Log settings changes
settingsStore.subscribe(settings => {
    console.log('DEBUG: Settings changed:', settings);
});

// --- i18n Store ---
const createI18nStore = () => {
    const defaultLang: Language = (typeof navigator !== 'undefined' && translations[navigator.language.split('-')[0] as Language]) 
        ? navigator.language.split('-')[0] as Language 
        : 'en';

    const { subscribe, set } = writable<{ lang: Language, t: (key: string, replacements?: Record<string, string>) => string }>({
        lang: defaultLang,
        t: (key) => key,
    });

    function setLanguage(lang: Language) {
        if (!translations[lang]) {
            console.warn(`Language '${lang}' not found, defaulting to English.`);
            lang = 'en';
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

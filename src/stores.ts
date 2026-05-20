import { writable } from 'svelte/store';
import type { BackendConfig, User, Language } from '@/types';
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
    llm: { provider: 'gemini', model: undefined },
    tts: { provider: 'edge-tts', language: 'de' },
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

// --- User Store ---
const initialUser: User | null = null;
export const userStore = writable<User | null>(initialUser);

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

// --- Auth Initialization ---
// This runs once when the app starts
if (typeof window !== 'undefined') {
    const loggedInUserEmail = localStorage.getItem('podcast_studio_currentUser');
    if (loggedInUserEmail) {
        const usersJSON = localStorage.getItem('podcast_studio_users');
        const users: User[] = usersJSON ? JSON.parse(usersJSON) : [];
        const user = users.find(u => u.email === loggedInUserEmail);
        if (user) {
            userStore.set(user);
        }
    }
}

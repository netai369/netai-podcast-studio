import type { Language, SpeakerConfig } from "./types";

export const VOICE_PREVIEW_TEXT: Record<string, string> = {
    en: "Hello, this is a preview of my voice.",
    de: "Hallo, dies ist eine Vorschau meiner Stimme.",
    es: "Hola, esta es una vista previa de mi voz.",
    fr: "Bonjour, ceci est un aperçu de ma voix.",
    it: "Ciao, questa è un'anteprima della mia voce.",
    nl: "Hallo, dit is een voorbeeld van mijn stem.",
    pl: "Cześć, to jest podgląd mojego głosu.",
    ru: "Привет, это предварительный просмотр моего голоса.",
    ja: "こんにちは、これは私の声のプレビューです。",
    zh: "你好，这是我的声音预览。",
    pt: "Olá, esta é uma prévia da minha voz.",
    tr: "Merhaba, bu sesimin bir önizlemesidir.",
};

export const getVoicePreviewText = (lang: string): string => {
    return VOICE_PREVIEW_TEXT[lang] || VOICE_PREVIEW_TEXT['en'];
};

export const CUSTOM_VOICE_ID = 'custom';

export const LANGUAGES: { code: Language, name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'German' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'it', name: 'Italian' },
    { code: 'nl', name: 'Dutch' },
    { code: 'sv', name: 'Swedish' },
    { code: 'ja', name: 'Japanese' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'pl', name: 'Polish' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'hr', name: 'Croatian' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'sk', name: 'Slovak' },
    { code: 'cs', name: 'Czech' },
    { code: 'ro', name: 'Romanian' },
    { code: 'el', name: 'Greek' },
    { code: 'tr', name: 'Turkish' },
];

export const getLanguageName = (code: string): string => {
    const lang = LANGUAGES.find(l => l.code === code);
    return lang ? lang.name : code;
};

export const PODCAST_DURATIONS = [0.5, 1, 3, 5, 10, 15];
export const PODCAST_STYLES = [
    { id: 'solo', title: 'Solo Host' },
    { id: 'conversation', title: 'Conversation' },
];

export const PODCAST_NARRATION_STYLES = [
    { id: 'professional', title: 'Professional (Neutral)', description: 'The most objective and uniform style.' },
    { id: 'educational', title: 'Educational', description: 'Clear, deliberate, and authoritative.' },
    { id: 'conversational', title: 'Conversational', description: 'Friendly, informal, and warm.' },
    { id: 'storytelling', title: 'Storytelling', description: 'Engaging, dynamic, and expressive.' },
    { id: 'documentary', title: 'Documentary Narration', description: 'A relaxed, interested, and informative tone.' },
    { id: 'explainer', title: 'Explainer/Upbeat', description: 'An energized, enthusiastic, and often slightly faster pace.' },
];

// Standard OpenAI voice aliases mapped by backend voice-map.env to bundle-specific native voices
const VOICES_BY_LANGUAGE_FALLBACK: { name: string; gender: 'M' | 'F'; label: string }[] = [
    { name: 'alloy', gender: 'F', label: 'Alloy (Balanced) ♀' },
    { name: 'nova', gender: 'F', label: 'Nova (Warm) ♀' },
    { name: 'shimmer', gender: 'F', label: 'Shimmer (Clear) ♀' },
    { name: 'echo', gender: 'M', label: 'Echo (Deep) ♂' },
    { name: 'fable', gender: 'M', label: 'Fable (Expressive) ♂' },
    { name: 'onyx', gender: 'M', label: 'Onyx (Authoritative) ♂' },
];

export const VOICES_BY_LANGUAGE: Record<string, { name: string; gender: 'M' | 'F'; label: string }[]> = {
    de: [
        { name: 'alloy', gender: 'F', label: 'Alloy (Sandra) ♀' },
        { name: 'nova', gender: 'F', label: 'Nova (Hannah) ♀' },
        { name: 'shimmer', gender: 'F', label: 'Shimmer (Ingrid) ♀' },
        { name: 'ash', gender: 'F', label: 'Ash (Leonie) ♀' },
        { name: 'ballad', gender: 'M', label: 'Ballad (Hokuspokus) ♀' },
        { name: 'echo', gender: 'M', label: 'Echo (Jürgen) ♂' },
        { name: 'fable', gender: 'M', label: 'Fable (Markus) ♂' },
        { name: 'onyx', gender: 'M', label: 'Onyx (Otto) ♂' },
        { name: 'cedar', gender: 'M', label: 'Cedar (Thorsten) ♂' },
        { name: 'sage', gender: 'M', label: 'Sage (Christian) ♂' },
        { name: 'verse', gender: 'M', label: 'Verse (Hokuspokus) ♂' },
    ],
    en: [
        { name: 'alloy', gender: 'F', label: 'Alloy (Alba) ♀' },
        { name: 'nova', gender: 'F', label: 'Nova (Anna) ♀' },
        { name: 'shimmer', gender: 'F', label: 'Shimmer (Cosette) ♀' },
        { name: 'ash', gender: 'F', label: 'Ash (Mary) ♀' },
        { name: 'ballad', gender: 'F', label: 'Ballad (Sarah) ♀' },
        { name: 'echo', gender: 'M', label: 'Echo (Frank) ♂' },
        { name: 'fable', gender: 'M', label: 'Fable (Jean) ♂' },
    ],
    fr: [
        { name: 'alloy', gender: 'F', label: 'Alloy (Estelle) ♀' },
        { name: 'nova', gender: 'F', label: 'Nova (Léa) ♀' },
        { name: 'shimmer', gender: 'F', label: 'Shimmer (Beatris) ♀' },
        { name: 'echo', gender: 'M', label: 'Echo (Orus) ♂' },
        { name: 'fable', gender: 'M', label: 'Fable (Achird) ♂' },
    ],
    it: [
        { name: 'alloy', gender: 'F', label: 'Alloy (Despina) ♀' },
        { name: 'nova', gender: 'F', label: 'Nova (Erinome) ♀' },
        { name: 'echo', gender: 'M', label: 'Echo (Giovanni) ♂' },
        { name: 'fable', gender: 'M', label: 'Fable (Gennaro) ♂' },
    ],
    es: VOICES_BY_LANGUAGE_FALLBACK,
    nl: VOICES_BY_LANGUAGE_FALLBACK,
    sv: VOICES_BY_LANGUAGE_FALLBACK,
    ja: VOICES_BY_LANGUAGE_FALLBACK,
    uk: VOICES_BY_LANGUAGE_FALLBACK,
    pl: VOICES_BY_LANGUAGE_FALLBACK,
    sl: VOICES_BY_LANGUAGE_FALLBACK,
    hr: VOICES_BY_LANGUAGE_FALLBACK,
    hu: VOICES_BY_LANGUAGE_FALLBACK,
    sk: VOICES_BY_LANGUAGE_FALLBACK,
    cs: VOICES_BY_LANGUAGE_FALLBACK,
    ro: VOICES_BY_LANGUAGE_FALLBACK,
    el: VOICES_BY_LANGUAGE_FALLBACK,
    tr: VOICES_BY_LANGUAGE_FALLBACK,
};

// PocketTTS models are language bundles. The backend resolves the bundle from
// `lang` when no (or an unknown) model is sent, but an explicit model wins —
// so a persisted default like de_6l must never be sent for en/fr/it.
export const TTS_MODEL_BY_LANGUAGE: Record<string, string> = {
    de: 'de_6l',
    en: 'en_6l',
    fr: 'fr_24l',
    it: 'it_6l',
};

export const getTtsModelForLanguage = (lang: string | undefined | null): string | undefined => {
    if (!lang) return undefined;
    return TTS_MODEL_BY_LANGUAGE[lang.split(/[-_]/)[0].toLowerCase()];
};

export const DEFAULT_NAMES_BY_LANGUAGE: Record<string, { M: string[], F: string[] }> = {
    en: { M: ['Joe', 'David'], F: ['Jane', 'Sarah'] },
    de: { M: ['Jonas', 'Lukas'], F: ['Julia', 'Lena'] },
    it: { M: ['Giovanni', 'Marco'], F: ['Giulia', 'Sofia'] },
    fr: { M: ['Jean', 'Lucas'], F: ['Jeanne', 'Chloé'] },
    es: { M: ['José', 'David'], F: ['María', 'Sofía'] },
    nl: { M: ['Daan', 'Luuk'], F: ['Emma', 'Tess'] },
    sv: { M: ['Erik', 'Lars'], F: ['Anna', 'Maria'] },
    ja: { M: ['Hiroshi', 'Kenji'], F: ['Yuki', 'Hana'] },
    uk: { M: ['Ivan', 'Oleksandr'], F: ['Olena', 'Nataliya'] },
    pl: { M: ['Jan', 'Piotr'], F: ['Anna', 'Katarzyna'] },
    sl: { M: ['Luka', 'Jakob'], F: ['Ana', 'Eva'] },
    hr: { M: ['Ivan', 'Marko'], F: ['Ana', 'Marija'] },
    hu: { M: ['László', 'István'], F: ['Anna', 'Katalin'] },
    sk: { M: ['Ján', 'Peter'], F: ['Mária', 'Zuzana'] },
    cs: { M: ['Jan', 'Petr'], F: ['Eva', 'Hana'] },
    ro: { M: ['Andrei', 'Ion'], F: ['Maria', 'Elena'] },
    el: { M: ['Giorgos', 'Dimitris'], F: ['Maria', 'Eleni'] },
    tr: { M: ['Mehmet', 'Ali'], F: ['Ayşe', 'Fatma'] },
};

export const getInitialSpeakers = (language: string): SpeakerConfig[] => {
    const langKey = language in VOICES_BY_LANGUAGE ? language : 'en';
    const availableVoices = VOICES_BY_LANGUAGE[langKey];
    const names = DEFAULT_NAMES_BY_LANGUAGE[langKey];

    const speaker1Voice = availableVoices.find(v => v.gender === 'F') || availableVoices[0];
    const speaker2Voice = availableVoices.find(v => v.gender === 'M') || availableVoices[availableVoices.length - 1];

    return [
        { name: names.F[0], voice: speaker1Voice.name },
        { name: names.M[0], voice: speaker2Voice.name },
    ];
};

export const SUPERTONIC_VOICES: Record<string, { id: string; name: string; gender: 'M' | 'F'; label: string }> = {
    alloy: { id: 'alloy', name: 'alloy', gender: 'F', label: 'Alloy (F1) - Calm female' },
    nova: { id: 'nova', name: 'nova', gender: 'F', label: 'Nova (F2) - Professional female' },
    shimmer: { id: 'shimmer', name: 'shimmer', gender: 'F', label: 'Shimmer (F3) - Expressive female' },
    ash: { id: 'ash', name: 'ash', gender: 'F', label: 'Ash (F4) - Energetic female' },
    coral: { id: 'coral', name: 'coral', gender: 'F', label: 'Coral (F5) - Warm female' },
    echo: { id: 'echo', name: 'echo', gender: 'M', label: 'Echo (M1) - Lively male' },
    fable: { id: 'fable', name: 'fable', gender: 'M', label: 'Fable (M2) - Narrative male' },
    onyx: { id: 'onyx', name: 'onyx', gender: 'M', label: 'Onyx (M3) - Deep male' },
    cedar: { id: 'cedar', name: 'cedar', gender: 'M', label: 'Cedar (M4) - Resonant male' },
    verse: { id: 'verse', name: 'verse', gender: 'M', label: 'Verse (M5) - Dramatic male' },
};

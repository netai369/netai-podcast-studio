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

export const VOICES_BY_LANGUAGE: Record<string, { name: string; gender: 'M' | 'F'; label: string }[]> = {
    en: [
        { name: 'Puck', gender: 'M', label: 'Puck (Male)' },
        { name: 'Fenrir', gender: 'M', label: 'Fenrir (Male)' },
        { name: 'Charon', gender: 'M', label: 'Charon (Male)' },
        { name: 'Zephyr', gender: 'F', label: 'Zephyr (Female)' },
        { name: 'Kore', gender: 'F', label: 'Kore (Female)' },
    ],
    de: [ { name: 'Puck', gender: 'M', label: 'Puck (Männlich)' }, { name: 'Kore', gender: 'F', label: 'Kore (Weiblich)' } ],
    it: [ { name: 'Fenrir', gender: 'M', label: 'Fenrir (Maschio)' }, { name: 'Zephyr', gender: 'F', label: 'Zephyr (Femmina)' } ],
    fr: [ { name: 'Fenrir', gender: 'M', label: 'Fenrir (Homme)' }, { name: 'Zephyr', gender: 'F', label: 'Zephyr (Femme)' } ],
    es: [ { name: 'Charon', gender: 'M', label: 'Charon (Masculino)' }, { name: 'Kore', gender: 'F', label: 'Kore (Femenino)' } ],
    nl: [ { name: 'Puck', gender: 'M', label: 'Puck (Mannelijk)' }, { name: 'Kore', gender: 'F', label: 'Kore (Vrouwelijk)' } ],
    sv: [ { name: 'Puck', gender: 'M', label: 'Puck (Manlig)' }, { name: 'Kore', gender: 'F', label: 'Kore (Kvinnlig)' } ],
    ja: [ { name: 'Puck', gender: 'M', label: 'Puck (男性)' }, { name: 'Kore', gender: 'F', label: 'Kore (女性)' } ],
    uk: [ { name: 'Puck', gender: 'M', label: 'Puck (Чоловічий)' }, { name: 'Kore', gender: 'F', label: 'Kore (Жіночий)' } ],
    pl: [ { name: 'Puck', gender: 'M', label: 'Puck (Męski)' }, { name: 'Kore', gender: 'F', label: 'Kore (Żeński)' } ],
    sl: [ { name: 'Puck', gender: 'M', label: 'Puck (Moški)' }, { name: 'Kore', gender: 'F', label: 'Kore (Ženski)' } ],
    hr: [ { name: 'Puck', gender: 'M', label: 'Puck (Muški)' }, { name: 'Kore', gender: 'F', label: 'Kore (Ženski)' } ],
    hu: [ { name: 'Puck', gender: 'M', label: 'Puck (Férfi)' }, { name: 'Kore', gender: 'F', label: 'Kore (Női)' } ],
    sk: [ { name: 'Puck', gender: 'M', label: 'Puck (Mužský)' }, { name: 'Kore', gender: 'F', label: 'Kore (Ženský)' } ],
    cs: [ { name: 'Puck', gender: 'M', label: 'Puck (Mužský)' }, { name: 'Kore', gender: 'F', label: 'Kore (Ženský)' } ],
    ro: [ { name: 'Puck', gender: 'M', label: 'Puck (Masculin)' }, { name: 'Kore', gender: 'F', label: 'Kore (Feminin)' } ],
    el: [ { name: 'Puck', gender: 'M', label: 'Puck (Αρσενικό)' }, { name: 'Kore', gender: 'F', label: 'Kore (Θηλυκό)' } ],
    tr: [ { name: 'Puck', gender: 'M', label: 'Puck (Erkek)' }, { name: 'Kore', gender: 'F', label: 'Kore (Kadın)' } ],
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

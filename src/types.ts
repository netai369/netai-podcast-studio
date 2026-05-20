// Authentication and User
export type AuthView = 'login' | 'register' | 'forgotPassword';

export interface User {
    username: string;
    email: string;
    password?: string;
}

// Document structure
export interface Document {
    id: string;
    name: string;
    content: string;
}

// Language and Internationalization
export type Language = 'en' | 'de' | 'es' | 'fr' | 'it' | 'nl' | 'sv' | 'ja' | 'uk' | 'pl' | 'sl' | 'hr' | 'hu' | 'sk' | 'cs' | 'ro' | 'el' | 'tr';

export type LogLevel = 'ERROR' | 'INFO' | 'DEBUG';

// Podcast Creation and Structure
export type PodcastDuration = number;
export type PodcastStyle = 'solo' | 'conversation';
export type PodcastNarrationStyle = 'professional' | 'educational' | 'conversational' | 'storytelling' | 'documentary' | 'explainer';

export interface SpeakerConfig {
    name: string;
    voice: string;
    customVoice?: string;
}

export interface Podcast {
    id: string;
    title: string;
    description: string;
    script: string;
    audioUrl: string;
    createdAt: Date;
    topic: string;
    duration: number;
    style: PodcastStyle;
    narrationStyle: PodcastNarrationStyle;
    speakers: SpeakerConfig[];
    language: Language;
}

// Backend Configuration
export type LlmProvider = 'gemini' | 'openai' | 'cerebras' | 'claude' | 'mistral' | 'xai' | 'openrouter';
export type TtsProvider = 'gemini' | 'openaudio-s1' | 'openai' | 'edge-tts' | 'supertonic';

export interface BackendConfig {
    llm: {
        provider: LlmProvider;
        openAiUrl?: string;
        openAiKey?: string;
        model?: string;
    };
    tts: {
        provider: TtsProvider;
        openAudioUrl?: string;
        language?: Language;
        model?: string;
    };
    debug: {
        logLevel: LogLevel;
    };
}

export interface AvailableModels {
    id: string;
    object: string;
    created: number;
    owned_by: string;
}

// Configuration utility functions
import { VITE_LLM_PROVIDER, VITE_LLM_URL, VITE_LLM_KEY, VITE_TTS_PROVIDER, VITE_TTS_URL, VITE_API_KEY } from '@/config';
import type { BackendConfig, LlmProvider, TtsProvider } from '@/types';

export const getDefaultBackendConfig = (): BackendConfig => {
    return {
        llm: {
            provider: (VITE_LLM_PROVIDER as LlmProvider) || 'gemini',
            openAiUrl: VITE_LLM_URL || undefined,
            openAiKey: VITE_LLM_KEY || undefined,
            model: undefined
        },
        tts: {
            provider: (VITE_TTS_PROVIDER as TtsProvider) || 'gemini',
            openAudioUrl: VITE_TTS_URL || undefined,
            language: 'en',
            model: undefined
        },
        debug: {
            logLevel: 'INFO'
        }
    };
};

export const validateBackendConfig = (config: BackendConfig): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Validate LLM configuration
    if (!config.llm) {
        errors.push('LLM configuration is missing');
    } else {
        const validProviders: LlmProvider[] = ['gemini', 'openai', 'cerebras', 'claude', 'mistral', 'xai', 'openrouter'];
        if (!validProviders.includes(config.llm.provider)) {
            errors.push(`Invalid LLM provider: ${config.llm.provider}`);
        }
        
        // If using OpenAI-compatible provider, URL is required
        const openaiCompatibleProviders: LlmProvider[] = ['openai', 'cerebras', 'mistral', 'xai', 'openrouter'];
        if (openaiCompatibleProviders.includes(config.llm.provider) && !config.llm.openAiUrl) {
            errors.push(`OpenAI URL is required for provider: ${config.llm.provider}`);
        }
        
        // If using OpenAI-compatible provider (except Claude), key might be required
        if (openaiCompatibleProviders.includes(config.llm.provider) && !config.llm.openAiKey) {
            errors.push(`OpenAI key is required for provider: ${config.llm.provider}`);
        }
    }
    
    // Validate TTS configuration
    if (!config.tts) {
        errors.push('TTS configuration is missing');
    } else {
        const validProviders: TtsProvider[] = ['gemini', 'openaudio-s1', 'openai', 'edge-tts', 'supertonic'];
        if (!validProviders.includes(config.tts.provider)) {
            errors.push(`Invalid TTS provider: ${config.tts.provider}`);
        }
        
        // If using custom TTS providers, URL is required
        const customTtsProviders: TtsProvider[] = ['openaudio-s1', 'openai', 'supertonic'];
        if (customTtsProviders.includes(config.tts.provider) && !config.tts.openAudioUrl) {
            errors.push(`TTS URL is required for provider: ${config.tts.provider}`);
        }
    }
    
    // Validate debug configuration
    if (!config.debug) {
        errors.push('Debug configuration is missing');
    } else {
        const validLogLevels: ('ERROR' | 'INFO' | 'DEBUG')[] = ['ERROR', 'INFO', 'DEBUG'];
        if (!validLogLevels.includes(config.debug.logLevel)) {
            errors.push(`Invalid log level: ${config.debug.logLevel}`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
};

export const getEnvironmentConfig = (): Record<string, string> => {
    return {
        VITE_API_KEY,
        VITE_LLM_PROVIDER,
        VITE_LLM_URL,
        VITE_LLM_KEY,
        VITE_TTS_PROVIDER,
        VITE_TTS_URL,
        MODE: typeof window !== 'undefined' && window.importMetaEnv ? window.importMetaEnv.MODE || 'development' : 'development',
        DEV: typeof window !== 'undefined' && window.importMetaEnv && window.importMetaEnv.DEV ? 'true' : 'false',
        PROD: typeof window !== 'undefined' && window.importMetaEnv && window.importMetaEnv.PROD ? 'true' : 'false'
    };
};
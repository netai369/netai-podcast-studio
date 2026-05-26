import { describe, it, expect } from '@jest/globals';
import { getDefaultBackendConfig, validateBackendConfig } from './config';
import type { BackendConfig } from '@/types';

describe('config utility', () => {
  describe('getDefaultBackendConfig', () => {
    it('should return a valid default configuration', () => {
      const config = getDefaultBackendConfig();
      
      expect(config).toHaveProperty('llm');
      expect(config).toHaveProperty('tts');
      expect(config).toHaveProperty('debug');
      
      expect(config.llm).toHaveProperty('provider');
      expect(config.llm).toHaveProperty('openAiUrl');
      expect(config.llm).toHaveProperty('openAiKey');
      expect(config.llm).toHaveProperty('model');
      
      expect(config.tts).toHaveProperty('provider');
      expect(config.tts).toHaveProperty('openAudioUrl');
      expect(config.tts).toHaveProperty('language');
      expect(config.tts).toHaveProperty('model');
      
      expect(config.debug).toHaveProperty('logLevel');
    });
  });
  
  describe('validateBackendConfig', () => {
    it('should validate a complete configuration', () => {
      const config: BackendConfig = {
        llm: {
          provider: 'gemini',
          openAiUrl: undefined,
          openAiKey: undefined,
          model: 'gemini-2.0-flash-exp'
        },
        tts: {
          provider: 'gemini',
          openAudioUrl: undefined,
          language: 'en',
          model: undefined
        },
        debug: {
          logLevel: 'INFO'
        }
      };
      
      const result = validateBackendConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
    
    it('should detect missing LLM configuration', () => {
      const config: BackendConfig = {
        llm: undefined as any,
        tts: {
          provider: 'gemini',
          openAudioUrl: undefined,
          language: 'en',
          model: undefined
        },
        debug: {
          logLevel: 'INFO'
        }
      };
      
      const result = validateBackendConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('LLM configuration is missing');
    });
    
    it('should detect invalid LLM provider', () => {
      const config: BackendConfig = {
        llm: {
          provider: 'invalid-provider' as any,
          openAiUrl: undefined,
          openAiKey: undefined,
          model: undefined
        },
        tts: {
          provider: 'gemini',
          openAudioUrl: undefined,
          language: 'en',
          model: undefined
        },
        debug: {
          logLevel: 'INFO'
        }
      };
      
      const result = validateBackendConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid LLM provider: invalid-provider');
    });
    
    it('should detect missing OpenAI URL for OpenAI provider', () => {
      const config: BackendConfig = {
        llm: {
          provider: 'openai',
          openAiUrl: undefined,
          openAiKey: 'test-key',
          model: 'gpt-4o'
        },
        tts: {
          provider: 'gemini',
          openAudioUrl: undefined,
          language: 'en',
          model: undefined
        },
        debug: {
          logLevel: 'INFO'
        }
      };
      
      const result = validateBackendConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('OpenAI URL is required for provider: openai');
    });
    
    it('should detect missing TTS configuration', () => {
      const config: BackendConfig = {
        llm: {
          provider: 'gemini',
          openAiUrl: undefined,
          openAiKey: undefined,
          model: undefined
        },
        tts: undefined as any,
        debug: {
          logLevel: 'INFO'
        }
      };
      
      const result = validateBackendConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('TTS configuration is missing');
    });
    
    it('should detect invalid TTS provider', () => {
      const config: BackendConfig = {
        llm: {
          provider: 'gemini',
          openAiUrl: undefined,
          openAiKey: undefined,
          model: undefined
        },
        tts: {
          provider: 'invalid-provider' as any,
          openAudioUrl: undefined,
          language: 'en',
          model: undefined
        },
        debug: {
          logLevel: 'INFO'
        }
      };
      
      const result = validateBackendConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid TTS provider: invalid-provider');
    });
    
    it('should detect missing TTS URL for custom providers', () => {
      const config: BackendConfig = {
        llm: {
          provider: 'gemini',
          openAiUrl: undefined,
          openAiKey: undefined,
          model: undefined
        },
        tts: {
          provider: 'openai',
          openAudioUrl: undefined,
          language: 'en',
          model: 'tts-1'
        },
        debug: {
          logLevel: 'INFO'
        }
      };
      
      const result = validateBackendConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('TTS URL is required for provider: openai');
    });
    
    it('should detect missing debug configuration', () => {
      const config: BackendConfig = {
        llm: {
          provider: 'gemini',
          openAiUrl: undefined,
          openAiKey: undefined,
          model: undefined
        },
        tts: {
          provider: 'gemini',
          openAudioUrl: undefined,
          language: 'en',
          model: undefined
        },
        debug: undefined as any
      };
      
      const result = validateBackendConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Debug configuration is missing');
    });
    
    it('should detect invalid log level', () => {
      const config: BackendConfig = {
        llm: {
          provider: 'gemini',
          openAiUrl: undefined,
          openAiKey: undefined,
          model: undefined
        },
        tts: {
          provider: 'gemini',
          openAudioUrl: undefined,
          language: 'en',
          model: undefined
        },
        debug: {
          logLevel: 'INVALID' as any
        }
      };
      
      const result = validateBackendConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid log level: INVALID');
    });
    
    it('should validate a complete OpenAI configuration', () => {
      const config: BackendConfig = {
        llm: {
          provider: 'openai',
          openAiUrl: 'http://localhost:8080/v1/chat/completions',
          openAiKey: 'test-key',
          model: 'gpt-4o'
        },
        tts: {
          provider: 'openai',
          openAudioUrl: 'http://localhost:8080/v1/audio/speech',
          language: 'en',
          model: 'tts-1'
        },
        debug: {
          logLevel: 'DEBUG'
        }
      };
      
      const result = validateBackendConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});
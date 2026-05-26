import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { fetchAvailableModels } from '@/services/ttsServices';
import type { BackendConfig } from '@/types';

describe('LLM Endpoint Tests', () => {
  const mockFetch = global.fetch as jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('OpenAI Compatible Endpoints', () => {
    it('should handle successful model fetching', async () => {
      const mockModelsResponse = {
        data: [
          {
            id: 'gpt-4o',
            object: 'model',
            created: 1711111111,
            owned_by: 'openai'
          },
          {
            id: 'gpt-3.5-turbo',
            object: 'model',
            created: 1688888888,
            owned_by: 'openai'
          }
        ]
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockModelsResponse)
      });
      
      const config: BackendConfig = {
        llm: {
          provider: 'openai',
          openAiUrl: 'http://localhost:8080/v1/chat/completions',
          openAiKey: 'test-key'
        },
        tts: { provider: 'gemini' },
        debug: { logLevel: 'INFO' }
      };
      
      const models = await fetchAvailableModels(config);
      
      expect(models.length).toBe(2);
      expect(models[0].id).toBe('gpt-4o');
      expect(models[1].id).toBe('gpt-3.5-turbo');
      
      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[0]).toContain('/v1/models');
      expect(fetchCall[1].headers.Authorization).toBe('Bearer test-key');
    });
    
    it('should handle model fetching with different endpoint formats', async () => {
      const mockModelsResponse = {
        data: [
          {
            id: 'mistral-small',
            object: 'model',
            created: 1711111111,
            owned_by: 'mistral'
          }
        ]
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockModelsResponse)
      });
      
      const config: BackendConfig = {
        llm: {
          provider: 'mistral',
          openAiUrl: 'http://localhost:8080/v1/openai/models',
          openAiKey: 'test-key'
        },
        tts: { provider: 'gemini' },
        debug: { logLevel: 'INFO' }
      };
      
      const models = await fetchAvailableModels(config);
      
      expect(models.length).toBe(1);
      expect(models[0].id).toBe('mistral-small');
    });
    
    it('should handle failed model fetching with 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      const config: BackendConfig = {
        llm: {
          provider: 'openai',
          openAiUrl: 'http://localhost:8080/v1/chat/completions',
          openAiKey: 'test-key'
        },
        tts: { provider: 'gemini' },
        debug: { logLevel: 'INFO' }
      };
      
      const models = await fetchAvailableModels(config);
      expect(models).toEqual([]);
    });
    
    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({
          error: {
            message: 'Invalid API key'
          }
        })
      });
      
      const config: BackendConfig = {
        llm: {
          provider: 'openai',
          openAiUrl: 'http://localhost:8080/v1/chat/completions',
          openAiKey: 'invalid-key'
        },
        tts: { provider: 'gemini' },
        debug: { logLevel: 'INFO' }
      };
      
      await expect(fetchAvailableModels(config)).rejects.toThrow('Failed to fetch models: Invalid API key');
    });
    
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      
      const config: BackendConfig = {
        llm: {
          provider: 'openai',
          openAiUrl: 'http://localhost:8080/v1/chat/completions',
          openAiKey: 'test-key'
        },
        tts: { provider: 'gemini' },
        debug: { logLevel: 'INFO' }
      };
      
      await expect(fetchAvailableModels(config)).rejects.toThrow('A network error occurred, which is often due to a CORS issue.');
    });
  });
  
  describe('Gemini Provider', () => {
    it('should return hardcoded Gemini models', async () => {
      const config: BackendConfig = {
        llm: { provider: 'gemini' },
        tts: { provider: 'gemini' },
        debug: { logLevel: 'INFO' }
      };
      
      const models = await fetchAvailableModels(config);
      
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('id');
      expect(models[0].id).toContain('gemini');
    });
  });
  
  describe('Claude Provider', () => {
    it('should return empty array for Claude provider', async () => {
      const config: BackendConfig = {
        llm: {
          provider: 'claude',
          openAiUrl: 'https://api.anthropic.com',
          openAiKey: 'test-key'
        },
        tts: { provider: 'gemini' },
        debug: { logLevel: 'INFO' }
      };
      
      const models = await fetchAvailableModels(config);
      expect(models).toEqual([]);
    });
  });
  
  describe('Configuration Validation', () => {
    it('should handle missing OpenAI URL', async () => {
      const config: BackendConfig = {
        llm: {
          provider: 'openai',
          openAiUrl: undefined,
          openAiKey: 'test-key'
        },
        tts: { provider: 'gemini' },
        debug: { logLevel: 'INFO' }
      };
      
      const models = await fetchAvailableModels(config);
      expect(models).toEqual([]);
    });
    
    it('should handle invalid provider', async () => {
      const config: BackendConfig = {
        llm: {
          provider: 'invalid-provider' as any,
          openAiUrl: 'http://localhost:8080',
          openAiKey: 'test-key'
        },
        tts: { provider: 'gemini' },
        debug: { logLevel: 'INFO' }
      };
      
      const models = await fetchAvailableModels(config);
      expect(models).toEqual([]);
    });
  });
});
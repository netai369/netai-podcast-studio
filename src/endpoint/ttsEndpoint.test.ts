import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { fetchAvailableVoices } from '@/services/ttsServices';
import type { BackendConfig } from '@/types';

describe('TTS Endpoint Tests', () => {
  const mockFetch = global.fetch as jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('OpenAI TTS Endpoint', () => {
    it('should fetch available voices successfully', async () => {
      const mockVoicesResponse = {
        voices: [
          {
            id: 'alloy',
            name: 'Alloy',
            gender: 'F',
            label: 'Alloy - Female voice'
          },
          {
            id: 'echo',
            name: 'Echo',
            gender: 'M',
            label: 'Echo - Male voice'
          }
        ]
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockVoicesResponse)
      });
      
      const config: BackendConfig = {
        llm: { provider: 'gemini' },
        tts: {
          provider: 'openai',
          openAudioUrl: 'http://localhost:8080/v1/audio/speech'
        },
        debug: { logLevel: 'INFO' }
      };
      
      const voices = await fetchAvailableVoices(config);
      
      expect(voices.length).toBe(2);
      expect(voices[0].id).toBe('alloy');
      expect(voices[1].id).toBe('echo');
      
      // Verify fetch was called with correct URL
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[0]).toContain('/audio/voices');
    });
    
    it('should handle alternative voices endpoint', async () => {
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            voices: [
              {
                id: 'alloy',
                name: 'Alloy',
                gender: 'F',
                label: 'Alloy'
              }
            ]
          })
        });
      
      const config: BackendConfig = {
        llm: { provider: 'gemini' },
        tts: {
          provider: 'openai',
          openAudioUrl: 'http://localhost:8080/v1/audio/speech'
        },
        debug: { logLevel: 'INFO' }
      };
      
      const voices = await fetchAvailableVoices(config);
      expect(voices.length).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
    
    it('should handle failed voice fetching', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      const config: BackendConfig = {
        llm: { provider: 'gemini' },
        tts: {
          provider: 'openai',
          openAudioUrl: 'http://localhost:8080/v1/audio/speech'
        },
        debug: { logLevel: 'INFO' }
      };
      
      await expect(fetchAvailableVoices(config)).rejects.toThrow('Failed to fetch voices: 500 Internal Server Error');
    });
    
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));
      
      const config: BackendConfig = {
        llm: { provider: 'gemini' },
        tts: {
          provider: 'openai',
          openAudioUrl: 'http://localhost:8080/v1/audio/speech'
        },
        debug: { logLevel: 'INFO' }
      };
      
      await expect(fetchAvailableVoices(config)).rejects.toThrow('A network error occurred, which is often due to a CORS issue.');
    });
  });
  
  describe('Edge TTS Provider', () => {
    it('should return fallback voices when listVoices fails', async () => {
      // Mock the edge-tts-universal module
      jest.mock('edge-tts-universal/browser', () => ({
        listVoices: jest.fn().mockRejectedValue(new Error('EdgeTTS not available'))
      }));
      
      const config: BackendConfig = {
        llm: { provider: 'gemini' },
        tts: { provider: 'edge-tts' },
        debug: { logLevel: 'INFO' }
      };
      
      const voices = await fetchAvailableVoices(config);
      
      expect(voices.length).toBeGreaterThan(0);
      expect(voices[0]).toHaveProperty('id');
      expect(voices[0]).toHaveProperty('name');
      // Should return fallback voices
      expect(voices.some(v => v.id === 'en-US-EmmaMultilingualNeural')).toBe(true);
    });
  });
  
  describe('Unsupported Providers', () => {
    it('should return empty array for unsupported providers', async () => {
      const config: BackendConfig = {
        llm: { provider: 'gemini' },
        tts: { provider: 'openaudio-s1' },
        debug: { logLevel: 'INFO' }
      };
      
      const voices = await fetchAvailableVoices(config);
      expect(voices).toEqual([]);
    });
  });
  
  describe('Configuration Validation', () => {
    it('should handle missing TTS URL for OpenAI provider', async () => {
      const config: BackendConfig = {
        llm: { provider: 'gemini' },
        tts: {
          provider: 'openai',
          openAudioUrl: undefined
        },
        debug: { logLevel: 'INFO' }
      };
      
      const voices = await fetchAvailableVoices(config);
      expect(voices).toEqual([]);
    });
  });
});
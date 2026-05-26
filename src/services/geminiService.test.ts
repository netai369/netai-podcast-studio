import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { BackendConfig, Document, SpeakerConfig } from '@/types';

import { generatePodcastScriptStream, generatePodcastMetadata, fetchAvailableModels, generatePodcastAudio, generateVoicePreviewAudio, fetchAvailableVoices } from './geminiService';

describe('geminiService', () => {
  describe('generatePodcastScriptStream', () => {
    const mockDocuments: Document[] = [
      { id: '1', name: 'Test Doc', content: 'Test content' }
    ];
    const mockSpeakers: SpeakerConfig[] = [
      { name: 'Host', voice: 'Puck' }
    ];
    
    const baseConfig: BackendConfig = {
      llm: { provider: 'gemini' },
      tts: { provider: 'gemini' },
      debug: { logLevel: 'INFO' }
    };
    
    beforeEach(() => {
      jest.clearAllMocks();
    });
    
    it('should throw error for empty documents', async () => {
      await expect(
        generatePodcastScriptStream([], 'Test Topic', 10, 'solo', mockSpeakers, 'en', 'professional', baseConfig).next()
      ).rejects.toThrow('Documents array cannot be empty');
    });
    
    it('should throw error for empty topic', async () => {
      await expect(
        generatePodcastScriptStream(mockDocuments, '', 10, 'solo', mockSpeakers, 'en', 'professional', baseConfig).next()
      ).rejects.toThrow('Topic cannot be empty');
    });
    
    it('should throw error for invalid duration', async () => {
      await expect(
        generatePodcastScriptStream(mockDocuments, 'Test Topic', 0, 'solo', mockSpeakers, 'en', 'professional', baseConfig).next()
      ).rejects.toThrow('Duration must be a positive number');
    });
    
    it('should throw error for empty speakers', async () => {
      await expect(
        generatePodcastScriptStream(mockDocuments, 'Test Topic', 10, 'solo', [], 'en', 'professional', baseConfig).next()
      ).rejects.toThrow('At least one speaker must be configured');
    });
    
    it('should throw error for invalid language', async () => {
      await expect(
        generatePodcastScriptStream(mockDocuments, 'Test Topic', 10, 'solo', mockSpeakers, 'xx', 'professional', baseConfig).next()
      ).rejects.toThrow('Invalid language code');
    });
    
    it('should throw error for missing configuration', async () => {
      await expect(
        generatePodcastScriptStream(mockDocuments, 'Test Topic', 10, 'solo', mockSpeakers, 'en', 'professional', {} as BackendConfig).next()
      ).rejects.toThrow('Backend configuration is required');
    });
  });
  
  describe('generatePodcastMetadata', () => {
    const baseConfig: BackendConfig = {
      llm: { provider: 'gemini' },
      tts: { provider: 'gemini' },
      debug: { logLevel: 'INFO' }
    };
    
    it('should throw error for empty script', async () => {
      await expect(
        generatePodcastMetadata('', baseConfig)
      ).rejects.toThrow('Script cannot be empty');
    });
    
    it('should throw error for missing configuration', async () => {
      await expect(
        generatePodcastMetadata('Test script', {} as BackendConfig)
      ).rejects.toThrow('Backend configuration is required');
    });
    
    it('should return metadata for valid input with Gemini', async () => {
      const result = await generatePodcastMetadata('Test script', baseConfig);
      expect(result).toEqual({
        title: 'Test Podcast',
        description: 'Test description'
      });
    });
  });
  
  describe('fetchAvailableModels', () => {
    const baseConfig: BackendConfig = {
      llm: { provider: 'gemini' },
      tts: { provider: 'gemini' },
      debug: { logLevel: 'INFO' }
    };
    
    it('should return Gemini models for Gemini provider', async () => {
      const result = await fetchAvailableModels(baseConfig);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('object');
    });
  });
  
  describe('generatePodcastAudio', () => {
    const mockSpeakers: SpeakerConfig[] = [
      { name: 'Host', voice: 'Puck' }
    ];
    
    const baseConfig: BackendConfig = {
      llm: { provider: 'gemini' },
      tts: { provider: 'gemini' },
      debug: { logLevel: 'INFO' }
    };
    
    const mockOnProgress = jest.fn();
    
    beforeEach(() => {
      jest.clearAllMocks();
    });
    
    it('should throw error for empty script', async () => {
      await expect(
        generatePodcastAudio('', 'solo', mockSpeakers, 'professional', baseConfig, mockOnProgress)
      ).rejects.toThrow('Script cannot be empty');
    });
    
    it('should throw error for empty speakers', async () => {
      await expect(
        generatePodcastAudio('Test script', 'solo', [], 'professional', baseConfig, mockOnProgress)
      ).rejects.toThrow('At least one speaker must be configured');
    });
    
    it('should throw error for missing TTS configuration', async () => {
      await expect(
        generatePodcastAudio('Test script', 'solo', mockSpeakers, 'professional', {} as BackendConfig, mockOnProgress)
      ).rejects.toThrow('TTS configuration is required');
    });
  });
  
  describe('generateVoicePreviewAudio', () => {
    const baseConfig: BackendConfig = {
      llm: { provider: 'gemini' },
      tts: { provider: 'gemini' },
      debug: { logLevel: 'INFO' }
    };
    
    it('should throw error for missing voice with Gemini', async () => {
      await expect(
        generateVoicePreviewAudio('', baseConfig)
      ).rejects.toThrow('Voice name required.');
    });
    
    it('should throw error for unsupported provider', async () => {
      const config: BackendConfig = {
        llm: { provider: 'gemini' },
        tts: { provider: 'openaudio-s1' },
        debug: { logLevel: 'INFO' }
      };
      
      await expect(
        generateVoicePreviewAudio('Puck', config)
      ).rejects.toThrow('Voice previews are only supported for Gemini, OpenAI and Edge TTS providers.');
    });
  });
  
  describe('fetchAvailableVoices', () => {
    const baseConfig: BackendConfig = {
      llm: { provider: 'gemini' },
      tts: { provider: 'gemini' },
      debug: { logLevel: 'INFO' }
    };
    
    it('should return empty array for unsupported provider', async () => {
      const config: BackendConfig = {
        llm: { provider: 'gemini' },
        tts: { provider: 'openaudio-s1' },
        debug: { logLevel: 'INFO' }
      };
      
      const result = await fetchAvailableVoices(config);
      expect(result).toEqual([]);
    });
  });
});
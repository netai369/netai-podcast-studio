import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { generatePodcastScriptStream, generatePodcastMetadata, generatePodcastAudio } from '@/services/ttsServices';
import type { BackendConfig, Document, SpeakerConfig } from '@/types';
import { getDefaultBackendConfig, validateBackendConfig } from '@/utils/config';

// Mock the Google GenAI and fetch
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContentStream: jest.fn().mockImplementation(function* () {
        yield { text: 'This is a test script. ' };
        yield { text: 'It demonstrates the podcast workflow. ' };
        yield { text: 'The script should be generated successfully.' };
      }),
      generateContent: jest.fn().mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              text: '{"title": "Test Integration Podcast", "description": "A test podcast created through integration testing"}'
            }]
          }
        }]
      })
    }
  }))
}));

global.fetch = jest.fn();

describe('Podcast Workflow Integration', () => {
  const mockDocuments: Document[] = [
    { id: '1', name: 'Test Document', content: 'This is test content for integration testing.' }
  ];
  
  const mockSpeakers: SpeakerConfig[] = [
    { name: 'Host', voice: 'Puck' }
  ];
  
  let config: BackendConfig;
  
  beforeEach(() => {
    jest.clearAllMocks();
    config = getDefaultBackendConfig();
  });
  
  describe('Configuration Validation', () => {
    it('should create a valid default configuration', () => {
      const validation = validateBackendConfig(config);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
  });
  
  describe('Script Generation Workflow', () => {
    it('should generate a podcast script successfully', async () => {
      const scriptChunks: string[] = [];
      
      for await (const chunk of generatePodcastScriptStream(
        mockDocuments, 
        'Integration Testing', 
        5, 
        'solo', 
        mockSpeakers, 
        'en', 
        'professional', 
        config
      )) {
        scriptChunks.push(chunk);
      }
      
      const fullScript = scriptChunks.join('');
      expect(fullScript).toBe('This is a test script. It demonstrates the podcast workflow. The script should be generated successfully.');
      expect(fullScript.length).toBeGreaterThan(0);
    });
    
    it('should handle script generation errors gracefully', async () => {
      // Mock an error in the Google GenAI
      jest.mock('@google/genai', () => ({
        GoogleGenAI: jest.fn().mockImplementation(() => ({
          models: {
            generateContentStream: jest.fn().mockImplementation(() => {
              throw new Error('Mocked generation error');
            })
          }
        }))
      }));
      
      await expect(
        generatePodcastScriptStream(
          mockDocuments, 
          'Integration Testing', 
          5, 
          'solo', 
          mockSpeakers, 
          'en', 
          'professional', 
          config
        ).next()
      ).rejects.toThrow('Gemini script generation failed: Mocked generation error');
    });
  });
  
  describe('Metadata Generation Workflow', () => {
    it('should generate podcast metadata successfully', async () => {
      const testScript = 'This is a test script for metadata generation. It should produce valid metadata.';
      
      const metadata = await generatePodcastMetadata(testScript, config);
      
      expect(metadata).toHaveProperty('title');
      expect(metadata).toHaveProperty('description');
      expect(metadata.title).toBe('Test Integration Podcast');
      expect(metadata.description).toBe('A test podcast created through integration testing');
    });
    
    it('should handle metadata generation errors gracefully', async () => {
      // Mock an error in metadata generation
      jest.mock('@google/genai', () => ({
        GoogleGenAI: jest.fn().mockImplementation(() => ({
          models: {
            generateContent: jest.fn().mockRejectedValue(new Error('Mocked metadata error'))
          }
        }))
      }));
      
      await expect(
        generatePodcastMetadata('Test script', config)
      ).rejects.toThrow('Gemini metadata generation failed: Mocked metadata error');
    });
  });
  
  describe('Complete Podcast Creation Workflow', () => {
    it('should create a complete podcast from documents to audio', async () => {
      // Mock the audio generation to return a valid audio URL
      const originalGenerateAudio = generatePodcastAudio;
      (generatePodcastAudio as any) = jest.fn().mockResolvedValue('mock-audio-url');
      
      try {
        // Step 1: Generate script
        const scriptChunks: string[] = [];
        for await (const chunk of generatePodcastScriptStream(
          mockDocuments, 
          'Complete Workflow Test', 
          10, 
          'solo', 
          mockSpeakers, 
          'en', 
          'professional', 
          config
        )) {
          scriptChunks.push(chunk);
        }
        
        const fullScript = scriptChunks.join('');
        expect(fullScript.length).toBeGreaterThan(0);
        
        // Step 2: Generate metadata
        const metadata = await generatePodcastMetadata(fullScript, config);
        expect(metadata.title).toBeTruthy();
        expect(metadata.description).toBeTruthy();
        
        // Step 3: Generate audio
        const mockOnProgress = jest.fn();
        const audioUrl = await generatePodcastAudio(
          fullScript, 
          'solo', 
          mockSpeakers, 
          'professional', 
          config, 
          mockOnProgress
        );
        
        expect(audioUrl).toBe('mock-audio-url');
        expect(mockOnProgress).toHaveBeenCalled();
        
      } finally {
        // Restore original function
        (generatePodcastAudio as any) = originalGenerateAudio;
      }
    });
  });
  
  describe('Error Handling in Workflow', () => {
    it('should handle invalid input gracefully', async () => {
      // Test with empty documents
      await expect(
        generatePodcastScriptStream(
          [], 
          'Test', 
          10, 
          'solo', 
          mockSpeakers, 
          'en', 
          'professional', 
          config
        ).next()
      ).rejects.toThrow('Documents array cannot be empty');
      
      // Test with empty topic
      await expect(
        generatePodcastScriptStream(
          mockDocuments, 
          '', 
          10, 
          'solo', 
          mockSpeakers, 
          'en', 
          'professional', 
          config
        ).next()
      ).rejects.toThrow('Topic cannot be empty');
      
      // Test with empty speakers
      await expect(
        generatePodcastScriptStream(
          mockDocuments, 
          'Test', 
          10, 
          'solo', 
          [], 
          'en', 
          'professional', 
          config
        ).next()
      ).rejects.toThrow('At least one speaker must be configured');
    });
    
    it('should handle metadata generation with empty script', async () => {
      await expect(
        generatePodcastMetadata('', config)
      ).rejects.toThrow('Script cannot be empty');
    });
    
    it('should handle audio generation with empty script', async () => {
      await expect(
        generatePodcastAudio('', 'solo', mockSpeakers, 'professional', config, jest.fn())
      ).rejects.toThrow('Script cannot be empty');
    });
  });
});
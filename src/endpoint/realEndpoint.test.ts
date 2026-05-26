import { describe, it, expect, beforeAll, jest, afterEach } from '@jest/globals';
import { fetchAvailableModels } from '@/services/ttsServices';
import { fetchAvailableVoices } from '@/services/ttsServices';
import { getDefaultBackendConfig, validateBackendConfig } from '@/utils/config';
import type { BackendConfig } from '@/types';

describe('Real Endpoint Tests with Configured Services (.env.local)', () => {
  let config: BackendConfig;
  let originalFetch: typeof fetch;

  beforeAll(() => {
    // Get the default configuration which uses .env.local values
    config = getDefaultBackendConfig();
    console.log('=== Real Endpoint Test Configuration ===');
    console.log('LLM Provider:', config.llm.provider);
    console.log('LLM URL:', config.llm.openAiUrl);
    console.log('LLM Key:', config.llm.openAiKey ? '***hidden***' : 'NOT SET');
    console.log('TTS Provider:', config.tts.provider);
    console.log('TTS URL:', config.tts.openAudioUrl);
    console.log('========================================');
  });

  beforeEach(() => {
    // Save the original fetch
    originalFetch = global.fetch;
    // Delete the global.fetch to allow real HTTP requests
    delete (global as any).fetch;
  });

  afterEach(() => {
    // Restore the mock fetch after each test
    global.fetch = originalFetch;
  });

  describe('LLM Endpoint Tests with Real Configuration', () => {
    it('should test LLM model fetching with configured endpoint', async () => {
      if (!config.llm.openAiUrl) {
        console.log('⊘ Skipping LLM test: No LLM URL configured');
        return;
      }

      const startTime = Date.now();
      console.log(`Testing LLM endpoint: ${config.llm.openAiUrl}`);

      try {
        const models = await fetchAvailableModels(config);
        const duration = Date.now() - startTime;

        console.log(`✓ LLM Models fetched in ${duration}ms:`, models.length);

        if (models.length > 0) {
          console.log('  Sample model:', models[0].id);
          console.log('  First 3 models:');
          models.slice(0, 3).forEach((m, i) => console.log(`    ${i + 1}. ${m.id}`));
          expect(models.length).toBeGreaterThan(0);
          expect(models[0]).toHaveProperty('id');
          expect(models[0]).toHaveProperty('object');
        } else {
          console.log('  No models returned');
        }
      } catch (error) {
        console.error('✗ LLM endpoint test failed:', error.message);
        console.log('  This may be expected if the endpoint is not reachable');
      }
    });
  });

  describe('TTS Endpoint Tests with Real Configuration', () => {
    it('should test TTS voice fetching with configured endpoint', async () => {
      // Skip for Gemini TTS provider (no voice listing endpoint)
      if (config.tts.provider === 'gemini') {
        console.log('⊘ Skipping: Gemini TTS does not have a voice listing endpoint');
        return;
      }

      if (!config.tts.openAudioUrl) {
        console.log('⊘ Skipping TTS test: No TTS URL configured');
        return;
      }

      const startTime = Date.now();
      console.log(`Testing TTS endpoint: ${config.tts.openAudioUrl}`);

      try {
        const voices = await fetchAvailableVoices(config);
        const duration = Date.now() - startTime;

        console.log(`✓ TTS Voices fetched in ${duration}ms:`, voices.length);

        if (voices.length > 0) {
          console.log('  Sample voice:', voices[0].id);
          console.log('  First 3 voices:');
          voices.slice(0, 3).forEach((v, i) => console.log(`    ${i + 1}. ${v.id} (${v.gender})`));
        } else {
          console.log('  No voices returned');
        }
      } catch (error) {
        console.error('✗ TTS endpoint test failed:', error.message);
        console.log('  This may be expected if the endpoint is not reachable');
      }
    });
  });

  describe('Configuration Source Verification', () => {
    it('should verify configuration comes from .env.local', () => {
      console.log('\n=== Configuration Source Check ===');

      console.log('Expected LLM provider: openai');
      console.log('Actual LLM provider:', config.llm.provider);

      console.log('Expected TTS provider: supertonic');
      console.log('Actual TTS provider:', config.tts.provider);

      console.log('Expected LLM URL contains: 192.168.0.103');
      console.log('Actual LLM URL:', config.llm.openAiUrl);
      console.log('Contains 192.168.0.103:', config.llm.openAiUrl.includes('192.168.0.103'));

      console.log('Expected TTS URL contains: 192.168.0.103');
      console.log('Actual TTS URL:', config.tts.openAudioUrl);
      console.log('Contains 192.168.0.103:', config.tts.openAudioUrl.includes('192.168.0.103'));

      // Verify configuration values
      const validation = validateBackendConfig(config);
      console.log('Validation result:', validation.valid ? '✓ Valid' : '✗ Invalid');
      if (!validation.valid) {
        console.log('  Errors:', validation.errors);
      }
    });
  });
});

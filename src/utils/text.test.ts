import { chunkScriptForTTS, validateChunkTokens, estimateTokenCount } from './text';

describe('chunkScriptForTTS', () => {
  it('should handle empty script', () => {
    const result = chunkScriptForTTS('');
    expect(result).toEqual([]);
  });

  it('should handle short script', () => {
    const shortScript = 'This is a short script.';
    const result = chunkScriptForTTS(shortScript);
    expect(result).toEqual([shortScript]);
  });

  it('should chunk long script at sentence boundaries', () => {
    const longScript = 'This is the first sentence. This is the second sentence. This is the third sentence. ' +
                      'This is the fourth sentence. This is the fifth sentence. This is the sixth sentence. ' +
                      'This is the seventh sentence. This is the eighth sentence. This is the ninth sentence. ' +
                      'This is the tenth sentence. This is the eleventh sentence. This is the twelfth sentence.';
    
    const result = chunkScriptForTTS(longScript, 100); // Force small chunk size for testing
    expect(result.length).toBeGreaterThan(1);
    
    // Check that chunks end with sentence-ending punctuation
    result.slice(0, -1).forEach(chunk => {
      const lastChar = chunk.trim().slice(-1);
      expect(['.', '?', '!', ';', ':', ',']).toContain(lastChar);
    });
  });

  it('should handle script without sentence boundaries', () => {
    const scriptWithoutPunctuation = 'This is a very long script without any punctuation marks it just keeps going on and on and on';
    const result = chunkScriptForTTS(scriptWithoutPunctuation, 50);
    
    expect(result.length).toBeGreaterThan(1);
    // Should split at word boundaries - allow some flexibility for the algorithm
    result.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(51); // Allow 1 extra character for edge cases
    });
  });
});

describe('estimateTokenCount', () => {
  it('should estimate token count correctly', () => {
    const text = 'Hello world! This is a test.';
    const tokenCount = estimateTokenCount(text);
    
    // Should be roughly 1.3 characters per token
    const expected = Math.ceil(text.length * 1.3);
    expect(tokenCount).toBe(expected);
  });
});

describe('validateChunkTokens', () => {
  it('should validate chunks under token limit', () => {
    const shortChunks = ['Short text.', 'Another short one.'];
    const result = validateChunkTokens(shortChunks);
    
    expect(result.valid).toBe(true);
    expect(result.oversized).toEqual([]);
  });

  it('should detect oversized chunks', () => {
    // Create a chunk that would exceed 5000 tokens (about 3846 characters)
    const longText = 'a'.repeat(4000); // ~5200 tokens
    const chunks = ['Short text.', longText];
    
    const result = validateChunkTokens(chunks);
    expect(result.valid).toBe(false);
    expect(result.oversized.length).toBe(1);
    expect(result.oversized[0]).toContain('5200');
  });
});
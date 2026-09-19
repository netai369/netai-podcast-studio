import { getTtsModelForLanguage, TTS_MODEL_BY_LANGUAGE, VOICES_BY_LANGUAGE, getVoicePreviewText } from './constants';

describe('getTtsModelForLanguage', () => {
  it('maps every supported language to its PocketTTS bundle', () => {
    expect(getTtsModelForLanguage('de')).toBe('de_6l');
    expect(getTtsModelForLanguage('en')).toBe('en_6l');
    expect(getTtsModelForLanguage('fr')).toBe('fr_24l');
    expect(getTtsModelForLanguage('it')).toBe('it_6l');
  });

  it('accepts BCP-47 and mixed-case tags', () => {
    expect(getTtsModelForLanguage('en-US')).toBe('en_6l');
    expect(getTtsModelForLanguage('FR')).toBe('fr_24l');
    expect(getTtsModelForLanguage('de_DE')).toBe('de_6l');
  });

  it('returns undefined for unsupported or missing languages', () => {
    expect(getTtsModelForLanguage('es')).toBeUndefined();
    expect(getTtsModelForLanguage('')).toBeUndefined();
    expect(getTtsModelForLanguage(undefined)).toBeUndefined();
    expect(getTtsModelForLanguage(null)).toBeUndefined();
  });

  it('never maps English to the German bundle (regression)', () => {
    expect(getTtsModelForLanguage('en')).not.toBe('de_6l');
    expect(TTS_MODEL_BY_LANGUAGE.en).not.toBe(TTS_MODEL_BY_LANGUAGE.de);
  });
});

describe('VOICES_BY_LANGUAGE', () => {
  it('has a voice list for every language the model map supports', () => {
    for (const lang of Object.keys(TTS_MODEL_BY_LANGUAGE)) {
      expect(VOICES_BY_LANGUAGE[lang]?.length).toBeGreaterThan(0);
    }
  });
});

describe('getVoicePreviewText', () => {
  it('returns a language-specific sentence and falls back to English', () => {
    expect(getVoicePreviewText('de')).toContain('Vorschau');
    expect(getVoicePreviewText('en')).toContain('preview');
    expect(getVoicePreviewText('xx')).toBe(getVoicePreviewText('en'));
  });
});

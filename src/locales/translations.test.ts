import { translations } from './translations';

const REQUIRED_TTS_KEYS = [
  'title',
  'subtitle',
  'placeholder',
  'langDe',
  'langEn',
  'langFr',
  'langIt',
  'preview',
  'delete',
  'voiceCloningHint',
  'voiceCloningUnavailable',
  'clone',
  'record',
  'stopRecording',
  'discard',
  'generate',
  'liveWaveform',
  'recordingOverview',
  'generatedHint',
  'ariaLive',
  'ariaRecording',
  'ariaGenerated',
  'errors.selectFile',
  'errors.cloningFailed',
  'errors.previewFailed',
  'errors.deleteFailed',
  'errors.deleteConfirm',
  'errors.micError',
  'errors.noAudio',
  'errors.enterText',
  'errors.generationFailed',
  'errors.uploadFailed',
];

function get(obj: unknown, path: string): unknown {
  return path.split('.').reduce<any>((acc, key) => (acc == null ? acc : acc[key]), obj);
}

const LOCALES = ['en', 'de', 'es', 'fr', 'it'];

describe('locale translations', () => {
  it('ships all supported languages', () => {
    expect(Object.keys(translations)).toEqual(expect.arrayContaining(LOCALES));
  });

  it.each(LOCALES)('%s defines every Quick TTS key', (lang) => {
    for (const key of REQUIRED_TTS_KEYS) {
      const value = get(translations[lang], `tts.${key}`);
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    }
  });

  it('actually translates the Quick TTS title (no English fallback)', () => {
    const enTitle = get(translations.en, 'tts.title');
    const distinct = ['de', 'es', 'fr', 'it'].filter(
      (lang) => get(translations[lang], 'tts.title') !== enTitle
    );
    expect(distinct).toHaveLength(4);
  });

  it('keeps the micError placeholders intact', () => {
    for (const lang of LOCALES) {
      const value = get(translations[lang], 'tts.errors.micError') as string;
      expect(value).toContain('{{name}}');
      expect(value).toContain('{{message}}');
    }
  });
});

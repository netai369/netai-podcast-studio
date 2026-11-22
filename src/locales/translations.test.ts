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

const LOCALES = ['en', 'de', 'es', 'zh', 'ru', 'fr', 'it'];

function flattenLeafStrings(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenLeafStrings(v, path));
    } else {
      out[path] = String(v ?? '');
    }
  }
  return out;
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();
}

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
    const distinct = ['de', 'es', 'zh', 'ru', 'fr', 'it'].filter(
      (lang) => get(translations[lang], 'tts.title') !== enTitle
    );
    expect(distinct).toHaveLength(6);
  });

  it('keeps the micError placeholders intact', () => {
    for (const lang of LOCALES) {
      const value = get(translations[lang], 'tts.errors.micError') as string;
      expect(value).toContain('{{name}}');
      expect(value).toContain('{{message}}');
    }
  });

  it.each(LOCALES.filter((l) => l !== 'en'))('%s matches full en key tree and placeholders', (lang) => {
    const base = flattenLeafStrings(translations.en);
    const cur = flattenLeafStrings(translations[lang]);
    expect(Object.keys(cur).sort()).toEqual(Object.keys(base).sort());
    for (const [k, enVal] of Object.entries(base)) {
      if (cur[k].trim().length === 0) {
        throw new Error(`${lang}:${k} is empty`);
      }
      const curPh = placeholders(cur[k]);
      const enPh = placeholders(enVal);
      if (JSON.stringify(curPh) !== JSON.stringify(enPh)) {
        throw new Error(`${lang}:${k} placeholder mismatch: ${JSON.stringify(curPh)} vs ${JSON.stringify(enPh)}`);
      }
    }
  });
});

import {
  decodeBase64ToBytes,
  encodeBytesToBase64,
  createWavBytes,
  detectAudioFormat,
  resampleLinear,
  floatToInt16,
  computePeaks,
  drawPeaks,
  PeakAccumulator,
} from './audio';

interface StrokeCall {
  strokeStyle: string;
  segments: number;
}

function mockCanvas(width = 100, height = 50) {
  const strokes: StrokeCall[] = [];
  const ctx: any = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    fills: 0,
    fillRect: () => { ctx.fills++; },
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => strokes.push({ strokeStyle: ctx.strokeStyle, segments: strokes.length }),
  };
  const canvas = { width, height, getContext: () => ctx } as unknown as HTMLCanvasElement;
  return { canvas, ctx, strokes };
}

describe('base64 helpers', () => {
  it('round-trips arbitrary bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 127, 128, 255]);
    expect(decodeBase64ToBytes(encodeBytesToBase64(bytes))).toEqual(bytes);
  });

  it('throws on invalid base64', () => {
    expect(() => decodeBase64ToBytes('!!!not-base64!!!')).toThrow();
  });
});

describe('createWavBytes', () => {
  it('writes a canonical 16-bit PCM header', () => {
    const pcm = new Int16Array([0, 100, -100, 32767, -32768]);
    const bytes = createWavBytes(pcm, 24000, 1);
    const view = new DataView(bytes.buffer);
    const tag = (o: number) => String.fromCharCode(view.getUint8(o), view.getUint8(o + 1), view.getUint8(o + 2), view.getUint8(o + 3));
    expect(tag(0)).toBe('RIFF');
    expect(tag(8)).toBe('WAVE');
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(24000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(pcm.length * 2);
    expect(view.getInt16(44, true)).toBe(0);
    expect(view.getInt16(44 + 2 * 4, true)).toBe(-32768);
  });
});

describe('detectAudioFormat', () => {
  const wrap = (bytes: number[]) => new Uint8Array(bytes);
  const id3 = () => wrap([0x49, 0x44, 0x33, 0x04, 0x00]);
  const frameSync = () => wrap([0xff, 0xfb, 0x90, 0x00]);
  const riff = () => wrap([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]);

  it('detects mp3 by ID3 tag and frame sync', () => {
    expect(detectAudioFormat(id3())).toBe('mp3');
    expect(detectAudioFormat(frameSync())).toBe('mp3');
  });

  it('detects wav by RIFF/WAVE magic', () => {
    expect(detectAudioFormat(riff())).toBe('wav');
  });

  it('honours the content-type header', () => {
    expect(detectAudioFormat(new Uint8Array(0), 'audio/mpeg')).toBe('mp3');
    expect(detectAudioFormat(new Uint8Array(0), 'audio/wav')).toBe('wav');
    expect(detectAudioFormat(new Uint8Array(0), 'audio/pcm')).toBe('pcm');
  });

  it('falls back to a PCM heuristic for even payloads >= 1024 bytes', () => {
    expect(detectAudioFormat(new Uint8Array(2048))).toBe('pcm');
    expect(detectAudioFormat(new Uint8Array(10))).toBe('unknown');
  });
});

describe('resampleLinear', () => {
  it('returns the input unchanged when rates match', () => {
    const input = new Float32Array([0, 0.5, -0.5]);
    expect(resampleLinear(input, 24000, 24000)).toBe(input);
  });

  it('halves the sample count when downsizing 48k -> 24k and preserves endpoints', () => {
    const input = new Float32Array([0, 1, 0, -1, 0, 1, 0, -1]);
    const out = resampleLinear(input, 48000, 24000);
    expect(out.length).toBe(4);
    expect(out[0]).toBeCloseTo(0);
    expect(out[out.length - 1]).toBeCloseTo(0);
  });

  it('handles empty input', () => {
    expect(resampleLinear(new Float32Array(0), 48000, 24000).length).toBe(0);
  });
});

describe('floatToInt16', () => {
  it('scales and clips to the signed 16-bit range', () => {
    const out = floatToInt16(new Float32Array([0, 1, -1, 2, -2, 0.5]));
    expect(out[0]).toBe(0);
    expect(out[1]).toBe(32767);
    expect(out[2]).toBe(-32768);
    expect(out[3]).toBe(32767);
    expect(out[4]).toBe(-32768);
    expect(out[5]).toBeCloseTo(16383, -1);
  });
});

describe('computePeaks', () => {
  it('produces one min/max pair per column', () => {
    const samples = new Float32Array([0, 1, 0, -1, 0.5, -0.5, 0.25, -0.25]);
    const peaks = computePeaks(samples, 4);
    expect(peaks.length).toBe(8);
    expect(peaks[0]).toBe(0);
    expect(peaks[1]).toBe(1);
    expect(peaks[2]).toBe(-1);
    expect(peaks[3]).toBe(0);
    expect(peaks[4]).toBe(-0.5);
    expect(peaks[5]).toBe(0.5);
  });

  it('returns a zeroed envelope for null/empty input', () => {
    expect(Array.from(computePeaks(null, 3))).toEqual([0, 0, 0, 0, 0, 0]);
    expect(Array.from(computePeaks(new Float32Array(0), 2))).toEqual([0, 0, 0, 0]);
  });
});

describe('drawPeaks', () => {
  it('paints the background and strokes the played/unplayed regions', () => {
    const { canvas, ctx, strokes } = mockCanvas(100, 50);
    const peaks = new Float32Array([0, 1, 0, -1, 0.5, -0.5, 0.25, -0.25]);
    drawPeaks(canvas, peaks, { progress: 0.5, color: '#38BDF8', dimColor: '#4A5568' });
    expect(ctx.fills).toBe(1);
    expect(strokes.length).toBe(2);
    expect(strokes[0].strokeStyle).toBe('#38BDF8');
    expect(strokes[1].strokeStyle).toBe('#4A5568');
  });

  it('only paints the background for null/empty peaks', () => {
    const { canvas, ctx, strokes } = mockCanvas();
    drawPeaks(canvas, null);
    expect(ctx.fills).toBe(1);
    expect(strokes.length).toBe(0);
  });

  it('is a no-op without a canvas', () => {
    expect(() => drawPeaks(null, new Float32Array([0, 1]))).not.toThrow();
  });
});

describe('PeakAccumulator', () => {
  it('emits one peak pair per bucket of samples', () => {
    const acc = new PeakAccumulator(4);
    acc.push(new Float32Array([0, 1, -1, 0, 0.5, -0.5, 0.25, -0.25]));
    const peaks = acc.snapshot();
    expect(peaks.length).toBe(4);
    expect(peaks[0]).toBe(-1);
    expect(peaks[1]).toBe(1);
    expect(peaks[2]).toBe(-0.5);
    expect(peaks[3]).toBe(0.5);
    expect(acc.length).toBe(2);
  });

  it('accumulates across pushes and flushes a partial bucket on snapshot', () => {
    const acc = new PeakAccumulator(4);
    acc.push(new Float32Array([0, 0.1]));
    expect(acc.length).toBe(0);
    expect(acc.snapshot().length).toBe(2);
    acc.push(new Float32Array([0.2, 0.3, 0.4, 0.5]));
    expect(acc.snapshot().length).toBe(4);
  });

  it('grows its backing buffer beyond the initial capacity', () => {
    const acc = new PeakAccumulator(1, 1);
    for (let i = 0; i < 10; i++) acc.push(new Float32Array([i / 10]));
    expect(acc.snapshot().length).toBe(20);
  });

  it('resets all state', () => {
    const acc = new PeakAccumulator(2);
    acc.push(new Float32Array([1, 1, 1, 1]));
    acc.reset();
    expect(acc.length).toBe(0);
    expect(acc.snapshot().length).toBe(0);
  });

  it('handles empty chunks', () => {
    const acc = new PeakAccumulator(4);
    acc.push(new Float32Array(0));
    expect(acc.snapshot().length).toBe(0);
  });
});

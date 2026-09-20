// Use global lamejs from CDN
declare global {
    var lamejs: any;
}

export function decodeBase64ToBytes(base64: string): Uint8Array {
    try {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    } catch (e) {
        console.error("Failed to decode base64 string.", e);
        throw new Error("The string to be decoded is not correctly encoded.");
    }
}

export function encodeBytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function createWavBytes(pcmData: Int16Array, sampleRate: number, numChannels: number): Uint8Array<ArrayBuffer> {
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmData.length * (bitsPerSample / 8);
    const fileSize = 36 + dataSize;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < pcmData.length; i++, offset += 2) {
        view.setInt16(offset, pcmData[i], true);
    }

    return new Uint8Array(buffer);
}

export function createWavBlob(pcmData: Int16Array, sampleRate: number, numChannels: number): Blob {
    return new Blob([createWavBytes(pcmData, sampleRate, numChannels)], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

export interface WaveformOptions {
  /** Colour of the already-played portion. */
  color?: string;
  /** Colour of the not-yet-played portion. */
  dimColor?: string;
  backgroundColor?: string;
  lineWidth?: number;
  /** Playback position 0..1 used to split played/unplayed colours. */
  progress?: number;
}

/**
 * Reduce `samples` to a min/max envelope with exactly `columns` pairs
 * (interleaved [min, max]) — the shape that both the live and the finished
 * waveform renderers consume.
 */
export function computePeaks(samples: Float32Array | null, columns: number): Float32Array {
  const cols = Math.max(1, Math.floor(columns));
  const peaks = new Float32Array(cols * 2);
  if (!samples || samples.length === 0) return peaks;

  const step = samples.length / cols;
  for (let c = 0; c < cols; c++) {
    const start = Math.floor(c * step);
    const end = Math.min(samples.length, Math.max(start + 1, Math.floor((c + 1) * step)));
    let min = 1;
    let max = -1;
    for (let i = start; i < end; i++) {
      const v = samples[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    peaks[c * 2] = min;
    peaks[c * 2 + 1] = max;
  }
  return peaks;
}

/**
 * Draw an interleaved min/max `peaks` array into `canvas`.
 *
 * `peaks` may be at any resolution (live accumulator or a pre-computed
 * overview); it is bucketed into `canvas.width` columns. The portion before
 * `progress` is drawn in `color`, the rest in `dimColor`.
 */
export function drawPeaks(
  canvas: HTMLCanvasElement | null,
  peaks: Float32Array | null,
  options: WaveformOptions = {}
): void {
  if (!canvas) return;
  const {
    color = '#38BDF8',
    dimColor = '#4A5568',
    backgroundColor = 'rgb(30 41 59)',
    lineWidth = 2,
    progress = 0,
  } = options;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const mid = height / 2;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  if (!peaks || peaks.length < 2) return;

  const pairs = peaks.length >> 1;
  const step = pairs / width;
  const progressX = Math.max(0, Math.min(width, Math.round(width * progress)));

  const drawRange = (from: number, to: number, stroke: string) => {
    if (to <= from) return;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let x = from; x < to; x++) {
      const start = Math.floor(x * step);
      const end = Math.min(pairs, Math.max(start + 1, Math.floor((x + 1) * step)));
      let min = 1;
      let max = -1;
      for (let i = start; i < end; i++) {
        const mn = peaks[i * 2];
        const mx = peaks[i * 2 + 1];
        if (mn < min) min = mn;
        if (mx > max) max = mx;
      }
      const yTop = mid - max * mid;
      const yBottom = mid - min * mid;
      ctx.moveTo(x + 0.5, yTop);
      ctx.lineTo(x + 0.5, Math.max(yBottom, yTop + 0.5));
    }
    ctx.stroke();
  };

  drawRange(0, progressX, color);
  drawRange(progressX, width, dimColor);
}

/**
 * Incremental peak builder for the live recording view.
 *
 * Appending one min/max pair per `samplesPerPeak` samples keeps the render
 * cost and memory flat regardless of recording length, so the waveform grows
 * smoothly from left to right instead of flickering through a tiny window.
 */
export class PeakAccumulator {
  private readonly samplesPerPeak: number;
  private peaks: Float32Array;
  private count = 0;
  private pendingCount = 0;
  private pendingMin = Infinity;
  private pendingMax = -Infinity;

  constructor(samplesPerPeak = 240, initialPairs = 2048) {
    this.samplesPerPeak = Math.max(1, Math.floor(samplesPerPeak));
    this.peaks = new Float32Array(Math.max(1, initialPairs) * 2);
  }

  reset(): void {
    this.count = 0;
    this.pendingCount = 0;
    this.pendingMin = Infinity;
    this.pendingMax = -Infinity;
  }

  get length(): number {
    return this.count;
  }

  push(chunk: Float32Array): void {
    for (let i = 0; i < chunk.length; i++) {
      const v = chunk[i];
      if (v < this.pendingMin) this.pendingMin = v;
      if (v > this.pendingMax) this.pendingMax = v;
      if (++this.pendingCount >= this.samplesPerPeak) this.flush();
    }
  }

  /** Current peaks (flushes any partial bucket). Caller gets a copy. */
  snapshot(): Float32Array {
    this.flush();
    return this.peaks.slice(0, this.count * 2);
  }

  private flush(): void {
    if (this.pendingCount === 0) return;
    if ((this.count + 1) * 2 > this.peaks.length) {
      const grown = new Float32Array(this.peaks.length * 2);
      grown.set(this.peaks);
      this.peaks = grown;
    }
    this.peaks[this.count * 2] = this.pendingMin;
    this.peaks[this.count * 2 + 1] = this.pendingMax;
    this.count++;
    this.pendingCount = 0;
    this.pendingMin = Infinity;
    this.pendingMax = -Infinity;
  }
}

/** Decode any browser-playable audio URL (blob: or http) to mono Float32. */
export async function decodeAudioSamples(url: string): Promise<Float32Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch audio: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const ctx = getAudioContext();
  const audioBuffer = await ctx.decodeAudioData(buffer);
  return new Float32Array(audioBuffer.getChannelData(0));
}

/**
 * Linear-interpolation resampler. The TTS models expect 24 kHz mono; some
 * browsers ignore the requested AudioContext sample rate, so we normalise the
 * captured PCM ourselves instead of trusting the context rate.
 */
export function resampleLinear(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate || input.length === 0) return input;
  const ratio = toRate / fromRate;
  const outLength = Math.max(1, Math.round(input.length * ratio));
  const output = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const pos = i / ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const frac = pos - i0;
    output[i] = input[i0] * (1 - frac) + input[i1] * frac;
  }
  return output;
}

export function floatToInt16(samples: Float32Array): Int16Array {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

export const createWavUrlFromBase64PCM = async (base64PCM: string): Promise<string> => {
    if (!base64PCM) throw new Error("Cannot create WAV from empty audio data.");
    const pcmBytes = decodeBase64ToBytes(base64PCM);
    const pcmDataInt16 = new Int16Array(pcmBytes.buffer);
    const wavBlob = createWavBlob(pcmDataInt16, 24000, 1);
    return URL.createObjectURL(wavBlob);
};

export const createMp3UrlFromBase64 = async (base64MP3: string): Promise<string> => {
    if (!base64MP3) throw new Error("Cannot create MP3 from empty audio data.");
    const mp3Bytes = decodeBase64ToBytes(base64MP3);
    const mp3Blob = new Blob([mp3Bytes as any], { type: 'audio/mpeg' });
    return URL.createObjectURL(mp3Blob);
};

export const createMp3UrlFromPcmBytes = async (
    pcmBytes: Uint8Array,
    sampleRate: number = OUTPUT_SAMPLE_RATE,
    bitrate: number = OUTPUT_MP3_BITRATE,
): Promise<string> => {
    if (!pcmBytes || pcmBytes.length === 0) throw new Error("Cannot create MP3 from empty audio data.");
    const pcmDataInt16 = new Int16Array(pcmBytes.buffer);

    // Encoding rate must match the source PCM, otherwise the mp3 plays at the
    // wrong speed/pitch (the WAV header carrying the real rate is stripped by
    // the caller before this point).
    // @ts-ignore - lamejs from CDN
    const lameEncoder = new lamejs.Mp3Encoder(1, sampleRate, bitrate); // mono
    const sampleBlockSize = 1152;
    const mp3Data = [];

    for (let i = 0; i < pcmDataInt16.length; i += sampleBlockSize) {
        const sampleChunk = pcmDataInt16.subarray(i, i + sampleBlockSize);
        const mp3buf = lameEncoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) mp3Data.push(mp3buf);
    }
    const mp3buf = lameEncoder.flush();
    if (mp3buf.length > 0) mp3Data.push(mp3buf);

    const blob = new Blob(mp3Data, { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
};

/**
 * Sample rate for generated podcast output.
 *
 * The TTS backend serves file-based audio (wav/mp3) at the model's native
 * 44.1 kHz for maximum quality, and the podcast export must preserve it.
 *
 * This matters for `getAudioContext()` too: `decodeAudioData()` ALWAYS
 * resamples to the AudioContext's rate, so a 24 kHz context silently
 * downsampled every 44.1 kHz TTS chunk before it was ever combined.
 */
export const OUTPUT_SAMPLE_RATE = 44100;

/** Bitrate for the mp3 export (kbps); 192 keeps up with 44.1 kHz speech. */
export const OUTPUT_MP3_BITRATE = 192;

let audioContext: AudioContext | null = null;
export function getAudioContext(): AudioContext {
    if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
    }
    return audioContext;
}

async function decodePCMToAudioBuffer(pcmBytes: Uint8Array): Promise<AudioBuffer> {
    const ctx = getAudioContext();
    const pcmDataInt16 = new Int16Array(pcmBytes.buffer);
    const frameCount = pcmDataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = pcmDataInt16[i] / 32768.0;
    }
    return buffer;
}

export const playBase64Audio = async (base64Audio: string, format?: 'mp3' | 'wav' | 'pcm'): Promise<void> => {
    console.log('DEBUG: playBase64Audio called, base64 length:', base64Audio.length);
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
    
    const audioBytes = decodeBase64ToBytes(base64Audio);
    console.log('DEBUG: Decoded base64 to bytes, length:', audioBytes.length, 'first few bytes:', audioBytes.slice(0, 10));
    
    // Auto-detect format if not specified
    const detectedFormat = format || detectAudioFormat(audioBytes).replace('unknown', 'pcm');
    console.log('DEBUG: Playing audio with format:', detectedFormat);
    
    let audioBuffer: AudioBuffer;
    
    if (detectedFormat === 'mp3' || detectedFormat === 'wav') {
        // Handle compressed formats (MP3, WAV) - copy into a fresh ArrayBuffer
        // so decodeAudioData can transfer/detach it safely.
        const audioCopy = new Uint8Array(audioBytes.byteLength);
        audioCopy.set(audioBytes);
        try {
            audioBuffer = await decodeMp3ToPcm(audioCopy.buffer);
        } catch (decodeError) {
            // Never reinterpret compressed bytes as raw PCM — that produces
            // loud noise. Surface the real failure instead.
            console.error('DEBUG: Failed to decode MP3/WAV:', decodeError);
            throw decodeError instanceof Error ? decodeError : new Error('Failed to decode audio.');
        }
    } else {
        // Handle raw PCM format
        audioBuffer = await decodePCMToAudioBuffer(audioBytes);
    }
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
};

// Backward compatibility - assume PCM format
export const playBase64PCM = async (base64PCM: string): Promise<void> => {
    return playBase64Audio(base64PCM, 'pcm');
};


// Interface für Audio Stream Processing

// Neue Funktionen für Binärstream-Verarbeitung
export async function processBinaryAudioStream(response: Response): Promise<ArrayBuffer> {
    console.log('DEBUG: Processing binary audio stream, Content-Type:', response.headers.get('content-type'));
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    console.log('DEBUG: Content-Length:', contentLength);
    
    // Prüfe auf chunked Transfer-Encoding
    const transferEncoding = response.headers.get('transfer-encoding');
    const isChunked = transferEncoding?.includes('chunked');
    console.log('DEBUG: Transfer-Encoding:', transferEncoding, 'isChunked:', isChunked);

    if (isChunked || !contentLength) {
        // Stream-Verarbeitung für chunked oder unbekannte Größe
        return await processChunkedStream(response);
    } else {
        // Direkte ArrayBuffer-Verarbeitung für bekannte Größe
        return await response.arrayBuffer();
    }
}

async function processChunkedStream(response: Response): Promise<ArrayBuffer> {
    console.log('DEBUG: Processing chunked stream');
    
    if (!response.body) {
        throw new Error('No response body available for stream processing');
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            totalLength += value.length;
            
            console.log(`DEBUG: Received chunk of ${value.length} bytes, total: ${totalLength}`);
            
            // Memory-Optimierung: Verarbeite Chunks progressiv wenn sie zu groß werden
            if (totalLength > 50 * 1024 * 1024) { // 50MB Limit
                console.warn('DEBUG: Large audio stream detected, consider progressive processing');
            }
        }

        // Kombiniere alle Chunks zu einem einzigen ArrayBuffer
        const result = new ArrayBuffer(totalLength);
        const resultView = new Uint8Array(result);
        let offset = 0;

        for (const chunk of chunks) {
            resultView.set(chunk, offset);
            offset += chunk.length;
        }

        console.log(`DEBUG: Combined ${chunks.length} chunks into ${totalLength} bytes`);
        return result;

    } finally {
        reader.releaseLock();
    }
}

export async function decodeMp3ToPcm(mp3Data: ArrayBuffer): Promise<AudioBuffer> {
    console.log('DEBUG: Decoding MP3 to PCM, data size:', mp3Data.byteLength);
    
    const ctx = getAudioContext();
    
    // Native Web Audio API decoding. `slice()` hands decodeAudioData a copy so
    // it can detach the buffer without affecting the caller.
    const audioBuffer = await ctx.decodeAudioData(mp3Data.slice(0));
    console.log('DEBUG: MP3 decoded with Web Audio API, sample rate:', audioBuffer.sampleRate);
    return audioBuffer;
}

export function detectAudioFormat(data: Uint8Array, contentType?: string): 'mp3' | 'wav' | 'pcm' | 'unknown' {
    console.log('DEBUG: Detecting audio format, Content-Type:', contentType);
    
    // Zuerst Content-Type prüfen
    if (contentType) {
        if (contentType.includes('audio/mpeg') || contentType.includes('audio/mp3')) {
            console.log('DEBUG: Format detected as MP3 (Content-Type)');
            return 'mp3';
        }
        if (contentType.includes('audio/wav') || contentType.includes('audio/wave')) {
            console.log('DEBUG: Format detected as WAV (Content-Type)');
            return 'wav';
        }
        if (contentType.includes('audio/pcm')) {
            console.log('DEBUG: Format detected as PCM (Content-Type)');
            return 'pcm';
        }
    }
    
    // Fallback auf Magic Bytes
    if (data.length >= 3) {
        // MP3 Magic Bytes (ID3v2 oder MP3 frame sync)
        const header3 = new TextDecoder().decode(data.slice(0, 3));
        if (header3 === 'ID3' || (data[0] === 0xFF && (data[1] & 0xE0) === 0xE0)) {
            console.log('DEBUG: Format detected as MP3 (Magic Bytes)');
            return 'mp3';
        }
        
        // WAV Magic Bytes
        const header4 = new TextDecoder().decode(data.slice(0, 4));
        if (header4 === 'RIFF' && data.length >= 12) {
            const waveHeader = new TextDecoder().decode(data.slice(8, 12));
            if (waveHeader === 'WAVE') {
                console.log('DEBUG: Format detected as WAV (Magic Bytes)');
                return 'wav';
            }
        }
    }
    
    // Prüfe auf PCM (gerade Länge, keine offensichtlichen Header)
    if (data.length % 2 === 0 && data.length >= 1024) {
        console.log('DEBUG: Format detected as PCM (heuristic)');
        return 'pcm';
    }
    
    console.log('DEBUG: Format detected as unknown');
    return 'unknown';
}

export async function convertToUnifiedPcm(audioData: Uint8Array, format: 'mp3' | 'wav' | 'pcm'): Promise<AudioBuffer> {
    console.log('DEBUG: Converting to unified PCM, format:', format);
    
    switch (format) {
        case 'mp3':
            return await decodeMp3ToPcm(audioData.buffer as ArrayBuffer);
            
        case 'wav':
            // WAV kann direkt dekodiert werden (enthält bereits PCM)
            const wavCtx = getAudioContext();
            // Wir müssen den Buffer kopieren, da decodeAudioData ihn "detachen" kann
            // Verwende .slice() auf dem TypedArray, um eine Kopie der Daten zu erhalten und dann .buffer
            const wavBufferCopy = audioData.slice().buffer;
            const audioBuffer = await wavCtx.decodeAudioData(wavBufferCopy);
            console.log('DEBUG: WAV decoded to PCM, sample rate:', audioBuffer.sampleRate);
            return audioBuffer;
            
        case 'pcm':
            // PCM direkt als AudioBuffer erstellen. 24 kHz = streaming wire
            // contract of the TTS backend; wav/mp3 (44.1 kHz) are decoded
            // above with their real rate from the file header.
            const pcmCtx = getAudioContext();
            const pcmData = new Int16Array(audioData.buffer);
            const frameCount = pcmData.length;
            const buffer = pcmCtx.createBuffer(1, frameCount, 24000);
            const channelData = buffer.getChannelData(0);
            
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = pcmData[i] / 32768.0;
            }
            
            console.log('DEBUG: PCM converted to AudioBuffer, frames:', frameCount);
            return buffer;
            
        default:
            throw new Error(`Unsupported audio format: ${format}`);
    }
}

// Memory-optimierte Audio-Buffer-Kombination
export async function combineAudioBuffersOptimized(buffers: AudioBuffer[], targetSampleRate: number = OUTPUT_SAMPLE_RATE): Promise<AudioBuffer> {
    console.log('DEBUG: Combining audio buffers, count:', buffers.length, 'target sample rate:', targetSampleRate);
    
    if (buffers.length === 0) {
        throw new Error('No audio buffers to combine');
    }
    
    if (buffers.length === 1) {
        return buffers[0];
    }
    
    const ctx = getAudioContext();
    
    // Berechne Gesamtlänge nach Resampling
    let totalLength = 0;
    const resampledBuffers: AudioBuffer[] = [];
    
    for (const buffer of buffers) {
        let processedBuffer = buffer;
        
        // Resampling wenn nötig
        if (buffer.sampleRate !== targetSampleRate) {
            const ratio = targetSampleRate / buffer.sampleRate;
            const newLength = Math.ceil(buffer.length * ratio);
            const resampled = ctx.createBuffer(1, newLength, targetSampleRate);
            const originalData = buffer.getChannelData(0);
            const resampledData = resampled.getChannelData(0);
            
            // Einfache lineare Interpolation für Resampling
            for (let i = 0; i < newLength; i++) {
                const sourceIndex = i / ratio;
                const index1 = Math.floor(sourceIndex);
                const index2 = Math.min(index1 + 1, originalData.length - 1);
                const fraction = sourceIndex - index1;
                
                resampledData[i] = originalData[index1] * (1 - fraction) + originalData[index2] * fraction;
            }
            
            processedBuffer = resampled;
            console.log(`DEBUG: Resampled buffer from ${buffer.sampleRate}Hz to ${targetSampleRate}Hz`);
        }
        
        resampledBuffers.push(processedBuffer);
        totalLength += processedBuffer.length;
    }
    
    // Erstelle kombinierten Buffer
    const combinedBuffer = ctx.createBuffer(1, totalLength, targetSampleRate);
    const combinedData = combinedBuffer.getChannelData(0);
    
    let offset = 0;
    for (const buffer of resampledBuffers) {
        const data = buffer.getChannelData(0);
        combinedData.set(data, offset);
        offset += data.length;
    }
    
    console.log(`DEBUG: Combined ${buffers.length} buffers into ${totalLength} samples`);
    return combinedBuffer;
}

// Neue generateAudioOpenAI Funktion mit Binary Stream Support
export async function generateAudioOpenAIWithBinaryStream(
    url: string, 
    text: string, 
    voice: string, 
    preferBinary: boolean = true,
    lang?: string,
    provider: 'openai' | 'supertonic' = 'openai',
    model?: string
): Promise<{ data: string; format: 'mp3' | 'wav' | 'pcm'; isBinary: boolean }> {
    console.log('DEBUG: generateAudioOpenAIWithBinaryStream called', { url, textLength: text.length, voice, preferBinary, lang, provider, model });
    
    // Normalize text for Supertonic TTS to handle special characters
    let normalizedText = text;
    if (provider === 'supertonic') {
        // Replace special quotation marks and other problematic characters
        normalizedText = text
            .replace(/[„“]/g, '"')  // Replace German quotes with standard quotes
            .replace(/[–—]/g, '-')  // Replace em dashes with hyphens
            .replace(/[•]/g, '*')   // Replace bullets with asterisks
            .replace(/[…]/g, '...') // Replace ellipsis with dots
            .replace(/[‘’]/g, "'")  // Replace curly quotes with straight quotes
            .replace(/[†‡]/g, '')    // Remove special symbols
            .replace(/[‚„]/g, '"')  // Replace other quote variants
            .replace(/[‹›]/g, '<>') // Replace angle quotes
            .replace(/[«»]/g, '""') // Replace French quotes
            .replace(/[‛]/g, "'")   // Replace single quote variant
            .replace(/[‚]/g, "'")   // Replace another single quote variant
            .replace(/[‚]/g, "'")   // Replace yet another single quote variant
            .replace(/[‚]/g, "'")   // Final catch for single quotes
            .replace(/[„]/g, '""'); // Replace double quote variants
        
        console.log('DEBUG: Normalized text for Supertonic:', { originalLength: text.length, normalizedLength: normalizedText.length });
    }
    
    const requestBody: any = {
        model: model || (provider === 'supertonic' ? "supertonic-3" : "tts-1"),
        input: normalizedText,
        voice: voice,
        response_format: preferBinary ? "mp3" : "json",
        speed: 1.0
    };
    
    if (lang) {
        requestBody.lang = lang;
    }
    
    console.log('DEBUG: OpenAI TTS request body:', requestBody);
    
     const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    
    // Only add authorization header for OpenAI, not for Supertonic
    if (provider === 'openai') {
        // Import config dynamically to avoid issues with import.meta in tests
        const { VITE_API_KEY } = await import('@/config');
        headers['Authorization'] = `Bearer ${VITE_API_KEY}`;
    }
    
    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
    });
    
    console.log('DEBUG: OpenAI TTS response status:', response.status);
    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`OpenAI TTS API failed with status ${response.status}: ${errorText}`);
    }
    
     const contentType = response.headers.get('content-type') || '';
    console.log('DEBUG: Response Content-Type:', contentType);
    console.log('DEBUG: Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (contentType.includes('audio/') || preferBinary) {
        // Binary Stream Processing
        console.log('DEBUG: Processing binary audio stream');
        const arrayBuffer = await processBinaryAudioStream(response);
        console.log('DEBUG: Received arrayBuffer size:', arrayBuffer.byteLength);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Erkenne das Format
        let detectedFormat = detectAudioFormat(uint8Array, contentType);
        console.log('DEBUG: Detected format:', detectedFormat);
        console.log('DEBUG: First 10 bytes:', uint8Array.slice(0, 10));
        
        // Handle unknown format - fallback to MP3 for binary streams
        if (detectedFormat === 'unknown') {
            console.log('DEBUG: Unknown format, defaulting to MP3 for binary stream');
            detectedFormat = 'mp3';
        }
        
        // Konvertiere zu Base64 für die weitere Verarbeitung
        const chunkSize = 8192;
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            binaryString += String.fromCharCode(...chunk);
        }
        const base64 = btoa(binaryString);
        
        console.log('DEBUG: Binary stream converted to base64:', { base64Length: base64.length });
        return { data: base64, format: detectedFormat, isBinary: true };
        
    } else {
        // Legacy JSON Processing
        console.log('DEBUG: Processing JSON response (legacy mode)');
        const data = await response.json();
        console.log('DEBUG: JSON response data structure:', Object.keys(data));
        
        const audioContent = data.audio_content || data.audio || data.Audio;
        if (!audioContent) {
            throw new Error(`Invalid JSON response format: missing audio field. Available fields: ${Object.keys(data).join(', ')}`);
        }
        
        // Erkenne das Format aus den Base64-Daten
        const audioBytes = decodeBase64ToBytes(audioContent);
        let detectedFormat = detectAudioFormat(audioBytes);
        console.log('DEBUG: Legacy - detected format:', detectedFormat);
        
        // Handle unknown format - fallback to MP3 for legacy JSON
        if (detectedFormat === 'unknown') {
            console.log('DEBUG: Unknown format in legacy JSON, defaulting to MP3');
            detectedFormat = 'mp3';
        }
        
        return { data: audioContent, format: detectedFormat, isBinary: false };
    }
}

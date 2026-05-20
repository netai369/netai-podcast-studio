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

function createWavBlob(pcmData: Int16Array, sampleRate: number, numChannels: number): Blob {
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

    return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
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

export const createMp3UrlFromPcmBytes = async (pcmBytes: Uint8Array): Promise<string> => {
    if (!pcmBytes || pcmBytes.length === 0) throw new Error("Cannot create MP3 from empty audio data.");
    const pcmDataInt16 = new Int16Array(pcmBytes.buffer);

    // @ts-ignore - lamejs from CDN
    const lameEncoder = new lamejs.Mp3Encoder(1, 24000, 128); // 1 channel, 24000 Hz, 128 kbps
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

let audioContext: AudioContext | null = null;
export function getAudioContext(): AudioContext {
    if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
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
        // Handle compressed formats (MP3, WAV) - convert Uint8Array to ArrayBuffer
        const audioArrayBuffer = audioBytes.buffer.slice(audioBytes.byteOffset, audioBytes.byteOffset + audioBytes.byteLength);
        try {
            // Ensure we have a regular ArrayBuffer, not SharedArrayBuffer
            const regularArrayBuffer = audioArrayBuffer instanceof SharedArrayBuffer 
                ? new ArrayBuffer(audioArrayBuffer.byteLength)
                : audioArrayBuffer;
            if (regularArrayBuffer instanceof SharedArrayBuffer) {
                new Uint8Array(regularArrayBuffer).set(new Uint8Array(audioArrayBuffer));
            }
            audioBuffer = await decodeMp3ToPcm(regularArrayBuffer);
        } catch (decodeError) {
            console.error('DEBUG: Failed to decode MP3/WAV, falling back to PCM interpretation:', decodeError);
            // If MP3 decoding fails, try to play as PCM (might work for some WAV files)
            audioBuffer = await decodePCMToAudioBuffer(audioBytes);
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
    
    // Versuche zuerst die native Web Audio API Dekodierung
    try {
        // WICHTIG: decodeAudioData detached den Buffer, daher Kopie verwenden wenn nötig
        // Hier slice() wir sowieso, also ist es sicher
        const audioBuffer = await ctx.decodeAudioData(mp3Data.slice(0));
        console.log('DEBUG: MP3 decoded with Web Audio API, sample rate:', audioBuffer.sampleRate);
        return audioBuffer;
    } catch (nativeError) {
        console.log('DEBUG: Native decode failed, trying alternative:', nativeError);
        
        // Fallback: Versuche es als rohe PCM-Daten zu behandeln
        // Dies ist eine Notlösung für spezielle Fälle
        const pcmData = new Int16Array(mp3Data.slice(0));
        const frameCount = pcmData.length;
        const fallbackBuffer = ctx.createBuffer(1, frameCount, 24000);
        const channelData = fallbackBuffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = pcmData[i] / 32768.0;
        }
        
        console.log('DEBUG: Created fallback PCM buffer from MP3 data');
        return fallbackBuffer;
    }
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
            // PCM direkt als AudioBuffer erstellen
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
export async function combineAudioBuffersOptimized(buffers: AudioBuffer[], targetSampleRate: number = 24000): Promise<AudioBuffer> {
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
        headers['Authorization'] = `Bearer ${import.meta.env.VITE_API_KEY}`;
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

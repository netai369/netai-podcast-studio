/// <reference types="vite/client" />
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { EdgeTTS, listVoices } from 'edge-tts-universal/browser';
import type { Document, PodcastStyle, SpeakerConfig, BackendConfig, PodcastNarrationStyle, AvailableModels } from "@/types";
import { chunkDocument, chunkScriptForTTS, validateChunkTokens } from "@/utils/text";
import { getVoicePreviewText, VOICES_BY_LANGUAGE, CUSTOM_VOICE_ID, getLanguageName } from "@/constants";
import type { LogLevel } from "@/types";

// Logger utility
const createLogger = (conf: { debug?: { logLevel?: LogLevel } }) => ({
    error: (message: string, ...args: any[]) => console.error(`ERROR: ${message}`, ...args),
    info: (message: string, ...args: any[]) => {
        if (['INFO', 'DEBUG'].includes(conf.debug?.logLevel || 'INFO')) {
            console.log(`INFO: ${message}`, ...args);
        }
    },
    debug: (message: string, ...args: any[]) => {
        if (conf.debug?.logLevel === 'DEBUG') {
            console.log(`DEBUG: ${message}`, ...args);
        }
    }
});
import { decodeBase64ToBytes, encodeBytesToBase64, generateAudioOpenAIWithBinaryStream, convertToUnifiedPcm, combineAudioBuffersOptimized } from "@/utils/audio";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const createCorsError = (url: string) => {
    return new Error(`A network error occurred, which is often due to a CORS issue. Please ensure your custom API server at "${url}" is configured to allow requests from this application's origin. Check the browser's developer console for more details.`);
};

const getScriptGenerationPrompt = (docs: { name: string, content: string }[], topic: string, duration: number, style: PodcastStyle, speakers: SpeakerConfig[], lang: string, narration: PodcastNarrationStyle): string => {
    const docContents = docs.map(d => `Document: ${d.name}\nContent:\n${d.content}`).join('\n\n---\n\n');
    const speakerInfo = style === 'solo'
        ? `The podcast is a solo host format, with the host named ${speakers[0].name}.`
        : `The podcast is a conversational format between two hosts: ${speakers[0].name} and ${speakers[1].name}.`;

    let styleSpecificInstructions = '';
    if (narration === 'professional' || narration === 'educational') {
        styleSpecificInstructions = `
- Special Instructions for this style: The tone must be formal, objective, and direct.
- Begin the script directly with the main content. Do NOT include informal greetings (e.g., "Hello and welcome...").
- The speaker must NOT introduce themselves by name.
- The outro must be a concise, formal concluding statement. Avoid casual sign-offs (e.g., "Thanks for listening," "goodbye").`;
    } else {
        styleSpecificInstructions = `- Include a brief, engaging intro and outro appropriate for the style.`
    }

    return `You are an expert podcast scriptwriter. Generate a script based on the provided documents.
Topic: ${topic}
Duration: ~${duration} minutes
Format: ${style}
Narration Style: ${narration}
Language: ${lang}
${speakerInfo}
Source Documents:\n${docContents}
Instructions:
1. Analyze the documents for relevant information.
2. Create a script in ${lang} of approximately ${duration} minutes (assuming a speaking rate of 150 words per minute).
3. Adhere strictly to the format: For a 'solo' style, write the script as a continuous monologue without any speaker name prefixes. For a 'conversation' style, you MUST prefix each line with the speaker's name (e.g., "${speakers[0].name}: " or "${speakers[1].name}: ") to indicate who is speaking.
4. Infuse the script with the specified "${narration}" style.
${styleSpecificInstructions}
5. Output ONLY the script content, ready for a text-to-speech engine. 
6. Do NOT add any extra text or formatting before or after the script. 
7. DO NOT output **Script Start:**, **Script End**, Intro/Outro, sound/music, language or similar description.
Begin script:`;
};

export async function* generatePodcastScriptStream(d: Document[], t: string, dur: number, s: PodcastStyle, spk: SpeakerConfig[], l: string, n: PodcastNarrationStyle, conf: BackendConfig): AsyncGenerator<string> {
    const logger = createLogger(conf);
    const fullLanguageName = getLanguageName(l);
    const prompt = getScriptGenerationPrompt(d.flatMap(chunkDocument), t, dur, s, spk, fullLanguageName, n);
    logger.debug('generatePodcastScriptStream called with:', { documents: d.length, topic: t, duration: dur, style: s, speakers: spk, language: l, narration: n, provider: conf.llm.provider });
    logger.debug('Full config:', conf);
    const openaiCompatibleProviders = ['openai', 'cerebras', 'mistral', 'xai', 'openrouter'];
    const claudeCompatibleProviders = ['claude'];
    
    if ((openaiCompatibleProviders.includes(conf.llm.provider) || claudeCompatibleProviders.includes(conf.llm.provider)) && conf.llm.openAiUrl) {
        console.log('DEBUG: Using OpenAI compatible provider:', conf.llm.provider, 'URL:', conf.llm.openAiUrl);
        try {
            let requestBody;
            let chatUrl;
            
            if (claudeCompatibleProviders.includes(conf.llm.provider)) {
                // Claude uses different API format
                requestBody = {
                    model: conf.llm.model || 'claude-4-6-sonnet',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 4000,
                    stream: true,
                    temperature: 0
                };
                chatUrl = conf.llm.openAiUrl; // Claude URL already includes the endpoint
                console.log('DEBUG: Using Claude API URL:', chatUrl);
            } else {
                // OpenAI-compatible format
                requestBody = {
                    model: conf.llm.model || 'gpt-4o',
                    messages: [{ role: 'user', content: prompt }],
                    n: 1,
                    stream: true,
                    temperature: 0
                };
                // Check if the URL already ends with /chat/completions (with or without version)
                if (conf.llm.openAiUrl.match(/\/chat\/completions\/?$/)) {
                    chatUrl = conf.llm.openAiUrl;
                } else {
                    // Remove trailing slash if present
                    const baseUrl = conf.llm.openAiUrl.replace(/\/$/, '');
                    chatUrl = `${baseUrl}/v1/chat/completions`;
                }
                console.log('DEBUG: Using OpenAI chat URL:', chatUrl);
            }
            
            console.log('DEBUG: Request body:', requestBody);
            const response = await fetch(chatUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${conf.llm.openAiKey}`
                },
                body: JSON.stringify(requestBody)
            });
            console.log('DEBUG: OpenAI response status:', response.status);
            
            if (!response.ok) {
                let errorMessage = `API Error: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    console.error('DEBUG: API Error details:', errorData);
                    if (errorData.error && errorData.error.message) {
                        errorMessage = errorData.error.message;
                    }
                } catch (e) {
                    console.warn('DEBUG: Could not parse error response JSON');
                }
                throw new Error(errorMessage);
            }

            if (!response.body) throw new Error("No response body from OpenAI stream.");
            console.log('DEBUG: OpenAI response body available, starting stream processing');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                console.log('DEBUG: Received OpenAI chunk:', chunk.substring(0, 200) + '...');
                const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
                for (const line of lines) {
                    const data = line.substring(6);
                    if (data.trim() === '[DONE]') {
                        console.log('DEBUG: OpenAI stream ended');
                        return;
                    }
                    try {
                        const json = JSON.parse(data);
                        let content = '';
                        if (json.choices && json.choices[0]) {
                            const choice = json.choices[0];
                            content = choice.delta?.content || choice.text || '';
                        } else if (json.content) {
                            content = json.content;
                        } else if (typeof json === 'string') {
                            content = json;
                        }
                        if (content) {
                            logger.debug('Yielding content:', content.substring(0, 100) + '...');
                            yield content;
                        }
                    } catch (e) {
                        console.log('DEBUG: Failed to parse JSON from line:', data, 'Error:', e);
                        // Try to extract content directly if it's not valid JSON
                        if (data && typeof data === 'string' && !data.startsWith('{')) {
                            console.log('DEBUG: Treating as raw content:', data.substring(0, 100) + '...');
                            yield data;
                        }
                    }
                }
            }
        } catch (e) {
            console.error('DEBUG: OpenAI request failed:', e);
            if (e instanceof TypeError) {
                throw createCorsError(conf.llm.openAiUrl);
            }
            throw e;
        }
    } else {
        console.log('DEBUG: Using Gemini provider');
        const responseStream = await ai.models.generateContentStream({ model: 'gemini-2.0-flash-exp', contents: [{parts: [{text: prompt}]}], config: { temperature: 0.7 } });
        console.log('DEBUG: Gemini stream started');
        for await (const chunk of responseStream) {
            const text = chunk.text || '';
            if (text) console.log('DEBUG: Yielding Gemini content:', text.substring(0, 100) + '...');
            yield text;
        }
        console.log('DEBUG: Gemini stream ended');
    }
}

export const generatePodcastMetadata = async (script: string, conf: BackendConfig, language: string = 'en'): Promise<{ title: string, description: string }> => {
    const prompt = `Based on this podcast script, generate a concise, catchy title and a one-paragraph description in ${language}. Return ONLY a JSON object with keys "title" and "description". Do not include any other text or formatting.\n\nScript:\n---\n${script.substring(0, 8000)}...`;
    console.log('DEBUG: generatePodcastMetadata called with provider:', conf.llm.provider);
    const openaiCompatibleProviders = ['openai', 'cerebras', 'mistral', 'xai', 'openrouter'];
    const claudeCompatibleProviders = ['claude'];
    
    if ((openaiCompatibleProviders.includes(conf.llm.provider) || claudeCompatibleProviders.includes(conf.llm.provider)) && conf.llm.openAiUrl) {
        console.log('DEBUG: Using OpenAI compatible provider for metadata:', conf.llm.provider, 'URL:', conf.llm.openAiUrl);
        try {
            let requestBody;
            let metadataUrl;
            
            if (claudeCompatibleProviders.includes(conf.llm.provider)) {
                // Claude uses different API format
                requestBody = {
                    model: conf.llm.model || 'claude-3-5-sonnet',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 1000,
                    temperature: 0
                };
                metadataUrl = conf.llm.openAiUrl; // Claude URL already includes the endpoint
                console.log('DEBUG: Using Claude metadata URL:', metadataUrl);
            } else {
                // OpenAI-compatible format
                requestBody = {
                    model: conf.llm.model || 'gpt-4o',
                    messages: [{ role: 'user', content: prompt }],
                    n: 1,
                    stream: false,
                    temperature: 0
                };
                // Check if the URL already ends with /chat/completions (with or without version)
                if (conf.llm.openAiUrl.match(/\/chat\/completions\/?$/)) {
                    metadataUrl = conf.llm.openAiUrl;
                } else {
                    // Remove trailing slash if present
                    const baseUrl = conf.llm.openAiUrl.replace(/\/$/, '');
                    metadataUrl = `${baseUrl}/v1/chat/completions`;
                }
                console.log('DEBUG: Using OpenAI metadata URL:', metadataUrl);
            }
            
            console.log('DEBUG: Metadata request body:', requestBody);
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${conf.llm.openAiKey}`
            };
            const response = await fetch(metadataUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody)
            });
            console.log('DEBUG: OpenAI metadata response status:', response.status);
            const data = await response.json();
            console.log('DEBUG: OpenAI metadata response data:', data);
            let content = '';
            if (data.choices && data.choices[0]) {
                const choice = data.choices[0];
                if (choice.message && choice.message.content) {
                    content = choice.message.content;
                } else if (choice.text) {
                    content = choice.text;
                } else if (choice.delta && choice.delta.content) {
                    content = choice.delta.content;
                }
            } else if (data.content) {
                content = data.content;
            } else if (typeof data === 'string') {
                content = data;
            }

            if (content) {
                // Remove thinking process tags that some models include
                const originalContent = content;
                content = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
                if (content !== originalContent) {
                    console.log('DEBUG: Removed thinking tags from metadata content');
                }

                console.log('DEBUG: Extracted content:', content.substring(0, 200) + '...');
                try {
                    const result = JSON.parse(content);
                    console.log('DEBUG: Parsed metadata result:', result);
                    return result;
                } catch (parseError) {
                    console.log('DEBUG: Content is not JSON, trying to extract JSON from text');
                    // Try to extract JSON from the text
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const result = JSON.parse(jsonMatch[0]);
                        console.log('DEBUG: Extracted and parsed JSON result:', result);
                        return result;
                    }
                    throw parseError;
                }
            }
            console.log('DEBUG: No valid content found in response');
            throw new Error('Invalid response format from OpenAI API');
        } catch (e) {
            console.error('DEBUG: OpenAI metadata request failed:', e);
            if (e instanceof TypeError) {
                throw createCorsError(conf.llm.openAiUrl);
            }
            throw e;
        }
    } else {
        console.log('DEBUG: Using Gemini for metadata');
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{parts: [{text: prompt}]}],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING }
                    },
                    required: ["title", "description"]
                }
            }
        });
        console.log('DEBUG: Gemini metadata response:', response);
        try {
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            console.log('DEBUG: Gemini metadata text:', text);
            const result = JSON.parse(text);
            console.log('DEBUG: Parsed Gemini metadata result:', result);
            return result;
        } catch (e) {
            console.error("Failed to parse JSON metadata from Gemini", { error: e, response: response.candidates?.[0]?.content?.parts?.[0]?.text });
            return { title: 'Untitled Podcast', description: 'Could not generate description.' };
        }
    }
};

export const fetchAvailableModels = async (conf: BackendConfig): Promise<AvailableModels[]> => {
    const openaiCompatibleProviders = ['openai', 'cerebras', 'mistral', 'xai', 'openrouter'];
    if (!openaiCompatibleProviders.includes(conf.llm.provider) || !conf.llm.openAiUrl) {
        return [];
    }
    
    // Claude doesn't have a public models endpoint
    if (conf.llm.provider === 'claude') {
        return [];
    }
    
    try {
        // Verschiedene mögliche Endpunkte in der Reihenfolge der Wahrscheinlichkeit
        const possibleEndpoints = [
            '/v1/models',           // Standard OpenAI Format & LM Studio
            '/v1/openai/models'    // Aktuell verwendeter Format
        ];
        
        let lastError: Error | null = null;
        
        for (const endpoint of possibleEndpoints) {
            try {
                // Remove /chat/completions or /v1/chat/completions from the end of the URL to get the base URL
                let baseUrl = conf.llm.openAiUrl.replace(/\/v1\/chat\/completions\/?$/, '').replace(/\/chat\/completions\/?$/, '');
                // Ensure no trailing slash
                baseUrl = baseUrl.replace(/\/$/, '');
                const modelsUrl = `${baseUrl}${endpoint}`;
                console.log('DEBUG: Trying to fetch models from:', modelsUrl);
                
                const response = await fetch(modelsUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${conf.llm.openAiKey}`
                    }
                });
                
                if (response.ok) {
                    console.log('DEBUG: Successfully fetched models from:', modelsUrl);
                    const data = await response.json();
                    
                    if (data.data && Array.isArray(data.data)) {
                        return data.data.map((model: any) => ({
                            id: model.id,
                            object: model.object,
                            created: model.created,
                            owned_by: model.owned_by
                        }));
                    }
                } else {
                    console.warn('DEBUG: Endpoint failed:', modelsUrl, response.status, response.statusText);
                }
            } catch (error) {
                console.warn('DEBUG: Endpoint error:', endpoint, error);
                lastError = error as Error;
                continue; // Nächsten Endpunkt versuchen
            }
        }
        
        // Wenn alle Endpunkte fehlgeschlagen sind, den letzten Fehler werfen
        if (lastError) {
            throw lastError;
        }
        
        return [];
    } catch (e) {
        console.error('DEBUG: Failed to fetch available models:', e);
        if (e instanceof TypeError) {
            throw createCorsError(conf.llm.openAiUrl);
        }
        throw e;
    }
};

const getEffectiveVoice = (spk: SpeakerConfig): string => {
    if (spk.voice === CUSTOM_VOICE_ID && spk.customVoice) {
        return spk.customVoice;
    }
    const allGeminiVoices = Object.values(VOICES_BY_LANGUAGE).flat().map((v: { name: string }) => v.name);
    if (spk.voice && allGeminiVoices.includes(spk.voice)) {
        return spk.voice;
    }
    return 'Puck';
};

const generateAudioGemini = async (text: string, style: PodcastNarrationStyle, voice: string): Promise<string> => {
    console.log('DEBUG: generateAudioGemini called with:', { textLength: text.length, style, voice });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `In a ${style} tone, say: ${text}` }] }],
        config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } }
    });
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    console.log('DEBUG: generateAudioGemini response:', { hasAudioData: !!audioData, dataLength: audioData.length });
    return audioData;
};

const generateAudioGeminiConversation = async (text: string, speakers: SpeakerConfig[], style: PodcastNarrationStyle): Promise<string> => {
    console.log('DEBUG: generateAudioGeminiConversation called with:', { textLength: text.length, speakers: speakers.map(s => ({ name: s.name, voice: getEffectiveVoice(s) })), style });
    const speakerVoiceConfigs = speakers.slice(0, 2).map(s => ({ speaker: s.name, voiceConfig: { prebuiltVoiceConfig: { voiceName: getEffectiveVoice(s) } } }));
    console.log('DEBUG: Speaker voice configs:', speakerVoiceConfigs);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `In a ${style} style, TTS the following conversation: ${text}` }] }],
        config: { responseModalities: [Modality.AUDIO], speechConfig: { multiSpeakerVoiceConfig: { speakerVoiceConfigs } } }
    });
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    console.log('DEBUG: generateAudioGeminiConversation response:', { hasAudioData: !!audioData, dataLength: audioData.length });
    return audioData;
};

const generateAudioCustom = async (url: string, text: string, speaker: string, lang?: string): Promise<string> => {
    console.log('DEBUG: generateAudioCustom called with:', { url, textLength: text.length, speaker, lang });
    try {
        const requestBody: any = { text, speaker_id: speaker, format: "pcm" };
        if (lang) {
            requestBody.language = lang;
        }
        console.log('DEBUG: Custom TTS request body:', requestBody);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        console.log('DEBUG: Custom TTS response status:', response.status);
        if (!response.ok) throw new Error(`Custom TTS API failed with status ${response.status}`);
        const data = await response.json();
        console.log('DEBUG: Custom TTS response data:', { hasAudioBase64: !!data.audio_base64, audioLength: data.audio_base64?.length });
        return data.audio_base64;
    } catch (e) {
        console.error('DEBUG: Custom TTS request failed:', e);
        if (e instanceof TypeError) {
            throw createCorsError(url);
        }
        throw e;
    }
};



export const generateAudioEdgeTTS = async (text: string, voice: string): Promise<string> => {
    console.log('DEBUG: generateAudioEdgeTTS called with:', { textLength: text.length, voice });
    
    try {
        // Browser-spezifische Implementierung von EdgeTTS
        // Die Browser-Variante hat ein etwas anderes API
        const tts = new EdgeTTS(text, voice);
        
        // Wir verwenden die synthesize-Methode, die das Audio generiert
        const result = await tts.synthesize();
        const audioBlob = result.audio;
        
        console.log('DEBUG: Audio blob type:', audioBlob.type);
        console.log('DEBUG: Audio blob size:', audioBlob.size);
        
        // Konvertiere Blob zu ArrayBuffer und dann zu Base64
        const audioBuffer = await audioBlob.arrayBuffer();
        const audioBytes = new Uint8Array(audioBuffer);
        const audioB64 = encodeBytesToBase64(audioBytes);
        
        console.log('DEBUG: Edge TTS generated audio, length:', audioB64.length);
        return audioB64;
    } catch (e) {
        console.error('DEBUG: Edge TTS generation failed:', e);
        throw e;
    }
};

export const generatePodcastAudio = async (script: string, style: PodcastStyle, speakers: SpeakerConfig[], n: PodcastNarrationStyle, conf: BackendConfig, onProgress: (p: number) => void, lang?: string): Promise<string> => {
    console.log('DEBUG: generatePodcastAudio called with:', { scriptLength: script.length, style, speakers: speakers.map(s => ({ name: s.name, voice: getEffectiveVoice(s) })), narrationStyle: n, ttsProvider: conf.tts.provider, language: lang || conf.tts.language });
    const chunks = chunkScriptForTTS(script);
    console.log('DEBUG: Script chunked into', chunks.length, 'chunks');
    
    const effectiveLang = lang || conf.tts.language || 'en';

    // Validiere die Token-Anzahl jedes Chunks
    const tokenValidation = validateChunkTokens(chunks);
    if (!tokenValidation.valid) {
        console.warn('WARNING: Some chunks exceed token limits:', tokenValidation.oversized);
        // Optional: Hier könnte eine zusätzliche Logik hinzugefügt werden
        // um oversized Chunks weiter aufzuteilen
    }

    const audioBuffers: AudioBuffer[] = [];
    onProgress(1);

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`DEBUG: Processing chunk ${i+1}/${chunks.length}, length: ${chunk.length}`);
        let audioB64 = "";
        let isCompressedFormat = false; // MP3, AAC, etc.

        try {
            if (conf.tts.provider === 'gemini') {
                console.log('DEBUG: Using Gemini TTS');
                isCompressedFormat = false; // Gemini gibt PCM zurück
                if (style === 'solo') {
                    audioB64 = await generateAudioGemini(chunk.replace(`${speakers[0].name}:`, '').trim(), n, getEffectiveVoice(speakers[0]));
                } else {
                    audioB64 = await generateAudioGeminiConversation(chunk, speakers, n);
                }
            } else if (conf.tts.provider === 'openai' && conf.tts.openAudioUrl) {
                console.log('DEBUG: Using OpenAI TTS provider with binary stream support');
                const speakerName = chunk.match(/^([^:]+):/)?.[1];
                const speaker = speakers.find(s => s.name === speakerName) || speakers[0];
                const text = chunk.replace(/^[^:]+:\s*/, '');
                const voice = speaker.voice || 'alloy'; // Default voice
                console.log('DEBUG: Speaker for chunk:', { speakerName, speaker: speaker.name, voice });
                
                 // Verwende die neue Binärstream-fähige Funktion
                 const result = await generateAudioOpenAIWithBinaryStream(conf.tts.openAudioUrl, text, voice, true, effectiveLang, 'openai', conf.tts.model);
                audioB64 = result.data;
                isCompressedFormat = result.format === 'mp3'; // Update basierend auf tatsächlichem Format
                console.log(`DEBUG: OpenAI chunk ${i+1} processed - format: ${result.format}, isBinary: ${result.isBinary}`);
            } else if (conf.tts.provider === 'openaudio-s1' && conf.tts.openAudioUrl) {
                console.log('DEBUG: Using custom TTS provider');
                isCompressedFormat = false; // Custom TTS gibt PCM zurück
                const speakerName = chunk.match(/^([^:]+):/)?.[1];
                const speaker = speakers.find(s => s.name === speakerName) || speakers[0];
                const text = chunk.replace(/^[^:]+:\s*/, '');
                console.log('DEBUG: Speaker for chunk:', { speakerName, speaker: speaker.name, voice: speaker.voice });
                audioB64 = await generateAudioCustom(conf.tts.openAudioUrl, text, speaker.voice, effectiveLang);
            } else if (conf.tts.provider === 'edge-tts') {
                console.log('DEBUG: Using Edge TTS provider');
                isCompressedFormat = true; // Edge TTS returns MP3 by default
                const speakerName = chunk.match(/^([^:]+):/)?.[1];
                const speaker = speakers.find(s => s.name === speakerName) || speakers[0];
                const text = chunk.replace(/^[^:]+:\s*/, '');
                const voice = speaker.voice || 'en-US-EmmaMultilingualNeural'; // Default voice
                console.log('DEBUG: Speaker for chunk:', { speakerName, speaker: speaker.name, voice });
                
                audioB64 = await generateAudioEdgeTTS(text, voice);
            }

            if (audioB64) {
                console.log(`DEBUG: Chunk ${i+1} generated audio, length: ${audioB64.length}`);

                const audioBytes = decodeBase64ToBytes(audioB64);
                
                // BESTIMME DAS FORMAT basierend auf dem Provider und Ergebnis
                let detectedFormat: 'mp3' | 'wav' | 'pcm' = 'pcm';
                
                if (conf.tts.provider === 'gemini') {
                    detectedFormat = 'pcm'; // Gemini gibt immer PCM zurück
                } else if (conf.tts.provider === 'openai') {
                    detectedFormat = isCompressedFormat ? 'mp3' : 'wav';
                } else if (conf.tts.provider === 'openaudio-s1') {
                    detectedFormat = 'pcm'; // Custom TTS gibt PCM zurück
                } else if (conf.tts.provider === 'edge-tts') {
                    detectedFormat = 'mp3'; // Edge TTS returns MP3
                }
                
                console.log(`DEBUG: Chunk ${i+1} format determined as: ${detectedFormat}, length: ${audioBytes.length}`);

                // KERNFIX: Konvertiere JEDEN Chunk zu unified PCM vor der Kombination
                // Das löst das Problem mit dem direkten MP3-Zusammenfügen
                try {
                    const pcmBuffer = await convertToUnifiedPcm(audioBytes, detectedFormat);
                    console.log(`DEBUG: Chunk ${i+1} converted to unified PCM, sample rate: ${pcmBuffer.sampleRate}, length: ${pcmBuffer.length}`);
                    audioBuffers.push(pcmBuffer);
                } catch (conversionError) {
                    console.error(`DEBUG: Failed to convert chunk ${i+1} to PCM:`, conversionError);
                    // Fallback: Versuche rohe PCM-Verarbeitung mit bestehender Logik
                    try {
                        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                        if (detectedFormat === 'wav' && audioBytes.length >= 44 && new TextDecoder().decode(audioBytes.slice(0, 4)) === 'RIFF') {
                            // WAV fallback
                            const arrayBuffer = new ArrayBuffer(audioBytes.length);
                            new Uint8Array(arrayBuffer).set(audioBytes);
                            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                            audioBuffers.push(audioBuffer);
                        } else {
                            // PCM fallback mit bestehender Funktion
                            handlePcmFallback(audioContext, audioBytes, i + 1, audioBuffers);
                        }
                        audioContext.close();
                        console.log(`DEBUG: Chunk ${i+1} processed with fallback method`);
                    } catch (fallbackError) {
                        console.error(`DEBUG: Fallback also failed for chunk ${i+1}:`, fallbackError);
                        // Continue mit anderen Chunks statt komplett abzubrechen
                    }
                }
            } else {
                console.warn(`DEBUG: No audio data generated for chunk ${i+1}`);
            }
        } catch (err) {
            console.warn(`Failed to process audio chunk ${i+1}/${chunks.length}`, err);
        }

        onProgress(Math.round(((i + 1) / chunks.length) * 95)); // 95% für die Chunks, 5% für finale Kombination
    }

    if (audioBuffers.length === 0) {
        console.error('DEBUG: No audio chunks were generated successfully');
        throw new Error("No audio data could be generated.");
    }

    console.log('DEBUG: Combining', audioBuffers.length, 'unified PCM audio buffers');

    try {
        // Verwende die neue memory-optimierte Buffer-Kombination
        const combinedBuffer = await combineAudioBuffersOptimized(audioBuffers, 24000);
        console.log('DEBUG: Audio buffers combined successfully, total samples:', combinedBuffer.length);

        // Konvertiere zu WAV mit bestehender Funktion
        const wavBytes = createWavBytesFromBuffer(combinedBuffer);
        console.log('DEBUG: Final WAV data length:', wavBytes.length);
        
        // Validiere die WAV-Datei
        if (wavBytes.length < 44) {
            throw new Error(`Invalid WAV file: too small (${wavBytes.length} bytes)`);
        }
        
        // Prüfe WAV-Header
        const header = new TextDecoder().decode(wavBytes.slice(0, 4));
        if (header !== 'RIFF') {
            throw new Error(`Invalid WAV file: missing RIFF header (got: ${header})`);
        }
        
        console.log('DEBUG: WAV file validation passed');
        
        // Erstelle eine Blob-URL mit korrektem MIME-Typ für bessere Wiedergabe-Unterstützung
        const wavBlob = new Blob([wavBytes.buffer as ArrayBuffer], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(wavBlob);
        
        console.log('DEBUG: Created audio URL:', audioUrl);
        console.log('DEBUG: Blob URL protocol:', audioUrl.startsWith('blob:') ? 'blob' : 'other');
        console.log('DEBUG: Blob size:', wavBlob.size);
        
        onProgress(100);
        return audioUrl;
        
    } catch (combinationError: any) {
        console.error('DEBUG: Failed to combine audio buffers:', combinationError);
        throw new Error(`Audio combination failed: ${combinationError?.message || 'Unknown error'}`);
    }
};

// Hilfsfunktion zum Erstellen von WAV-Bytes aus AudioBuffer
function createWavBytesFromBuffer(buffer: AudioBuffer): Uint8Array {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;

    // PCM-Daten als 16-bit signed integers
    const pcmData = new Int16Array(length);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i])) * 32767;
        pcmData[i] = Math.round(sample);
    }

    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmData.length * (bitsPerSample / 8);
    const fileSize = 36 + dataSize;

    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);

    // WAV Header schreiben
    writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // PCM-Daten schreiben
    let offset = 44;
    for (let i = 0; i < pcmData.length; i++, offset += 2) {
        view.setInt16(offset, pcmData[i], true);
    }

    return new Uint8Array(arrayBuffer);
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

// Hilfsfunktion zur Verarbeitung von PCM Fallback
function handlePcmFallback(audioContext: AudioContext, audioBytes: Uint8Array, chunkNumber: number, audioBuffers: AudioBuffer[]) {
    console.log(`DEBUG: Chunk ${chunkNumber} treated as PCM raw data, audio length: ${audioBytes.length}`);
    
    // Überprüfe, ob die Länge durch 2 teilbar ist (für 16-bit PCM)
    if (audioBytes.length % 2 !== 0) {
        console.warn(`WARNING: Chunk ${chunkNumber} audio data length (${audioBytes.length}) not divisible by 2, truncating`);
        // Schneide das letzte Byte ab
        const truncatedBytes = audioBytes.slice(0, audioBytes.length - 1);
        console.log(`DEBUG: Truncated to ${truncatedBytes.length} bytes`);
        const audioBuffer = audioContext.createBuffer(1, truncatedBytes.length / 2, 24000);
        const channelData = audioBuffer.getChannelData(0);
        const pcmData = new Int16Array(truncatedBytes.buffer);
        for (let j = 0; j < pcmData.length; j++) {
            channelData[j] = pcmData[j] / 32768.0;
        }
        audioBuffers.push(audioBuffer);
    } else {
        console.log(`DEBUG: Creating audio buffer with ${audioBytes.length / 2} samples`);
        const audioBuffer = audioContext.createBuffer(1, audioBytes.length / 2, 24000);
        const channelData = audioBuffer.getChannelData(0);
        const pcmData = new Int16Array(audioBytes.buffer);
        for (let j = 0; j < pcmData.length; j++) {
            channelData[j] = pcmData[j] / 32768.0;
        }
        audioBuffers.push(audioBuffer);
    }
}

export const generateVoicePreviewAudio = async (voice: string, conf: BackendConfig, language: string = 'en'): Promise<string> => {
    console.log('DEBUG: generateVoicePreviewAudio called with:', { voice, provider: conf.tts.provider, language });
    const previewText = getVoicePreviewText(language);
    
    if (conf.tts.provider === 'gemini') {
        if (!voice) throw new Error("Voice name required.");
        console.log('DEBUG: Generating voice preview for Gemini');
        const result = await generateAudioGemini(previewText, 'professional', voice);
        console.log('DEBUG: Voice preview generated, length:', result.length);
        return result;
    } else if (conf.tts.provider === 'openai' && conf.tts.openAudioUrl) {
        console.log('DEBUG: Generating voice preview for OpenAI');
        // Use binary stream for OpenAI preview as well, pass language
        const result = await generateAudioOpenAIWithBinaryStream(conf.tts.openAudioUrl, previewText, voice, true, language, 'openai', conf.tts.model);
        console.log('DEBUG: Voice preview generated, length:', result.data.length);
        return result.data;
    } else if (conf.tts.provider === 'edge-tts') {
        console.log('DEBUG: Generating voice preview for Edge TTS');
        if (!voice) throw new Error("Voice name required.");
        const result = await generateAudioEdgeTTS(previewText, voice);
        console.log('DEBUG: Voice preview generated, length:', result.length);
        return result;
    } else {
        console.log('DEBUG: Voice previews not supported for provider:', conf.tts.provider);
        throw new Error("Voice previews are only supported for Gemini, OpenAI and Edge TTS providers.");
    }
};

export const fetchAvailableVoices = async (conf: BackendConfig): Promise<{ id: string; name: string; gender: 'M' | 'F'; label: string }[]> => {
    console.log('DEBUG: fetchAvailableVoices called with provider:', conf.tts.provider);
    console.log('DEBUG: Full config:', conf);
    
    if (conf.tts.provider === 'openai' && conf.tts.openAudioUrl) {
        try {
            // Extract the base URL and add the voices endpoint
            const baseUrl = conf.tts.openAudioUrl.replace('/audio/speech', '');
            const voicesUrl = `${baseUrl}/audio/voices`;
            console.log('DEBUG: Fetching available voices from:', voicesUrl);
            
            const response = await fetch(voicesUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('DEBUG: Response status:', response.status);
            console.log('DEBUG: Response headers:', response.headers);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch voices: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('DEBUG: Available voices response:', data);
            
            if (data.voices && Array.isArray(data.voices)) {
                return data.voices.map((voice: any) => ({
                    id: voice.id,
                    name: voice.name,
                    gender: voice.gender || 'M',
                    label: voice.label || voice.name
                }));
            }
            
            return [];
        } catch (e) {
            console.error('DEBUG: Failed to fetch available voices:', e);
            if (e instanceof TypeError) {
                throw createCorsError(conf.tts.openAudioUrl);
            }
            throw e;
        }
    } else if (conf.tts.provider === 'edge-tts') {
        try {
            // Browser-spezifische Implementierung von EdgeTTS
            // Da wir direkt im Browser arbeiten, können wir die Standard-Stimmen abrufen
            const voicesList = await listVoices();
            
            // Falls die Funktion verfügbar ist, geben wir sie zurück
            if (Array.isArray(voicesList) && voicesList.length > 0) {
                console.log('DEBUG: Successfully fetched Edge TTS voices:', voicesList.length);
                return voicesList.map((voice: any) => ({
                    id: voice.ShortName || voice.Name,
                    name: voice.FriendlyName || voice.Name,
                    gender: voice.Gender || 'M',
                    label: voice.FriendlyName || voice.Name
                }));
            } else {
                console.warn('DEBUG: EdgeTTS listVoices returned no voices');
                // Fallback zu einer vordefinierten Liste von Stimmen
                return [
                    { id: 'en-US-EmmaMultilingualNeural', name: 'Emma (Multilingual)', gender: 'F', label: 'Emma (Multilingual)' },
                    { id: 'en-US-AndrewMultilingualNeural', name: 'Andrew (Multilingual)', gender: 'M', label: 'Andrew (Multilingual)' },
                    { id: 'en-US-BrianMultilingualNeural', name: 'Brian (Multilingual)', gender: 'M', label: 'Brian (Multilingual)' },
                    { id: 'de-DE-FlorianMultilingualNeural', name: 'Florian (Multilingual)', gender: 'M', label: 'Florian (Multilingual)' },
                    { id: 'de-DE-SeraphinaMultilingualNeural', name: 'Seraphina (Multilingual)', gender: 'F', label: 'Seraphina (Multilingual)' },
                ];
            }
        } catch (e) {
            console.error('DEBUG: Failed to fetch EdgeTTS voices:', e);
            // Fallback zu einer vordefinierten Liste von Stimmen
            return [
                { id: 'en-US-EmmaMultilingualNeural', name: 'Emma (Multilingual)', gender: 'F', label: 'Emma (Multilingual)' },
                { id: 'en-US-AndrewMultilingualNeural', name: 'Andrew (Multilingual)', gender: 'M', label: 'Andrew (Multilingual)' },
                { id: 'en-US-BrianMultilingualNeural', name: 'Brian (Multilingual)', gender: 'M', label: 'Brian (Multilingual)' },
                { id: 'de-DE-FlorianMultilingualNeural', name: 'Florian (Multilingual)', gender: 'M', label: 'Florian (Multilingual)' },
                { id: 'de-DE-SeraphinaMultilingualNeural', name: 'Seraphina (Multilingual)', gender: 'F', label: 'Seraphina (Multilingual)' },
            ];
        }
    } else {
        console.log('DEBUG: Voice fetching not supported for provider:', conf.tts.provider);
        // Return empty array to let the frontend handle fallbacks based on language
        return [];
    }
}
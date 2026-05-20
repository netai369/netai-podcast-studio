const CHUNK_SIZE = 15000;
const CHUNK_OVERLAP = 500;

// Token-basierte Chunking-Konstanten für TTS
const SAFE_MAX_CHARS = 1000; // Silero TTS unterstützt max 1000 Zeichen stabil

export const chunkDocument = (doc: { name: string, content: string }): Array<{ name: string, content: string }> => {
    if (doc.content.length <= CHUNK_SIZE) return [{ ...doc }];
    const chunks: string[] = [];
    for (let i = 0; i < doc.content.length; i += (CHUNK_SIZE - CHUNK_OVERLAP)) {
        chunks.push(doc.content.substring(i, i + CHUNK_SIZE));
    }
    if (chunks.length === 1) return [{ ...doc }];
    return chunks.map((chunkContent, index) => ({
        name: `${doc.name} (Part ${index + 1}/${chunks.length})`,
        content: chunkContent,
    }));
};

export const chunkScriptForTTS = (script: string, maxLength: number = SAFE_MAX_CHARS): string[] => {
    const chunks: string[] = [];
    if (!script) return chunks;

    let text = script;

    while (text.length > 0) {
        // Wenn der Text kurz genug ist, direkt hinzufügen
        if (text.length <= maxLength) {
            chunks.push(text);
            break;
        }

        // Finde den besten Split-Punkt innerhalb der sicheren Grenze
        let splitPos = text.lastIndexOf('.', maxLength);
        if (splitPos === -1) splitPos = text.lastIndexOf('?', maxLength);
        if (splitPos === -1) splitPos = text.lastIndexOf('!', maxLength);
        if (splitPos === -1) splitPos = text.lastIndexOf('\n', maxLength);
        if (splitPos === -1) splitPos = text.lastIndexOf(';', maxLength);
        if (splitPos === -1) splitPos = text.lastIndexOf(':', maxLength);
        if (splitPos === -1) splitPos = maxLength; // Fallback: harter Schnitt

        // Vermeide leere Chunks
        if (splitPos === 0) splitPos = maxLength;

        const chunk = text.substring(0, splitPos).trim();
        chunks.push(chunk);
        text = text.substring(splitPos).trim();
    }

    return chunks;
};

/**
 * Chunks script by speaker turns for conversation-style scripts
 * This ensures proper voice alternation for dialogue scripts
 */
export const chunkScriptBySpeakerTurns = (script: string): string[] => {
    const chunks: string[] = [];
    if (!script) return chunks;

    // Split by newlines first
    const lines = script.split('\n').filter(line => line.trim());

    for (const line of lines) {
        // Check if this line has a speaker prefix (name:)
        if (line.match(/^[^:]+:/)) {
            chunks.push(line);
        } else {
            // If no speaker prefix, append to the last chunk
            if (chunks.length > 0) {
                chunks[chunks.length - 1] += '\n' + line;
            } else {
                chunks.push(line);
            }
        }
    }

    return chunks;
};

// Hilfsfunktionen für Token-Validierung
export const estimateTokenCount = (text: string): number => {
    // Einfache Schätzung: ~1.3 Zeichen pro Token für europäische Sprachen
    return Math.ceil(text.length * 1.3);
};

export const validateChunkTokens = (chunks: string[]): { valid: boolean; oversized: string[] } => {
    const oversized: string[] = [];
    const maxTokens = 5000;

    for (const chunk of chunks) {
        const tokenCount = estimateTokenCount(chunk);
        if (tokenCount > maxTokens) {
            oversized.push(`Chunk mit ${tokenCount} Token (Max: ${maxTokens})`);
        }
    }

    return {
        valid: oversized.length === 0,
        oversized
    };
};

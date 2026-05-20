# Fix für das Chunking-Problem in chunkScriptForTTS

## Problemanalyse

Das aktuelle `chunkScriptForTTS` in `src/utils/text.ts` teilt Text basierend auf Zeichenlänge (maxLength: 4500), nicht auf Token. Die Silero Engine hat eine Token-Grenze von 5000, aber durch die Zeichen-basierte Chunking-Logik können längere Textabschnitte mehr als 5000 Token enthalten, was zum Absturz der Engine führt.

## Lösung: Token-basiertes Chunking

### 1. Neue Konstanten

Füge am Anfang von `src/utils/text.ts` hinzu:

```typescript
// Token-basierte Chunking-Konstanten
const MAX_TOKENS_PER_CHUNK = 4800; // Sicherheitspuffer unter 5000 Token
const TOKEN_TO_CHAR_RATIO = 0.75; // Durchschnittliches Zeichen-zu-Token-Verhältnis
const SAFE_MAX_CHARS = Math.floor(MAX_TOKENS_PER_CHUNK * TOKEN_TO_CHAR_RATIO);
```

### 2. Verbesserte chunkScriptForTTS Funktion

Ersetze die bestehende Funktion durch:

```typescript
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
        if (splitPos === -1) splitPos = text.lastIndexOf(',', maxLength);
        if (splitPos === -1) splitPos = text.lastIndexOf(' ', maxLength);
        
        // Wenn kein guter Trennpunkt gefunden wurde, hart an maxLength teilen
        if (splitPos === -1 || splitPos < maxLength * 0.7) {
            splitPos = maxLength;
        } else {
            splitPos += 1; // Einschließen des Trennzeichens im nächsten Chunk
        }
        
        chunks.push(text.substring(0, splitPos));
        text = text.substring(splitPos).trim();
    }
    
    return chunks;
};
```

### 3. Optionale Token-Validierungsfunktion

Füge zur Validierung vor dem Senden an die TTS-Engine hinzu:

```typescript
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
```

### 4. Anpassung der generatePodcastAudio Funktion

In `src/services/ttsServices.ts`, Zeile 445, füge Token-Validierung hinzu:

```typescript
const chunks = chunkScriptForTTS(script);
console.log('DEBUG: Script chunked into', chunks.length, 'chunks');

// Validiere die Token-Anzahl jedes Chunks
const tokenValidation = validateChunkTokens(chunks);
if (!tokenValidation.valid) {
    console.warn('WARNING: Some chunks exceed token limits:', tokenValidation.oversized);
    // Optional: Hier könnte eine zusätzliche Logik hinzugefügt werden
    // um oversized Chunks weiter aufzuteilen
}
```

## Implementierungsreihenfolge

1. **Konstanten hinzufügen** - Füge die neuen Konstanten am Anfang von `src/utils/text.ts` hinzu
2. **chunkScriptForTTS aktualisieren** - Ersetze die bestehende Funktion durch die token-basierte Version
3. **Hilfsfunktionen hinzufügen** - Füge `estimateTokenCount` und `validateChunkTokens` hinzu
4. **generatePodcastAudio anpassen** - Füge Token-Validierung hinzu
5. **Testen** - Überprüfe das neue Chunking-Verhalten mit verschiedenen Textlängen

## Vorteile der neuen Lösung

- **Token-basiert**: Stellt sicher, dass keine Chunk die 5000-Token-Grenze überschreitet
- **Sicherheitspuffer**: 4800 Token pro Chunk gibt Puffer für unvorhergesehene Tokenisierung
- **Verbesserte Splitting-Logik**: Nutzt mehr Trennzeichen für natürlichere Sprachabschnitte
- **Validierung**: Kann oversized Chunks erkennen und melden
- **Rückwärtskompatibel**: Behält die gleiche API bei, nur die interne Logik wird verbessert

## Testfälle

- Kurze Texte (< 100 Zeichen)
- Mittellange Texte (1000-4000 Zeichen)
- Lange Texte (> 10000 Zeichen)
- Texte ohne Trennzeichen
- Texte mit vielen Zeilenumbrüchen
- Texte mit verschiedenen Satzzeichen
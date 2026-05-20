#!/usr/bin/env python3
"""
Enhanced Gradio Web UI for NetAI Stack
- Document Processing & Search
- License Plate Detection (Single & Batch)
- Audio Transcription & Search
- Vision Chat
- System Monitoring
"""

import gradio as gr
import requests
from PIL import Image
import io
import base64
from pathlib import Path
import json
import os
import traceback
import uuid
from typing import List, Tuple

# API Configuration
API_URL = os.getenv("API_URL", "http://netaistack-service-api:8080")
FAST_ALPR_URL = os.getenv("FAST_ALPR_URL", "http://netaistack-fast-alpr:8002")

def safe_request(func):
    """Decorator for safe API calls with error handling"""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except requests.exceptions.Timeout:
            return "⏱️ Timeout: Die Anfrage dauerte zu lange."
        except requests.exceptions.ConnectionError:
            return "🔌 Verbindungsfehler: API nicht erreichbar."
        except requests.exceptions.RequestException as e:
            try:
                if hasattr(e, 'response') and e.response:
                    error_json = e.response.json()
                    return f"API Fehler: {error_json.get('detail', str(e))}"
            except:
                pass
            return f"Anfragefehler: {str(e)}"
        except Exception as e:
            traceback.print_exc()
            return f"Fehler: {str(e)}"
    return wrapper

# ==================== DOCUMENT FUNCTIONS ====================

@safe_request
def process_document(file):
    """Verarbeitet Dokument (PDF/Bild)"""
    if file is None:
        return "⚠️ Bitte laden Sie eine Datei hoch."
    
    with open(file.name, 'rb') as f:
        files = {'file': f}
        response = requests.post(
            f"{API_URL}/api/v1/documents/process",
            files=files,
            timeout=120
        )
        response.raise_for_status()
    
    result = response.json()
    
    # Formatiere Ausgabe
    output = f"## ✅ Dokument verarbeitet\n\n"
    output += f"**Datei**: {result.get('filename', 'N/A')}\n\n"
    output += f"**Seiten**: {result.get('pages', 0)}\n\n"
    output += "---\n\n"
    
    if result.get('results'):
        for page in result['results']:
            extracted = page.get('extracted', {})
            output += f"### 📄 Seite {page['page']}\n\n"
            output += f"**Dokument-ID**: `{page['document_id']}`\n\n"
            output += f"**Typ**: {extracted.get('type', 'N/A')}\n\n"
            
            summary = extracted.get('summary', 'N/A')
            output += f"**Zusammenfassung**:\n\n{summary}\n\n"
            
            text = extracted.get('text', 'N/A')
            if len(text) > 500:
                output += f"**Text** (Auszug):\n\n{text[:500]}...\n\n"
            else:
                output += f"**Text**:\n\n{text}\n\n"
            
            metadata = extracted.get('metadata', 'N/A')
            if metadata and metadata != 'N/A':
                output += f"**Metadaten**: {metadata}\n\n"
            
            output += "---\n\n"
    
    return output

@safe_request
def search_documents(query: str, limit: int) -> str:
    """Search documents by semantic similarity"""
    response = requests.get(
        f"{API_URL}/api/v1/documents/search",
        params={'query': query, 'limit': limit},
        timeout=30
    )
    response.raise_for_status()
    result = response.json()
    
    output = f"**Suchanfrage**: {result.get('query', 'N/A')}\n\n"
    
    if result.get('results'):
        for i, hit in enumerate(result['results'], 1):
            output += f"**{i}. Ergebnis** (Ähnlichkeit: {hit.get('score', 0):.2f})\n"
            output += f"- Datei: {hit.get('filename', 'N/A')} (Seite {hit.get('page', 'N/A')})\n"
            output += f"- Text: {hit.get('text', 'N/A')[:250]}...\n\n"
    else:
        output += "Keine Ergebnisse gefunden."
    
    return output

# ==================== LICENSE PLATE FUNCTIONS ====================

@safe_request
def detect_license_plate(image) -> Tuple[str, Image.Image]:
    """Detect license plate in a single image"""
    if image is None:
        return "Bitte laden Sie ein Bild hoch.", None
    
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    files = {'file': ('image.png', img_byte_arr, 'image/png')}
    response = requests.post(
        f"{FAST_ALPR_URL}/api/v1/recognize?return_image=true",
        files=files,
        timeout=60
    )
    response.raise_for_status()
    
    result = response.json()
    plates = result.get('plates', [])
    
    output = f"**Status**: {result.get('status', 'N/A')}\n"
    output += f"**Verarbeitungszeit**: {result.get('processing_time_ms', 0):.0f}ms\n\n"
    
    if plates:
        for i, plate in enumerate(plates, 1):
            output += f"**Kennzeichen {i}**: {plate.get('plate_text', 'N/A')}\n"
            output += f"- Konfidenz: {plate.get('confidence', 0):.1%}\n"
            output += f"- Position: {plate.get('bbox', 'N/A')}\n\n"
    else:
        output += "Keine Kennzeichen erkannt."
    
    annotated_img = None
    if 'annotated_image' in result:
        try:
            img_data = result['annotated_image'].split(',')[1]
            img_bytes = base64.b64decode(img_data)
            annotated_img = Image.open(io.BytesIO(img_bytes))
        except:
            pass
    
    return output, annotated_img

@safe_request
def detect_license_plate_batch(batch_files, return_images: bool, confidence_threshold: float) -> str:
    """Batch detect license plates in multiple images"""
    if not batch_files:
        return "Bitte laden Sie mindestens ein Bild hoch."
    
    try:
        files_list = []
        
        for file_obj in batch_files:
            # Handle Gradio file objects
            if isinstance(file_obj, dict) and 'name' in file_obj:
                file_path = file_obj['name']
            else:
                file_path = file_obj
            
            with open(file_path, 'rb') as f:
                file_content = f.read()
                filename = Path(file_path).name
                files_list.append(('files', (filename, file_content, 'image/jpeg')))
        
        response = requests.post(
            f"{FAST_ALPR_URL}/api/v1/recognize-batch?"
            f"return_image={return_images}&confidence_threshold={confidence_threshold}",
            files=files_list,
            timeout=300
        )
        response.raise_for_status()
        
    except Exception as e:
        traceback.print_exc()
        return f"Fehler beim Batch-Processing: {str(e)}"
    
    result = response.json()
    
    output = f"**Bilder verarbeitet**: {result.get('total_images', 0)}\n"
    output += f"**Gesamtzeit**: {result.get('total_processing_time_ms', 0):.0f}ms "
    output += f"| **Durchschnitt**: {result.get('avg_time_per_image_ms', 0):.0f}ms/Bild\n\n"
    
    results = result.get('results', [])
    detected_count = sum(1 for r in results if r.get('plates'))
    output += f"**Kennzeichen gefunden**: {detected_count}/{len(results)} Bilder\n\n"
    output += "---\n\n"
    
    for idx, img_result in enumerate(results, 1):
        filename = img_result.get('filename', 'Unbekannt')
        status = img_result.get('status', 'unknown')
        plates = img_result.get('plates', [])
        
        output += f"**{idx}. {filename}** ({status})\n"
        
        if status == "error":
            output += f"- Fehler: {img_result.get('error', 'Unbekannter Fehler')}\n\n"
        elif plates:
            for plate_idx, plate in enumerate(plates, 1):
                output += f"  - Kennzeichen {plate_idx}: **{plate.get('plate_text', 'N/A')}** "
                output += f"(Konfidenz: {plate.get('confidence', 0):.1%})\n"
            output += "\n"
        else:
            output += "- Keine Kennzeichen erkannt\n\n"
    
    return output

# ==================== AUDIO FUNCTIONS ====================

@safe_request
def transcribe_audio(audio_file, language, store_in_db):
    """Transkribiert Audio"""
    if audio_file is None:
        return "⚠️ Bitte laden Sie eine Audio-Datei hoch."
    
    with open(audio_file, 'rb') as f:
        files = {'audio': (Path(audio_file).name, f, 'audio/mpeg')}
        data = {
            'language': language if language and language != "auto" else None,
            'store_in_db': str(store_in_db).lower()
        }
        
        response = requests.post(
            f"{API_URL}/api/v1/audio/transcribe",
            files=files,
            data=data,
            timeout=300
        )
        response.raise_for_status()
    
    result = response.json()
    
    output = "## 🎤 Transkription\n\n"
    
    if result.get('audio_id'):
        output += f"**Audio-ID**: `{result['audio_id']}`\n\n"
    
    output += f"**Datei**: {result.get('filename', 'N/A')}\n\n"
    output += f"**Sprache**: {result.get('language', 'N/A')}\n\n"
    
    duration = result.get('duration')
    if duration:
        output += f"**Dauer**: {duration:.1f}s\n\n"
    

    full_response = result.get('full_response', {})
    if full_response and 'segments' in full_response:
        output += f"**Segmente**: {len(full_response['segments'])}\n\n"
        for segment in full_response['segments']:
            start = segment.get('start')
            end = segment.get('end')
            text = segment.get('text')

            start_display = f"{start}s" if start is not None else 'N/A'
            end_display = f"{end}s" if end is not None else 'N/A'
            text_display = text if text is not None else 'N/A'

            output += f"- **{start_display} - {end_display}**: {text_display}\n"
    elif result.get('transcript'):
        output += f"**Transkript**: {result.get('transcript')}\n\n"
    
    return output

@safe_request
def search_audio(query: str, limit: int) -> str:
    """Search audio transcripts by semantic similarity"""
    response = requests.get(
        f"{API_URL}/api/v1/audio/search",
        params={'query': query, 'limit': limit},
        timeout=30
    )
    response.raise_for_status()
    result = response.json()
    
    output = f"**Suchanfrage**: {result.get('query', 'N/A')}\n\n"
    
    if result.get('results'):
        for i, hit in enumerate(result['results'], 1):
            output += f"**{i}. Ergebnis** (Ähnlichkeit: {hit.get('score', 0):.2f})\n"
            output += f"- Datei: {hit.get('filename', 'N/A')}\n"
            output += f"- Sprache: {hit.get('language', 'N/A')} | Dauer: {hit.get('duration', 0):.1f}s\n"
            output += f"- Text: {hit.get('transcript', 'N/A')[:250]}...\n\n"
    else:
        output += "Keine Ergebnisse gefunden."
    
    return output

# ==================== SYSTEM FUNCTIONS ====================

@safe_request
def get_system_health() -> str:
    """Get system health status"""
    response = requests.get(f"{API_URL}/health", timeout=10)
    response.raise_for_status()
    data = response.json()
    
    output = f"**Status**: {data.get('status', 'N/A')}\n"
    output += f"**Service**: {data.get('service', 'N/A')} v{data.get('version', 'N/A')}\n\n"
    
    output += "**Modelle**:\n"
    for model_type, model_name in data.get('models', {}).items():
        output += f"- {model_type}: {model_name}\n"
    
    output += "\n**Komponenten**:\n"
    for component, status in data.get('health', {}).items():
        emoji = "✅" if status == "online" else "⏳" if status == "loading" else "❌"
        output += f"- {emoji} {component}: {status}\n"
    
    return output

@safe_request
def get_database_stats() -> str:
    """Get database statistics"""
    response = requests.get(f"{API_URL}/api/v1/stats", timeout=10)
    response.raise_for_status()
    data = response.json()
    
    output = f"**Embedding Modell**: {data.get('embedding_model', 'N/A')}\n\n"
    output += "**Sammlungen**:\n"
    
    for collection, stats in data.get('collections', {}).items():
        count = stats.get('count', 0)
        output += f"- {collection}: {count} Einträge\n"
    
    return output

# ==================== GRADIO UI ====================

def create_ui():
    """Create the Gradio interface"""
    
    with gr.Blocks(
        title="NetAI Stack",
        theme=gr.themes.Soft()
    ) as demo:
        
        gr.Markdown("""
        # NetAI Stack - Web UI
        Integrierte Plattform für Dokumentenverarbeitung, Kennzeichenerkennung und Audio-Transkription
        
        🚀 **Powered by**: OpenVINO 2025.3 | MiniCPM-V 4.5 | Whisper | FastALPR | Qdrant
        """)
        
        with gr.Tabs():
            
            # ==================== DOCUMENTS ====================
            # Tab 1: Dokumenten-Verarbeitung
            with gr.TabItem("📄 Dokumente"):
                gr.Markdown("### Dokument hochladen und analysieren")
                gr.Markdown("Unterstützt: PDF, PNG, JPG, JPEG oder Webcam")
                
                with gr.Row():
                    with gr.Column(scale=1):
                        with gr.Tabs():
                            with gr.TabItem("📁 Datei"):
                                doc_file = gr.File(
                                    label="Dokument hochladen",
                                    file_types=[".pdf", ".png", ".jpg", ".jpeg"]
                                )
                            with gr.TabItem("📷 Webcam"):
                                doc_webcam = gr.Image(
                                    label="Dokument fotografieren",
                                    type="pil"
                                )
                        doc_button = gr.Button("🔍 Analysieren", variant="primary", size="lg")
                    
                    with gr.Column(scale=2):
                        doc_output = gr.Markdown(label="Ergebnis")
            
                # Handler für beide Inputs
                def process_document_unified(file, webcam):
                    """Verarbeitet entweder Datei oder Webcam-Bild"""
                    if webcam is not None:
                        # Webcam-Bild in temporäre Datei speichern
                        import tempfile
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp:
                            webcam.save(tmp.name, format='PNG')
                            tmp_path = tmp.name
                        
                        # Erstelle ein File-ähnliches Objekt
                        class TempFile:
                            def __init__(self, path):
                                self.name = path
                        
                        return process_document(TempFile(tmp_path))
                    elif file is not None:
                        return process_document(file)
                    else:
                        return "⚠️ Bitte laden Sie eine Datei hoch oder machen Sie ein Foto."
                
                doc_button.click(
                    fn=process_document_unified,
                    inputs=[doc_file, doc_webcam],
                    outputs=[doc_output]
                )
            
                gr.Markdown("---")
                
                # Dokument-Suche
                gr.Markdown("### 🔎 Dokumente durchsuchen")
                with gr.Row():
                    with gr.Column(scale=1):
                        search_query = gr.Textbox(
                            label="Suchanfrage",
                            placeholder="z.B. Rechnung Januar 2025",
                            lines=2
                        )
                        search_limit = gr.Slider(
                            minimum=1,
                            maximum=20,
                            value=5,
                            step=1,
                            label="Anzahl Ergebnisse"
                        )
                        search_button = gr.Button("🔍 Suchen", variant="primary", size="lg")
                    
                    with gr.Column(scale=2):
                        search_output = gr.Markdown(label="Suchergebnisse")
                
                search_button.click(
                    fn=search_documents,
                    inputs=[search_query, search_limit],
                    outputs=[search_output]
                )
            
            # ==================== LICENSE PLATES ====================
            with gr.TabItem("🚗 Kennzeichen"):
                with gr.Tabs():
                    
                    with gr.TabItem("📸 Einzelbild"):
                        with gr.Row():
                            with gr.Column(scale=1):
                                plate_image = gr.Image(
                                    label="Fahrzeugbild",
                                    type="pil",
                                    sources=["upload", "webcam"]
                                )
                                plate_button = gr.Button("Erkennen", variant="primary", size="lg")
                            with gr.Column(scale=1):
                                plate_output = gr.Textbox(label="Ergebnis", lines=8)
                                plate_annotated = gr.Image(label="Annotiertes Bild")
                        
                        plate_button.click(
                            fn=detect_license_plate,
                            inputs=[plate_image],
                            outputs=[plate_output, plate_annotated]
                        )
                    
                    with gr.TabItem("📸➕ Batch"):
                        gr.Markdown("Mehrere Bilder gleichzeitig verarbeiten")
                        
                        with gr.Row():
                            with gr.Column(scale=1):
                                batch_images = gr.File(
                                    label="Bilder hochladen",
                                    file_count="multiple",
                                    file_types=["image"]
                                )
                                batch_confidence = gr.Slider(
                                    minimum=0,
                                    maximum=1,
                                    value=0.5,
                                    step=0.05,
                                    label="Konfidenz-Schwelle"
                                )
                                batch_return = gr.Checkbox(
                                    label="Annotierte Bilder zurückgeben",
                                    value=False
                                )
                                batch_button = gr.Button("Batch Verarbeitung", variant="primary", size="lg")
                            with gr.Column(scale=2):
                                batch_output = gr.Textbox(
                                    label="Ergebnisse",
                                    lines=12,
                                    max_lines=20
                                )
                        
                        batch_button.click(
                            fn=detect_license_plate_batch,
                            inputs=[batch_images, batch_return, batch_confidence],
                            outputs=[batch_output]
                        )
            
            # ==================== AUDIO ====================
            with gr.TabItem("🎤 Audio"):
                with gr.Tabs():
                    
                    with gr.TabItem("🎙️ Transkription"):
                        with gr.Row():
                            with gr.Column(scale=1):
                                audio_file = gr.Audio(
                                    label="Audio hochladen",
                                    type="filepath"
                                )
                                audio_language = gr.Dropdown(
                                    choices=["auto", "de", "en", "fr", "es", "it"],
                                    value="auto",
                                    label="Sprache"
                                )
                                audio_store = gr.Checkbox(
                                    label="In Datenbank speichern",
                                    value=True
                                )
                                audio_button = gr.Button("Transkribieren", variant="primary", size="lg")
                            with gr.Column(scale=2):
                                audio_output = gr.Textbox(
                                    label="Transkript",
                                    lines=10,
                                    max_lines=15
                                )
                        
                        audio_button.click(
                            fn=transcribe_audio,
                            inputs=[audio_file, audio_language, audio_store],
                            outputs=[audio_output]
                        )
                    
                    with gr.TabItem("🔍 Suche"):
                        with gr.Row():
                            with gr.Column(scale=1):
                                audio_query = gr.Textbox(
                                    label="Suchanfrage",
                                    placeholder="z.B. Meeting Projekt",
                                    lines=2
                                )
                                audio_limit = gr.Slider(
                                    minimum=1,
                                    maximum=20,
                                    value=5,
                                    label="Anzahl Ergebnisse"
                                )
                                audio_search_btn = gr.Button("Suchen", variant="primary", size="lg")
                            with gr.Column(scale=2):
                                audio_search_output = gr.Textbox(
                                    label="Ergebnisse",
                                    lines=10,
                                    max_lines=15
                                )
                        
                        audio_search_btn.click(
                            fn=search_audio,
                            inputs=[audio_query, audio_limit],
                            outputs=[audio_search_output]
                        )
            
            # ==================== SYSTEM ====================
            with gr.TabItem("ℹ️ System"):
                with gr.Row():
                    with gr.Column():
                        health_output = gr.Textbox(label="System Status", lines=10, interactive=False)
                    with gr.Column():
                        stats_output = gr.Textbox(label="Datenbank Statistiken", lines=10, interactive=False)
                
                refresh_button = gr.Button("Aktualisieren", variant="primary", size="lg")
                
                def refresh():
                    return get_system_health(), get_database_stats()
                
                refresh_button.click(
                    fn=refresh,
                    outputs=[health_output, stats_output]
                )
                
                # Auto-load on startup
                demo.load(
                    fn=refresh,
                    outputs=[health_output, stats_output]
                )
        
        gr.Markdown("""
        ---
        ### 📖 Dokumentation & Tools
        - **Qdrant Dashboard**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard)
        - **API Dokumentation**: [http://localhost:8080/docs](http://localhost:8080/docs)
        - **FastALPR Dokumentation**: [http://localhost:8002/docs](http://localhost:8002/docs)
        - **Whisper Playground**: OpenAI-kompatibel via faster-whisper-server [http://localhost:8001/](http://localhost:8001/)
        - **Modelchooser**: [http://localhost:7860/](http://localhost:7860/)
        
        **Powered by**: OpenVINO 2025.3 | Intel ARC A770 | MiniCPM-V 4.5 | Whisper Distil Large V3 | FastALPR v0.3 | Qdrant
        """)
    
    return demo

if __name__ == "__main__":
    demo = create_ui()
    demo.launch(
        server_name="0.0.0.0",
        server_port=3000,
        share=False,
        show_error=True
    )
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NetAI Podcast Studio

AI-Powered Podcast Creation Platform

## Overview

NetAI Podcast Studio is a comprehensive web application that enables users to create professional podcasts from their documents using advanced AI technologies. The platform supports multiple AI providers for both language model (LLM) and text-to-speech (TTS) services, offering flexibility and customization options.

## Features

### Core Functionality
- **Document Upload & Parsing**: Supports PDF, DOCX, ODT, and TXT files
- **AI-Powered Script Generation**: Creates podcast scripts based on uploaded documents
- **Text-to-Speech Synthesis**: Converts scripts to audio with multiple voice options
- **Podcast Management**: Create, edit, and manage your podcast collection
- **Multi-Language Support**: Supports 18+ languages with localized interfaces

### AI Provider Support

#### Language Models (LLM)
- **Google Gemini**: Default provider with built-in integration
- **OpenAI Compatible**: Supports OpenAI, Cerebras, Mistral, xAI (Grok), and OpenRouter
- **Anthropic Claude**: Specialized support for Claude models
- **Custom APIs**: Configure any OpenAI-compatible API endpoint

#### Text-to-Speech (TTS)
- **Google Gemini TTS**: High-quality voice synthesis
- **OpenAI TTS**: Standard OpenAI voices (alloy, echo, fable, onyx, nova, shimmer)
- **Microsoft Edge TTS**: Free browser-based multilingual voices
- **OpenAudio-S1 / XTTS**: Custom TTS server support
- **Supertonic**: OpenAI-compatible TTS with voice mixing capabilities

### Podcast Customization
- **Multiple Formats**: Solo host or conversation styles
- **Narration Styles**: Professional, Educational, Conversational, Storytelling, Documentary, Explainer
- **Duration Control**: Preset durations (0.5-15 minutes) or custom lengths
- **Speaker Configuration**: Customize speaker names and voices
- **Voice Preview**: Test voices before generating full podcasts

### User Management
- **Authentication System**: User registration, login, and password recovery
- **Persistent Storage**: Podcasts are saved per user account
- **Settings Management**: Configure AI providers, API keys, and debug options

## Technical Stack

### Frontend
- **Framework**: Svelte 4 with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: Svelte stores with localStorage persistence

### AI Services
- **Google GenAI SDK**: For Gemini integration
- **Edge TTS Universal**: Browser-based TTS
- **LAME.js**: MP3 encoding
- **PDF.js**: PDF parsing
- **Mammoth.js**: DOCX parsing
- **JSZip**: ODT parsing

### Audio Processing
- **Web Audio API**: Audio buffer manipulation
- **PCM/WAV/MP3 Conversion**: Multiple format support
- **Chunked Processing**: Efficient handling of large audio files
- **Memory Optimization**: Progressive audio buffer combination

## Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- API keys for your chosen AI providers

### Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure API keys**:
   - Create `.env.local` file
   - Add your Gemini API key: `VITE_API_KEY=your_gemini_api_key`
   - For other providers, configure through the Settings page

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   Open `http://localhost:5173` in your browser

### Production Build

```bash
npm run build
npm run preview
```

### Docker Deployment

The project includes a Docker configuration for easy deployment:

```bash
# Build and run with Docker Compose
docker-compose up --build
```

The application will be available at `http://localhost:8080`

## Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Gemini API Key (required for Gemini provider)
VITE_API_KEY=your_gemini_api_key

# Optional: Set default provider configurations
# VITE_DEFAULT_LLM_PROVIDER=gemini
# VITE_DEFAULT_TTS_PROVIDER=gemini
```

### Settings Page

Configure AI providers through the in-app Settings page:
- **LLM Provider**: Select from available options
- **TTS Provider**: Choose your preferred TTS service
- **API URLs**: Configure custom endpoints
- **API Keys**: Securely store your credentials
- **Debug Options**: Adjust logging levels

## Usage

### Creating a Podcast

1. **Upload Documents**: Drag and drop or select files
2. **Configure Podcast**: Set topic, duration, style, and language
3. **Customize Speakers**: Select voices and names
4. **Generate Script**: AI creates the podcast script
5. **Review & Edit**: Modify the generated script if needed
6. **Synthesize Audio**: Convert script to speech
7. **Play & Download**: Listen and export your podcast

### Managing Podcasts

- **Edit**: Modify existing podcast scripts
- **Delete**: Remove unwanted podcasts
- **Export**: Download scripts (TXT) or audio (WAV/MP3)

## Architecture

### Component Structure

```
src/
├── components/          # UI Components
├── services/           # AI Service Integrations
├── utils/              # Utility Functions
├── stores/            # State Management
├── types/             # Type Definitions
├── constants/         # Configuration Constants
├── locales/           # Internationalization
└── App.svelte         # Main Application
```

### Key Services

- **geminiService.ts**: Google Gemini integration
- **ttsServices.ts**: TTS service abstraction layer
- **docParser.ts**: Document parsing utilities
- **audio.ts**: Audio processing and conversion
- **text.ts**: Text chunking and validation

### State Management

- **userStore**: User authentication and profile
- **settingsStore**: AI provider configurations
- **i18n**: Internationalization and localization

## Security

- **API Key Management**: Keys are stored in localStorage (browser-only)
- **CORS Handling**: Proper error messages for API configuration issues
- **Input Validation**: Document parsing with error handling
- **Authentication**: Local user management system

## Performance Optimization

- **Chunked Processing**: Large documents and audio files are processed in chunks
- **Memory Management**: Efficient audio buffer handling
- **Progressive Loading**: Real-time feedback during generation
- **Caching**: Local storage for user preferences and podcasts

## Internationalization

The application supports multiple languages with complete translations for:
- English (en)
- German (de)
- Spanish (es)
- French (fr)
- Italian (it)

Additional languages are available for voice selection.

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Required APIs**: Web Audio API, Fetch API, Blob URLs
- **Fallbacks**: Graceful degradation for unsupported features

## Development

### Running Tests

```bash
npm run check
```

### Code Quality

- **TypeScript**: Strict type checking
- **ESLint**: Code style enforcement
- **Prettier**: Code formatting

### Debugging

Enable debug logging in Settings:
- Set log level to DEBUG for detailed console output
- Monitor network requests and API responses
- Check audio processing steps and buffer operations

## Contributing

Contributions are welcome! Please follow the existing code style and architecture patterns.

### Key Areas for Contribution

- Additional AI provider integrations
- Enhanced document parsing support
- Improved audio processing algorithms
- Additional language translations
- UI/UX improvements

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please open a GitHub issue or contact the maintainers.

## Roadmap

Future enhancements planned:
- Cloud synchronization
- Collaborative editing
- Advanced audio effects
- Video podcast support
- Analytics and insights
- API for programmatic access

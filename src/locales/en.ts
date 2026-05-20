export default {
    header: {
        title: "AI Podcast Studio",
        settings: "Settings",
        welcome: "Welcome, {{name}}",
        logout: "Logout"
    },
    login: {
        title: "Welcome Back",
        emailLabel: "Email Address",
        passwordLabel: "Password",
        forgotPassword: "Forgot password?",
        loginButton: "Log In",
        noAccount: "Don't have an account?",
        registerLink: "Sign up",
        error: "Invalid email or password."
    },
    register: {
        title: "Create an Account",
        usernameLabel: "Username",
        emailLabel: "Email Address",
        passwordLabel: "Password (min. 6 characters)",
        confirmPasswordLabel: "Confirm Password",
        registerButton: "Create Account",
        haveAccount: "Already have an account?",
        loginLink: "Log in",
        errorMatch: "Passwords do not match.",
        errorExists: "An account with this email already exists."
    },
    forgotPassword: {
        title: "Reset Password",
        instruction: "Enter your email address and we'll simulate sending you a link to reset your password.",
        emailLabel: "Email Address",
        resetButton: "Send Reset Link",
        submittedText: "If an account with the email {{email}} exists, a password reset link has been sent.",
        backToLogin: "Back to Login"
    },
    docManager: {
        title: "Source Documents",
        dropActive: "Drop the files here...",
        dropInactive: "Drag 'n' drop some files here, or click to select files",
        supportedFormats: "Supported: .txt, .pdf, .docx, .odt",
        parsing: "Parsing documents...",
        removeAria: "Remove document"
    },
    creator: {
        titleCreate: "Create New Podcast",
        titleEdit: "Edit Podcast Script",
        topicLabel: "What is the main topic of your podcast?",
        topicPlaceholder: "e.g., The future of renewable energy",
        styleLabel: "Narration Style",
        durationLabel: "Approximate Duration (minutes)",
        durationCustom: "Custom",
        languageLabel: "Podcast Language",
        formatLabel: "Podcast Format",
        speakersLabel: "Speakers",
        speakerLabel: "Speaker",
        speakerNamePlaceholder: "Speaker {{number}} Name",
        selectVoice: "Select a voice...",
        customVoice: "Custom Voice ID",
        customVoicePlaceholder: "Enter custom voice ID/name",
        previewAria: "Preview voice {{voice}}",
        generateScriptButton: "Generate Script"
    },
    editor: {
        titleLabel: "Title",
        descriptionLabel: "Description",
        scriptLabel: "Script",
        backButton: "Back to Config",
        synthesizeButton: "Synthesize Audio"
    },
    podcastList: {
        title: "Your Podcasts",
        empty: "No podcasts created yet. Generate one to get started!",
        duration: "{{duration}} min",
        editAria: "Edit podcast script",
        deleteAria: "Delete podcast",
        playAria: "Play podcast"
    },
    player: {
        closeAria: "Close player",
        audioNotSupported: "Your browser does not support the audio element.",
        duration: "{{duration}} min",
        downloadScript: "Download Script",
        downloadAudio: "Download Audio (.wav)",
        downloadAudioMp3: "Download Audio (.mp3)"
    },
    settings: {
        title: "Backend Settings",
        closeAria: "Close settings",
        llmTitle: "Language Model (LLM)",
        ttsTitle: "Text-to-Speech (TTS)",
        debugTitle: "Debug Settings",
        logLevel: "Log Level",
        provider: "Provider",
        apiUrl: "API URL",
        apiKey: "API Key",
        model: "Model",
        modelsLoading: "Loading models...",
        modelsError: "Failed to load models",
        doneButton: "Done"
    },
    progress: {
        generatingScript: "Generating script, please wait...",
        generatingAudio: "Synthesizing audio..."
    },
    errors: {
        unknown: "An unknown error occurred.",
        audioPreview: "Failed to generate voice preview.",
        scriptGeneration: "Script generation failed",
        audioSynthesis: "Audio synthesis failed",
        unsupportedFileType: "Unsupported file type: .{{extension}}. Please upload .txt, .pdf, .docx, or .odt files.",
        fileParseError: "Failed to parse {{name}}: {{message}}"
    },
    styles: {
        professional: "Professional (Neutral)",
        educational: "Educational",
        conversational: "Conversational",
        storytelling: "Storytelling",
        documentary: "Documentary Narration",
        explainer: "Explainer/Upbeat"
    },
    formats: {
        solo: "Solo Host",
        conversation: "Conversation"
    }
};

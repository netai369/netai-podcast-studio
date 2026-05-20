export default {
    header: {
        title: "AI Podcast Studio",
        settings: "Einstellungen",
        welcome: "Willkommen, {{name}}",
        logout: "Abmelden"
    },
    login: {
        title: "Willkommen zurück",
        emailLabel: "E-Mail-Adresse",
        passwordLabel: "Passwort",
        forgotPassword: "Passwort vergessen?",
        loginButton: "Anmelden",
        noAccount: "Noch kein Konto?",
        registerLink: "Registrieren",
        error: "Ungültige E-Mail oder ungültiges Passwort."
    },
    register: {
        title: "Konto erstellen",
        usernameLabel: "Benutzername",
        emailLabel: "E-Mail-Adresse",
        passwordLabel: "Passwort (min. 6 Zeichen)",
        confirmPasswordLabel: "Passwort bestätigen",
        registerButton: "Konto erstellen",
        haveAccount: "Bereits ein Konto?",
        loginLink: "Anmelden",
        errorMatch: "Die Passwörter stimmen nicht überein.",
        errorExists: "Ein Konto mit dieser E-Mail existiert bereits."
    },
    forgotPassword: {
        title: "Passwort zurücksetzen",
        instruction: "Geben Sie Ihre E-Mail-Adresse ein und wir simulieren das Senden eines Links zum Zurücksetzen des Passworts.",
        emailLabel: "E-Mail-Adresse",
        resetButton: "Link zum Zurücksetzen senden",
        submittedText: "Wenn ein Konto mit der E-Mail {{email}} existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet.",
        backToLogin: "Zurück zum Login"
    },
    docManager: {
        title: "Quelldokumente",
        dropActive: "Dateien hier ablegen...",
        dropInactive: "Dateien hierher ziehen oder zum Auswählen klicken",
        supportedFormats: "Unterstützt: .txt, .pdf, .docx, .odt",
        parsing: "Dokumente werden analysiert...",
        removeAria: "Dokument entfernen"
    },
    creator: {
        titleCreate: "Neuen Podcast erstellen",
        titleEdit: "Podcast-Skript bearbeiten",
        topicLabel: "Was ist das Hauptthema deines Podcasts?",
        topicPlaceholder: "z.B. Die Zukunft der erneuerbaren Energien",
        styleLabel: "Erzählstil",
        durationLabel: "Ungefähre Dauer (Minuten)",
        durationCustom: "Eigene",
        languageLabel: "Podcast-Sprache",
        formatLabel: "Podcast-Format",
        speakersLabel: "Sprecher",
        speakerLabel: "Sprecher",
        speakerNamePlaceholder: "Sprecher {{number}} Name",
        selectVoice: "Stimme auswählen...",
        customVoice: "Benutzerdefinierte Stimme-ID",
        customVoicePlaceholder: "Benutzerdefinierte Stimme-ID/Namen eingeben",
        previewAria: "Stimmprobe für {{voice}}",
        generateScriptButton: "Skript generieren"
    },
    editor: {
        titleLabel: "Titel",
        descriptionLabel: "Beschreibung",
        scriptLabel: "Skript",
        backButton: "Zurück zur Konfiguration",
        synthesizeButton: "Audio synthetisieren"
    },
    podcastList: {
        title: "Deine Podcasts",
        empty: "Noch keine Podcasts erstellt. Erstelle einen, um loszulegen!",
        duration: "{{duration}} min",
        editAria: "Podcast-Skript bearbeiten",
        deleteAria: "Podcast löschen",
        playAria: "Podcast abspielen"
    },
    player: {
        closeAria: "Player schließen",
        audioNotSupported: "Dein Browser unterstützt das Audio-Element nicht.",
        duration: "{{duration}} min",
        downloadScript: "Skript herunterladen",
        downloadAudio: "Audio herunterladen (.wav)",
        downloadAudioMp3: "Audio herunterladen (.mp3)"
    },
    settings: {
        title: "Backend-Einstellungen",
        closeAria: "Einstellungen schließen",
        llmTitle: "Sprachmodell (LLM)",
        ttsTitle: "Text-zu-Sprache (TTS)",
        debugTitle: "Debug-Einstellungen",
        logLevel: "Log-Level",
        provider: "Anbieter",
        apiUrl: "API-URL",
        apiKey: "API-Schlüssel",
        model: "Modell",
        modelsLoading: "Modelle werden geladen...",
        modelsError: "Modelle konnten nicht geladen werden",
        doneButton: "Fertig"
    },
    progress: {
        generatingScript: "Skript wird generiert, bitte warten...",
        generatingAudio: "Audio wird synthetisiert..."
    },
    errors: {
        unknown: "Ein unbekannter Fehler ist aufgetreten.",
        audioPreview: "Stimmprobe konnte nicht generiert werden.",
        scriptGeneration: "Skriptgenerierung fehlgeschlagen",
        audioSynthesis: "Audiosynthese fehlgeschlagen",
        unsupportedFileType: "Nicht unterstützter Dateityp: .{{extension}}. Bitte laden Sie .txt, .pdf, .docx oder .odt-Dateien hoch.",
        fileParseError: "Fehler beim Parsen von {{name}}: {{message}}"
    },
    styles: {
        professional: "Professionell (Neutral)",
        educational: "Lehrreich",
        conversational: "Gesprächig",
        storytelling: "Erzählerisch",
        documentary: "Dokumentarisch",
        explainer: "Erklärend/Flott"
    },
    formats: {
        solo: "Einzelmoderator",
        conversation: "Gespräch"
    }
};

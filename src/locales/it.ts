export default {
    header: {
        title: "AI Podcast Studio",
        settings: "Impostazioni",
        welcome: "Benvenuto, {{name}}",
        logout: "Esci"
    },
    login: {
        title: "Bentornato",
        emailLabel: "Indirizzo email",
        passwordLabel: "Password",
        forgotPassword: "Password dimenticata?",
        loginButton: "Accedi",
        noAccount: "Non hai un account?",
        registerLink: "Registrati",
        error: "Email o password non validi."
    },
    register: {
        title: "Crea un account",
        usernameLabel: "Nome utente",
        emailLabel: "Indirizzo email",
        passwordLabel: "Password (min. 6 caratteri)",
        confirmPasswordLabel: "Conferma password",
        registerButton: "Crea account",
        haveAccount: "Hai già un account?",
        loginLink: "Accedi",
        errorMatch: "Le password non corrispondono.",
        errorExists: "Esiste già un account con questa email."
    },
    forgotPassword: {
        title: "Reimposta password",
        instruction: "Inserisci il tuo indirizzo email e simuleremo l'invio di un link per reimpostare la tua password.",
        emailLabel: "Indirizzo email",
        resetButton: "Invia link di reimpostazione",
        submittedText: "Se esiste un account con l'email {{email}}, è stato inviato un link per il ripristino della password.",
        backToLogin: "Torna al login"
    },
    docManager: {
        title: "Documenti di Origine",
        dropActive: "Rilascia i file qui...",
        dropInactive: "Trascina e rilascia alcuni file qui, o clicca per selezionare i file",
        supportedFormats: "Supportati: .txt, .pdf, .docx, .odt",
        parsing: "Analisi dei documenti...",
        removeAria: "Rimuovi documento"
    },
    creator: {
        titleCreate: "Crea Nuovo Podcast",
        titleEdit: "Modifica Script Podcast",
        topicLabel: "Qual è l'argomento principale del tuo podcast?",
        topicPlaceholder: "es. Il futuro dell'energia rinnovabile",
        styleLabel: "Stile di Narrazione",
        durationLabel: "Durata Approssimativa (minuti)",
        durationCustom: "Personalizzata",
        languageLabel: "Lingua del Podcast",
        formatLabel: "Formato Podcast",
        speakersLabel: "Oratori",
        speakerLabel: "Oratore",
        speakerNamePlaceholder: "Nome Oratore {{number}}",
        selectVoice: "Seleziona una voce...",
        customVoice: "ID Voce Personalizzato",
        customVoicePlaceholder: "Inserisci ID/nome voce personalizzato",
        previewAria: "Anteprima voce {{voice}}",
        generateScriptButton: "Genera Script"
    },
    editor: {
        titleLabel: "Titolo",
        descriptionLabel: "Descrizione",
        scriptLabel: "Script",
        backButton: "Torna alla Configurazione",
        synthesizeButton: "Sintetizza Audio"
    },
    podcastList: {
        title: "I Tuoi Podcast",
        empty: "Nessun podcast ancora creato. Creane uno per iniziare!",
        duration: "{{duration}} min",
        editAria: "Modifica script podcast",
        deleteAria: "Elimina podcast",
        playAria: "Riproduci podcast"
    },
    player: {
        closeAria: "Chiudi lettore",
        audioNotSupported: "Il tuo browser non supporta l'elemento audio.",
        duration: "{{duration}} min",
        downloadScript: "Scarica Script",
        downloadAudio: "Scarica Audio (.wav)",
        downloadAudioMp3: "Scarica Audio (.mp3)"
    },
     settings: {
        title: "Impostazioni Backend",
        closeAria: "Chiudi impostazioni",
        llmTitle: "Modello Linguistico (LLM)",
        ttsTitle: "Sintesi Vocale (TTS)",
        debugTitle: "Impostazioni di Debug",
        logLevel: "Livello di Log",
        provider: "Provider",
        apiUrl: "URL API",
        apiKey: "Chiave API",
        model: "Modello",
        modelsLoading: "Caricamento modelli...",
        modelsError: "Caricamento modelli fallito",
        refreshModels: "Aggiorna modelli",
        refreshingModels: "Aggiornamento...",
        doneButton: "Fatto"
    },
    progress: {
        generatingScript: "Generazione script in corso, attendere...",
        generatingAudio: "Sintesi audio in corso..."
    },
    errors: {
        unknown: "Si è verificato un errore sconosciuto.",
        audioPreview: "Impossibile generare l'anteprima vocale.",
        scriptGeneration: "Generazione dello script fallita",
        audioSynthesis: "Sintesi audio fallita",
        unsupportedFileType: "Tipo di file non supportato: .{{extension}}. Caricare file .txt, .pdf, .docx o .odt.",
        fileParseError: "Errore durante l'analisi di {{name}}: {{message}}"
    },
    styles: {
        professional: "Professionale (Neutro)",
        educational: "Educativo",
        conversational: "Conversazionale",
        storytelling: "Narrativo",
        documentary: "Narrazione Documentario",
        explainer: "Espositivo/Vivace"
    },
    formats: {
        solo: "Host Singolo",
        conversation: "Conversazione"
    }
};

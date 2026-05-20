export default {
    header: {
        title: "AI Podcast Studio",
        settings: "Ajustes",
        welcome: "Bienvenido, {{name}}",
        logout: "Cerrar sesión"
    },
    login: {
        title: "Bienvenido de nuevo",
        emailLabel: "Correo electrónico",
        passwordLabel: "Contraseña",
        forgotPassword: "¿Olvidaste tu contraseña?",
        loginButton: "Iniciar sesión",
        noAccount: "¿No tienes una cuenta?",
        registerLink: "Regístrate",
        error: "Correo electrónico o contraseña no válidos."
    },
    register: {
        title: "Crear una cuenta",
        usernameLabel: "Nombre de usuario",
        emailLabel: "Correo electrónico",
        passwordLabel: "Contraseña (mín. 6 caracteres)",
        confirmPasswordLabel: "Confirmar contraseña",
        registerButton: "Crear cuenta",
        haveAccount: "¿Ya tienes una cuenta?",
        loginLink: "Iniciar sesión",
        errorMatch: "Las contraseñas no coinciden.",
        errorExists: "Ya existe una cuenta con este correo electrónico."
    },
    forgotPassword: {
        title: "Restablecer contraseña",
        instruction: "Ingresa tu correo electrónico y simularemos el envío de un enlace para restablecer tu contraseña.",
        emailLabel: "Correo electrónico",
        resetButton: "Enviar enlace de restablecimiento",
        submittedText: "Si existe una cuenta con el correo electrónico {{email}}, se ha enviado un enlace para restablecer la contraseña.",
        backToLogin: "Volver a iniciar sesión"
    },
    docManager: {
        title: "Documentos de Origen",
        dropActive: "Suelta los archivos aquí...",
        dropInactive: "Arrastra y suelta algunos archivos aquí, o haz clic para seleccionar archivos",
        supportedFormats: "Soportados: .txt, .pdf, .docx, .odt",
        parsing: "Analizando documentos...",
        removeAria: "Eliminar documento"
    },
    creator: {
        titleCreate: "Crear Nuevo Podcast",
        titleEdit: "Editar Guion del Podcast",
        topicLabel: "¿Cuál es el tema principal de tu podcast?",
        topicPlaceholder: "p. ej., El futuro de la energía renovable",
        styleLabel: "Estilo de Narración",
        durationLabel: "Duración Aproximada (minutos)",
        durationCustom: "Personalizado",
        languageLabel: "Idioma del Podcast",
        formatLabel: "Formato del Podcast",
        speakersLabel: "Oradores",
        speakerLabel: "Orador",
        speakerNamePlaceholder: "Nombre del Orador {{number}}",
        selectVoice: "Selecciona una voz...",
        customVoice: "ID de Voz Personalizada",
        customVoicePlaceholder: "Ingresa ID/nombre de voz personalizada",
        previewAria: "Vista previa de la voz {{voice}}",
        generateScriptButton: "Generar Guion"
    },
    editor: {
        titleLabel: "Título",
        descriptionLabel: "Descripción",
        scriptLabel: "Guion",
        backButton: "Volver a la Configuración",
        synthesizeButton: "Sintetizar Audio"
    },
    podcastList: {
        title: "Tus Podcasts",
        empty: "Aún no se han creado podcasts. ¡Genera uno para empezar!",
        duration: "{{duration}} min",
        editAria: "Editar guion del podcast",
        deleteAria: "Eliminar podcast",
        playAria: "Reproducir podcast"
    },
    player: {
        closeAria: "Cerrar reproductor",
        audioNotSupported: "Tu navegador no soporta el elemento de audio.",
        duration: "{{duration}} min",
        downloadScript: "Descargar Guion",
        downloadAudio: "Descargar Audio (.wav)",
        downloadAudioMp3: "Descargar Audio (.mp3)"
    },
    settings: {
        title: "Ajustes del Backend",
        closeAria: "Cerrar ajustes",
        llmTitle: "Modelo de Lenguaje (LLM)",
        ttsTitle: "Texto a Voz (TTS)",
        provider: "Proveedor",
        apiUrl: "URL de la API",
        apiKey: "Clave de API",
        doneButton: "Hecho"
    },
    progress: {
        generatingScript: "Generando guion, por favor espera...",
        generatingAudio: "Sintetizando audio..."
    },
    errors: {
        unknown: "Ocurrió un error desconocido.",
        audioPreview: "No se pudo generar la vista previa de la voz.",
        scriptGeneration: "Falló la generación del guion",
        audioSynthesis: "Falló la síntesis de audio",
        unsupportedFileType: "Tipo de archivo no compatible: .{{extension}}. Por favor, suba archivos .txt, .pdf, .docx o .odt.",
        fileParseError: "Error al analizar {{name}}: {{message}}"
    },
    styles: {
        professional: "Profesional (Neutral)",
        educational: "Educativo",
        conversational: "Conversacional",
        storytelling: "Narración",
        documentary: "Narración de Documental",
        explainer: "Explicativo/Animado"
    },
    formats: {
        solo: "Anfitrión Único",
        conversation: "Conversación"
    }
};

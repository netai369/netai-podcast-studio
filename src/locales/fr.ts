export default {
    header: {
        title: "AI Podcast Studio",
        settings: "Paramètres",
        welcome: "Bienvenue, {{name}}",
        logout: "Déconnexion"
    },
    login: {
        title: "Content de vous revoir",
        emailLabel: "Adresse e-mail",
        passwordLabel: "Mot de passe",
        forgotPassword: "Mot de passe oublié ?",
        loginButton: "Se connecter",
        noAccount: "Vous n'avez pas de compte ?",
        registerLink: "S'inscrire",
        error: "Adresse e-mail ou mot de passe invalide."
    },
    register: {
        title: "Créer un compte",
        usernameLabel: "Nom d'utilisateur",
        emailLabel: "Adresse e-mail",
        passwordLabel: "Mot de passe (6 caractères min.)",
        confirmPasswordLabel: "Confirmer le mot de passe",
        registerButton: "Créer le compte",
        haveAccount: "Vous avez déjà un compte ?",
        loginLink: "Se connecter",
        errorMatch: "Les mots de passe ne correspondent pas.",
        errorExists: "Un compte avec cette adresse e-mail existe déjà."
    },
    forgotPassword: {
        title: "Réinitialiser le mot de passe",
        instruction: "Entrez votre adresse e-mail et nous simulerons l'envoi d'un lien pour réinitialiser votre mot de passe.",
        emailLabel: "Adresse e-mail",
        resetButton: "Envoyer le lien de réinitialisation",
        submittedText: "Si un compte avec l'e-mail {{email}} existe, un lien de réinitialisation de mot de passe a été envoyé.",
        backToLogin: "Retour à la connexion"
    },
    docManager: {
        title: "Documents Source",
        dropActive: "Déposez les fichiers ici...",
        dropInactive: "Glissez-déposez des fichiers ici, ou cliquez pour sélectionner des fichiers",
        supportedFormats: "Supportés: .txt, .pdf, .docx, .odt",
        parsing: "Analyse des documents...",
        removeAria: "Supprimer le document"
    },
    creator: {
        titleCreate: "Créer un Nouveau Podcast",
        titleEdit: "Modifier le Script du Podcast",
        topicLabel: "Quel est le sujet principal de votre podcast ?",
        topicPlaceholder: "ex: L'avenir des énergies renouvelables",
        styleLabel: "Style de Narration",
        durationLabel: "Durée Approximative (minutes)",
        durationCustom: "Personnalisé",
        languageLabel: "Langue du Podcast",
        formatLabel: "Format du Podcast",
        speakersLabel: "Intervenants",
        speakerLabel: "Intervenant",
        speakerNamePlaceholder: "Nom de l'intervenant {{number}}",
        selectVoice: "Sélectionnez une voix...",
        customVoice: "ID de Voix Personnalisée",
        customVoicePlaceholder: "Entrez l'ID/nom de la voix personnalisée",
        previewAria: "Aperçu de la voix {{voice}}",
        generateScriptButton: "Générer le Script"
    },
    editor: {
        titleLabel: "Titre",
        descriptionLabel: "Description",
        scriptLabel: "Script",
        backButton: "Retour à la Configuration",
        synthesizeButton: "Synthétiser l'Audio"
    },
    podcastList: {
        title: "Vos Podcasts",
        empty: "Aucun podcast créé pour le moment. Générez-en un pour commencer !",
        duration: "{{duration}} min",
        editAria: "Modifier le script du podcast",
        deleteAria: "Supprimer le podcast",
        playAria: "Lire le podcast"
    },
    player: {
        closeAria: "Fermer le lecteur",
        audioNotSupported: "Votre navigateur ne prend pas en charge l'élément audio.",
        duration: "{{duration}} min",
        downloadScript: "Télécharger le Script",
        downloadAudio: "Télécharger l'Audio (.wav)",
        downloadAudioMp3: "Télécharger l'Audio (.mp3)"
    },
     settings: {
        title: "Paramètres du Backend",
        closeAria: "Fermer les paramètres",
        llmTitle: "Modèle de Langage (LLM)",
        ttsTitle: "Synthèse Vocale (TTS)",
        debugTitle: "Paramètres de Débogage",
        logLevel: "Niveau de Journalisation",
        provider: "Fournisseur",
        apiUrl: "URL de l'API",
        apiKey: "Clé API",
        model: "Modèle",
        modelsLoading: "Chargement des modèles...",
        modelsError: "Échec du chargement des modèles",
        refreshModels: "Actualiser les modèles",
        refreshingModels: "Actualisation...",
        doneButton: "Terminé"
    },
    progress: {
        generatingScript: "Génération du script, veuillez patienter...",
        generatingAudio: "Synthèse de l'audio..."
    },
    errors: {
        unknown: "Une erreur inconnue est survenue.",
        audioPreview: "Échec de la génération de l'aperçu vocal.",
        scriptGeneration: "La génération du script a échoué",
        audioSynthesis: "La synthèse audio a échoué",
        unsupportedFileType: "Type de fichier non pris en charge : .{{extension}}. Veuillez télécharger des fichiers .txt, .pdf, .docx ou .odt.",
        fileParseError: "Échec de l'analyse de {{name}} : {{message}}"
    },
    styles: {
        professional: "Professionnel (Neutre)",
        educational: "Éducatif",
        conversational: "Conversation",
        storytelling: "Narration",
        documentary: "Narration de Documentaire",
        explainer: "Explicatif/Enthousiaste"
    },
    formats: {
        solo: "Hôte Unique",
        conversation: "Conversation"
    }
};

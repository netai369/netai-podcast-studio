export default {
    header: {
        title: "Студия ИИ-подкастов",
        settings: "Настройки",
        welcome: "Добро пожаловать, {{name}}",
        logout: "Выйти"
    },
    login: {
        title: "С возвращением",
        emailLabel: "Адрес эл. почты",
        passwordLabel: "Пароль",
        forgotPassword: "Забыли пароль?",
        loginButton: "Войти",
        noAccount: "Нет учётной записи?",
        registerLink: "Регистрация",
        error: "Неверный адрес эл. почты или пароль."
    },
    register: {
        title: "Создать аккаунт",
        usernameLabel: "Имя пользователя",
        emailLabel: "Адрес эл. почты",
        passwordLabel: "Пароль (минимум 6 символов)",
        confirmPasswordLabel: "Подтвердите пароль",
        registerButton: "Создать аккаунт",
        haveAccount: "Уже есть аккаунт?",
        loginLink: "Войти",
        errorMatch: "Пароли не совпадают.",
        errorExists: "Аккаунт с таким адресом эл. почты уже существует."
    },
    forgotPassword: {
        title: "Сброс пароля",
        instruction: "Введите адрес эл. почты, и мы смоделируем отправку ссылки для сброса пароля.",
        emailLabel: "Адрес эл. почты",
        resetButton: "Отправить ссылку",
        submittedText: "Если аккаунт с адресом {{email}} существует, ссылка для сброса пароля отправлена.",
        backToLogin: "Назад ко входу"
    },
    docManager: {
        title: "Исходные документы",
        dropActive: "Отпустите файлы здесь…",
        dropInactive: "Перетащите файлы сюда или нажмите для выбора",
        supportedFormats: "Поддерживаются: .txt, .pdf, .docx, .odt",
        parsing: "Обработка документов…",
        removeAria: "Удалить документ"
    },
    creator: {
        titleCreate: "Создать новый подкаст",
        titleEdit: "Редактировать сценарий подкаста",
        topicLabel: "Какова основная тема вашего подкаста?",
        topicPlaceholder: "Например: Будущее возобновляемой энергетики",
        styleLabel: "Стиль повествования",
        durationLabel: "Примерная длительность (минуты)",
        durationCustom: "Другая",
        languageLabel: "Язык подкаста",
        formatLabel: "Формат подкаста",
        speakersLabel: "Дикторы",
        speakerLabel: "Диктор",
        speakerNamePlaceholder: "Имя диктора {{number}}",
        selectVoice: "Выберите голос…",
        customVoice: "Свой ID голоса",
        customVoicePlaceholder: "Введите ID или имя голоса",
        previewAria: "Прослушать голос {{voice}}",
        generateScriptButton: "Создать сценарий"
    },
    editor: {
        titleLabel: "Заголовок",
        descriptionLabel: "Описание",
        scriptLabel: "Сценарий",
        backButton: "Назад к настройкам",
        synthesizeButton: "Синтезировать аудио"
    },
    podcastList: {
        title: "Ваши подкасты",
        empty: "Подкастов пока нет. Создайте первый, чтобы начать!",
        duration: "{{duration}} мин",
        editAria: "Редактировать сценарий подкаста",
        deleteAria: "Удалить подкаст",
        playAria: "Воспроизвести подкаст"
    },
    player: {
        closeAria: "Закрыть плеер",
        audioNotSupported: "Ваш браузер не поддерживает элемент audio.",
        duration: "{{duration}} мин",
        downloadScript: "Скачать сценарий",
        downloadAudio: "Скачать аудио (.wav)",
        downloadAudioMp3: "Скачать аудио (.mp3)"
    },
    settings: {
        title: "Настройки бэкенда",
        closeAria: "Закрыть настройки",
        llmTitle: "Языковая модель (LLM)",
        ttsTitle: "Синтез речи (TTS)",
        debugTitle: "Отладка",
        logLevel: "Уровень журналирования",
        provider: "Провайдер",
        apiUrl: "URL API",
        apiKey: "API-ключ",
        model: "Модель",
        modelsLoading: "Загрузка моделей…",
        modelsError: "Не удалось загрузить модели",
        refreshModels: "Обновить модели",
        refreshingModels: "Обновление…",
        doneButton: "Готово"
    },
    tts: {
        title: "Быстрый синтез речи",
        subtitle: "Генерируйте речь напрямую через настроенный сервис NetAI TTS.",
        placeholder: "Введите текст для озвучивания…",
        langDe: "Немецкий",
        langEn: "Английский",
        langFr: "Французский",
        langIt: "Итальянский",
        preview: "Прослушать",
        delete: "Удалить",
        voiceCloningHint: "Клонирование голоса: загрузите или запишите эталонный WAV-файл (рекомендуется моно, 24 кГц).",
        voiceCloningUnavailable: "Клонирование голоса недоступно для активного TTS-бэкенда.",
        clone: "Клонировать",
        record: "Запись",
        stopRecording: "Остановить запись",
        discard: "Сбросить",
        generate: "Озвучить текст",
        liveWaveform: "Осциллограмма в реальном времени",
        recordingOverview: "Обзор записи — нажмите на волну для перемотки.",
        generatedHint: "Сгенерированное аудио — нажмите на волну для перемотки.",
        ariaLive: "Осциллограмма записи в реальном времени",
        ariaRecording: "Осциллограмма записи",
        ariaGenerated: "Осциллограмма синтезированной речи",
        errors: {
            selectFile: "Сначала выберите WAV-файл.",
            cloningFailed: "Не удалось клонировать голос.",
            previewFailed: "Не удалось воспроизвести пример.",
            deleteFailed: "Не удалось удалить голос.",
            deleteConfirm: "Удалить этот клонированный голос?",
            micError: "Ошибка микрофона ({{name}}): {{message}}. Если браузер не показал запрос, проверьте разрешение для микрофона в настройках сайта.",
            noAudio: "Звук не записан. Пожалуйста, попробуйте снова.",
            enterText: "Введите текст для озвучивания.",
            generationFailed: "Не удалось синтезировать речь.",
            uploadFailed: "Ошибка загрузки: {{status}} {{message}}"
        }
    },
    progress: {
        generatingScript: "Создание сценария, пожалуйста подождите…",
        generatingAudio: "Синтез аудио…"
    },
    errors: {
        unknown: "Произошла неизвестная ошибка.",
        audioPreview: "Не удалось создать пример звучания.",
        scriptGeneration: "Ошибка создания сценария",
        audioSynthesis: "Ошибка синтеза аудио",
        unsupportedFileType: "Неподдерживаемый формат файла: .{{extension}}. Загрузите файл .txt, .pdf, .docx или .odt.",
        fileParseError: "Не удалось обработать {{name}}: {{message}}"
    },
    styles: {
        professional: "Профессиональный (нейтральный)",
        educational: "Обучающий",
        conversational: "Разговорный",
        storytelling: "Повествовательный",
        documentary: "Документальное озвучивание",
        explainer: "Объясняющий / динамичный"
    },
    formats: {
        solo: "Один ведущий",
        conversation: "Диалог"
    }
};

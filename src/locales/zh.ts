export default {
    header: {
        title: "AI 播客工作室",
        settings: "设置",
        welcome: "欢迎，{{name}}",
        logout: "退出登录"
    },
    login: {
        title: "欢迎回来",
        emailLabel: "电子邮箱",
        passwordLabel: "密码",
        forgotPassword: "忘记密码？",
        loginButton: "登录",
        noAccount: "还没有账户？",
        registerLink: "注册",
        error: "邮箱或密码无效。"
    },
    register: {
        title: "创建账户",
        usernameLabel: "用户名",
        emailLabel: "电子邮箱",
        passwordLabel: "密码（至少 6 个字符）",
        confirmPasswordLabel: "确认密码",
        registerButton: "创建账户",
        haveAccount: "已有账户？",
        loginLink: "登录",
        errorMatch: "两次输入的密码不一致。",
        errorExists: "该电子邮箱已注册。"
    },
    forgotPassword: {
        title: "重置密码",
        instruction: "请输入您的电子邮箱地址，我们将为您模拟发送密码重置链接。",
        emailLabel: "电子邮箱",
        resetButton: "发送重置链接",
        submittedText: "如果存在使用 {{email}} 的账户，我们已发送密码重置链接。",
        backToLogin: "返回登录"
    },
    docManager: {
        title: "参考文档",
        dropActive: "将文件拖放到此处…",
        dropInactive: "将文件拖拽到此处，或点击选择文件",
        supportedFormats: "支持格式：.txt, .pdf, .docx, .odt",
        parsing: "正在解析文档…",
        removeAria: "移除文档"
    },
    creator: {
        titleCreate: "创建新播客",
        titleEdit: "编辑播客文稿",
        topicLabel: "您的播客主题是什么？",
        topicPlaceholder: "例如：可再生能源的未来",
        styleLabel: "旁白风格",
        durationLabel: "预计时长（分钟）",
        durationCustom: "自定义",
        languageLabel: "播客语言",
        formatLabel: "播客形式",
        speakersLabel: "演讲者",
        speakerLabel: "演讲者",
        speakerNamePlaceholder: "演讲者 {{number}} 姓名",
        selectVoice: "选择声音…",
        customVoice: "自定义音色 ID",
        customVoicePlaceholder: "输入自定义音色 ID 或名称",
        previewAria: "试听声音 {{voice}}",
        generateScriptButton: "生成文稿"
    },
    editor: {
        titleLabel: "标题",
        descriptionLabel: "简介",
        scriptLabel: "文稿",
        backButton: "返回配置",
        synthesizeButton: "合成音频"
    },
    podcastList: {
        title: "您的播客",
        empty: "尚未创建任何播客。立即生成一个吧！",
        duration: "{{duration}} 分钟",
        editAria: "编辑播客文稿",
        deleteAria: "删除播客",
        playAria: "播放播客"
    },
    player: {
        closeAria: "关闭播放器",
        audioNotSupported: "您的浏览器不支持音频播放元素。",
        duration: "{{duration}} 分钟",
        downloadScript: "下载文稿",
        downloadAudio: "下载音频 (.wav)",
        downloadAudioMp3: "下载音频 (.mp3)"
    },
    settings: {
        title: "后端设置",
        closeAria: "关闭设置",
        llmTitle: "大语言模型 (LLM)",
        ttsTitle: "文本转语音 (TTS)",
        debugTitle: "调试设置",
        logLevel: "日志级别",
        provider: "服务提供商",
        apiUrl: "API 地址",
        apiKey: "API 密钥",
        model: "模型",
        modelsLoading: "正在加载模型…",
        modelsError: "加载模型失败",
        refreshModels: "刷新模型",
        refreshingModels: "正在刷新…",
        doneButton: "完成"
    },
    tts: {
        title: "快速文本转语音",
        subtitle: "直接通过已配置的 NetAI TTS 接口生成语音。",
        placeholder: "请输入要合成的文本…",
        langDe: "德语",
        langEn: "英语",
        langFr: "法语",
        langIt: "意大利语",
        preview: "试听",
        delete: "删除",
        voiceCloningHint: "声音克隆：上传或录制参考 WAV 音频（建议单声道、24 kHz）。",
        voiceCloningUnavailable: "当前启用的 TTS 后端不支持声音克隆。",
        clone: "克隆",
        record: "录音",
        stopRecording: "停止录音",
        discard: "丢弃",
        generate: "生成语音",
        liveWaveform: "实时波形",
        recordingOverview: "录音总览 — 点击波形可定位播放。",
        generatedHint: "已生成的音频 — 点击波形可定位播放。",
        ariaLive: "实时录音波形",
        ariaRecording: "录音波形",
        ariaGenerated: "生成语音波形",
        errors: {
            selectFile: "请先选择一个 WAV 文件。",
            cloningFailed: "声音克隆失败。",
            previewFailed: "试听失败。",
            deleteFailed: "删除失败。",
            deleteConfirm: "确定要删除这个克隆音色吗？",
            micError: "麦克风错误 ({{name}})：{{message}}。如果浏览器未弹出授权提示，请在浏览器设置中检查该网址的麦克风权限。",
            noAudio: "未采集到音频，请重试。",
            enterText: "请输入要合成的文本。",
            generationFailed: "语音生成失败。",
            uploadFailed: "上传失败：{{status}} {{message}}"
        }
    },
    progress: {
        generatingScript: "正在生成文稿，请稍候…",
        generatingAudio: "正在合成音频…"
    },
    errors: {
        unknown: "发生未知错误。",
        audioPreview: "生成语音试听失败。",
        scriptGeneration: "文稿生成失败",
        audioSynthesis: "音频合成失败",
        unsupportedFileType: "不支持的文件类型：.{{extension}}。请上传 .txt、.pdf、.docx 或 .odt 文件。",
        fileParseError: "解析 {{name}} 失败：{{message}}"
    },
    styles: {
        professional: "专业（中性）",
        educational: "教学解说",
        conversational: "对话交流",
        storytelling: "故事讲述",
        documentary: "纪录片旁白",
        explainer: "讲解／活力风格"
    },
    formats: {
        solo: "单人主持",
        conversation: "双人对话"
    }
};

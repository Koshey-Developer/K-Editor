/**
 * K-Editor — WYSIWYG Editor (polk1430 style)
 * Saves HTML content, loads files, demo rendering
 */

class KEditor {
    constructor() {
        this.editor = document.getElementById('editor');
        this.preview = document.getElementById('preview');
        this.htmlArea = document.getElementById('htmlArea');
        this.wordCount = document.getElementById('wordCount');
        this.charCount = document.getElementById('charCount');
        this.statusMessage = document.getElementById('statusMessage');
        this.modalOverlay = document.getElementById('modalOverlay');
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalBody = document.getElementById('modalBody');
        this.modalOk = document.getElementById('modalOk');
        this.modalCancel = document.getElementById('modalCancel');
        this.modalClose = document.getElementById('modalClose');
        this.smileysPanel = document.getElementById('smileysPanel');
        this.smileysGrid = document.getElementById('smileysGrid');
        this.uploadOverlay = document.getElementById('uploadOverlay');
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.filePreview = document.getElementById('filePreview');
        this.fileList = document.getElementById('fileList');

        this.savedSelection = null;
        this.currentModalCallback = null;
        this.isFullscreen = false;
        this.uploadedFiles = [];
        this.currentDocId = null;

        this.smileys = [
            '😀','😃','😄','😁','😆','😅','🤣','😂',
            '🙂','😉','😊','😇','🥰','😍','🤩','😘',
            '😋','😛','😜','🤪','😝','🤗','🤭','🤔',
            '🤐','😏','😒','🙄','😬','😌','😔','😪',
            '😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴',
            '🤯','🤠','🥳','😎','🤓','🧐','😤','😡',
            '👍','👎','👌','✌️','🤞','🤟','🤘','👊',
            '❤️','🧡','💛','💚','💙','💜','🖤','⭐'
        ];

        // ===== Widget registry =====
        this.widgetRegistry = {
            carousel: {
                name: 'Карусель',
                icon: '🎠',
                desc: 'Галерея изображений с навигацией',
                fields: [
                    { name: 'images', type: 'textarea', label: 'URL изображений (каждая строка — URL)', placeholder: '/img/1.jpg\n/img/2.jpg\n/img/3.jpg', required: true },
                    { name: 'autoplay', type: 'checkbox', label: 'Автовоспроизведение', default: true },
                    { name: 'speed', type: 'number', label: 'Скорость (мс)', default: 3000, min: 500, max: 10000 },
                    { name: 'dots', type: 'checkbox', label: 'Точки навигации', default: true },
                    { name: 'arrows', type: 'checkbox', label: 'Стрелки навигации', default: true },
                    { name: 'height', type: 'text', label: 'Высота', default: '400px' }
                ],
                render(cfg) {
                    const imgs = cfg.images.split('\n').filter(s => s.trim());
                    const preview = imgs.slice(0, 3).map(u => `<span class="w-thumb">${u.trim().split('/').pop()}</span>`).join(' ');
                    return `<div class="widget-block widget-carousel" data-widget="carousel" data-config='${JSON.stringify(cfg)}' contenteditable="false">
                        <div class="wb-header"><span class="wb-icon">🎠</span><span class="wb-title">Карусель</span><span class="wb-badge">${imgs.length} фото</span><button class="wb-edit" title="Редактировать">✏️</button><button class="wb-delete" title="Удалить">🗑️</button></div>
                        <div class="wb-preview">${preview}${cfg.autoplay ? ' <span class="wb-tag">▶ Авто</span>' : ''}${cfg.speed ? ` <span class="wb-tag">⏱ ${cfg.speed}мс</span>` : ''}</div>
                    </div><p><br></p>`;
                }
            },
            youtube: {
                name: 'YouTube',
                icon: '▶️',
                desc: 'Видео YouTube с настройками',
                fields: [
                    { name: 'url', type: 'url', label: 'URL видео', placeholder: 'https://youtube.com/watch?v=...', required: true },
                    { name: 'autoplay', type: 'checkbox', label: 'Автовоспроизведение', default: false },
                    { name: 'muted', type: 'checkbox', label: 'Без звука', default: false },
                    { name: 'loop', type: 'checkbox', label: 'Зациклить', default: false },
                    { name: 'start', type: 'number', label: 'Начать с (сек)', default: 0, min: 0 },
                    { name: 'end', type: 'number', label: 'Закончить на (сек)', default: 0, min: 0 },
                    { name: 'controls', type: 'checkbox', label: 'Показывать управление', default: true },
                    { name: 'aspect', type: 'select', label: 'Соотношение сторон', options: [{ value: '16:9', label: '16:9' }, { value: '4:3', label: '4:3' }, { value: '21:9', label: '21:9' }], default: '16:9' }
                ],
                render(cfg) {
                    const tags = [];
                    if (cfg.autoplay) tags.push('▶ Авто');
                    if (cfg.muted) tags.push('🔇 Без звука');
                    if (cfg.loop) tags.push('🔁 Цикл');
                    if (cfg.start > 0) tags.push(`⏱ с ${cfg.start}с`);
                    return `<div class="widget-block widget-youtube" data-widget="youtube" data-config='${JSON.stringify(cfg)}' contenteditable="false">
                        <div class="wb-header"><span class="wb-icon">▶️</span><span class="wb-title">YouTube</span><span class="wb-badge">${cfg.aspect || '16:9'}</span><button class="wb-edit" title="Редактировать">✏️</button><button class="wb-delete" title="Удалить">🗑️</button></div>
                        <div class="wb-preview"><span class="wb-link">${cfg.url}</span>${tags.map(t => ` <span class="wb-tag">${t}</span>`).join('')}</div>
                    </div><p><br></p>`;
                }
            },
            vimeo: {
                name: 'Vimeo',
                icon: '🎬',
                desc: 'Видео Vimeo с настройками',
                fields: [
                    { name: 'url', type: 'url', label: 'URL видео', placeholder: 'https://vimeo.com/123456789', required: true },
                    { name: 'autoplay', type: 'checkbox', label: 'Автовоспроизведение', default: false },
                    { name: 'loop', type: 'checkbox', label: 'Зациклить', default: false },
                    { name: 'muted', type: 'checkbox', label: 'Без звука', default: false }
                ],
                render(cfg) {
                    const tags = [];
                    if (cfg.autoplay) tags.push('▶ Авто');
                    if (cfg.loop) tags.push('🔁 Цикл');
                    if (cfg.muted) tags.push('🔇 Без звука');
                    return `<div class="widget-block widget-vimeo" data-widget="vimeo" data-config='${JSON.stringify(cfg)}' contenteditable="false">
                        <div class="wb-header"><span class="wb-icon">🎬</span><span class="wb-title">Vimeo</span><button class="wb-edit" title="Редактировать">✏️</button><button class="wb-delete" title="Удалить">🗑️</button></div>
                        <div class="wb-preview"><span class="wb-link">${cfg.url}</span>${tags.map(t => ` <span class="wb-tag">${t}</span>`).join('')}</div>
                    </div><p><br></p>`;
                }
            },
            gallery: {
                name: 'Галерея',
                icon: '🖼️',
                desc: 'Сетка изображений с лайтбоксом',
                fields: [
                    { name: 'images', type: 'textarea', label: 'URL изображений (каждая строка — URL)', placeholder: '/img/1.jpg\n/img/2.jpg', required: true },
                    { name: 'columns', type: 'number', label: 'Колонок в ряду', default: 3, min: 1, max: 6 },
                    { name: 'gap', type: 'text', label: 'Отступ', default: '8px' },
                    { name: 'lightbox', type: 'checkbox', label: 'Открывать по клику (лайтбокс)', default: true },
                    { name: 'rounded', type: 'checkbox', label: 'Закруглённые углы', default: true }
                ],
                render(cfg) {
                    const imgs = cfg.images.split('\n').filter(s => s.trim());
                    return `<div class="widget-block widget-gallery" data-widget="gallery" data-config='${JSON.stringify(cfg)}' contenteditable="false">
                        <div class="wb-header"><span class="wb-icon">🖼️</span><span class="wb-title">Галерея</span><span class="wb-badge">${imgs.length} фото</span><span class="wb-badge">${cfg.columns} кол.</span><button class="wb-edit" title="Редактировать">✏️</button><button class="wb-delete" title="Удалить">🗑️</button></div>
                        <div class="wb-preview">${imgs.slice(0, 4).map(u => `<span class="w-thumb">${u.trim().split('/').pop()}</span>`).join(' ')}${imgs.length > 4 ? ` <span class="wb-tag">+${imgs.length - 4}</span>` : ''}</div>
                    </div><p><br></p>`;
                }
            },
            audio: {
                name: 'Аудио',
                icon: '🎵',
                desc: 'Аудиоплеер с настройками',
                fields: [
                    { name: 'url', type: 'url', label: 'URL аудио', placeholder: '/audio/song.mp3', required: true },
                    { name: 'title', type: 'text', label: 'Название', placeholder: 'Название трека' },
                    { name: 'autoplay', type: 'checkbox', label: 'Автовоспроизведение', default: false },
                    { name: 'loop', type: 'checkbox', label: 'Зациклить', default: false },
                    { name: 'preload', type: 'select', label: 'Предзагрузка', options: [{ value: 'auto', label: 'Авто' }, { value: 'metadata', label: 'Только метаданные' }, { value: 'none', label: 'Не загружать' }], default: 'auto' }
                ],
                render(cfg) {
                    return `<div class="widget-block widget-audio" data-widget="audio" data-config='${JSON.stringify(cfg)}' contenteditable="false">
                        <div class="wb-header"><span class="wb-icon">🎵</span><span class="wb-title">Аудио${cfg.title ? ': ' + cfg.title : ''}</span><button class="wb-edit" title="Редактировать">✏️</button><button class="wb-delete" title="Удалить">🗑️</button></div>
                        <div class="wb-preview"><span class="wb-link">${cfg.url}</span>${cfg.autoplay ? ' <span class="wb-tag">▶ Авто</span>' : ''}${cfg.loop ? ' <span class="wb-tag">🔁 Цикл</span>' : ''}</div>
                    </div><p><br></p>`;
                }
            },
            quote: {
                name: 'Цитата-блок',
                icon: '💬',
                desc: 'Стилизованная цитата с автором',
                fields: [
                    { name: 'text', type: 'textarea', label: 'Текст цитаты', placeholder: 'Текст...', required: true },
                    { name: 'author', type: 'text', label: 'Автор', placeholder: 'Имя автора' },
                    { name: 'source', type: 'text', label: 'Источник', placeholder: 'Название книги, статьи...' },
                    { name: 'style', type: 'select', label: 'Стиль', options: [{ value: 'classic', label: 'Классический' }, { value: 'modern', label: 'Современный' }, { value: 'minimal', label: 'Минимальный' }], default: 'classic' }
                ],
                render(cfg) {
                    return `<div class="widget-block widget-quote" data-widget="quote" data-config='${JSON.stringify(cfg)}' contenteditable="false">
                        <div class="wb-header"><span class="wb-icon">💬</span><span class="wb-title">Цитата</span><span class="wb-badge">${cfg.style}</span><button class="wb-edit" title="Редактировать">✏️</button><button class="wb-delete" title="Удалить">🗑️</button></div>
                        <div class="wb-preview"><em>"${cfg.text.substring(0, 80)}${cfg.text.length > 80 ? '...' : ''}"</em>${cfg.author ? ` — <strong>${cfg.author}</strong>` : ''}</div>
                    </div><p><br></p>`;
                }
            },
            countdown: {
                name: 'Таймер',
                icon: '⏰',
                desc: 'Обратный отсчёт до даты',
                fields: [
                    { name: 'date', type: 'text', label: 'Дата и время', placeholder: '2026-12-31T23:59:59', required: true },
                    { name: 'title', type: 'text', label: 'Заголовок', placeholder: 'До Нового года' },
                    { name: 'expired', type: 'text', label: 'Текст по окончании', default: 'Время вышло!' },
                    { name: 'style', type: 'select', label: 'Стиль', options: [{ value: 'flip', label: 'Переворот' }, { value: 'minimal', label: 'Минимальный' }, { value: 'bold', label: 'Жирный' }], default: 'flip' }
                ],
                render(cfg) {
                    return `<div class="widget-block widget-countdown" data-widget="countdown" data-config='${JSON.stringify(cfg)}' contenteditable="false">
                        <div class="wb-header"><span class="wb-icon">⏰</span><span class="wb-title">Таймер</span><span class="wb-badge">${cfg.style}</span><button class="wb-edit" title="Редактировать">✏️</button><button class="wb-delete" title="Удалить">🗑️</button></div>
                        <div class="wb-preview">${cfg.title ? `<strong>${cfg.title}</strong> — ` : ''}до ${cfg.date}</div>
                    </div><p><br></p>`;
                }
            },
            map: {
                name: 'Карта',
                icon: '🗺️',
                desc: 'Интерактивная карта (OpenStreetMap)',
                fields: [
                    { name: 'lat', type: 'text', label: 'Широта', placeholder: '55.7558', required: true },
                    { name: 'lon', type: 'text', label: 'Долгота', placeholder: '37.6173', required: true },
                    { name: 'zoom', type: 'number', label: 'Масштаб', default: 13, min: 1, max: 18 },
                    { name: 'height', type: 'text', label: 'Высота', default: '350px' },
                    { name: 'marker', type: 'checkbox', label: 'Показать маркер', default: true },
                    { name: 'popup', type: 'text', label: 'Текст метки', placeholder: 'Наш офис' }
                ],
                render(cfg) {
                    return `<div class="widget-block widget-map" data-widget="map" data-config='${JSON.stringify(cfg)}' contenteditable="false">
                        <div class="wb-header"><span class="wb-icon">🗺️</span><span class="wb-title">Карта</span><span class="wb-badge">${cfg.lat}, ${cfg.lon}</span><button class="wb-edit" title="Редактировать">✏️</button><button class="wb-delete" title="Удалить">🗑️</button></div>
                        <div class="wb-preview">Масштаб: ${cfg.zoom}${cfg.popup ? ` | "${cfg.popup}"` : ''}${cfg.marker ? ' | 📍 Маркер' : ''}</div>
                    </div><p><br></p>`;
                }
            },
            code: {
                name: 'Код (подсветка)',
                icon: '💻',
                desc: 'Блок кода с выбором языка',
                fields: [
                    { name: 'code', type: 'textarea', label: 'Код', placeholder: 'console.log("Hello");', required: true },
                    { name: 'language', type: 'select', label: 'Язык', options: [
                        { value: 'javascript', label: 'JavaScript' }, { value: 'python', label: 'Python' },
                        { value: 'php', label: 'PHP' }, { value: 'html', label: 'HTML' },
                        { value: 'css', label: 'CSS' }, { value: 'sql', label: 'SQL' },
                        { value: 'bash', label: 'Bash' }, { value: 'json', label: 'JSON' },
                        { value: 'other', label: 'Другой' }
                    ], default: 'javascript' },
                    { name: 'title', type: 'text', label: 'Заголовок', placeholder: 'Название файла...' },
                    { name: 'linenumbers', type: 'checkbox', label: 'Номера строк', default: true },
                    { name: 'copyable', type: 'checkbox', label: 'Кнопка копирования', default: true }
                ],
                render(cfg) {
                    return `<div class="widget-block widget-code" data-widget="code" data-config='${JSON.stringify(cfg)}' contenteditable="false">
                        <div class="wb-header"><span class="wb-icon">💻</span><span class="wb-title">Код${cfg.title ? ': ' + cfg.title : ''}</span><span class="wb-badge">${cfg.language}</span><button class="wb-edit" title="Редактировать">✏️</button><button class="wb-delete" title="Удалить">🗑️</button></div>
                        <div class="wb-preview"><code>${cfg.code.substring(0, 120).replace(/</g,'&lt;')}${cfg.code.length > 120 ? '...' : ''}</code></div>
                    </div><p><br></p>`;
                }
            },
            poll: {
                name: 'Опрос',
                icon: '📊',
                desc: 'Интерактивный опрос/голосование',
                fields: [
                    { name: 'question', type: 'text', label: 'Вопрос', placeholder: 'Какой ваш любимый язык?', required: true },
                    { name: 'options', type: 'textarea', label: 'Варианты (каждая строка)', placeholder: 'JavaScript\nPython\nPHP\nRust', required: true },
                    { name: 'multiple', type: 'checkbox', label: 'Множественный выбор', default: false },
                    { name: 'anonymous', type: 'checkbox', label: 'Анонимное голосование', default: true }
                ],
                render(cfg) {
                    const opts = cfg.options.split('\n').filter(s => s.trim());
                    return `<div class="widget-block widget-poll" data-widget="poll" data-config='${JSON.stringify(cfg)}' contenteditable="false">
                        <div class="wb-header"><span class="wb-icon">📊</span><span class="wb-title">Опрос</span><span class="wb-badge">${opts.length} вариантов</span><button class="wb-edit" title="Редактировать">✏️</button><button class="wb-delete" title="Удалить">🗑️</button></div>
                        <div class="wb-preview"><strong>${cfg.question}</strong><br>${opts.map(o => `• ${o.trim()}`).join('<br>')}</div>
                    </div><p><br></p>`;
                }
            },
            spacer: {
                name: 'Отступ',
                icon: '↕️',
                desc: 'Настраиваемый вертикальный отступ',
                fields: [
                    { name: 'height', type: 'text', label: 'Высота отступа', default: '40px' },
                    { name: 'line', type: 'checkbox', label: 'Показать линию-разделитель', default: false }
                ],
                render(cfg) {
                    return `<div class="widget-block widget-spacer" data-widget="spacer" data-config='${JSON.stringify(cfg)}' contenteditable="false">
                        <div class="wb-header"><span class="wb-icon">↕️</span><span class="wb-title">Отступ: ${cfg.height}</span>${cfg.line ? '<span class="wb-badge">с линией</span>' : ''}<button class="wb-edit" title="Редактировать">✏️</button><button class="wb-delete" title="Удалить">🗑️</button></div>
                    </div><p><br></p>`;
                }
            },
            rawhtml: {
                name: 'Свой HTML',
                icon: '🔧',
                desc: 'Произвольный HTML-код',
                fields: [
                    { name: 'html', type: 'textarea', label: 'HTML код', placeholder: '<div class="custom">...</div>', required: true },
                    { name: 'label', type: 'text', label: 'Метка (для редактора)', placeholder: 'Мой блок' }
                ],
                render(cfg) {
                    return `<div class="widget-block widget-rawhtml" data-widget="rawhtml" data-config='${JSON.stringify(cfg)}' contenteditable="false">
                        <div class="wb-header"><span class="wb-icon">🔧</span><span class="wb-title">HTML${cfg.label ? ': ' + cfg.label : ''}</span><button class="wb-edit" title="Редактировать">✏️</button><button class="wb-delete" title="Удалить">🗑️</button></div>
                        <div class="wb-preview"><code>${cfg.html.substring(0, 100).replace(/</g,'&lt;')}${cfg.html.length > 100 ? '...' : ''}</code></div>
                    </div><p><br></p>`;
                }
            },
            voice: {
                name: 'Голосовое',
                icon: '🎤',
                desc: 'Запись голосового сообщения',
                fields: [
                    { name: 'maxDuration', type: 'number', label: 'Макс. длительность (сек)', default: 60, min: 5, max: 300 },
                    { name: 'autoplay', type: 'checkbox', label: 'Автовоспроизведение', default: false }
                ],
                hasRecording: true,
                render(cfg) {
                    const hasAudio = cfg.audioData && cfg.audioData.length > 10;
                    const duration = cfg.audioDuration || 0;
                    const durStr = Math.floor(duration / 60) + ':' + String(Math.floor(duration % 60)).padStart(2, '0');
                    return `<div class="widget-block widget-voice" data-widget="voice" data-config='${JSON.stringify(cfg)}' contenteditable="false">
                        <div class="wb-header"><span class="wb-icon">🎤</span><span class="wb-title">Голосовое сообщение</span>${hasAudio ? `<span class="wb-badge">${durStr}</span>` : '<span class="wb-badge">нет записи</span>'}<button class="wb-edit" title="Редактировать">✏️</button><button class="wb-delete" title="Удалить">🗑️</button></div>
                        <div class="wb-preview">${hasAudio ? '<span class="wb-tag">🎙️ Записано</span>' : '<span class="wb-tag">🎙️ Нажмите ✏️ для записи</span>'}${cfg.autoplay ? ' <span class="wb-tag">▶ Авто</span>' : ''}</div>
                    </div><p><br></p>`;
                }
            }
        };

        this.currentWidget = null;
        this.editingWidgetEl = null;
        this.voiceAudioData = null;
        this.voiceRecorder = null;
        this.voiceStream = null;

        this.init();
    }

    init() {
        this.bindToolbar();
        this.bindTabs();
        this.bindHotkeys();
        this.bindModals();
        this.bindSmileys();
        this.bindActions();
        this.bindUpload();
        this.bindWidgets();
        this.updateStats();
        this.loadContent();

        this.editor.addEventListener('input', () => {
            this.updateStats();
            this.saveContent();
        });

        this.editor.addEventListener('paste', (e) => this.handlePaste(e));
        this.statusMessage.textContent = 'Готов';
    }

    // ===== Toolbar =====
    bindToolbar() {
        document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.execCommand(btn.dataset.command, false, null);
                this.editor.focus();
                this.updateActiveStates();
            });
        });

        document.getElementById('formatBlock').addEventListener('change', (e) => {
            document.execCommand('formatBlock', false, `<${e.target.value}>`);
            this.editor.focus();
        });

        document.getElementById('fontSize').addEventListener('change', (e) => {
            document.execCommand('fontSize', false, e.target.value);
            this.editor.focus();
        });

        document.getElementById('foreColor').addEventListener('input', (e) => {
            document.execCommand('foreColor', false, e.target.value);
            this.editor.focus();
        });

        document.getElementById('hiliteColor').addEventListener('input', (e) => {
            document.execCommand('hiliteColor', false, e.target.value);
            this.editor.focus();
        });

        document.getElementById('btnLink').addEventListener('click', () => this.showLinkModal());
        document.getElementById('btnUnlink').addEventListener('click', () => {
            document.execCommand('unlink', false, null);
            this.editor.focus();
        });
        document.getElementById('btnImage').addEventListener('click', () => this.showImageModal());
        document.getElementById('btnVideo').addEventListener('click', () => this.showVideoModal());
        document.getElementById('btnTable').addEventListener('click', () => this.showTableModal());
        document.getElementById('btnHR').addEventListener('click', () => {
            document.execCommand('insertHorizontalRule', false, null);
            this.editor.focus();
        });
        document.getElementById('btnCode').addEventListener('click', () => this.insertCodeBlock());
        document.getElementById('btnSmile').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSmileys();
        });
        document.getElementById('btnFullscreen').addEventListener('click', () => this.toggleFullscreen());

        this.editor.addEventListener('mouseup', () => this.updateActiveStates());
        this.editor.addEventListener('keyup', () => this.updateActiveStates());
    }

    updateActiveStates() {
        document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
            const cmd = btn.dataset.command;
            if (['bold','italic','underline','strikeThrough',
                 'justifyLeft','justifyCenter','justifyRight','justifyFull',
                 'insertUnorderedList','insertOrderedList'].includes(cmd)) {
                btn.classList.toggle('active', document.queryCommandState(cmd));
            }
        });
    }

    // ===== Tabs =====
    bindTabs() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
    }

    switchTab(name) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.tab[data-tab="${name}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const id = 'tab' + name.charAt(0).toUpperCase() + name.slice(1);
        document.getElementById(id).classList.add('active');

        if (name === 'preview') {
            this.preview.innerHTML = this.editor.innerHTML;
            if (window.renderWidgetsIn) window.renderWidgetsIn(this.preview);
        } else if (name === 'html') {
            this.htmlArea.value = this.formatHTML(this.editor.innerHTML);
        } else if (name === 'editor') {
            if (this.htmlArea.value && this.htmlArea.value !== this.formatHTML(this.editor.innerHTML)) {
                this.editor.innerHTML = this.htmlArea.value;
                this.updateStats();
            }
        }

        const labels = { editor: 'Редактор', preview: 'Предпросмотр', html: 'HTML' };
        this.statusMessage.textContent = 'Режим: ' + labels[name];
    }

    // ===== Hotkeys =====
    bindHotkeys() {
        this.editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        this.saveContent();
                        this.saveToServer();
                        break;
                    case 'b':
                        e.preventDefault();
                        document.execCommand('bold', false, null);
                        break;
                    case 'i':
                        e.preventDefault();
                        document.execCommand('italic', false, null);
                        break;
                    case 'u':
                        e.preventDefault();
                        document.execCommand('underline', false, null);
                        break;
                    case 'k':
                        e.preventDefault();
                        this.showLinkModal();
                        break;
                }
            }
            if (e.key === 'F11') {
                e.preventDefault();
                this.toggleFullscreen();
            }
        });
    }

    // ===== Modals =====
    bindModals() {
        this.modalClose.addEventListener('click', () => this.hideModal());
        this.modalCancel.addEventListener('click', () => this.hideModal());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.hideModal();
        });
        this.modalOk.addEventListener('click', () => {
            if (this.currentModalCallback) this.currentModalCallback();
        });
    }

    showModal(title, bodyHTML, callback) {
        this.saveSelection();
        this.modalTitle.textContent = title;
        this.modalBody.innerHTML = bodyHTML;
        this.currentModalCallback = callback;
        this.modalOverlay.classList.add('active');
        setTimeout(() => {
            const inp = this.modalBody.querySelector('input');
            if (inp) inp.focus();
        }, 100);
    }

    hideModal() {
        this.modalOverlay.classList.remove('active');
        this.currentModalCallback = null;
    }

    showLinkModal() {
        const sel = this.getSelectedText();
        this.showModal('Вставить ссылку', `
            <label>Текст ссылки:</label>
            <input type="text" id="linkText" value="${sel}" placeholder="Текст">
            <label style="margin-top:10px">URL:</label>
            <input type="url" id="linkUrl" placeholder="https://example.com">
            <label style="margin-top:10px"><input type="checkbox" id="linkBlank" checked> Новая вкладка</label>
        `, () => {
            const text = document.getElementById('linkText').value;
            const url = document.getElementById('linkUrl').value;
            const blank = document.getElementById('linkBlank').checked;
            if (url) {
                this.restoreSelection();
                const tag = blank ? ' target="_blank" rel="noopener"' : '';
                document.execCommand('insertHTML', false,
                    text ? `<a href="${url}"${tag}>${text}</a>` : `<a href="${url}"${tag}>${url}</a>`
                );
                this.hideModal();
                this.editor.focus();
            }
        });
    }

    showImageModal() {
        this.showModal('Вставить изображение', `
            <label>URL изображения:</label>
            <input type="url" id="imageUrl" placeholder="https://example.com/img.jpg">
            <label style="margin-top:10px">Alt текст:</label>
            <input type="text" id="imageAlt" placeholder="Описание">
            <label style="margin-top:10px">Выравнивание:</label>
            <select id="imageAlign" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border);border-radius:4px;color:var(--text)">
                <option value="">По умолчанию</option>
                <option value="left">Слева</option>
                <option value="center">По центру</option>
                <option value="right">Справа</option>
            </select>
        `, () => {
            const url = document.getElementById('imageUrl').value;
            const alt = document.getElementById('imageAlt').value || 'image';
            const align = document.getElementById('imageAlign').value;
            if (url) {
                this.restoreSelection();
                let img = `<img src="${url}" alt="${alt}"`;
                if (align) img += ` style="float:${align};margin:0 12px 12px 0"`;
                img += '>';
                document.execCommand('insertHTML', false, img);
                this.hideModal();
                this.editor.focus();
            }
        });
    }

    showVideoModal() {
        this.showModal('Вставить видео', `
            <label>URL (YouTube / Vimeo):</label>
            <input type="url" id="videoUrl" placeholder="https://youtube.com/watch?v=...">
        `, () => {
            const url = document.getElementById('videoUrl').value;
            if (url) {
                this.restoreSelection();
                const embed = this.getVideoEmbed(url);
                if (embed) document.execCommand('insertHTML', false, embed);
                this.hideModal();
                this.editor.focus();
            }
        });
    }

    getVideoEmbed(url) {
        let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        if (m) return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:16px 0;border-radius:6px"><iframe src="https://www.youtube.com/embed/${m[1]}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none" allowfullscreen></iframe></div>`;
        m = url.match(/vimeo\.com\/(\d+)/);
        if (m) return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:16px 0;border-radius:6px"><iframe src="https://player.vimeo.com/video/${m[1]}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none" allowfullscreen></iframe></div>`;
        return null;
    }

    showTableModal() {
        this.showModal('Вставить таблицу', `
            <label>Строк:</label>
            <input type="number" id="tableRows" value="3" min="1" max="20">
            <label style="margin-top:10px">Столбцов:</label>
            <input type="number" id="tableCols" value="3" min="1" max="10">
            <label style="margin-top:10px"><input type="checkbox" id="tableHeader" checked> С заголовком</label>
        `, () => {
            const rows = parseInt(document.getElementById('tableRows').value) || 3;
            const cols = parseInt(document.getElementById('tableCols').value) || 3;
            const hdr = document.getElementById('tableHeader').checked;
            this.restoreSelection();
            let html = '<table>';
            if (hdr) {
                html += '<tr>';
                for (let j = 0; j < cols; j++) html += `<th>Заголовок ${j + 1}</th>`;
                html += '</tr>';
            }
            for (let i = 0; i < rows; i++) {
                html += '<tr>';
                for (let j = 0; j < cols; j++) html += '<td>&nbsp;</td>';
                html += '</tr>';
            }
            html += '</table><p>&nbsp;</p>';
            document.execCommand('insertHTML', false, html);
            this.hideModal();
            this.editor.focus();
        });
    }

    insertCodeBlock() {
        const code = prompt('Введите код:');
        if (code) {
            this.restoreSelection();
            document.execCommand('insertHTML', false,
                `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre><p>&nbsp;</p>`
            );
            this.editor.focus();
        }
    }

    // ===== Smileys =====
    bindSmileys() {
        this.smileys.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'smiley-btn';
            btn.textContent = s;
            btn.addEventListener('click', () => {
                this.restoreSelection();
                document.execCommand('insertText', false, s);
                this.smileysPanel.classList.remove('active');
                this.editor.focus();
            });
            this.smileysGrid.appendChild(btn);
        });
        document.addEventListener('click', (e) => {
            if (!this.smileysPanel.contains(e.target) && e.target.id !== 'btnSmile' && !e.target.closest('#btnSmile')) {
                this.smileysPanel.classList.remove('active');
            }
        });
    }

    toggleSmileys() {
        const btn = document.getElementById('btnSmile');
        const rect = btn.getBoundingClientRect();
        this.smileysPanel.style.top = (rect.bottom + 6) + 'px';
        this.smileysPanel.style.left = Math.min(rect.left, window.innerWidth - 300) + 'px';
        this.smileysPanel.classList.toggle('active');
    }

    // ===== Widgets =====
    bindWidgets() {
        const overlay = document.getElementById('widgetOverlay');
        const picker = document.getElementById('widgetPicker');
        const form = document.getElementById('widgetForm');
        const title = document.getElementById('widgetTitle');
        const backBtn = document.getElementById('widgetBackBtn');
        const insertBtn = document.getElementById('widgetInsertBtn');
        const cancelBtn = document.getElementById('widgetCancelBtn');
        const closeBtn = document.getElementById('widgetClose');

        // Build picker grid
        let grid = '<div class="wg-grid">';
        for (const [key, w] of Object.entries(this.widgetRegistry)) {
            grid += `<button class="wg-card" data-widget="${key}"><span class="wg-icon">${w.icon}</span><span class="wg-name">${w.name}</span><span class="wg-desc">${w.desc}</span></button>`;
        }
        grid += '</div>';
        picker.innerHTML = grid;

        // Open modal
        document.getElementById('btnWidget').addEventListener('click', () => {
            this.saveSelection();
            this.editingWidgetEl = null;
            this.currentWidget = null;
            picker.style.display = '';
            form.style.display = 'none';
            backBtn.style.display = 'none';
            insertBtn.style.display = 'none';
            title.textContent = 'Выберите виджет';
            overlay.classList.add('active');
        });

        // Pick widget type
        picker.querySelectorAll('.wg-card').forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.widget;
                this.currentWidget = type;
                this.showWidgetForm(type, null);
            });
        });

        // Back button
        backBtn.addEventListener('click', () => {
            picker.style.display = '';
            form.style.display = 'none';
            backBtn.style.display = 'none';
            insertBtn.style.display = 'none';
            title.textContent = 'Выберите виджет';
            this.editingWidgetEl = null;
        });

        // Cancel / Close
        cancelBtn.addEventListener('click', () => this.hideWidgetModal());
        closeBtn.addEventListener('click', () => this.hideWidgetModal());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) this.hideWidgetModal(); });

        // Insert button
        insertBtn.addEventListener('click', () => this.insertWidget());

        // Delegate edit/delete on widget blocks in editor
        this.editor.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.wb-edit');
            const delBtn = e.target.closest('.wb-delete');
            if (editBtn) {
                e.preventDefault();
                const block = editBtn.closest('.widget-block');
                const type = block.dataset.widget;
                const cfg = JSON.parse(block.dataset.config || '{}');
                this.editingWidgetEl = block;
                this.currentWidget = type;
                this.saveSelection();
                this.showWidgetForm(type, cfg);
            } else if (delBtn) {
                e.preventDefault();
                const block = delBtn.closest('.widget-block');
                const next = block.nextElementSibling;
                block.remove();
                if (next && next.tagName === 'P' && !next.textContent.trim()) next.remove();
                this.showToast('Виджет удалён', 'success');
            }
        });
    }

    showWidgetForm(type, existingCfg) {
        const w = this.widgetRegistry[type];
        if (!w) return;
        const picker = document.getElementById('widgetPicker');
        const form = document.getElementById('widgetForm');
        const title = document.getElementById('widgetTitle');
        const backBtn = document.getElementById('widgetBackBtn');
        const insertBtn = document.getElementById('widgetInsertBtn');

        picker.style.display = 'none';
        form.style.display = '';
        backBtn.style.display = '';
        insertBtn.style.display = '';
        title.textContent = (existingCfg ? 'Редактировать' : 'Настройка') + ': ' + w.icon + ' ' + w.name;

        let html = '';
        w.fields.forEach(f => {
            const val = existingCfg ? (existingCfg[f.name] ?? f.default ?? '') : (f.default ?? '');
            html += `<div class="wf-field">`;
            if (f.type === 'checkbox') {
                html += `<label class="wf-check"><input type="checkbox" id="wf_${f.name}" ${val ? 'checked' : ''}> ${f.label}</label>`;
            } else if (f.type === 'select') {
                html += `<label class="wf-label">${f.label}</label><select class="wf-input" id="wf_${f.name}">${f.options.map(o => `<option value="${o.value}" ${val === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}</select>`;
            } else if (f.type === 'textarea') {
                html += `<label class="wf-label">${f.label}</label><textarea class="wf-input wf-textarea" id="wf_${f.name}" placeholder="${f.placeholder || ''}">${val}</textarea>`;
            } else {
                html += `<label class="wf-label">${f.label}</label><input class="wf-input" type="${f.type}" id="wf_${f.name}" value="${val}" placeholder="${f.placeholder || ''}"${f.min !== undefined ? ` min="${f.min}"` : ''}${f.max !== undefined ? ` max="${f.max}"` : ''}>`;
            }
            html += '</div>';
        });
        form.innerHTML = html;

        // Voice recording interface
        if (w.hasRecording) {
            const existingAudio = existingCfg ? existingCfg.audioData : null;
            const hasExisting = existingAudio && existingAudio.length > 10;
            this.voiceAudioData = hasExisting ? existingAudio : null;

            form.insertAdjacentHTML('beforeend', `
                <div class="wf-field" style="border-top:1px solid var(--border);padding-top:14px;margin-top:10px">
                    <label class="wf-label" style="font-weight:600">🎙️ Запись голоса</label>
                    <div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:16px;text-align:center">
                        <div id="wfVoiceStatus" style="color:var(--text-muted);font-size:0.85rem;margin-bottom:10px">${hasExisting ? '✅ Есть запись' : 'Нажмите записать'}</div>
                        <div style="display:flex;justify-content:center;gap:10px;align-items:center">
                            <button id="wfVoiceRecBtn" onclick="window.kEditor.toggleVoiceRec()" style="background:#5a8a40;color:#fff;border:none;width:48px;height:48px;border-radius:50%;cursor:pointer;font-size:1.3rem">🎙️</button>
                            <button id="wfVoicePlayBtn" onclick="window.kEditor.playVoicePreview()" style="background:rgba(201,168,76,0.15);color:#c9a84c;border:1px solid var(--border);width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:1rem;display:${hasExisting ? '' : 'none'}">▶</button>
                            <button id="wfVoiceDelBtn" onclick="window.kEditor.deleteVoiceRec()" style="background:rgba(200,60,60,0.15);color:#c44;border:1px solid rgba(200,60,60,0.3);width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:1rem;display:${hasExisting ? '' : 'none'}">🗑️</button>
                        </div>
                        <div id="wfVoiceTimer" style="color:#c9a84c;font-size:1.1rem;margin-top:10px;display:none">0:00</div>
                        <audio id="wfVoiceAudio" ${hasExisting ? `src="${existingAudio}"` : ''} style="display:none"></audio>
                    </div>
                </div>`);

            // Disable insert button if no audio yet
            if (!hasExisting) {
                insertBtn.disabled = true;
                insertBtn.style.opacity = '0.4';
                insertBtn.style.pointerEvents = 'none';
            }
        }
    }

    // ===== Voice Recording =====
    toggleVoiceRec() {
        const btn = document.getElementById('wfVoiceRecBtn');
        const timer = document.getElementById('wfVoiceTimer');
        const status = document.getElementById('wfVoiceStatus');

        if (this.voiceRecorder && this.voiceRecorder.state === 'recording') {
            this.voiceRecorder.stop();
            return;
        }

        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            this.voiceStream = stream;
            const recorder = new MediaRecorder(stream);
            const chunks = [];
            const startTime = Date.now();
            this.voiceRecorder = recorder;

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop());
                this.voiceStream = null;
                clearInterval(this._voiceTimer);

                const blob = new Blob(chunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onload = () => {
                    this.voiceAudioData = reader.result;
                    const duration = (Date.now() - startTime) / 1000;
                    const durStr = Math.floor(duration / 60) + ':' + String(Math.floor(duration % 60)).padStart(2, '0');
                    status.textContent = '✅ Записано: ' + durStr;
                    document.getElementById('wfVoicePlayBtn').style.display = '';
                    document.getElementById('wfVoiceDelBtn').style.display = '';
                    document.getElementById('wfVoiceAudio').src = this.voiceAudioData;
                    this._voiceDuration = duration;

                    // Enable insert button
                    const insertBtn = document.getElementById('widgetInsertBtn');
                    if (insertBtn) {
                        insertBtn.disabled = false;
                        insertBtn.style.opacity = '1';
                        insertBtn.style.pointerEvents = '';
                    }

                    // Auto-retry insert if pending
                    if (this._pendingVoiceInsert) {
                        this._pendingVoiceInsert = false;
                        setTimeout(() => this.insertWidget(), 100);
                    }
                };
                reader.readAsDataURL(blob);

                btn.textContent = '🎙️';
                btn.style.background = '#5a8a40';
                timer.style.display = 'none';
            };

            recorder.start();
            btn.textContent = '⏹';
            btn.style.background = '#c44';
            timer.style.display = '';

            this._voiceTimer = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                timer.textContent = Math.floor(elapsed / 60) + ':' + String(elapsed % 60).padStart(2, '0');
            }, 200);

        }).catch(() => {
            this.showToast('Не удалось получить доступ к микрофону', 'error');
        });
    }

    playVoicePreview() {
        const audio = document.getElementById('wfVoiceAudio');
        if (!audio || !audio.src) return;
        if (audio.paused) {
            audio.play();
            document.getElementById('wfVoicePlayBtn').textContent = '⏸';
            audio.onended = () => { document.getElementById('wfVoicePlayBtn').textContent = '▶'; };
        } else {
            audio.pause();
            audio.currentTime = 0;
            document.getElementById('wfVoicePlayBtn').textContent = '▶';
        }
    }

    deleteVoiceRec() {
        this.voiceAudioData = null;
        this._voiceDuration = 0;
        document.getElementById('wfVoiceStatus').textContent = 'Нажмите записать';
        document.getElementById('wfVoiceAudio').src = '';
        document.getElementById('wfVoicePlayBtn').style.display = 'none';
        document.getElementById('wfVoiceDelBtn').style.display = 'none';
        // Disable insert button
        const insertBtn = document.getElementById('widgetInsertBtn');
        if (insertBtn) {
            insertBtn.disabled = true;
            insertBtn.style.opacity = '0.4';
            insertBtn.style.pointerEvents = 'none';
        }
    }

    hideWidgetModal() {
        if (this.voiceRecorder && this.voiceRecorder.state === 'recording') {
            this.voiceRecorder.stop();
        }
        if (this.voiceStream) {
            this.voiceStream.getTracks().forEach(t => t.stop());
            this.voiceStream = null;
        }
        document.getElementById('widgetOverlay').classList.remove('active');
        this.currentWidget = null;
        this.editingWidgetEl = null;
    }

    insertWidget() {
        const w = this.widgetRegistry[this.currentWidget];
        if (!w) return;

        // Auto-stop voice recording if in progress
        if (w.hasRecording && this.voiceRecorder && this.voiceRecorder.state === 'recording') {
            this._pendingVoiceInsert = true;
            this.voiceRecorder.stop();
            return; // Will retry after recording stops
        }

        const cfg = {};
        w.fields.forEach(f => {
            const el = document.getElementById('wf_' + f.name);
            if (!el) return;
            if (f.type === 'checkbox') cfg[f.name] = el.checked;
            else if (f.type === 'number') cfg[f.name] = parseInt(el.value) || f.default || 0;
            else cfg[f.name] = el.value;
        });

        // Add voice audio data
        if (w.hasRecording && this.voiceAudioData) {
            cfg.audioData = this.voiceAudioData;
            cfg.audioDuration = this._voiceDuration || 0;
        } else if (w.hasRecording && !this.voiceAudioData) {
            this.showToast('Запись не найдена — нажмите 🎙️ для записи', 'error');
            return;
        }

        // Validate required
        for (const f of w.fields) {
            if (f.required && !cfg[f.name]) {
                this.showToast(`Заполните поле: ${f.label}`, 'error');
                return;
            }
        }

        const html = w.render(cfg);

        if (this.editingWidgetEl) {
            // Update existing widget
            this.editingWidgetEl.outerHTML = html;
            this.editingWidgetEl = null;
            this.showToast('Виджет обновлён', 'success');
        } else {
            // Insert new
            this.restoreSelection();
            document.execCommand('insertHTML', false, html);
            this.showToast('Виджет вставлен', 'success');
        }

        this.voiceAudioData = null;
        this._voiceDuration = 0;
        this.hideWidgetModal();
        this.editor.focus();
    }

    // ===== File Upload =====
    bindUpload() {
        document.getElementById('btnUpload').addEventListener('click', () => {
            this.uploadOverlay.classList.add('active');
        });

        document.getElementById('uploadClose').addEventListener('click', () => {
            this.uploadOverlay.classList.remove('active');
        });

        document.getElementById('uploadCancelBtn').addEventListener('click', () => {
            this.uploadOverlay.classList.remove('active');
        });

        this.uploadOverlay.addEventListener('click', (e) => {
            if (e.target === this.uploadOverlay) this.uploadOverlay.classList.remove('active');
        });

        this.uploadArea.addEventListener('click', () => this.fileInput.click());

        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.processFiles(e.dataTransfer.files);
        });

        this.fileInput.addEventListener('change', (e) => {
            this.processFiles(e.target.files);
        });

        document.getElementById('uploadInsertBtn').addEventListener('click', () => {
            this.insertUploadedFiles();
        });
    }

    processFiles(fileList) {
        Array.from(fileList).forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                this.showToast(`Файл ${file.name} слишком большой (макс 5MB)`, 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result
                };
                this.uploadedFiles.push(fileData);
                this.renderFilePreview();
            };

            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    }

    renderFilePreview() {
        this.filePreview.innerHTML = '';
        this.fileList.innerHTML = '';

        this.uploadedFiles.forEach((file, idx) => {
            if (file.type.startsWith('image/')) {
                const item = document.createElement('div');
                item.className = 'file-preview-item';
                item.innerHTML = `
                    <img src="${file.data}" alt="${file.name}">
                    <span class="file-name">${file.name}</span>
                    <button class="remove-file" data-idx="${idx}">&times;</button>
                `;
                this.filePreview.appendChild(item);
            } else {
                const item = document.createElement('div');
                item.className = 'file-list-item';
                item.innerHTML = `
                    <div class="file-info">
                        <span>📄</span>
                        <span>${file.name}</span>
                        <span class="file-size">${this.formatSize(file.size)}</span>
                    </div>
                    <button class="insert-btn" data-idx="${idx}">Вставить</button>
                `;
                this.fileList.appendChild(item);
            }
        });

        // Bind remove buttons
        this.filePreview.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', () => {
                this.uploadedFiles.splice(parseInt(btn.dataset.idx), 1);
                this.renderFilePreview();
            });
        });

        // Bind insert buttons for non-image files
        this.fileList.querySelectorAll('.insert-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                this.insertFile(idx);
            });
        });
    }

    insertFile(idx) {
        const file = this.uploadedFiles[idx];
        if (!file) return;

        this.restoreSelection();

        if (file.type.startsWith('image/')) {
            document.execCommand('insertHTML', false,
                `<img src="${file.data}" alt="${file.name}" style="max-width:100%;height:auto"><p>&nbsp;</p>`
            );
        } else {
            document.execCommand('insertHTML', false,
                `<div class="file-attachment"><span>📄</span><a href="${file.data}" download="${file.name}">${file.name}</a> <span style="color:var(--text-muted);font-size:0.75rem">(${this.formatSize(file.size)})</span></div><p>&nbsp;</p>`
            );
        }

        this.showToast(`Файл ${file.name} вставлен`, 'success');
    }

    insertUploadedFiles() {
        if (this.uploadedFiles.length === 0) {
            this.showToast('Нет файлов для вставки', 'error');
            return;
        }

        this.restoreSelection();

        this.uploadedFiles.forEach(file => {
            if (file.type.startsWith('image/')) {
                document.execCommand('insertHTML', false,
                    `<img src="${file.data}" alt="${file.name}" style="max-width:100%;height:auto"><p>&nbsp;</p>`
                );
            } else {
                document.execCommand('insertHTML', false,
                    `<div class="file-attachment"><span>📄</span><a href="${file.data}" download="${file.name}">${file.name}</a> <span style="color:var(--text-muted);font-size:0.75rem">(${this.formatSize(file.size)})</span></div><p>&nbsp;</p>`
                );
            }
        });

        this.uploadedFiles = [];
        this.renderFilePreview();
        this.uploadOverlay.classList.remove('active');
        this.editor.focus();
        this.showToast('Файлы вставлены', 'success');
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' Б';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
        return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
    }

    // ===== Actions =====
    bindActions() {
        document.getElementById('btnSave').addEventListener('click', () => {
            this.saveContent();
            this.saveToServer();
        });

        document.getElementById('btnClear').addEventListener('click', () => {
            this.editor.innerHTML = '<p></p>';
            this.currentDocId = null;
            this.updateStats();
            this.saveContent();
            this.showToast('Контент очищен', 'success');
        });
    }

    // ===== Fullscreen =====
    toggleFullscreen() {
        const wrapper = document.querySelector('.editor-wrapper');
        this.isFullscreen = !this.isFullscreen;
        wrapper.classList.toggle('fullscreen', this.isFullscreen);
        document.body.classList.toggle('fullscreen-mode', this.isFullscreen);
        const icon = document.querySelector('#btnFullscreen .btn-icon');
        if (icon) icon.style.setProperty('--icon', this.isFullscreen ? "'⛶'" : "'⛶'");
    }

    // ===== Selection helpers =====
    saveSelection() {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) this.savedSelection = sel.getRangeAt(0);
    }

    restoreSelection() {
        if (this.savedSelection) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(this.savedSelection);
        } else {
            // No saved selection — place cursor at end of editor
            this.editor.focus();
            const sel = window.getSelection();
            sel.selectAllChildren(this.editor);
            sel.collapseToEnd();
        }
    }

    getSelectedText() {
        return window.getSelection().toString() || '';
    }

    handlePaste(e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
    }

    // ===== Stats =====
    updateStats() {
        const text = this.editor.innerText || '';
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        this.wordCount.textContent = words;
        this.charCount.textContent = text.length;
    }

    // ===== Save/Load =====
    saveContent() {
        localStorage.setItem('keditor_content', this.editor.innerHTML);
    }

    loadContent() {
        const saved = localStorage.getItem('keditor_content');
        if (saved) {
            this.editor.innerHTML = saved;
            this.updateStats();
        }
    }

    // ===== Save to server (AJAX) =====
    saveToServer() {
        const html = this.editor.innerHTML;
        if (!html || html === '<p></p>' || html === '<p><br></p>') {
            this.showToast('Нечего сохранять', 'error');
            return;
        }

        const body = { content: html };
        if (this.currentDocId) body.id = this.currentDocId;

        fetch('api/save.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                if (data.id) this.currentDocId = data.id;
                this.showToast('Сохранено на сервер!', 'success');
            } else {
                this.showToast(data.error || 'Ошибка сохранения', 'error');
            }
        })
        .catch(() => this.showToast('Сохранено локально', 'success'));
    }

    // ===== Toast =====
    showToast(message, type = 'success') {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.innerHTML = '<span style="font-size:1.1rem">' +
            (type === 'success' ? '✓' : '✗') +
            '</span> ' + message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ===== HTML formatter =====
    formatHTML(html) {
        let formatted = '';
        let indent = 0;
        const tags = html.match(/(<\/?[^>]+>)/g) || [];
        tags.forEach(tag => {
            if (tag.match(/^<\/\w/)) indent--;
            formatted += '  '.repeat(Math.max(0, indent)) + tag + '\n';
            if (tag.match(/^<\w[^>]*[^\/]>/) && !tag.match(/^<(img|br|hr|input)/)) indent++;
        });
        return formatted.trim();
    }
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    window.kEditor = new KEditor();
});
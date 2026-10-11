/**
 * K-Editor Widget Renderer
 * Renders widget-block elements with data-widget + data-config into real interactive content.
 * Include this script on any page that displays K-Editor saved documents.
 */
(function() {
    'use strict';

    function parseConfig(el) {
        try {
            const raw = el.getAttribute('data-config');
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.warn('Widget config parse error:', e);
            return {};
        }
    }

    function escapeHTML(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    // Aliases for widget types that differ between editor storage and renderer
    const typeAliases = {
        countdown: 'timer',
        custom_html: 'rawhtml'
    };

    const renderers = {
        carousel(el, cfg) {
            const imgs = Array.isArray(cfg.images) ? cfg.images : (cfg.images || '').split('\n').filter(s => s.trim());
            if (!imgs.length) return;
            const id = 'carousel_' + Math.random().toString(36).slice(2, 8);
            const speed = cfg.speed || 3000;
            const autoplay = cfg.autoplay !== false;
            const dots = cfg.dots !== false;
            const arrows = cfg.arrows !== false;
            const h = cfg.height || '400px';

            el.innerHTML = `
                <div class="wr-carousel" id="${id}" style="position:relative;overflow:hidden;border-radius:8px;height:${h};background:#0a0d06">
                    <div class="wr-carousel-track" style="display:flex;height:100%;transition:transform 0.5s ease">
                        ${imgs.map(u => `<div style="min-width:100%;height:100%"><img src="${escapeHTML(u.trim())}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"></div>`).join('')}
                    </div>
                    ${arrows ? `<button class="wr-car-arrow wr-car-prev" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.6);color:#c9a84c;border:none;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:18px;z-index:2" onclick="wrCarouselNav('${id}',-1)">‹</button>
                    <button class="wr-car-arrow wr-car-next" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.6);color:#c9a84c;border:none;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:18px;z-index:2" onclick="wrCarouselNav('${id}',1)">›</button>` : ''}
                    ${dots ? `<div class="wr-car-dots" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:2">
                        ${imgs.map((_, i) => `<span class="wr-car-dot" data-idx="${i}" style="width:10px;height:10px;border-radius:50%;background:${i === 0 ? '#c9a84c' : 'rgba(255,255,255,0.4)'};cursor:pointer;transition:background 0.3s" onclick="wrCarouselGo('${id}',${i},${imgs.length})"></span>`).join('')}
                    </div>` : ''}
                </div>`;
            el.style.margin = '16px 0';

            if (autoplay && imgs.length > 1) {
                el._interval = setInterval(() => wrCarouselNav(id, 1), speed);
            }
        },

        youtube(el, cfg) {
            if (!cfg.url) return;
            let videoId = '';
            const m = cfg.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?#]+)/);
            if (m) videoId = m[1];
            if (!videoId) return;

            const params = new URLSearchParams();
            if (cfg.autoplay) params.set('autoplay', '1');
            if (cfg.muted) params.set('mute', '1');
            if (cfg.loop) { params.set('loop', '1'); params.set('playlist', videoId); }
            if (cfg.start > 0) params.set('start', cfg.start);
            if (cfg.end > 0) params.set('end', cfg.end);
            if (cfg.controls === false) params.set('controls', '0');
            params.set('rel', '0');

            const ratio = cfg.aspect === '4:3' ? '75%' : cfg.aspect === '21:9' ? '42.86%' : '56.25%';
            el.innerHTML = `<div style="position:relative;padding-bottom:${ratio};height:0;overflow:hidden;border-radius:8px;margin:16px 0">
                <iframe src="https://www.youtube.com/embed/${videoId}?${params}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none" allowfullscreen allow="autoplay;encrypted-media"></iframe>
            </div>`;
            el.style.margin = '0';
        },

        vimeo(el, cfg) {
            if (!cfg.url) return;
            const m = cfg.url.match(/vimeo\.com\/(\d+)/);
            if (!m) return;
            const params = new URLSearchParams();
            if (cfg.autoplay) params.set('autoplay', '1');
            if (cfg.loop) params.set('loop', '1');
            if (cfg.muted) params.set('muted', '1');

            el.innerHTML = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:16px 0">
                <iframe src="https://player.vimeo.com/video/${m[1]}?${params}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none" allowfullscreen></iframe>
            </div>`;
            el.style.margin = '0';
        },

        gallery(el, cfg) {
            const imgs = Array.isArray(cfg.images) ? cfg.images : (cfg.images || '').split('\n').filter(s => s.trim());
            if (!imgs.length) return;
            const cols = cfg.columns || 3;
            const gap = cfg.gap || '8px';
            const rounded = cfg.rounded !== false;
            const lightbox = cfg.lightbox !== false;

            el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${gap};margin:16px 0">
                ${imgs.map(u => `<div style="overflow:hidden;border-radius:${rounded ? '8px' : '0'};cursor:pointer;aspect-ratio:4/3;background:#1a1a2e">
                    <img src="${escapeHTML(u.trim())}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" ${lightbox ? `onclick="wrLightbox(this.src)"` : ''} onerror="this.parentElement.style.display='none'">
                </div>`).join('')}
            </div>`;
            el.style.margin = '0';
        },

        audio(el, cfg) {
            if (!cfg.url) return;
            const title = cfg.title || cfg.url.split('/').pop();
            el.innerHTML = `<div style="background:rgba(201,168,76,0.06);border:1px solid #2a3520;border-radius:8px;padding:16px;margin:16px 0">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                    <span style="font-size:1.5rem">🎵</span>
                    <span style="color:#c9a84c;font-weight:600">${escapeHTML(title)}</span>
                </div>
                <audio controls style="width:100%" ${cfg.autoplay ? 'autoplay' : ''} ${cfg.loop ? 'loop' : ''} preload="${cfg.preload || 'metadata'}">
                    <source src="${escapeHTML(cfg.url)}">
                </audio>
            </div>`;
            el.style.margin = '0';
        },

        quote(el, cfg) {
            if (!cfg.text) return;
            const style = cfg.style || 'classic';
            let borderStyle, bgStyle, textStyle;

            if (style === 'modern') {
                borderStyle = 'border-left:4px solid #5a8a40';
                bgStyle = 'background:rgba(90,138,64,0.06)';
                textStyle = 'color:#d4d4c8;font-size:1.1rem;line-height:1.8';
            } else if (style === 'minimal') {
                borderStyle = 'border:none;text-align:center';
                bgStyle = 'background:transparent';
                textStyle = 'color:#7a7a6a;font-style:italic;font-size:1.05rem';
            } else {
                borderStyle = 'border-left:3px solid #8a7433';
                bgStyle = 'background:rgba(201,168,76,0.04)';
                textStyle = 'color:#7a7a6a;font-style:italic';
            }

            el.innerHTML = `<blockquote style="${borderStyle};${bgStyle};padding:16px 20px;margin:16px 0;border-radius:0 8px 8px 0">
                <p style="${textStyle};margin:0 0 10px">«${escapeHTML(cfg.text)}»</p>
                ${cfg.author ? `<footer style="color:#c9a84c;font-size:0.9rem;font-style:normal">— <strong>${escapeHTML(cfg.author)}</strong>${cfg.source ? ` <span style="color:#7a7a6a">, ${escapeHTML(cfg.source)}</span>` : ''}</footer>` : ''}
            </blockquote>`;
            el.style.margin = '0';
        },

        timer(el, cfg) {
            if (!cfg.date) return;
            const target = new Date(cfg.date).getTime();
            const label = cfg.label || cfg.title || '';
            const expired = cfg.expired || 'Время вышло!';
            const style = cfg.style || 'flip';
            const id = 'timer_' + Math.random().toString(36).slice(2, 8);

            const bgStyle = style === 'bold' ? 'background:linear-gradient(135deg,#1a2110,#0a0d06);border:2px solid #5a8a40' :
                            style === 'minimal' ? 'background:transparent;border:none' :
                            'background:rgba(0,0,0,0.4);border:1px solid #2a3520';
            const numStyle = style === 'bold' ? 'font-size:2.5rem;font-weight:900;color:#5a8a40' :
                            style === 'minimal' ? 'font-size:1.8rem;font-weight:300;color:#c9a84c' :
                            'font-size:2rem;font-weight:700;color:#c9a84c';

            el.innerHTML = `<div id="${id}" style="${bgStyle};border-radius:12px;padding:24px;text-align:center;margin:16px 0">
                ${label ? `<div style="color:#7a7a6a;margin-bottom:12px;font-size:0.95rem">${escapeHTML(label)}</div>` : ''}
                <div class="wr-timer-digits" style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap">
                    <div><div class="wr-td" style="${numStyle}" data-unit="days">--</div><div style="color:#7a7a6a;font-size:0.75rem;margin-top:4px">дней</div></div>
                    <div style="color:#7a7a6a;font-size:2rem;align-self:flex-start;padding-top:2px">:</div>
                    <div><div class="wr-td" style="${numStyle}" data-unit="hours">--</div><div style="color:#7a7a6a;font-size:0.75rem;margin-top:4px">часов</div></div>
                    <div style="color:#7a7a6a;font-size:2rem;align-self:flex-start;padding-top:2px">:</div>
                    <div><div class="wr-td" style="${numStyle}" data-unit="mins">--</div><div style="color:#7a7a6a;font-size:0.75rem;margin-top:4px">минут</div></div>
                    <div style="color:#7a7a6a;font-size:2rem;align-self:flex-start;padding-top:2px">:</div>
                    <div><div class="wr-td" style="${numStyle}" data-unit="secs">--</div><div style="color:#7a7a6a;font-size:0.75rem;margin-top:4px">секунд</div></div>
                </div>
                <div class="wr-timer-expired" style="display:none;color:#5a8a40;font-size:1.2rem;margin-top:12px">${escapeHTML(expired)}</div>
            </div>`;
            el.style.margin = '0';

            function tick() {
                const now = Date.now();
                const diff = target - now;
                if (diff <= 0) {
                    el.querySelector('.wr-timer-digits').style.display = 'none';
                    el.querySelector('.wr-timer-expired').style.display = 'block';
                    clearInterval(el._interval);
                    return;
                }
                const d = Math.floor(diff / 86400000);
                const h = Math.floor((diff % 86400000) / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                const digits = el.querySelectorAll('.wr-td');
                digits.forEach(dd => {
                    const unit = dd.dataset.unit;
                    dd.textContent = unit === 'days' ? d : unit === 'hours' ? String(h).padStart(2, '0') : unit === 'mins' ? String(m).padStart(2, '0') : String(s).padStart(2, '0');
                });
            }
            tick();
            el._interval = setInterval(tick, 1000);
        },

        map(el, cfg) {
            const lat = parseFloat(cfg.lat) || 55.7558;
            const lng = parseFloat(cfg.lng || cfg.lon) || 37.6173;
            const zoom = cfg.zoom || 13;
            const h = cfg.height || '350px';
            const marker = cfg.marker !== false;
            const popup = cfg.markerText || cfg.popup || '';

            let url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02},${lat - 0.01},${lng + 0.02},${lat + 0.01}&layer=mapnik`;
            if (marker) url += `&marker=${lat},${lng}`;

            el.innerHTML = `<div style="border-radius:8px;overflow:hidden;border:1px solid #2a3520;margin:16px 0;position:relative">
                <iframe src="${url}" style="width:100%;height:${h};border:none" loading="lazy"></iframe>
                ${popup ? `<div style="position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,0.7);color:#c9a84c;padding:6px 12px;border-radius:6px;font-size:0.85rem">📍 ${escapeHTML(popup)}</div>` : ''}
            </div>`;
            el.style.margin = '0';
        },

        code(el, cfg) {
            const code = cfg.code || '';
            const lang = cfg.language || '';
            const title = cfg.title || '';
            const lineNums = cfg.lineNumbers !== false;
            const copyable = cfg.copyButton !== false || cfg.copyable !== false;

            const lines = escapeHTML(code).split('\n');
            const lineHTML = lineNums ? lines.map((l, i) =>
                `<span style="display:inline-block;width:2.5em;text-align:right;color:#5a5a4a;user-select:none;padding-right:12px;border-right:1px solid #2a3520;margin-right:12px">${i + 1}</span>${l}`
            ).join('\n') : escapeHTML(code);

            const id = 'code_' + Math.random().toString(36).slice(2, 8);

            el.innerHTML = `<div style="background:#0d1008;border:1px solid #2a3520;border-radius:8px;margin:16px 0;overflow:hidden">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 14px;background:rgba(201,168,76,0.06);border-bottom:1px solid #2a3520">
                    <span style="color:#c9a84c;font-size:0.85rem">${title ? escapeHTML(title) + ' · ' : ''}<span style="color:#5a8a40">${escapeHTML(lang)}</span></span>
                    ${copyable ? `<button onclick="wrCopyCode('${id}')" style="background:rgba(90,138,64,0.15);border:1px solid #2a3520;color:#5a8a40;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem">📋 Копировать</button>` : ''}
                </div>
                <pre id="${id}" style="margin:0;padding:14px;overflow-x:auto;font-family:Consolas,Monaco,'Courier New',monospace;font-size:0.85rem;line-height:1.6;color:#a0ffa0"><code>${lineHTML}</code></pre>
            </div>`;
            el.style.margin = '0';
        },

        poll(el, cfg) {
            const question = cfg.question || '';
            const options = Array.isArray(cfg.options) ? cfg.options : (cfg.options || '').split('\n').filter(s => s.trim());
            if (!question || !options.length) return;
            const multiple = cfg.multiple === true;
            const id = 'poll_' + Math.random().toString(36).slice(2, 8);

            el.innerHTML = `<div id="${id}" style="background:rgba(201,168,76,0.04);border:1px solid #2a3520;border-radius:8px;padding:20px;margin:16px 0">
                <div style="color:#c9a84c;font-weight:600;font-size:1.05rem;margin-bottom:14px">📊 ${escapeHTML(question)}</div>
                <div class="wr-poll-options">
                    ${options.map((o, i) => `<label style="display:flex;align-items:center;gap:10px;padding:10px 14px;margin-bottom:6px;background:rgba(0,0,0,0.2);border:1px solid #2a3520;border-radius:6px;cursor:pointer;transition:all 0.2s" onmouseover="this.style.borderColor='#5a8a40'" onmouseout="this.style.borderColor='#2a3520'">
                        <input type="${multiple ? 'checkbox' : 'radio'}" name="${id}" value="${i}" style="accent-color:#5a8a40">
                        <span style="color:#d4d4c8">${escapeHTML(o.trim())}</span>
                    </label>`).join('')}
                </div>
                <button onclick="wrPollVote('${id}')" style="margin-top:12px;background:#5a8a40;color:#fff;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-weight:600">Голосовать</button>
                <div class="wr-poll-results" style="display:none;margin-top:14px"></div>
            </div>`;
            el.style.margin = '0';
        },

        spacer(el, cfg) {
            let h = cfg.height || '40px';
            if (typeof h === 'number' || /^\d+$/.test(h)) h = h + 'px';
            const line = cfg.line === true;
            el.innerHTML = line ?
                `<div style="height:${h};display:flex;align-items:center"><hr style="flex:1;border:none;height:1px;background:linear-gradient(90deg,transparent,#2a3520,transparent)"></div>` :
                `<div style="height:${h}"></div>`;
            el.style.margin = '0';
        },

        rawhtml(el, cfg) {
            if (!cfg.html) return;
            el.innerHTML = cfg.html;
        },

        voice(el, cfg) {
            const hasAudio = cfg.audioData && cfg.audioData.length > 10;
            const duration = cfg.audioDuration || 0;
            const autoplay = cfg.autoplay === true;
            const id = 'voice_' + Math.random().toString(36).slice(2, 8);

            if (hasAudio) {
                const durStr = Math.floor(duration / 60) + ':' + String(Math.floor(duration % 60)).padStart(2, '0');
                el.innerHTML = `<div id="${id}" style="background:rgba(201,168,76,0.04);border:1px solid #2a3520;border-radius:12px;padding:16px;margin:16px 0">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
                        <span style="font-size:1.5rem">🎤</span>
                        <span style="color:#c9a84c;font-weight:600">Голосовое сообщение</span>
                        <span style="color:#5a8a40;font-size:0.8rem">${durStr}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px">
                        <button onclick="wrVoicePlayAudio('${id}')" style="background:#5a8a40;color:#fff;border:none;width:44px;height:44px;border-radius:50%;cursor:pointer;font-size:1.2rem;display:flex;align-items:center;justify-content:center">▶</button>
                        <div style="flex:1;height:6px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden;cursor:pointer" onclick="wrVoiceSeek('${id}', event)">
                            <div id="${id}_progress" style="width:0%;height:100%;background:#c9a84c;border-radius:3px;transition:width 0.1s"></div>
                        </div>
                        <span id="${id}_time" style="color:#7a7a6a;font-size:0.85rem;min-width:60px;text-align:right">0:00</span>
                    </div>
                    <audio id="${id}_audio" src="${escapeHTML(cfg.audioData)}" ${autoplay ? 'autoplay' : ''} style="display:none"></audio>
                </div>`;
            } else {
                el.innerHTML = `<div style="background:rgba(201,168,76,0.04);border:1px solid #2a3520;border-radius:12px;padding:16px;margin:16px 0">
                    <div style="display:flex;align-items:center;gap:10px">
                        <span style="font-size:1.5rem">🎤</span>
                        <span style="color:#7a7a6a;font-style:italic">Голосовое сообщение (нет записи)</span>
                    </div>
                </div>`;
            }
            el.style.margin = '0';
        }
    };

    // === Global helpers ===
    window.wrCarouselNav = function(id, dir) {
        const el = document.getElementById(id);
        if (!el) return;
        const track = el.querySelector('.wr-carousel-track');
        const slides = track.children.length;
        let idx = parseInt(el.dataset.idx || '0') + dir;
        if (idx < 0) idx = slides - 1;
        if (idx >= slides) idx = 0;
        el.dataset.idx = idx;
        track.style.transform = `translateX(-${idx * 100}%)`;
        // Update dots
        el.querySelectorAll('.wr-car-dot').forEach((d, i) => {
            d.style.background = i === idx ? '#c9a84c' : 'rgba(255,255,255,0.4)';
        });
        // Reset autoplay
        if (el.parentElement._interval) {
            clearInterval(el.parentElement._interval);
            el.parentElement._interval = setInterval(() => wrCarouselNav(id, 1), parseInt(el.dataset.speed || 3000));
        }
    };

    window.wrCarouselGo = function(id, idx, total) {
        const el = document.getElementById(id);
        if (!el) return;
        const track = el.querySelector('.wr-carousel-track');
        el.dataset.idx = idx;
        track.style.transform = `translateX(-${idx * 100}%)`;
        el.querySelectorAll('.wr-car-dot').forEach((d, i) => {
            d.style.background = i === idx ? '#c9a84c' : 'rgba(255,255,255,0.4)';
        });
    };

    window.wrLightbox = function(src) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:10000;display:flex;align-items:center;justify-content:center;cursor:pointer';
        overlay.innerHTML = `<img src="${src}" style="max-width:90%;max-height:90%;border-radius:8px;box-shadow:0 0 40px rgba(0,0,0,0.5)">`;
        overlay.onclick = () => overlay.remove();
        document.body.appendChild(overlay);
    };

    window.wrCopyCode = function(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const text = el.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const btn = el.parentElement.querySelector('button');
            if (btn) { btn.textContent = '✓ Скопировано'; setTimeout(() => btn.textContent = '📋 Копировать', 2000); }
        });
    };

    window.wrPollVote = function(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const checked = el.querySelector('input:checked');
        if (!checked) return;
        const opts = el.querySelectorAll('.wr-poll-options label');
        const results = el.querySelector('.wr-poll-results');
        results.style.display = 'block';
        // Simulate random results
        const votes = Array.from(opts).map((_, i) => i === parseInt(checked.value) ? Math.floor(Math.random() * 30) + 40 : Math.floor(Math.random() * 25));
        const total = votes.reduce((a, b) => a + b, 0);
        results.innerHTML = votes.map((v, i) => {
            const pct = Math.round(v / total * 100);
            return `<div style="margin-bottom:8px">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:0.85rem">
                    <span style="color:#d4d4c8">${opts[i].querySelector('span').textContent}</span>
                    <span style="color:#c9a84c">${pct}%</span>
                </div>
                <div style="background:rgba(0,0,0,0.3);border-radius:4px;height:8px;overflow:hidden">
                    <div style="width:${pct}%;height:100%;background:${i === parseInt(checked.value) ? '#5a8a40' : '#2a3520'};border-radius:4px;transition:width 0.5s"></div>
                </div>
            </div>`;
        }).join('');
        el.querySelector('.wr-poll-options').style.opacity = '0.5';
        el.querySelector('.wr-poll-options').style.pointerEvents = 'none';
        el.querySelector('button').style.display = 'none';
    };

    // Voice playback helpers
    window.wrVoicePlayAudio = function(id) {
        const audio = document.getElementById(id + '_audio');
        if (!audio) return;
        const btn = audio.parentElement.querySelector('button');
        const progress = document.getElementById(id + '_progress');
        const timeEl = document.getElementById(id + '_time');

        if (audio.paused) {
            audio.play();
            btn.textContent = '⏸';
            const update = () => {
                if (!audio.duration) return;
                if (progress) progress.style.width = (audio.currentTime / audio.duration * 100) + '%';
                const mins = Math.floor(audio.currentTime / 60);
                const secs = String(Math.floor(audio.currentTime % 60)).padStart(2, '0');
                if (timeEl) timeEl.textContent = mins + ':' + secs;
            };
            audio._updateInterval = setInterval(update, 100);
            audio.addEventListener('ended', function onEnd() {
                btn.textContent = '▶';
                if (progress) progress.style.width = '0%';
                if (timeEl) timeEl.textContent = '0:00';
                clearInterval(audio._updateInterval);
                audio.removeEventListener('ended', onEnd);
            });
        } else {
            audio.pause();
            btn.textContent = '▶';
            clearInterval(audio._updateInterval);
        }
    };

    window.wrVoiceSeek = function(id, event) {
        const audio = document.getElementById(id + '_audio');
        if (!audio || !audio.duration) return;
        const bar = event.currentTarget;
        const rect = bar.getBoundingClientRect();
        audio.currentTime = ((event.clientX - rect.left) / rect.width) * audio.duration;
    };

    // === Render widgets in a specific container ===
    window.renderWidgetsIn = function(container) {
        container.querySelectorAll('.widget-block[data-widget]').forEach(el => {
            let type = el.getAttribute('data-widget');
            type = typeAliases[type] || type;
            const cfg = parseConfig(el);
            if (renderers[type]) {
                renderers[type](el, cfg);
            }
        });
    };

    // === Auto-render on load ===
    function renderAllWidgets() {
        renderWidgetsIn(document);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderAllWidgets);
    } else {
        renderWidgetsIn(document);
    }
})();
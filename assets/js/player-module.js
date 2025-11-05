// assets/js/player-module.js
import { $, extractVimeoId, escapeHtml } from './utils.js';
import { indexOfIdInFiltered, nextPlayableIdFromFiltered, FILTERED } from './table.js';
import { isAutoplayEnabled, isAutoplaySessionActive, setAutoplaySessionActive, isAudioMode } from './toolbar.js';
import { closeTranscriptModal } from './transcript.js';
import { getTranscriptForRow, getSubtitleOptionsForRow, languageLabel, normalizeLanguageCode } from './lang.js';

/* ---------------------------
   Modal-scoped element helpers
---------------------------- */
const modal = $('#modal');
const q = (sel) => (modal ? modal.querySelector(sel) : document.querySelector(sel)); // always prefer modal scope

// Player + controls (scoped to modal to avoid page duplicates)
const iframe          = q('#player');
const closeModalBtn   = q('#closeModal');
const fsModalBtn      = q('#fsModal');
const ao              = q('#aoOverlay');          // optional overlay for large text display
const subtitleControls   = q('#subtitleControls');
const subtitleButtonsWrap = q('#subtitleButtons');

// Transcript UI (scoped to modal)
const audioScreen     = q('#audioScreen');
const audioTitle      = q('#audioTitle');
const audioTranscript = q('#audioTranscript');
const audioAutoScrollEl = q('#audioAutoScroll');
const audioSpeedEl      = q('#audioSpeed');
const audioSpeedVal     = q('#audioSpeedVal');

let player = null;
let currentIndex = -1;
let currentId = null;
let currentSubtitleActive = '';
const subtitleButtonMap = new Map();
let currentSubtitleOptions = [];
let ignoreNextTextTrackChange = false;

// sequence guards
let transcriptSeq = 0;
let currentRecordId = null;
let pendingPlayForId = null;
let pendingStartAt = 0;

// auto-scroll state
let autoScrollReq = null, autoScrollStart = 0, autoScrollFrom = 0, autoScrollTo = 0, autoScrollDur = 0;
function cancelAutoScroll(){ if (autoScrollReq) { cancelAnimationFrame(autoScrollReq); autoScrollReq = null; } }

function canonicalLangCode(value){
  const raw = value ? String(value).toLowerCase() : '';
  if (!raw) return '';
  if (raw === 'default') return '';
  const normalized = normalizeLanguageCode(raw);
  return normalized || raw;
}

function getStoredPrefLang(){
  try {
    return (localStorage.getItem('pg_pref_lang') || '').toLowerCase();
  } catch {
    return '';
  }
}

function setActiveSubtitleLanguage(lang){
  currentSubtitleActive = canonicalLangCode(lang);
  reflectSubtitleButtons(currentSubtitleActive, getStoredPrefLang());
}

function reflectSubtitleButtons(activeLang, preferredLang){
  const active = canonicalLangCode(activeLang);
  const pref = canonicalLangCode(preferredLang);
  subtitleButtonMap.forEach((btn, code) => {
    const codeNorm = canonicalLangCode(code);
    const isActive = active ? codeNorm === active : !codeNorm && !active;
    const isPref = pref ? codeNorm === pref : !pref && !codeNorm;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    btn.classList.toggle('is-pref', isPref);
  });
  if (subtitleControls) {
    if (active) subtitleControls.setAttribute('data-active-lang', active);
    else subtitleControls.removeAttribute('data-active-lang');
    if (pref) subtitleControls.setAttribute('data-pref-lang', pref);
    else subtitleControls.removeAttribute('data-pref-lang');
  }
}

function clearSubtitleButtons(){
  subtitleButtonMap.clear();
  if (subtitleButtonsWrap) subtitleButtonsWrap.innerHTML = '';
  currentSubtitleOptions = [];
  currentSubtitleActive = canonicalLangCode(getStoredPrefLang());
  if (subtitleControls) {
    subtitleControls.classList.add('is-hidden');
    subtitleControls.setAttribute('hidden', '');
    subtitleControls.removeAttribute('data-active-lang');
    subtitleControls.removeAttribute('data-pref-lang');
  }
}

function addSubtitleButton({ code, label, isAuto = false }){
  if (!subtitleButtonsWrap) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `pill subtitle-btn${isAuto ? ' subtitle-btn--auto' : ''}`;
  const normalized = isAuto ? '' : canonicalLangCode(code);
  const displayLabel = label || (normalized ? languageLabel(normalized) : 'Auto');
  btn.textContent = displayLabel || 'Auto';
  btn.dataset.lang = normalized || '';
  btn.setAttribute('aria-pressed', 'false');
  btn.title = isAuto ? 'Automatically select subtitles' : `Switch subtitles to ${displayLabel}`;
  btn.addEventListener('click', () => {
    selectModalSubtitleLanguage(normalized || '');
  });
  subtitleButtonsWrap.appendChild(btn);
  subtitleButtonMap.set(normalized || '', btn);
  return btn;
}

function updateSubtitleButtonsForRecord(rec){
  if (!subtitleControls || !subtitleButtonsWrap) return;
  clearSubtitleButtons();
  if (!rec) return;
  const options = getSubtitleOptionsForRow(rec) || [];
  currentSubtitleOptions = options;
  if (!options.length) return;
  subtitleControls.classList.remove('is-hidden');
  subtitleControls.removeAttribute('hidden');
  addSubtitleButton({ code: '', label: 'Auto', isAuto: true });
  options.forEach((opt) => {
    const normalized = canonicalLangCode(opt?.code) || canonicalLangCode(opt?.label);
    if (!normalized) return;
    const label = opt?.label || languageLabel(normalized) || (normalized ? normalized.toUpperCase() : '');
    const code = normalized || (opt?.code ? String(opt.code).toLowerCase() : '');
    addSubtitleButton({ code, label });
  });
  currentSubtitleActive = canonicalLangCode(getStoredPrefLang()) || currentSubtitleActive || '';
  reflectSubtitleButtons(currentSubtitleActive, getStoredPrefLang());
}

function computeLateStart(val){
  const norm = String(val || '').trim();
  if (!norm) return 0;
  if (/^(1|true|yes)$/i.test(norm)) return 4;
  const num = Number(norm);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function startOffsetForIndex(idx){
  if (!FILTERED || idx < 0 || idx >= FILTERED.length) return 0;
  return computeLateStart(FILTERED[idx]?.['Late_4s']);
}

function videoLoadOptions(id, startAt = 0){
  const idNum = Number(id);
  const opts = { id: Number.isFinite(idNum) ? idNum : id };
  if (startAt > 0) opts.start = startAt;
  return opts;
}

/* ---------------------------
   Vimeo SDK loader
---------------------------- */
function loadVimeoSdk() {
  return new Promise((resolve, reject) => {
    if (window.Vimeo && window.Vimeo.Player) return resolve();
    const s = document.createElement('script');
    s.src = 'https://player.vimeo.com/api/player.js';
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ---------------------------
   Subtitles preference
---------------------------- */
function normalizeTrackLanguage(track){
  if (!track) return '';
  return normalizeLanguageCode(track.language || track.lang || track.label || track.code || '');
}

async function applyPreferredTextTrack(p, opts = {}) {
  try {
    const override = canonicalLangCode(opts?.override);
    const pref = override || getStoredPrefLang();
    for (let attempt = 0; attempt < 5; attempt++) {
      const tracks = await p.getTextTracks();
      if (tracks && tracks.length) {
        const normalizedTracks = tracks.map((track) => ({
          raw: track,
          code: normalizeTrackLanguage(track)
        }));

        const pickByCode = (code) => {
          if (!code) return null;
          const norm = normalizeLanguageCode(code);
          if (!norm) return null;
          return normalizedTracks.find((entry) => entry.code === norm) || null;
        };

        let choice = pickByCode(pref);
        if (!choice && pref) {
          choice = normalizedTracks.find((entry) => {
            const lang = entry.raw?.language || '';
            return lang && lang.toLowerCase().startsWith(pref);
          }) || null;
        }
        if (!choice) choice = pickByCode('en');
        if (!choice) choice = normalizedTracks.find((entry) => entry.code) || null;
        if (!choice) choice = normalizedTracks[0];

        if (choice && choice.raw) {
          const langToEnable = choice.raw.language || choice.code || pref || 'en';
          const kind = choice.raw.kind || 'subtitles';
          ignoreNextTextTrackChange = true;
          try {
            await p.enableTextTrack(langToEnable, kind);
          } catch (err) {
            ignoreNextTextTrackChange = false;
            throw err;
          }
          setActiveSubtitleLanguage(choice.code || langToEnable);
          return choice.code || normalizeLanguageCode(langToEnable) || '';
        }
      }
      await new Promise(r => setTimeout(r, 200));
    }
  } catch (err) {
    console.warn('applyPreferredTextTrack failed', err);
  }
  setActiveSubtitleLanguage('');
  return '';
}

async function selectModalSubtitleLanguage(lang){
  const normalized = canonicalLangCode(lang);
  if (!player) {
    setActiveSubtitleLanguage(normalized);
    reflectSubtitleButtons(currentSubtitleActive, getStoredPrefLang());
    if (currentId) await setTranscriptFor(currentId);
    if (currentIndex >= 0) await prepareAudioScreenForIndex(currentIndex);
    return;
  }
  if (!normalized) {
    await applyPreferredTextTrack(player);
    if (currentId) await setTranscriptFor(currentId);
    if (currentIndex >= 0) await prepareAudioScreenForIndex(currentIndex);
    return;
  }
  try {
    const applied = await applyPreferredTextTrack(player, { override: normalized });
    if (!applied) {
      setActiveSubtitleLanguage(normalized);
      reflectSubtitleButtons(currentSubtitleActive, getStoredPrefLang());
    }
  } catch (err) {
    console.warn('selectModalSubtitleLanguage failed', err);
  }
  if (currentId) await setTranscriptFor(currentId);
  if (currentIndex >= 0) await prepareAudioScreenForIndex(currentIndex);
}

/* ---------------------------
   Transcript formatting
---------------------------- */
function formatOverlay(txt){
  const norm = String(txt||'').replace(/\r\n?/g,'\n').trim();
  const parts = norm ? norm.split(/\n{2,}/) : [];
  return parts.map(p=>`<p>${escapeHtml(p)}</p>`).join('') || '<p style="opacity:.6">No transcript.</p>';
}

function formatTranscriptToHtml(txt){
  if (!txt) return '<p style="color:var(--muted)">No transcript available.</p>';
  const norm = String(txt).replace(/\r\n/g,'\n').replace(/\r/g,'\n').trim();
  let parts = norm.includes('\n\n') ? norm.split(/\n\n+/) : norm.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Ý0-9])/);
  parts = parts.map(p => p.replace(/\n+/g,' ').trim()).filter(Boolean);
  const esc = (s) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return parts.map(p => `<p>${esc(p)}</p>`).join('');
}

/* ---------------------------
   Transcript updater (race-safe)
---------------------------- */
async function setTranscriptFor(id){
  currentRecordId = String(id);
  const seq = ++transcriptSeq;

  // Clear immediately to avoid showing stale text
  if (audioTranscript) audioTranscript.innerHTML = '';
  if (ao) ao.innerHTML = '';

  // Resolve from filtered dataset synchronously
  const idx = indexOfIdInFiltered(String(id));
  const rec = (idx >= 0 && FILTERED) ? FILTERED[idx] : null;
  updateSubtitleButtonsForRecord(rec);
  const title = rec ? `${rec['Notion']||''}${rec['Interviewee name'] ? ' — ' + rec['Interviewee name'] : ''}` : '';
  const activeLang = currentSubtitleActive || canonicalLangCode(getStoredPrefLang());
  const transcriptInfo = rec ? getTranscriptForRow(rec, activeLang || getStoredPrefLang()) : { text: '', lang: null };
  const raw   = transcriptInfo?.text || '';
  const transcriptLang = transcriptInfo?.lang || '';

  const overlayHtml    = (title ? `<div class="ao-title">${escapeHtml(title)}</div>` : '') +
                         `<div class="ao-text">${formatOverlay(raw)}`;
  const transcriptHtml = formatTranscriptToHtml(raw);

  // Abort if superseded
  if (seq !== transcriptSeq) return;

  // Commit to modal elements only
  if (audioTitle)      audioTitle.textContent = title || '';
  if (audioTranscript) {
    audioTranscript.innerHTML = transcriptHtml;
    if (transcriptLang) {
      audioTranscript.setAttribute('data-lang', canonicalLangCode(transcriptLang));
    } else {
      audioTranscript.removeAttribute('data-lang');
    }
  }
  if (ao)              ao.innerHTML = overlayHtml;
  if (subtitleControls) {
    const normLang = canonicalLangCode(transcriptLang);
    if (normLang) subtitleControls.setAttribute('data-transcript-lang', normLang);
    else subtitleControls.removeAttribute('data-transcript-lang');
  }
}

/* ---------------------------
   Audio-mode UI
---------------------------- */
function onOpenModalEnsureUiState(){
  document.body.classList.toggle('audio-mode', isAudioMode());
}
function applyAudioUi(id){
  if (isAudioMode()){
    document.body.classList.add('audio-mode');
  } else {
    document.body.classList.remove('audio-mode');
    if (ao) ao.innerHTML = '';
  }
}

/* ---------------------------
   Prepare audio screen (autoscroll)
---------------------------- */
async function prepareAudioScreenForIndex(idx){
  if (!audioScreen || !audioTranscript || !audioTitle || !player) return;
  const row = FILTERED?.[idx];
  const notion  = row?.['Notion'] || '';
  const person  = row?.['Interviewee name'] || '';
  const activeLang = currentSubtitleActive || canonicalLangCode(getStoredPrefLang());
  const transcriptInfo = row ? getTranscriptForRow(row, activeLang || getStoredPrefLang()) : { text: '', lang: null };
  const trans   = transcriptInfo?.text || '';
  audioTitle.textContent = person ? `${notion} — ${person}` : notion;
  audioTranscript.innerHTML = formatTranscriptToHtml(trans);
  if (transcriptInfo?.lang) {
    audioTranscript.setAttribute('data-lang', canonicalLangCode(transcriptInfo.lang));
  } else {
    audioTranscript.removeAttribute('data-lang');
  }

  cancelAutoScroll();
  if (audioSpeedEl && audioSpeedVal) audioSpeedVal.textContent = `${Number(audioSpeedEl.value || 1).toFixed(1)}×`;
  let dur = 0; try { dur = await player.getDuration(); } catch {}
  if (!dur) return;
  const scrollArea = audioTranscript.scrollHeight - audioTranscript.clientHeight;
  if (scrollArea <= 0) return;
  const speed = Number(audioSpeedEl?.value || 1);
  autoScrollFrom = 0; autoScrollTo = scrollArea; autoScrollDur = (dur * 1000) / (speed || 1);
  if (audioAutoScrollEl?.checked) {
    autoScrollStart = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - autoScrollStart) / autoScrollDur);
      audioTranscript.scrollTop = autoScrollFrom + (autoScrollTo - autoScrollFrom) * k;
      if (k < 1) autoScrollReq = requestAnimationFrame(step); else autoScrollReq = null;
    };
    autoScrollReq = requestAnimationFrame(step);
  }
}

async function afterVideoLoaded(){
  const on = localStorage.getItem('pg_audio_mode') === '1';
  if (on) {
    document.body.classList.add('audio-mode');
    if (currentIndex >= 0) await prepareAudioScreenForIndex(currentIndex);
  } else {
    document.body.classList.remove('audio-mode');
    cancelAutoScroll();
  }
}

/* ---------------------------
   Player lifecycle
---------------------------- */
async function ensurePlayer(initId) {
  // use the iframe inside the modal
  const mount = q('#player');
  if (!mount) throw new Error('#player iframe not found in modal');

  // Load SDK if needed
  await loadVimeoSdk();

  if (!player) {
    const base = { autopause: 1, playsinline: 1, title: 0, byline: 0, portrait: 0 };
    const vid  = Number(initId) || undefined;

    if (mount.tagName === 'IFRAME') {
      if (!vid) throw new Error('Missing initId for iframe priming');
      // PRIME iframe BEFORE constructing Player to avoid "isn't a Vimeo embed"
      const qs = 'title=0&byline=0&portrait=0&autoplay=0&autopause=1&playsinline=1';
      mount.src = `https://player.vimeo.com/video/${vid}?${qs}`;
      player = new window.Vimeo.Player(mount);
    } else {
      // If someday #player is a div: let SDK create iframe
      player = new window.Vimeo.Player(mount, { id: vid, ...base });
    }

    // events
    player.on('loaded', async () => {
      const id = pendingPlayForId;
      pendingPlayForId = null;
      try {
        await player.play().catch(()=>{});
        await applyPreferredTextTrack(player);
        await afterVideoLoaded();
      } catch {}
    });

    player.on('play', () => {
      document.body.classList.toggle('audio-mode', isAudioMode());
    });

    player.on('texttrackchange', async (data) => {
      const langRaw = data?.language || data?.track?.language || '';
      const normalized = canonicalLangCode(langRaw);
      const activeValue = normalized || (langRaw === '' ? '' : langRaw);
      setActiveSubtitleLanguage(activeValue);

      if (ignoreNextTextTrackChange) {
        ignoreNextTextTrackChange = false;
        reflectSubtitleButtons(currentSubtitleActive, getStoredPrefLang());
      } else {
        reflectSubtitleButtons(currentSubtitleActive, getStoredPrefLang());
      }

      if (currentId) await setTranscriptFor(currentId);
      if (currentIndex >= 0) await prepareAudioScreenForIndex(currentIndex);
    });

    player.on('ended', async () => {
      if (!isAutoplayEnabled() || !isAutoplaySessionActive()) return;
      const next = nextPlayableIdFromFiltered(currentIndex);
      if (next && next.id) {
        currentIndex = next.index; currentId = String(next.id);
        pendingStartAt = startOffsetForIndex(currentIndex);
        await setTranscriptFor(currentId);
        applyAudioUi(currentId);
        try {
          pendingPlayForId = currentId;
          await player.loadVideo(videoLoadOptions(currentId, pendingStartAt));
        } catch (e) {
          console.warn('Autoplay-next failed:', e);
        }
      } else {
        try { await player.unload(); } catch {}
        modal?.classList.remove('open');
        setAutoplaySessionActive(false);
      }
    });
  }

  return player;
}

/* ---------------------------
   Public API
---------------------------- */
export async function openPlayer(id, opts = {}) {
  if (!id) return;
  closeTranscriptModal?.();

  const cleanId = /^\d+$/.test(String(id)) ? String(id) : extractVimeoId(String(id));
  if (!cleanId) return;

  currentIndex = indexOfIdInFiltered(cleanId);
  currentId    = cleanId;

  const requestedStart = opts?.startAt;
  const numericRequested = requestedStart === undefined ? NaN : Number(requestedStart);
  const fallbackStart = startOffsetForIndex(currentIndex);
  const effectiveStart = Number.isFinite(numericRequested) ? numericRequested : fallbackStart;
  pendingStartAt = Number.isFinite(effectiveStart) && effectiveStart >= 0 ? effectiveStart : 0;

  // 1) Update transcript immediately in the MODAL
  await setTranscriptFor(cleanId);

  // 2) OPEN modal first so layout exists (prevents 0×0 iframes)
  setAutoplaySessionActive(true);
  modal?.classList.add('open');
  onOpenModalEnsureUiState();
  applyAudioUi(cleanId);

  // 3) Let the browser paint (two frames for safety)
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);

  // 4) Init player & load video (auto-play on 'loaded')
  try {
    const p = await ensurePlayer(cleanId);
    pendingPlayForId = cleanId;
    await p.loadVideo(videoLoadOptions(cleanId, pendingStartAt));
  } catch (e) {
    console.warn('Could not start playback:', e);
    modal?.classList.remove('open');
    setAutoplaySessionActive(false);
  }
}

function close() {
  modal?.classList.remove('open');
  setAutoplaySessionActive(false);
  cancelAutoScroll();
  pendingStartAt = 0;
  document.body.classList.remove('audio-mode');
  if (player) player.unload().catch(()=>{});
  else if (iframe) iframe.src = '';
}

export function bindPlayer() {
  // Open on row click
  document.addEventListener('row:play', (e) => {
    const { id, startAt } = e.detail || {};
    if (id) openPlayer(id, { startAt });
  });

  // Close controls
  closeModalBtn?.addEventListener('click', close);
  modal?.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal?.classList.contains('open')) close(); });

  // Fullscreen
  fsModalBtn?.addEventListener('click', () => {
    const el = q('.player') || document.querySelector('.player');
    if (el?.requestFullscreen) el.requestFullscreen();
    else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
  });

  // Subtitle preference change
  document.addEventListener('subtitle:pref-changed', async () => {
    reflectSubtitleButtons(currentSubtitleActive, getStoredPrefLang());
    if (player) await applyPreferredTextTrack(player);
    if (currentId) await setTranscriptFor(currentId);
    if (currentIndex >= 0) await prepareAudioScreenForIndex(currentIndex);
  });

  // Audio-mode toggle handling
  document.addEventListener('audio:mode-changed', async (e) => {
    if (e.detail?.on) {
      document.body.classList.add('audio-mode');
      closeTranscriptModal?.();
      if (currentIndex >= 0) await prepareAudioScreenForIndex(currentIndex);
    } else {
      document.body.classList.remove('audio-mode');
      cancelAutoScroll();
    }
  });

  // Audio screen controls
  audioAutoScrollEl?.addEventListener('change', async ()=>{
    cancelAutoScroll();
    if (document.body.classList.contains('audio-mode') && currentIndex >= 0 && audioAutoScrollEl.checked) {
      await prepareAudioScreenForIndex(currentIndex);
    }
  });
  audioSpeedEl?.addEventListener('input', ()=>{
    if (audioSpeedVal) audioSpeedVal.textContent = `${Number(audioSpeedEl.value).toFixed(1)}×`;
  });
  audioSpeedEl?.addEventListener('change', async ()=>{
    if (document.body.classList.contains('audio-mode') && currentIndex >= 0 && audioAutoScrollEl?.checked) {
      await prepareAudioScreenForIndex(currentIndex);
    }
  });
}

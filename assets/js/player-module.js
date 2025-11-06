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
const transcriptActions  = q('#transcriptActions');
const openTranscriptPanelBtn = q('#openTranscriptPanel');
const downloadTranscriptBtn  = q('#downloadTranscriptBtn');

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

// Transcript highlight tracking
let trackedTranscriptElement = null;
let currentTranscriptChunkMeta = [];
let lastHighlightedChunk = -1;
let lastCueRawText = '';

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
  const hasExplicitOverride = !!normalized;
  setActiveSubtitleLanguage(normalized || '');
  reflectSubtitleButtons(currentSubtitleActive, getStoredPrefLang());

  if (!player) {
    if (currentId) {
      if (hasExplicitOverride) await setTranscriptFor(currentId, { languageOverride: normalized });
      else await setTranscriptFor(currentId);
    }
    if (currentIndex >= 0) {
      if (hasExplicitOverride) await prepareAudioScreenForIndex(currentIndex, { languageOverride: normalized });
      else await prepareAudioScreenForIndex(currentIndex);
    }
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
  if (currentId) await setTranscriptFor(currentId, { languageOverride: normalized });
  if (currentIndex >= 0) await prepareAudioScreenForIndex(currentIndex, { languageOverride: normalized });
}

/* ---------------------------
   Transcript formatting
---------------------------- */
function formatOverlay(txt){
  const norm = String(txt||'').replace(/\r\n?/g,'\n').trim();
  const parts = norm ? norm.split(/\n{2,}/) : [];
  return parts.map(p=>`<p>${escapeHtml(p)}</p>`).join('') || '<p style="opacity:.6">No transcript.</p>';
}

function splitTranscriptChunks(txt){
  if (!txt) return [];
  const norm = String(txt).replace(/\r\n/g,'\n').replace(/\r/g,'\n').trim();
  let parts = norm.includes('\n\n') ? norm.split(/\n\n+/) : norm.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Ý0-9])/);
  parts = parts.map(p => p.replace(/\n+/g,' ').trim()).filter(Boolean);
  return parts;
}

function buildTranscriptHtml(chunks){
  if (!chunks || !chunks.length) {
    return {
      html: '<p style="color:var(--muted)">No transcript available.</p>',
      chunks: []
    };
  }
  const html = chunks
    .map((chunk, idx) => `<p class="transcript-paragraph" data-transcript-chunk="${idx}"><span class="transcript-chunk" data-transcript-chunk="${idx}">${escapeHtml(chunk)}</span></p>`)
    .join('');
  return { html, chunks };
}

function renderTranscriptInto(el, raw, { track = false } = {}){
  if (!el) return [];
  const { html, chunks } = buildTranscriptHtml(splitTranscriptChunks(raw));
  el.innerHTML = html;
  if (track) {
    trackedTranscriptElement = el;
    currentTranscriptChunkMeta = [];
    const nodes = el.querySelectorAll('.transcript-chunk');
    nodes.forEach((node) => {
      const idx = Number(node.dataset.transcriptChunk);
      const targetIndex = Number.isFinite(idx) && idx >= 0 ? idx : currentTranscriptChunkMeta.length;
      const chunkText = Number.isFinite(idx) && idx >= 0 && idx < chunks.length
        ? chunks[idx]
        : node.textContent || '';
      const meta = prepareChunkMeta(node, chunkText);
      currentTranscriptChunkMeta[targetIndex] = meta;
    });
    lastHighlightedChunk = -1;
    clearTranscriptHighlight();
    if (lastCueRawText) {
      highlightTranscriptCue(lastCueRawText);
    }
  }
  return chunks;
}

function prepareChunkMeta(node, chunkText){
  if (!node) return { canonical: '', words: [], wordNodes: [], element: null };
  const canonical = canonicalCueString(chunkText);
  const text = node.textContent || '';
  const segments = tokenizeChunkText(text);
  const frag = document.createDocumentFragment();
  const wordNodes = [];
  const words = [];
  let wordIndex = 0;
  segments.forEach((seg) => {
    if (!seg) return;
    if (seg.isWord) {
      const span = document.createElement('span');
      span.className = 'transcript-word';
      span.dataset.wordIndex = String(wordIndex);
      span.textContent = seg.text;
      frag.appendChild(span);
      wordNodes.push(span);
      words.push(seg.canonical);
      wordIndex++;
    } else if (seg.text) {
      frag.appendChild(document.createTextNode(seg.text));
    }
  });
  node.innerHTML = '';
  node.appendChild(frag);
  return { canonical, words, wordNodes, element: node };
}

function canonicalCueString(str){
  if (!str) return '';
  try {
    return str
      .normalize('NFD')
      .replace(/\p{M}+/gu, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  } catch {
    return String(str).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
}

function canonicalWord(str){
  const value = canonicalCueString(str);
  return value.replace(/\s+/g, '');
}

function tokenizeChunkText(text){
  if (!text) return [];
  const tokens = [];
  const regex = /([\p{L}\p{N}\u2019']+|\s+|[^\s\p{L}\p{N}\u2019'])/gu;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const value = match[0];
    const isWord = /[\p{L}\p{N}\u2019']/u.test(value) && !/^\s+$/.test(value);
    tokens.push({
      text: value,
      isWord,
      canonical: isWord ? canonicalWord(value) : ''
    });
  }
  return tokens;
}

function clearTranscriptHighlight(){
  if (!trackedTranscriptElement) return;
  trackedTranscriptElement.querySelectorAll('.transcript-word--active').forEach((node) => {
    node.classList.remove('transcript-word--active');
  });
  trackedTranscriptElement.querySelectorAll('.transcript-chunk.is-active').forEach((node) => {
    node.classList.remove('is-active');
  });
  lastHighlightedChunk = -1;
}

function ensureChunkVisible(el){
  if (!el || !trackedTranscriptElement) return;
  if (audioAutoScrollEl?.checked) return; // let auto-scroll drive the view
  const parent = trackedTranscriptElement;
  const parentRect = parent.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  const isVisible = rect.top >= parentRect.top && rect.bottom <= parentRect.bottom;
  if (!isVisible) {
    const offset = Math.max(0, el.offsetTop - parent.clientHeight * 0.3);
    if (typeof parent.scrollTo === 'function') {
      parent.scrollTo({ top: offset, behavior: 'smooth' });
    } else {
      parent.scrollTop = offset;
    }
  }
}

function setActiveChunkHighlight(index, range = null) {
  if (!trackedTranscriptElement || !currentTranscriptChunkMeta) return;
  const hasRange = range && Number.isInteger(range.start) && Number.isInteger(range.end) && range.start <= range.end;
  currentTranscriptChunkMeta.forEach((meta, idx) => {
    if (!meta) return;
    const isTarget = idx === index;
    if (meta.wordNodes) {
      meta.wordNodes.forEach((node, wordIdx) => {
        const shouldHighlight = isTarget && hasRange && wordIdx >= range.start && wordIdx <= range.end;
        node.classList.toggle('transcript-word--active', shouldHighlight);
      });
    }
    if (meta.element) {
      const shouldActivateChunk = isTarget && (hasRange || !meta.wordNodes?.length);
      meta.element.classList.toggle('is-active', shouldActivateChunk);
      if (shouldActivateChunk) ensureChunkVisible(meta.element.closest('p') || meta.element);
    }
  });
  lastHighlightedChunk = hasRange || (currentTranscriptChunkMeta[index]?.wordNodes?.length === 0) ? index : -1;
}

function determineWordRange(meta, cueWords) {
  if (!meta || !Array.isArray(meta.words) || !meta.words.length || !cueWords.length) {
    return null;
  }

  const words = meta.words;
  const cueLen = cueWords.length;

  // Try to find an exact contiguous match first
  for (let start = 0; start <= words.length - cueLen; start++) {
    let ok = true;
    for (let i = 0; i < cueLen; i++) {
      if (words[start + i] !== cueWords[i]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      return { start, end: start + cueLen - 1 };
    }
  }

  // Fallback: match words sequentially, skipping non-matching tokens
  let cueIdx = 0;
  let first = -1;
  let last = -1;
  for (let i = 0; i < words.length && cueIdx < cueLen; i++) {
    if (words[i] === cueWords[cueIdx]) {
      if (first === -1) first = i;
      last = i;
      cueIdx++;
    }
  }
  if (cueIdx > 0 && first !== -1) {
    return { start: first, end: last >= first ? last : first };
  }

  // Last resort: highlight any overlapping words (set intersection)
  const cueSet = new Set(cueWords);
  let min = Infinity;
  let max = -1;
  words.forEach((word, idx) => {
    if (cueSet.has(word)) {
      if (idx < min) min = idx;
      if (idx > max) max = idx;
    }
  });
  if (Number.isFinite(min) && Number.isFinite(max) && max >= min) {
    return { start: min, end: max };
  }
  return null;
}

function clampWordRange(range, wordCount) {
  if (!range || !Number.isInteger(range.start) || !Number.isInteger(range.end) || wordCount <= 0) return null;
  const maxIndex = wordCount - 1;
  const start = Math.max(0, Math.min(range.start, maxIndex));
  const end = Math.max(start, Math.min(range.end, maxIndex));
  return { start, end };
}

function highlightTranscriptCue(rawText){
  if (!trackedTranscriptElement || !currentTranscriptChunkMeta.length) {
    lastCueRawText = rawText || '';
    return;
  }
  const canonicalCue = canonicalCueString(rawText);
  lastCueRawText = rawText || '';
  if (!canonicalCue) {
    clearTranscriptHighlight();
    return;
  }

  const cueWords = canonicalCue.split(/\s+/).filter(Boolean);
  const cueWordSet = new Set(cueWords);
  let bestIndex = -1;
  let bestScore = 0;

  currentTranscriptChunkMeta.forEach((meta, idx) => {
    if (!meta || !meta.canonical) return;
    let score = 0;
    if (meta.canonical === canonicalCue) {
      score = 1000;
    } else {
      if (meta.canonical.includes(canonicalCue)) score += 400;
      if (canonicalCue.includes(meta.canonical)) score += 350;
      if (cueWords.length && meta.words.length) {
        let overlap = 0;
        meta.words.forEach((w) => { if (cueWordSet.has(w)) overlap++; });
        if (overlap) {
          const cueRatio = overlap / cueWords.length;
          const chunkRatio = overlap / meta.words.length;
          score += overlap * 25 + cueRatio * 120 + chunkRatio * 80;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIndex = idx;
    }
  });

  if (bestIndex === -1) {
    clearTranscriptHighlight();
    return;
  }

  const meta = currentTranscriptChunkMeta[bestIndex];
  const range = clampWordRange(determineWordRange(meta, cueWords), meta?.wordNodes?.length || 0);
  if (!range && meta?.wordNodes?.length) {
    setActiveChunkHighlight(bestIndex, { start: 0, end: meta.wordNodes.length - 1 });
  } else {
    setActiveChunkHighlight(bestIndex, range);
  }
}

function extractCueText(evt){
  if (!evt) return '';
  if (Array.isArray(evt.cues) && evt.cues.length) {
    return evt.cues.map((cue) => cue?.text || '').join(' ').trim();
  }
  if (evt.cue && typeof evt.cue.text === 'string') return evt.cue.text;
  if (typeof evt.text === 'string') return evt.text;
  return '';
}

/* ---------------------------
   Transcript updater (race-safe)
---------------------------- */
async function setTranscriptFor(id, opts = {}){
  const targetId = String(id);
  const isSameRecord = currentRecordId === targetId;
  currentRecordId = targetId;
  if (!isSameRecord) {
    lastCueRawText = '';
  }
  const seq = ++transcriptSeq;

  // Clear immediately to avoid showing stale text
  if (audioTranscript) audioTranscript.innerHTML = '';
  if (ao) ao.innerHTML = '';

  // Resolve from filtered dataset synchronously
  const idx = indexOfIdInFiltered(String(id));
  const rec = (idx >= 0 && FILTERED) ? FILTERED[idx] : null;
  updateSubtitleButtonsForRecord(rec);
  const title = rec ? `${rec['Notion']||''}${rec['Interviewee name'] ? ' — ' + rec['Interviewee name'] : ''}` : '';
  const explicitLang = canonicalLangCode(opts?.languageOverride);
  const activeLang = explicitLang || currentSubtitleActive || canonicalLangCode(getStoredPrefLang());
  const transcriptInfo = rec
    ? getTranscriptForRow(rec, activeLang || getStoredPrefLang())
    : { text: '', lang: null };
  const raw   = transcriptInfo?.text || '';
  const transcriptLang = transcriptInfo?.lang || '';
  const canonicalTranscriptLang = canonicalLangCode(transcriptLang);
  const transcriptLabel = canonicalTranscriptLang ? languageLabel(canonicalTranscriptLang) : '';

  const overlayHtml    = (title ? `<div class="ao-title">${escapeHtml(title)}</div>` : '') +
                         `<div class="ao-text">${formatOverlay(raw)}`;
  // Abort if superseded
  if (seq !== transcriptSeq) return;

  // Commit to modal elements only
  if (audioTitle)      audioTitle.textContent = title || '';
  if (audioTranscript) {
    renderTranscriptInto(audioTranscript, raw, { track: true });
    if (canonicalTranscriptLang) {
      audioTranscript.setAttribute('data-lang', canonicalTranscriptLang);
    } else {
      audioTranscript.removeAttribute('data-lang');
    }
  }
  if (ao)              ao.innerHTML = overlayHtml;
  if (subtitleControls) {
    const normLang = canonicalTranscriptLang;
    if (normLang) subtitleControls.setAttribute('data-transcript-lang', normLang);
    else subtitleControls.removeAttribute('data-transcript-lang');
  }
  if (transcriptActions) {
    if (raw) {
      transcriptActions.removeAttribute('hidden');
      if (canonicalTranscriptLang) transcriptActions.setAttribute('data-lang', canonicalTranscriptLang);
      else transcriptActions.removeAttribute('data-lang');
    } else {
      transcriptActions.setAttribute('hidden', '');
      transcriptActions.removeAttribute('data-lang');
    }
  }
  if (downloadTranscriptBtn) {
    downloadTranscriptBtn.disabled = !raw;
    downloadTranscriptBtn.setAttribute('aria-disabled', raw ? 'false' : 'true');
    downloadTranscriptBtn.dataset.lang = canonicalTranscriptLang || '';
  }

  document.dispatchEvent(new CustomEvent('transcript:updated', {
    detail: {
      id: targetId,
      text: raw,
      lang: canonicalTranscriptLang || '',
      label: transcriptLabel || '',
      title
    }
  }));
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
async function prepareAudioScreenForIndex(idx, opts = {}){
  if (!audioScreen || !audioTranscript || !audioTitle || !player) return;
  const row = FILTERED?.[idx];
  const notion  = row?.['Notion'] || '';
  const person  = row?.['Interviewee name'] || '';
  const explicitLang = canonicalLangCode(opts?.languageOverride);
  const activeLang = explicitLang || currentSubtitleActive || canonicalLangCode(getStoredPrefLang());
  const transcriptInfo = row
    ? getTranscriptForRow(row, activeLang || getStoredPrefLang())
    : { text: '', lang: null };
  const trans   = transcriptInfo?.text || '';
  audioTitle.textContent = person ? `${notion} — ${person}` : notion;
  renderTranscriptInto(audioTranscript, trans, { track: true });
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

    player.on('cuechange', (evt) => {
      highlightTranscriptCue(extractCueText(evt));
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
  clearTranscriptHighlight();
  currentRecordId = null;
  currentTranscriptChunkMeta = [];
  lastHighlightedChunk = -1;
  lastCueRawText = '';
  trackedTranscriptElement = null;
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

  openTranscriptPanelBtn?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('transcript:open-request'));
  });

  downloadTranscriptBtn?.addEventListener('click', () => {
    if (downloadTranscriptBtn.disabled) return;
    document.dispatchEvent(new CustomEvent('transcript:download-request', {
      detail: { format: 'txt' }
    }));
  });
}

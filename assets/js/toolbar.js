// assets/js/toolbar.js
import { $, $$ } from './utils.js';
import { setCollectionFilter, getCollectionFilter, getCollectionOptions } from './table.js';

// --- state -------------------------------------------------
let autoplayEnabled = false;       // user toggle (session)
let autoplaySessionActive = false; // set true while modal is open / playing

// Persistent + per-session flags
let audioMode = (localStorage.getItem('pg_audio_mode') === '1'); // persistent user pref
let audioClickedThisSession = (sessionStorage.getItem('pg_audio_clicked') === '1'); // new guard

let collectionSelect = null;
const collectionAliasMap = new Map();
const collectionSlugOverrides = new Map([
  ['Post Growth Toolkit', 'PGTK'],
  ['Radical Ecological Shifts', 'RES']
]);

// --- small helpers / exports -------------------------------
export function isAudioMode() { return audioMode; }

export function setAudioMode(v) {
  audioMode = !!v;
  document.body.classList.toggle('audio-mode', audioMode);

  const btn = $('#toggleAudioMode');
  if (btn) {
    btn.classList.toggle('active', audioMode);
    btn.setAttribute('aria-pressed', audioMode ? 'true' : 'false');
  }

  // Persist + mark that the user explicitly chose it this session
  localStorage.setItem('pg_audio_mode', audioMode ? '1' : '0');
  sessionStorage.setItem('pg_audio_clicked', '1');
  audioClickedThisSession = true;

  document.dispatchEvent(new CustomEvent('audio:mode-changed', { detail: { on: audioMode } }));
}

export function isAutoplayEnabled()      { return autoplayEnabled; }
export function setAutoplaySessionActive(v) { autoplaySessionActive = !!v; }
export function isAutoplaySessionActive() { return autoplaySessionActive; }

export function setAutoplayButtonState(on) {
  autoplayEnabled = !!on;
  const btn = $('#toggleAutoplay');
  if (btn) {
    btn.classList.toggle('active', autoplayEnabled);
    btn.setAttribute('aria-pressed', autoplayEnabled ? 'true' : 'false');
  }
}

// --- main binder -------------------------------------------
export function bindToolbar() {
  // ✅ Reset to video if stuck in audio mode from a previous session
  if (!audioClickedThisSession && audioMode) {
    audioMode = false;
    localStorage.setItem('pg_audio_mode', '0');
  }

  // Reflect initial state
  document.body.classList.toggle('audio-mode', audioMode);

  // Column toggles
  $$('.tbar .toggle[data-col]').forEach(btn => {
    btn.addEventListener('click', () => {
      const col  = btn.dataset.col;
      const attr = `data-show-${col}`;
      const cur  = document.body.getAttribute(attr) || '0';
      const next = (cur === '1') ? '0' : '1';
      document.body.setAttribute(attr, next);
      btn.classList.toggle('active', next === '1');
    });
  });

  // Autoplay toggle
  const ap = $('#toggleAutoplay');
  if (ap) {
    ap.addEventListener('click', () => setAutoplayButtonState(!autoplayEnabled));
  }

  // Theme toggle
  const themeToggle = $('#themeToggle');
  if (themeToggle) {
    if (localStorage.getItem('theme') === 'light') document.body.classList.add('light');
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light');
      localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
    });
  }

  // Audio mode toggle
  const audioBtn = $('#toggleAudioMode');
  if (audioBtn) {
    audioBtn.classList.toggle('active', audioMode);
    audioBtn.setAttribute('aria-pressed', audioMode ? 'true' : 'false');
    audioBtn.addEventListener('click', () => setAudioMode(!audioMode));
  }

  // Subtitle language preference selector
  const langSel = $('#langPref');
  if (langSel) {
    const savedLang = localStorage.getItem('pg_pref_lang');
    if (savedLang) langSel.value = savedLang;

    langSel.addEventListener('change', (e) => {
      const val = (e.target.value || '').trim().toLowerCase();
      if (val) localStorage.setItem('pg_pref_lang', val);
      else localStorage.removeItem('pg_pref_lang');

      document.dispatchEvent(new CustomEvent('subtitle:pref-changed', {
        detail: { lang: val || null }
      }));
    });
  }

  collectionSelect = $('#collectionFilter');
  if (collectionSelect) {
    collectionSelect.addEventListener('change', (e) => {
      const val = (e.target.value || '').trim();
      setCollectionFilter(val);
      syncCollectionQueryParam(val);
    });
  }
}

export function refreshCollectionFilterOptions() {
  collectionSelect = collectionSelect || $('#collectionFilter');
  if (!collectionSelect) return;

  const options = getCollectionOptions();
  const fragment = document.createDocumentFragment();

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'All';
  fragment.appendChild(defaultOption);

  options.forEach(label => {
    const opt = document.createElement('option');
    opt.value = label;
    opt.textContent = label;
    fragment.appendChild(opt);
  });

  collectionSelect.innerHTML = '';
  collectionSelect.appendChild(fragment);

  const current = getCollectionFilter();
  if (current && options.includes(current)) {
    collectionSelect.value = current;
  } else {
    collectionSelect.value = '';
    if (current) {
      setCollectionFilter('');
      syncCollectionQueryParam('');
    }
  }

  rebuildCollectionAliasMap(options);
}

export function applyCollectionFilterFromUrl() {
  collectionSelect = collectionSelect || $('#collectionFilter');
  if (!collectionSelect) return false;

  const token = readCollectionTokenFromUrl();
  if (!token) return false;

  const resolved = resolveCollectionLabelFromToken(token);
  if (resolved === null) return false;

  setCollectionFilter(resolved);
  if (collectionSelect.value !== resolved) {
    collectionSelect.value = resolved;
  }
  syncCollectionQueryParam(resolved);
  return true;
}

function rebuildCollectionAliasMap(options) {
  collectionAliasMap.clear();

  const normalized = new Map();
  options.forEach(label => {
    const key = normalizeCollectionToken(label);
    if (!key || normalized.has(key)) return;
    normalized.set(key, label);
    collectionAliasMap.set(key, label);
    const slugKey = normalizeCollectionToken(label.replace(/[^A-Za-z0-9]/g, ''));
    if (slugKey && !collectionAliasMap.has(slugKey)) collectionAliasMap.set(slugKey, label);
  });

  const pgKey = normalizeCollectionToken('Post Growth Toolkit');
  if (normalized.has(pgKey)) {
    collectionAliasMap.set('pgtk', normalized.get(pgKey));
  }

  const resKey = normalizeCollectionToken('Radical Ecological Shifts');
  if (normalized.has(resKey)) {
    collectionAliasMap.set('res', normalized.get(resKey));
  }
}

function normalizeCollectionToken(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function readCollectionTokenFromUrl() {
  const search = window.location.search || '';
  if (!search || search === '?') return '';
  const query = search.slice(1);
  if (!query) return '';
  const first = query.split('&')[0];
  if (!first) return '';
  const [rawKey, rawValue = ''] = first.split('=');
  const raw = rawValue || rawKey;
  return decodeURIComponent(raw || '').trim();
}

function resolveCollectionLabelFromToken(token) {
  const norm = normalizeCollectionToken(token);
  if (!norm || norm === 'all') return '';
  return collectionAliasMap.get(norm) ?? null;
}

function syncCollectionQueryParam(label) {
  const hash = window.location.hash || '';
  if (!label) {
    try {
      window.history.replaceState({}, '', `${window.location.pathname}${hash}`);
    } catch (_) {
      window.location.search = '';
    }
    return;
  }

  const slug = collectionSlugOverrides.get(label) || label.replace(/[^A-Za-z0-9]/g, '');
  const query = slug ? `?${slug}` : '';
  try {
    window.history.replaceState({}, '', `${window.location.pathname}${query}${hash}`);
  } catch (_) {
    window.location.search = query;
  }
}

// --- Mobile Keywords stacking state (keeps .keywords-on in sync) ----
(function () {
  const btn = document.querySelector('.tbar .toggle[data-col="keywords"]');

  function syncKeywordsClass() {
    const on = !!btn && btn.classList.contains('active');
    document.body.classList.toggle('keywords-on', on);
  }

  // Initial sync
  syncKeywordsClass();

  // Re-sync after button click
  if (btn) {
    btn.addEventListener('click', () => {
      requestAnimationFrame(syncKeywordsClass);
    }, true);
  }

  // If your app mutates table attributes, re-sync
  const table = document.querySelector('#videoTable');
  if (table && window.MutationObserver) {
    const mo = new MutationObserver(() => requestAnimationFrame(syncKeywordsClass));
    mo.observe(table, { attributes: true, subtree: true, attributeFilter: ['class', 'style'] });
  }
})();

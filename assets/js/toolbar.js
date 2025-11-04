// assets/js/toolbar.js
import { $, $$ } from './utils.js';

// --- state -------------------------------------------------
let autoplayEnabled = false;       // user toggle (session)
let autoplaySessionActive = false; // set true while modal is open / playing

// Persistent + per-session flags
let audioMode = (localStorage.getItem('pg_audio_mode') === '1'); // persistent user pref
let audioClickedThisSession = (sessionStorage.getItem('pg_audio_clicked') === '1'); // new guard

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

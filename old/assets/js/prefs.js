// Centralized localStorage/sessionStorage access with safe wrappers.

const KEYS = {
  theme: 'theme',
  prefLang: 'pg_pref_lang',
  audioMode: 'pg_audio_mode',
  audioClicked: 'pg_audio_clicked',
};

function safeGet(storage, key) {
  try { return storage.getItem(key); }
  catch { return null; }
}

function safeSet(storage, key, value) {
  try { storage.setItem(key, value); }
  catch (err) { console.warn(`prefs: could not write ${key}`, err); }
}

function safeRemove(storage, key) {
  try { storage.removeItem(key); }
  catch {}
}

export function getTheme()  { return safeGet(localStorage, KEYS.theme); }
export function setTheme(v) { safeSet(localStorage, KEYS.theme, v); }

export function getPrefLang() { return (safeGet(localStorage, KEYS.prefLang) || '').toLowerCase(); }
export function setPrefLang(v) {
  if (v) safeSet(localStorage, KEYS.prefLang, v);
  else safeRemove(localStorage, KEYS.prefLang);
}

export function getAudioMode()  { return safeGet(localStorage, KEYS.audioMode) === '1'; }
export function setAudioMode(v) { safeSet(localStorage, KEYS.audioMode, v ? '1' : '0'); }

export function getAudioClicked()  { return safeGet(sessionStorage, KEYS.audioClicked) === '1'; }
export function setAudioClicked()  { safeSet(sessionStorage, KEYS.audioClicked, '1'); }

const KEYS = {
  theme: 'theme',
  preferredLanguage: 'pg_pref_lang',
  audioMode: 'pg_audio_mode',
  audioClicked: 'pg_audio_clicked',
  layoutMode: 'pg_layout_mode',
};

function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

function safeRemove(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // ignore storage failures
  }
}

export function getTheme(): 'light' | 'dark' | null {
  const value = safeGet(window.localStorage, KEYS.theme);
  return value === 'light' || value === 'dark' ? value : null;
}

export function setTheme(value: 'light' | 'dark'): void {
  safeSet(window.localStorage, KEYS.theme, value);
}

export function getPreferredLanguage(): string {
  return (safeGet(window.localStorage, KEYS.preferredLanguage) || '').toLowerCase();
}

export function setPreferredLanguage(value: string): void {
  if (value) {
    safeSet(window.localStorage, KEYS.preferredLanguage, value.toLowerCase());
  } else {
    safeRemove(window.localStorage, KEYS.preferredLanguage);
  }
}

export function getAudioMode(): boolean {
  return safeGet(window.localStorage, KEYS.audioMode) === '1';
}

export function setAudioMode(value: boolean): void {
  safeSet(window.localStorage, KEYS.audioMode, value ? '1' : '0');
}

export function getAudioClicked(): boolean {
  return safeGet(window.sessionStorage, KEYS.audioClicked) === '1';
}

export function setAudioClicked(): void {
  safeSet(window.sessionStorage, KEYS.audioClicked, '1');
}

export function getLayoutMode(): 'side' | 'stacked' | null {
  const value = safeGet(window.localStorage, KEYS.layoutMode);
  return value === 'side' || value === 'stacked' ? value : null;
}

export function setLayoutMode(value: 'side' | 'stacked'): void {
  safeSet(window.localStorage, KEYS.layoutMode, value);
}

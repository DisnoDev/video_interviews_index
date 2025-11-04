import {
  DEFAULT_LANG,
  TRANSLATIONS_SHEET_ID,
  TRANSLATIONS_GID,
  TRANSLATIONS_USE_CSV_PUBLISH,
  TRANSLATIONS_CSV_URL,
  SHEET_ID,
} from './config.js';
import { csvToRows } from './utils.js';

const FALLBACK_TRANSLATIONS = {
  en: {
    headerTitle: 'Video Interviews Index',
    intro:
      'Spanning energy, ecology, economics, and techno-solutionism, most DISNOVATION.ORG projects begin with dialogue and documentation alongside experts and stakeholders. This archive gathers the interviews that underpin works such as the Post Growth Toolkit, ShadowGrowth, and Radical Ecological Shifts.',
    showLabel: 'Show:',
    toggleCollection: 'Collection',
    toggleTranscript: 'Transcript',
    toggleKeywords: 'Keywords',
    toggleAudioMode: '📻 mode',
    searchPlaceholder: 'Search… (concept, person, keywords, …)',
    langAuto: '📣 auto',
    audioOnlyMode: 'Audio-only mode',
    thCollection: 'Collection',
    thConcept: 'Concept',
    thAuthor: 'Author',
    thTranscript: '📃 Transcript',
    thKeywords: 'Keywords',
    thTitle: 'Title',
    thPlay: 'Play',
    modalClose: 'Close ✕',
    modalFullscreen: 'Fullscreen ⛶',
    audioAutoScroll: 'Auto-scroll',
    audioSpeed: 'Speed',
    transcriptTitle: 'Transcript',
    noTranscript: 'No transcript available.',
    downloadPdf: 'Download .pdf',
    downloadTxt: 'Download .txt',
  },
  fr: {
    headerTitle: 'Index des entretiens vidéo',
    intro:
      "Englobant l'énergie, l'écologie, l'économie et le techno-solutionnisme, la plupart des projets de DISNOVATION.ORG commencent par un dialogue et une documentation avec des experts et des parties prenantes. Cette archive rassemble les entretiens qui sous-tendent des œuvres telles que le Post Growth Toolkit, ShadowGrowth et Radical Ecological Shifts.",
    showLabel: 'Afficher :',
    toggleCollection: 'Collection',
    toggleTranscript: 'Transcription',
    toggleKeywords: 'Mots-clés',
    toggleAudioMode: '📻 mode audio',
    searchPlaceholder: 'Rechercher… (concept, personne, mots-clés, …)',
    langAuto: '📣 auto',
    audioOnlyMode: 'Mode audio uniquement',
    thCollection: 'Collection',
    thConcept: 'Concept',
    thAuthor: 'Auteur',
    thTranscript: '📃 Transcription',
    thKeywords: 'Mots-clés',
    thTitle: 'Titre',
    thPlay: 'Lecture',
    modalClose: 'Fermer ✕',
    modalFullscreen: 'Plein écran ⛶',
    audioAutoScroll: 'Défilement auto',
    audioSpeed: 'Vitesse',
    transcriptTitle: 'Transcription',
    noTranscript: 'Aucune transcription disponible.',
    downloadPdf: 'Télécharger .pdf',
    downloadTxt: 'Télécharger .txt',
  },
  de: {
    headerTitle: 'Video-Interviews-Index',
    intro:
      'Von Energie, Ökologie, Wirtschaft bis Techno-Solutionismus beginnen die meisten Projekte von DISNOVATION.ORG mit Dialog und Dokumentation zusammen mit Expert·innen und Stakeholdern. Dieses Archiv sammelt die Interviews, die Arbeiten wie das Post Growth Toolkit, ShadowGrowth und Radical Ecological Shifts untermauern.',
    showLabel: 'Anzeigen:',
    toggleCollection: 'Sammlung',
    toggleTranscript: 'Transkript',
    toggleKeywords: 'Schlüsselwörter',
    toggleAudioMode: '📻 Audiomodus',
    searchPlaceholder: 'Suchen… (Begriff, Person, Schlagwörter, …)',
    langAuto: '📣 automatisch',
    audioOnlyMode: 'Nur-Audio-Modus',
    thCollection: 'Sammlung',
    thConcept: 'Konzept',
    thAuthor: 'Autor',
    thTranscript: '📃 Transkript',
    thKeywords: 'Schlüsselwörter',
    thTitle: 'Titel',
    thPlay: 'Wiedergabe',
    modalClose: 'Schließen ✕',
    modalFullscreen: 'Vollbild ⛶',
    audioAutoScroll: 'Auto-Scroll',
    audioSpeed: 'Geschwindigkeit',
    transcriptTitle: 'Transkript',
    noTranscript: 'Kein Transkript verfügbar.',
    downloadPdf: 'PDF herunterladen',
    downloadTxt: 'TXT herunterladen',
  },
  pl: {
    headerTitle: 'Indeks wywiadów wideo',
    intro:
      'Obejmując energię, ekologię, ekonomię i techno-solutionizm, większość projektów DISNOVATION.ORG rozpoczyna się od dialogu i dokumentacji prowadzonej z ekspertami i interesariuszami. To archiwum gromadzi wywiady stanowiące podstawę takich prac jak Post Growth Toolkit, ShadowGrowth i Radical Ecological Shifts.',
    showLabel: 'Pokaż:',
    toggleCollection: 'Kolekcja',
    toggleTranscript: 'Transkrypcja',
    toggleKeywords: 'Słowa kluczowe',
    toggleAudioMode: '📻 tryb audio',
    searchPlaceholder: 'Szukaj… (pojęcie, osoba, słowa kluczowe, …)',
    langAuto: '📣 automatycznie',
    audioOnlyMode: 'Tryb tylko audio',
    thCollection: 'Kolekcja',
    thConcept: 'Koncepcja',
    thAuthor: 'Autor',
    thTranscript: '📃 Transkrypcja',
    thKeywords: 'Słowa kluczowe',
    thTitle: 'Tytuł',
    thPlay: 'Odtwarzaj',
    modalClose: 'Zamknij ✕',
    modalFullscreen: 'Pełny ekran ⛶',
    audioAutoScroll: 'Auto-przewijanie',
    audioSpeed: 'Prędkość',
    transcriptTitle: 'Transkrypcja',
    noTranscript: 'Brak dostępnej transkrypcji.',
    downloadPdf: 'Pobierz .pdf',
    downloadTxt: 'Pobierz .txt',
  },
};

const translations = Object.fromEntries(
  Object.entries(FALLBACK_TRANSLATIONS).map(([lang, dict]) => [lang, { ...dict }]),
);

let loadPromise = null;

function resolveLang(lang) {
  return translations[lang] ? lang : DEFAULT_LANG;
}

function getTranslation(lang, key) {
  const dict = translations[lang] || {};
  if (Object.prototype.hasOwnProperty.call(dict, key)) {
    return dict[key];
  }
  const fallback = translations[DEFAULT_LANG] || {};
  return fallback[key] ?? null;
}

function applyTranslations(lang) {
  const resolvedLang = resolveLang(lang);

  document.documentElement.setAttribute('lang', resolvedLang);

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const translation = getTranslation(resolvedLang, key);
    if (translation !== null && translation !== undefined) {
      el.textContent = translation;
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    const translation = getTranslation(resolvedLang, key);
    if (translation !== null && translation !== undefined) {
      el.setAttribute('placeholder', translation);
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.dataset.i18nTitle;
    const translation = getTranslation(resolvedLang, key);
    if (translation !== null && translation !== undefined) {
      el.setAttribute('title', translation);
    }
  });
}

function getSavedLanguage() {
  try {
    return localStorage.getItem('pg_pref_lang');
  } catch (err) {
    console.warn('Unable to access localStorage for language preference.', err);
    return null;
  }
}

function shouldFetchTranslations() {
  if (TRANSLATIONS_USE_CSV_PUBLISH && TRANSLATIONS_CSV_URL) return true;
  if (TRANSLATIONS_SHEET_ID) return true;
  if (TRANSLATIONS_GID) return true;
  return false;
}

async function fetchTranslationsCsv() {
  if (TRANSLATIONS_USE_CSV_PUBLISH && TRANSLATIONS_CSV_URL) {
    const response = await fetch(TRANSLATIONS_CSV_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not fetch translations CSV (published).');
    return await response.text();
  }

  const sheetId = TRANSLATIONS_SHEET_ID || SHEET_ID;
  if (!sheetId) throw new Error('No sheet id configured for translations.');
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${
    TRANSLATIONS_GID ? `&gid=${TRANSLATIONS_GID}` : ''
  }`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not fetch CSV from Google Sheets (translations).');
  return await res.text();
}

function mergeTranslationsFromRows(rows) {
  if (!rows.length) return false;
  const headerRow = rows[0].map((h) => h.trim());
  if (!headerRow.length) return false;

  const keyHeader = headerRow[0].toLowerCase();
  if (keyHeader !== 'key') {
    console.warn('Translations sheet missing a "key" header in the first column.');
    return false;
  }

  const languageHeaders = headerRow
    .slice(1)
    .map((h) => h.trim())
    .filter(Boolean);
  if (!languageHeaders.length) return false;

  const pending = {};

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const key = String(row[0] || '').trim();
    if (!key) continue;

    languageHeaders.forEach((header, index) => {
      const langCode = header.toLowerCase();
      if (!langCode) return;
      const cellValue = row[index + 1];
      if (cellValue === undefined || cellValue === null) return;
      const value = String(cellValue).trim();
      if (!value) return;
      if (!pending[langCode]) pending[langCode] = {};
      pending[langCode][key] = value;
    });
  }

  Object.entries(pending).forEach(([lang, dict]) => {
    if (!translations[lang]) translations[lang] = {};
    translations[lang] = { ...translations[lang], ...dict };
  });

  return true;
}

async function loadTranslations() {
  if (!shouldFetchTranslations()) return;

  try {
    const csv = await fetchTranslationsCsv();
    const rows = csvToRows(csv);
    mergeTranslationsFromRows(rows);
  } catch (err) {
    console.warn('Unable to load translations from sheet.', err);
  }
}

async function ensureTranslationsLoaded() {
  if (!loadPromise) {
    loadPromise = loadTranslations();
  }
  try {
    await loadPromise;
  } catch (err) {
    console.warn('Translation loading failed.', err);
  }
}

export async function initI18n() {
  await ensureTranslationsLoaded();

  const saved = getSavedLanguage();
  const initialLang = saved || document.querySelector('#langPref')?.value || DEFAULT_LANG;
  applyTranslations(initialLang);

  document.addEventListener('subtitle:pref-changed', (event) => {
    const nextLang = event.detail?.lang || DEFAULT_LANG;
    applyTranslations(nextLang);
  });
}

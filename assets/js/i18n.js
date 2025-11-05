const DEFAULT_LANG = 'en';

const TRANSLATIONS = {
  en: {
    headerTitle: 'Video Interviews Index',
    intro: 'Spanning energy, ecology, economics, and techno-solutionism, most DISNOVATION.ORG projects begin with dialogue and documentation alongside experts and stakeholders. This archive gathers the interviews that underpin works such as the Post Growth Toolkit, ShadowGrowth, and Radical Ecological Shifts.',
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
    modalSubtitles: 'Subtitles',
    audioAutoScroll: 'Auto-scroll',
    audioSpeed: 'Speed',
    transcriptTitle: 'Transcript',
    noTranscript: 'No transcript available.',
    downloadPdf: 'Download .pdf',
    downloadTxt: 'Download .txt'
  },
  fr: {
    headerTitle: 'Index des entretiens vidéo',
    intro: 'Englobant l\'énergie, l\'écologie, l\'économie et le techno-solutionnisme, la plupart des projets de DISNOVATION.ORG commencent par un dialogue et une documentation avec des experts et des parties prenantes. Cette archive rassemble les entretiens qui sous-tendent des œuvres telles que le Post Growth Toolkit, ShadowGrowth et Radical Ecological Shifts.',
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
    modalSubtitles: 'Sous-titres',
    audioAutoScroll: 'Défilement auto',
    audioSpeed: 'Vitesse',
    transcriptTitle: 'Transcription',
    noTranscript: 'Aucune transcription disponible.',
    downloadPdf: 'Télécharger .pdf',
    downloadTxt: 'Télécharger .txt'
  },
  de: {
    headerTitle: 'Video-Interviews-Index',
    intro: 'Von Energie, Ökologie, Wirtschaft bis Techno-Solutionismus beginnen die meisten Projekte von DISNOVATION.ORG mit Dialog und Dokumentation zusammen mit Expert·innen und Stakeholdern. Dieses Archiv sammelt die Interviews, die Arbeiten wie das Post Growth Toolkit, ShadowGrowth und Radical Ecological Shifts untermauern.',
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
    modalSubtitles: 'Untertitel',
    audioAutoScroll: 'Auto-Scroll',
    audioSpeed: 'Geschwindigkeit',
    transcriptTitle: 'Transkript',
    noTranscript: 'Kein Transkript verfügbar.',
    downloadPdf: 'PDF herunterladen',
    downloadTxt: 'TXT herunterladen'
  },
  pl: {
    headerTitle: 'Indeks wywiadów wideo',
    intro: 'Obejmując energię, ekologię, ekonomię i techno-solutionizm, większość projektów DISNOVATION.ORG rozpoczyna się od dialogu i dokumentacji prowadzonej z ekspertami i interesariuszami. To archiwum gromadzi wywiady stanowiące podstawę takich prac jak Post Growth Toolkit, ShadowGrowth i Radical Ecological Shifts.',
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
    modalSubtitles: 'Napisy',
    audioAutoScroll: 'Auto-przewijanie',
    audioSpeed: 'Prędkość',
    transcriptTitle: 'Transkrypcja',
    noTranscript: 'Brak dostępnej transkrypcji.',
    downloadPdf: 'Pobierz .pdf',
    downloadTxt: 'Pobierz .txt'
  }
};

function resolveLang(lang) {
  return (lang && TRANSLATIONS[lang]) ? lang : DEFAULT_LANG;
}

function getTranslation(lang, key) {
  const dict = TRANSLATIONS[lang] || {};
  if (Object.prototype.hasOwnProperty.call(dict, key)) {
    return dict[key];
  }
  const fallback = TRANSLATIONS[DEFAULT_LANG] || {};
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

export function initI18n() {
  const saved = getSavedLanguage();
  const initialLang = saved || document.querySelector('#langPref')?.value || DEFAULT_LANG;
  applyTranslations(initialLang);

  document.addEventListener('subtitle:pref-changed', (event) => {
    const nextLang = event.detail?.lang || DEFAULT_LANG;
    applyTranslations(nextLang);
  });
}

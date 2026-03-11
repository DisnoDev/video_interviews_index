const DEFAULT_LANG = 'en';

export type TranslationKey =
  | 'headerTitle'
  | 'intro'
  | 'searchPlaceholder'
  | 'collectionAll'
  | 'audioMode'
  | 'audioAutoScroll'
  | 'audioSpeed'
  | 'sortLabel'
  | 'sortAsc'
  | 'sortDesc'
  | 'themeDark'
  | 'themeLight'
  | 'layoutSide'
  | 'layoutStacked'
  | 'keywords'
  | 'collection'
  | 'year'
  | 'duration'
  | 'concept'
  | 'author'
  | 'title'
  | 'play'
  | 'transcript'
  | 'downloadTranscript'
  | 'downloadPdf'
  | 'exportPdf'
  | 'subtitles'
  | 'loading'
  | 'retry'
  | 'loadError'
  | 'selectVideo'
  | 'noResults'
  | 'clear'
  | 'itemsCount'
  | 'viewTranscript'
  | 'fullscreen'
  | 'close'
  | 'language'
  | 'auto'
  | 'metaCollection'
  | 'metaYear'
  | 'metaDuration';

const TRANSLATIONS: Record<string, Record<TranslationKey, string>> = {
  en: {
    headerTitle: 'Video Interviews Index',
    intro: 'Spanning energy, ecology, economics, and techno-solutionism, most DISNOVATION.ORG projects begin with dialogue and documentation alongside experts and stakeholders.',
    searchPlaceholder: 'Search... concept, person, keywords...',
    collectionAll: 'All collections',
    audioMode: 'Audio mode',
    audioAutoScroll: 'Auto-scroll',
    audioSpeed: 'Speed',
    sortLabel: 'Sort',
    sortAsc: 'Asc',
    sortDesc: 'Desc',
    themeDark: 'Dark',
    themeLight: 'Light',
    layoutSide: 'Split',
    layoutStacked: 'Stack',
    keywords: 'Keywords',
    collection: 'Collection',
    year: 'Year',
    duration: 'Duration',
    concept: 'Concept',
    author: 'Author',
    title: 'Title',
    play: 'Play',
    transcript: 'Transcript',
    downloadTranscript: 'Download transcript',
    downloadPdf: 'Download PDF',
    exportPdf: 'Export PDF',
    subtitles: 'Subtitles',
    loading: 'Loading interviews...',
    retry: 'Retry',
    loadError: 'Could not load data.',
    selectVideo: 'Select a video from the list to view it here.',
    noResults: 'No results match the current filters.',
    clear: 'Clear',
    itemsCount: 'items',
    viewTranscript: 'View transcript',
    fullscreen: 'Fullscreen',
    close: 'Close',
    language: 'Language',
    auto: 'auto',
    metaCollection: 'Collection',
    metaYear: 'Year',
    metaDuration: 'Duration',
  },
  fr: {
    headerTitle: 'Index des entretiens video',
    intro: 'Entre energie, ecologie, economie et techno-solutionnisme, la plupart des projets de DISNOVATION.ORG commencent par le dialogue et la documentation.',
    searchPlaceholder: 'Rechercher... concept, personne, mots-cles...',
    collectionAll: 'Toutes les collections',
    audioMode: 'Mode audio',
    audioAutoScroll: 'Defilement auto',
    audioSpeed: 'Vitesse',
    sortLabel: 'Tri',
    sortAsc: 'Asc',
    sortDesc: 'Desc',
    themeDark: 'Sombre',
    themeLight: 'Clair',
    layoutSide: 'Double',
    layoutStacked: 'Empile',
    keywords: 'Mots-cles',
    collection: 'Collection',
    year: 'Annee',
    duration: 'Duree',
    concept: 'Concept',
    author: 'Auteur',
    title: 'Titre',
    play: 'Lecture',
    transcript: 'Transcription',
    downloadTranscript: 'Telecharger la transcription',
    downloadPdf: 'Telecharger PDF',
    exportPdf: 'Exporter PDF',
    subtitles: 'Sous-titres',
    loading: 'Chargement des entretiens...',
    retry: 'Reessayer',
    loadError: 'Impossible de charger les donnees.',
    selectVideo: 'Selectionnez une video dans la liste.',
    noResults: 'Aucun resultat pour ces filtres.',
    clear: 'Effacer',
    itemsCount: 'elements',
    viewTranscript: 'Voir la transcription',
    fullscreen: 'Plein ecran',
    close: 'Fermer',
    language: 'Langue',
    auto: 'auto',
    metaCollection: 'Collection',
    metaYear: 'Annee',
    metaDuration: 'Duree',
  },
  de: {
    headerTitle: 'Video-Interview-Index',
    intro: 'Von Energie, Okologie und Wirtschaft bis Techno-Solutionismus beginnen die meisten Projekte von DISNOVATION.ORG mit Dialog und Dokumentation.',
    searchPlaceholder: 'Suchen... Begriff, Person, Schlagwort...',
    collectionAll: 'Alle Sammlungen',
    audioMode: 'Audiomodus',
    audioAutoScroll: 'Auto-Scroll',
    audioSpeed: 'Geschwindigkeit',
    sortLabel: 'Sortierung',
    sortAsc: 'Auf',
    sortDesc: 'Ab',
    themeDark: 'Dunkel',
    themeLight: 'Hell',
    layoutSide: 'Split',
    layoutStacked: 'Stapel',
    keywords: 'Schlagworter',
    collection: 'Sammlung',
    year: 'Jahr',
    duration: 'Dauer',
    concept: 'Konzept',
    author: 'Autor',
    title: 'Titel',
    play: 'Play',
    transcript: 'Transkript',
    downloadTranscript: 'Transkript herunterladen',
    downloadPdf: 'PDF herunterladen',
    exportPdf: 'PDF exportieren',
    subtitles: 'Untertitel',
    loading: 'Interviews werden geladen...',
    retry: 'Erneut',
    loadError: 'Daten konnten nicht geladen werden.',
    selectVideo: 'Wahlen Sie ein Video aus der Liste.',
    noResults: 'Keine Ergebnisse fur diese Filter.',
    clear: 'Loschen',
    itemsCount: 'Eintrage',
    viewTranscript: 'Transkript anzeigen',
    fullscreen: 'Vollbild',
    close: 'Schliessen',
    language: 'Sprache',
    auto: 'auto',
    metaCollection: 'Sammlung',
    metaYear: 'Jahr',
    metaDuration: 'Dauer',
  },
};

export function resolveUiLanguage(language: string): string {
  return TRANSLATIONS[language] ? language : DEFAULT_LANG;
}

export function t(language: string, key: TranslationKey): string {
  const resolved = resolveUiLanguage(language);
  return TRANSLATIONS[resolved][key] || TRANSLATIONS[DEFAULT_LANG][key];
}

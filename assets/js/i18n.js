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
    thYear: 'Year',
    thDuration: 'Duration',
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
    thYear: 'Année',
    thDuration: 'Durée',
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
    thYear: 'Jahr',
    thDuration: 'Dauer',
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
    thYear: 'Rok',
    thDuration: 'Czas trwania',
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
  },
  nl: {
    headerTitle: 'Index van video-interviews',
    intro: 'Van energie, ecologie, economie tot techno-solutionisme: de meeste projecten van DISNOVATION.ORG beginnen met dialoog en documentatie samen met experts en belanghebbenden. Dit archief bundelt de interviews die werken als de Post Growth Toolkit, ShadowGrowth en Radical Ecological Shifts ondersteunen.',
    showLabel: 'Toon:',
    toggleCollection: 'Collectie',
    toggleTranscript: 'Transcript',
    toggleKeywords: 'Trefwoorden',
    toggleAudioMode: '📻 audiomodus',
    searchPlaceholder: 'Zoek… (concept, persoon, trefwoorden, …)',
    langAuto: '📣 auto',
    audioOnlyMode: 'Alleen-audio-modus',
    thYear: 'Jaar',
    thDuration: 'Duur',
    thCollection: 'Collectie',
    thConcept: 'Concept',
    thAuthor: 'Auteur',
    thTranscript: '📃 Transcript',
    thKeywords: 'Trefwoorden',
    thTitle: 'Titel',
    thPlay: 'Afspelen',
    modalClose: 'Sluiten ✕',
    modalFullscreen: 'Volledig scherm ⛶',
    modalSubtitles: 'Ondertitels',
    audioAutoScroll: 'Auto-scroll',
    audioSpeed: 'Snelheid',
    transcriptTitle: 'Transcript',
    noTranscript: 'Geen transcript beschikbaar.',
    downloadPdf: 'Download .pdf',
    downloadTxt: 'Download .txt'
  },
  es: {
    headerTitle: 'Índice de entrevistas en video',
    intro: 'Desde la energía, la ecología y la economía hasta el tecno-solucionismo, la mayoría de los proyectos de DISNOVATION.ORG comienzan con diálogo y documentación junto a especialistas y partes interesadas. Este archivo reúne las entrevistas que sustentan obras como Post Growth Toolkit, ShadowGrowth y Radical Ecological Shifts.',
    showLabel: 'Mostrar:',
    toggleCollection: 'Colección',
    toggleTranscript: 'Transcripción',
    toggleKeywords: 'Palabras clave',
    toggleAudioMode: '📻 modo audio',
    searchPlaceholder: 'Buscar… (concepto, persona, palabras clave, …)',
    langAuto: '📣 auto',
    audioOnlyMode: 'Modo solo audio',
    thYear: 'Año',
    thDuration: 'Duración',
    thCollection: 'Colección',
    thConcept: 'Concepto',
    thAuthor: 'Autor',
    thTranscript: '📃 Transcripción',
    thKeywords: 'Palabras clave',
    thTitle: 'Título',
    thPlay: 'Reproducir',
    modalClose: 'Cerrar ✕',
    modalFullscreen: 'Pantalla completa ⛶',
    modalSubtitles: 'Subtítulos',
    audioAutoScroll: 'Desplazamiento automático',
    audioSpeed: 'Velocidad',
    transcriptTitle: 'Transcripción',
    noTranscript: 'No hay transcripción disponible.',
    downloadPdf: 'Descargar .pdf',
    downloadTxt: 'Descargar .txt'
  },
  it: {
    headerTitle: 'Indice delle interviste video',
    intro: 'Tra energia, ecologia, economia e tecno-solutionism, la maggior parte dei progetti di DISNOVATION.ORG inizia con dialogo e documentazione insieme a esperti e stakeholder. Questo archivio raccoglie le interviste che sostengono opere come Post Growth Toolkit, ShadowGrowth e Radical Ecological Shifts.',
    showLabel: 'Mostra:',
    toggleCollection: 'Collezione',
    toggleTranscript: 'Trascrizione',
    toggleKeywords: 'Parole chiave',
    toggleAudioMode: '📻 modalità audio',
    searchPlaceholder: 'Cerca… (concetto, persona, parole chiave, …)',
    langAuto: '📣 auto',
    audioOnlyMode: 'Modalità solo audio',
    thYear: 'Anno',
    thDuration: 'Durata',
    thCollection: 'Collezione',
    thConcept: 'Concetto',
    thAuthor: 'Autore',
    thTranscript: '📃 Trascrizione',
    thKeywords: 'Parole chiave',
    thTitle: 'Titolo',
    thPlay: 'Riproduci',
    modalClose: 'Chiudi ✕',
    modalFullscreen: 'Schermo intero ⛶',
    modalSubtitles: 'Sottotitoli',
    audioAutoScroll: 'Scorrimento automatico',
    audioSpeed: 'Velocità',
    transcriptTitle: 'Trascrizione',
    noTranscript: 'Nessuna trascrizione disponibile.',
    downloadPdf: 'Scarica .pdf',
    downloadTxt: 'Scarica .txt'
  },
  pt: {
    headerTitle: 'Índice de entrevistas em vídeo',
    intro: 'Abrangendo energia, ecologia, economia e tecno-solutionismo, a maioria dos projetos da DISNOVATION.ORG começa com diálogo e documentação ao lado de especialistas e partes interessadas. Este arquivo reúne as entrevistas que sustentam obras como Post Growth Toolkit, ShadowGrowth e Radical Ecological Shifts.',
    showLabel: 'Mostrar:',
    toggleCollection: 'Coleção',
    toggleTranscript: 'Transcrição',
    toggleKeywords: 'Palavras-chave',
    toggleAudioMode: '📻 modo áudio',
    searchPlaceholder: 'Pesquisar… (conceito, pessoa, palavras-chave, …)',
    langAuto: '📣 auto',
    audioOnlyMode: 'Modo apenas áudio',
    thYear: 'Ano',
    thDuration: 'Duração',
    thCollection: 'Coleção',
    thConcept: 'Conceito',
    thAuthor: 'Autor',
    thTranscript: '📃 Transcrição',
    thKeywords: 'Palavras-chave',
    thTitle: 'Título',
    thPlay: 'Reproduzir',
    modalClose: 'Fechar ✕',
    modalFullscreen: 'Tela cheia ⛶',
    modalSubtitles: 'Legendas',
    audioAutoScroll: 'Rolagem automática',
    audioSpeed: 'Velocidade',
    transcriptTitle: 'Transcrição',
    noTranscript: 'Nenhuma transcrição disponível.',
    downloadPdf: 'Baixar .pdf',
    downloadTxt: 'Baixar .txt'
  },
  cn: {
    headerTitle: '视频访谈索引',
    intro: '涵盖能源、生态、经济和技术解决主义，DISNOVATION.ORG 的大多数项目都始于与专家和利益相关者的对话与记录。此档案汇集了支撑《后增长工具包》《ShadowGrowth》和《激进生态转向》等作品的访谈。',
    showLabel: '显示：',
    toggleCollection: '合集',
    toggleTranscript: '文字稿',
    toggleKeywords: '关键词',
    toggleAudioMode: '📻 音频模式',
    searchPlaceholder: '搜索…（概念、人物、关键词…）',
    langAuto: '📣 自动',
    audioOnlyMode: '纯音频模式',
    thYear: '年份',
    thDuration: '时长',
    thCollection: '合集',
    thConcept: '概念',
    thAuthor: '作者',
    thTranscript: '📃 文字稿',
    thKeywords: '关键词',
    thTitle: '标题',
    thPlay: '播放',
    modalClose: '关闭 ✕',
    modalFullscreen: '全屏 ⛶',
    modalSubtitles: '字幕',
    audioAutoScroll: '自动滚动',
    audioSpeed: '速度',
    transcriptTitle: '文字稿',
    noTranscript: '暂无可用文字稿。',
    downloadPdf: '下载 .pdf',
    downloadTxt: '下载 .txt'
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

function applyTranslations(lang, scope = document) {
  const resolvedLang = resolveLang(lang);

  document.documentElement.setAttribute('lang', resolvedLang);

  scope.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const translation = getTranslation(resolvedLang, key);
    if (translation !== null && translation !== undefined) {
      el.textContent = translation;
    }
  });

  scope.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    const translation = getTranslation(resolvedLang, key);
    if (translation !== null && translation !== undefined) {
      el.setAttribute('placeholder', translation);
    }
  });

  scope.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.dataset.i18nTitle;
    const translation = getTranslation(resolvedLang, key);
    if (translation !== null && translation !== undefined) {
      el.setAttribute('title', translation);
    }
  });
}

document.addEventListener('i18n:refresh', (event) => {
  const lang = document.documentElement.getAttribute('lang') || DEFAULT_LANG;
  const scope = event?.detail?.scope;
  applyTranslations(lang, scope || document);
});

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

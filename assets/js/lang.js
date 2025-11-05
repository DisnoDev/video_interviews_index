const LANGUAGE_LABELS = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  pl: 'Polski',
  es: 'Español',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  da: 'Dansk',
  sv: 'Svenska',
  no: 'Norsk',
  fi: 'Suomi',
  is: 'Íslenska',
  cs: 'Čeština',
  sk: 'Slovenčina',
  sl: 'Slovenščina',
  hr: 'Hrvatski',
  sr: 'Српски',
  ro: 'Română',
  bg: 'Български',
  ru: 'Русский',
  uk: 'Українська',
  be: 'Беларуская',
  el: 'Ελληνικά',
  tr: 'Türkçe',
  ar: 'العربية',
  he: 'עברית',
  fa: 'فارسی',
  hi: 'हिन्दी',
  bn: 'বাংলা',
  ur: 'اردو',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  vi: 'Tiếng Việt',
  th: 'ไทย',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
  tl: 'Filipino',
  sw: 'Kiswahili',
  af: 'Afrikaans',
  hu: 'Magyar',
  et: 'Eesti',
  lv: 'Latviešu',
  lt: 'Lietuvių',
  ga: 'Gaeilge',
  cy: 'Cymraeg',
  ca: 'Català',
  gl: 'Galego',
  eu: 'Euskara',
  mk: 'Македонски',
  sq: 'Shqip',
  bs: 'Bosanski',
  kk: 'Қазақша',
  uz: 'Oʻzbek',
  az: 'Azərbaycan dili'
};

const LANGUAGE_ALIASES = new Map([
  ['en', ['en', 'eng', 'english', 'anglais', 'anglaise']],
  ['fr', ['fr', 'fra', 'fre', 'french', 'francais', 'français', 'francophone', 'fr']],
  ['de', ['de', 'ger', 'deu', 'german', 'deutsch']],
  ['pl', ['pl', 'pol', 'polish', 'polski', 'polskie']],
  ['es', ['es', 'spa', 'spanish', 'espanol', 'español']],
  ['it', ['it', 'ita', 'italian', 'italiano']],
  ['pt', ['pt', 'por', 'portuguese', 'portugues', 'português']],
  ['nl', ['nl', 'dut', 'nld', 'dutch', 'nederlands']],
  ['da', ['da', 'dan', 'danish', 'dansk']],
  ['sv', ['sv', 'swe', 'swedish', 'svenska']],
  ['no', ['no', 'nor', 'norsk', 'bokmal', 'bokmål', 'nynorsk']],
  ['fi', ['fi', 'fin', 'finnish', 'suomi']],
  ['is', ['is', 'isl', 'icelandic', 'íslenska']],
  ['cs', ['cs', 'cze', 'ces', 'czech', 'čeština', 'cesky']],
  ['sk', ['sk', 'slo', 'slk', 'slovak', 'slovensky']],
  ['sl', ['sl', 'slv', 'slovenian', 'slovene', 'slovenščina']],
  ['hr', ['hr', 'hrv', 'croatian', 'hrvatski']],
  ['sr', ['sr', 'srp', 'serbian', 'српски']],
  ['ro', ['ro', 'ron', 'rum', 'romanian', 'română']],
  ['bg', ['bg', 'bul', 'bulgarian', 'български']],
  ['ru', ['ru', 'rus', 'russian', 'русский']],
  ['uk', ['uk', 'ukr', 'ukrainian', 'українська']],
  ['be', ['be', 'bel', 'belarusian', 'беларуская']],
  ['el', ['el', 'gre', 'ell', 'greek', 'ελληνικά']],
  ['tr', ['tr', 'tur', 'turkish', 'türkçe']],
  ['ar', ['ar', 'ara', 'arabic', 'العربية']],
  ['he', ['he', 'heb', 'hebrew', 'עברית']],
  ['fa', ['fa', 'fas', 'per', 'persian', 'فارسی', 'farsi']],
  ['hi', ['hi', 'hin', 'hindi', 'हिन्दी']],
  ['bn', ['bn', 'ben', 'bengali', 'বাংলা']],
  ['ur', ['ur', 'urd', 'urdu', 'اردو']],
  ['zh', ['zh', 'chi', 'zho', 'chinese', '中文', 'mandarin', 'zhongwen']],
  ['ja', ['ja', 'jpn', 'japanese', '日本語']],
  ['ko', ['ko', 'kor', 'korean', '한국어']],
  ['vi', ['vi', 'vie', 'vietnamese', 'tiếngviệt', 'tiếng việt']],
  ['th', ['th', 'tha', 'thai', 'ไทย']],
  ['id', ['id', 'ind', 'indonesian', 'bahasaindonesia', 'bahasa indonesia']],
  ['ms', ['ms', 'may', 'msa', 'malay', 'bahasamelayu', 'bahasa melayu']],
  ['tl', ['tl', 'fil', 'filipino', 'tagalog']],
  ['sw', ['sw', 'swa', 'swahili', 'kiswahili']],
  ['af', ['af', 'afr', 'afrikaans']],
  ['hu', ['hu', 'hun', 'hungarian', 'magyar']],
  ['et', ['et', 'est', 'estonian', 'eesti']],
  ['lv', ['lv', 'lav', 'latvian', 'latviešu']],
  ['lt', ['lt', 'lit', 'lithuanian', 'lietuvių']],
  ['ga', ['ga', 'gle', 'irish', 'gaeilge']],
  ['cy', ['cy', 'wel', 'cym', 'welsh', 'cymraeg']],
  ['ca', ['ca', 'cat', 'catalan', 'català']],
  ['gl', ['gl', 'glg', 'galician', 'galego']],
  ['eu', ['eu', 'baq', 'eus', 'basque', 'euskara']],
  ['mk', ['mk', 'mac', 'mkd', 'macedonian', 'македонски']],
  ['sq', ['sq', 'alb', 'sqi', 'albanian', 'shqip']],
  ['bs', ['bs', 'bos', 'bosnian', 'bosanski']],
  ['kk', ['kk', 'kaz', 'kazakh', 'қазақша']],
  ['uz', ['uz', 'uzb', 'uzbek', 'oʻzbek', 'ozbek']],
  ['az', ['az', 'aze', 'azerbaijani', 'azerbaijan', 'azərbaycan']]
]);

function normalizeToken(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function normalizeLanguageCode(value) {
  const token = normalizeToken(value);
  if (!token) return '';
  for (const [code, aliases] of LANGUAGE_ALIASES.entries()) {
    if (aliases.includes(token)) return code;
  }
  if (token.length === 2 || token.length === 3) return token;
  return '';
}

export function languageLabel(code, fallback = '') {
  if (!code) return fallback;
  const key = normalizeLanguageCode(code) || code.toLowerCase();
  if (LANGUAGE_LABELS[key]) return LANGUAGE_LABELS[key];
  return fallback || key.toUpperCase();
}

function parseJsonSpec(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((entry) => {
        if (typeof entry === 'string') {
          const code = normalizeLanguageCode(entry);
          return {
            code,
            label: languageLabel(code, entry.trim())
          };
        }
        if (entry && typeof entry === 'object') {
          const code = normalizeLanguageCode(entry.code || entry.lang || entry.language || entry.id || entry.slug);
          const label = entry.label || entry.title || entry.name || languageLabel(code, entry.code || entry.lang || '');
          const url = entry.url || entry.href || entry.src || '';
          return {
            code,
            label: label ? String(label).trim() : languageLabel(code, ''),
            url: url ? String(url).trim() : ''
          };
        }
        return null;
      }).filter(Boolean);
    }
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).map(([key, val]) => {
        const code = normalizeLanguageCode(key);
        if (typeof val === 'string') {
          return {
            code,
            label: languageLabel(code, val.trim())
          };
        }
        if (val && typeof val === 'object') {
          const label = val.label || val.title || val.name || languageLabel(code, key);
          const url = val.url || val.href || val.src || '';
          return {
            code,
            label: label ? String(label).trim() : languageLabel(code, key),
            url: url ? String(url).trim() : ''
          };
        }
        return {
          code,
          label: languageLabel(code, key)
        };
      });
    }
  } catch (_) {
    // ignore
  }
  return null;
}

export function parseSubtitleList(raw) {
  if (!raw) return [];
  if (typeof raw !== 'string') {
    if (Array.isArray(raw)) {
      return raw
        .map((entry) => {
          if (!entry) return null;
          if (typeof entry === 'string') {
            const code = normalizeLanguageCode(entry);
            return {
              code,
              label: languageLabel(code, entry.trim())
            };
          }
          if (entry && typeof entry === 'object') {
            const code = normalizeLanguageCode(entry.code || entry.lang || entry.language || entry.id || entry.slug);
            const label = entry.label || entry.title || entry.name || languageLabel(code, entry.code || entry.lang || '');
            const url = entry.url || entry.href || entry.src || '';
            return {
              code,
              label: label ? String(label).trim() : languageLabel(code, ''),
              url: url ? String(url).trim() : ''
            };
          }
          return null;
        })
        .filter(Boolean);
    }
    return [];
  }

  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const parsed = parseJsonSpec(trimmed);
    if (parsed) return dedupeOptions(parsed);
  }

  const tokens = trimmed
    .split(/\s*[,;|\n]+\s*/)
    .map((token) => token.trim())
    .filter(Boolean);

  const results = tokens.map((token) => {
    let working = token;
    let url = '';
    const urlMatch = working.match(/https?:\/\/[\w\-./?&=%+#]+/i);
    if (urlMatch) {
      url = urlMatch[0];
      working = working.replace(urlMatch[0], '').trim();
    }

    let code = '';
    let label = '';

    if (/[=:]/.test(working)) {
      const parts = working.split(/[=:]/);
      const left = parts.shift();
      const right = parts.join(':');
      const leftCode = normalizeLanguageCode(left);
      const rightCode = normalizeLanguageCode(right);
      if (leftCode && !rightCode) {
        code = leftCode;
        label = right ? right.trim() : '';
      } else if (rightCode && !leftCode) {
        code = rightCode;
        label = left ? String(left).trim() : '';
      } else {
        const leftToken = normalizeToken(left);
        const rightToken = normalizeToken(right);
        if (leftCode) {
          code = leftCode;
          label = right.trim();
        } else if (rightCode) {
          code = rightCode;
          label = left.trim();
        } else if (rightToken) {
          code = rightToken;
          label = left.trim();
        } else if (leftToken) {
          code = leftToken;
          label = right.trim();
        }
      }
    }

    if (!code) {
      const tokenCode = normalizeLanguageCode(working);
      if (tokenCode) {
        code = tokenCode;
      }
    }

    if (!label) {
      const fallback = working.replace(/^[a-z]{2,3}$/i, '').trim();
      label = fallback || languageLabel(code, working);
    }

    if (!code && label) {
      const cleaned = label.replace(/\b(subtitles?|captions?)\b/ig, '').trim();
      const cleanedCode = normalizeLanguageCode(cleaned);
      if (cleanedCode) code = cleanedCode;
    }

    if (!code && label) {
      const rough = normalizeToken(label);
      if (rough) code = rough;
    }

    const finalLabel = label ? label.trim() : languageLabel(code, working);

    return {
      code,
      label: finalLabel || languageLabel(code, working),
      url
    };
  });

  return dedupeOptions(results);
}

function dedupeOptions(options) {
  const seen = new Map();
  const result = [];
  options.forEach((opt) => {
    if (!opt) return;
    const code = opt.code || '';
    let key = code ? normalizeLanguageCode(code) : '';
    if (!key && code) {
      key = normalizeToken(code);
    }
    if (!key && opt.label) {
      key = normalizeLanguageCode(opt.label);
    }
    if (!key && opt.label) {
      key = normalizeToken(opt.label);
    }
    const label = opt.label ? String(opt.label).trim() : languageLabel(key, '');
    const url = opt.url ? String(opt.url).trim() : '';
    const final = {
      code: key,
      label: label || languageLabel(key, ''),
      url
    };
    const dedupeKey = final.code || final.label.toLowerCase();
    if (!seen.has(dedupeKey)) {
      seen.set(dedupeKey, true);
      result.push(final);
    }
  });
  return result;
}

function isSrtLike(text) {
  const sample = String(text || '').trim();
  if (!sample) return false;
  if (sample.includes('-->')) return true;
  if (/^\d+\s*$/m.test(sample) && /\d{2}:\d{2}:\d{2}/.test(sample)) return true;
  return false;
}

export function convertSrtToPlainText(srt) {
  const norm = String(srt || '').replace(/\r\n?/g, '\n').trim();
  if (!norm) return '';
  const chunks = norm.split(/\n{2,}/);
  const lines = [];
  chunks.forEach((chunk) => {
    const parts = chunk.split(/\n+/).map((line) => line.trim());
    const textLines = parts.filter((line) => {
      if (!line) return false;
      if (/^\d+$/.test(line)) return false;
      if (/\d{2}:\d{2}:\d{2}/.test(line)) return false;
      return true;
    });
    if (textLines.length) {
      lines.push(textLines.join(' '));
    }
  });
  return lines.join(' ').replace(/\s+/g, ' ').trim();
}

function normalizeTranscriptText(raw) {
  if (!raw) return '';
  const str = String(raw).trim();
  if (!str) return '';
  if (isSrtLike(str)) {
    return convertSrtToPlainText(str);
  }
  return str.replace(/\r\n?/g, '\n').trim();
}

function parseTranscriptColumns(row) {
  const map = Object.create(null);
  const order = [];
  if (!row || typeof row !== 'object') {
    return { map, order };
  }

  for (const [key, value] of Object.entries(row)) {
    if (!value) continue;
    const trimmedKey = String(key || '').trim();
    if (!trimmedKey) continue;
    const lower = trimmedKey.toLowerCase();
    if (!lower.startsWith('transcript')) continue;

    const clean = normalizeTranscriptText(value);
    if (!clean) continue;
    if (/^https?:\/\//i.test(clean)) continue;

    if (lower === 'transcript') {
      map.default = clean;
      order.push('default');
      continue;
    }

    let suffix = trimmedKey.slice('Transcript'.length);
    suffix = suffix.replace(/^[\s._:-]+/, '').trim();
    if (!suffix) continue;

    const code = normalizeLanguageCode(suffix);
    const token = code || normalizeToken(suffix);
    const keyName = token || suffix.toLowerCase();

    if (!map[keyName]) {
      map[keyName] = clean;
      order.push(keyName);
    }
  }

  return { map, order };
}

function computeLangData(row) {
  const subtitleRaw = row?.Subtitles || row?.Subtitle || row?.['Subtitle languages'] || row?.['Subtitles languages'] || row?.['Captions'] || '';
  const subtitles = parseSubtitleList(subtitleRaw);
  const { map, order } = parseTranscriptColumns(row);

  if (!map.default && row && row.Transcript) {
    const base = normalizeTranscriptText(row.Transcript);
    if (base) {
      map.default = base;
      order.unshift('default');
    }
  }

  if (map) {
    const seenCodes = new Set(subtitles.map((s) => normalizeLanguageCode(s.code) || normalizeLanguageCode(s.label) || ''));
    Object.keys(map).forEach((key) => {
      const code = normalizeLanguageCode(key);
      if (code && !seenCodes.has(code)) {
        subtitles.push({ code, label: languageLabel(code) });
        seenCodes.add(code);
      }
    });
  }

  return {
    subtitles,
    transcripts: map,
    order
  };
}

export function ensureLangData(row) {
  if (!row || typeof row !== 'object') {
    return { subtitles: [], transcripts: {}, order: [] };
  }
  if (!row.__langData) {
    row.__langData = computeLangData(row);
  }
  return row.__langData;
}

export function getSubtitleOptionsForRow(row) {
  const data = ensureLangData(row);
  return data.subtitles || [];
}

export function getTranscriptForRow(row, preferredLang) {
  const data = ensureLangData(row);
  const transcripts = data.transcripts || {};
  const order = data.order || [];
  if (!transcripts || (!transcripts.default && order.length === 0)) {
    const fallback = String(row?.Transcript || '').trim();
    return { text: fallback, lang: fallback ? 'default' : null };
  }

  const pref = normalizeLanguageCode(preferredLang);
  if (pref && transcripts[pref]) {
    return { text: transcripts[pref], lang: pref };
  }

  if (pref) {
    const aliasKey = order.find((key) => normalizeLanguageCode(key) === pref);
    if (aliasKey && transcripts[aliasKey]) {
      return { text: transcripts[aliasKey], lang: pref };
    }
  }

  if (transcripts.default) {
    return { text: transcripts.default, lang: 'default' };
  }

  for (const key of order) {
    if (transcripts[key]) {
      const code = normalizeLanguageCode(key) || key;
      return { text: transcripts[key], lang: code };
    }
  }

  const fallback = String(row?.Transcript || '').trim();
  return { text: fallback, lang: fallback ? 'default' : null };
}

export function hasTranscriptForLanguage(row, lang) {
  const data = ensureLangData(row);
  const transcripts = data.transcripts || {};
  const code = normalizeLanguageCode(lang);
  if (code && transcripts[code]) return true;
  if (code) {
    return Object.keys(transcripts).some((key) => normalizeLanguageCode(key) === code && transcripts[key]);
  }
  return false;
}

export function getAllTranscriptLanguages(row) {
  const data = ensureLangData(row);
  const transcripts = data.transcripts || {};
  const langs = new Set();
  Object.keys(transcripts).forEach((key) => {
    const code = normalizeLanguageCode(key) || key;
    langs.add(code);
  });
  return Array.from(langs);
}

import type { RawSheetRow, SubtitleOption, TranscriptInfo } from '../types';

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  fr: 'Francais',
  de: 'Deutsch',
  pl: 'Polski',
  nl: 'Nederlands',
  es: 'Espanol',
  it: 'Italiano',
  pt: 'Portugues',
  cn: 'Chinese',
  zh: 'Chinese',
  da: 'Dansk',
  sv: 'Svenska',
  no: 'Norsk',
  fi: 'Suomi',
  cs: 'Cestina',
  sk: 'Slovencina',
  sl: 'Slovenscina',
  hr: 'Hrvatski',
  sr: 'Srpski',
  ro: 'Romana',
  bg: 'Bulgarian',
  ru: 'Russkiy',
  uk: 'Ukrainska',
  el: 'Ellinika',
  tr: 'Turkce',
  ar: 'Arabic',
  he: 'Hebrew',
  fa: 'Farsi',
  hi: 'Hindi',
  bn: 'Bangla',
  ur: 'Urdu',
  ja: 'Japanese',
  ko: 'Korean',
};

const LANGUAGE_ALIASES = new Map<string, string[]>([
  ['en', ['en', 'eng', 'english', 'anglais']],
  ['fr', ['fr', 'fra', 'fre', 'french', 'francais', 'francophone']],
  ['de', ['de', 'ger', 'deu', 'german', 'deutsch']],
  ['pl', ['pl', 'pol', 'polish', 'polski']],
  ['nl', ['nl', 'dut', 'nld', 'dutch', 'nederlands']],
  ['es', ['es', 'spa', 'spanish', 'espanol']],
  ['it', ['it', 'ita', 'italian', 'italiano']],
  ['pt', ['pt', 'por', 'portuguese', 'portugues']],
  ['cn', ['cn']],
  ['zh', ['zh', 'chi', 'zho', 'chinese', 'mandarin', 'zhongwen']],
  ['da', ['da', 'dan', 'danish', 'dansk']],
  ['sv', ['sv', 'swe', 'swedish', 'svenska']],
  ['no', ['no', 'nor', 'norsk', 'bokmal', 'nynorsk']],
  ['fi', ['fi', 'fin', 'finnish', 'suomi']],
  ['cs', ['cs', 'cze', 'ces', 'czech', 'cestina']],
  ['sk', ['sk', 'slo', 'slk', 'slovak', 'slovensky']],
  ['sl', ['sl', 'slv', 'slovenian', 'slovene', 'slovenscina']],
  ['hr', ['hr', 'hrv', 'croatian', 'hrvatski']],
  ['sr', ['sr', 'srp', 'serbian', 'srpski']],
  ['ro', ['ro', 'ron', 'rum', 'romanian', 'romana']],
  ['bg', ['bg', 'bul', 'bulgarian']],
  ['ru', ['ru', 'rus', 'russian']],
  ['uk', ['uk', 'ukr', 'ukrainian']],
  ['el', ['el', 'gre', 'ell', 'greek', 'ellinika']],
  ['tr', ['tr', 'tur', 'turkish', 'turkce']],
  ['ar', ['ar', 'ara', 'arabic']],
  ['he', ['he', 'heb', 'hebrew']],
  ['fa', ['fa', 'fas', 'per', 'persian', 'farsi']],
  ['hi', ['hi', 'hin', 'hindi']],
  ['bn', ['bn', 'ben', 'bengali', 'bangla']],
  ['ur', ['ur', 'urd', 'urdu']],
  ['ja', ['ja', 'jpn', 'japanese']],
  ['ko', ['ko', 'kor', 'korean']],
]);

function normalizeToken(value: string): string {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function normalizeLanguageCode(value: string): string {
  const token = normalizeToken(value);
  if (!token) {
    return '';
  }

  for (const [code, aliases] of LANGUAGE_ALIASES.entries()) {
    if (aliases.includes(token)) {
      return code;
    }
  }

  if (token.length === 2 || token.length === 3) {
    return token;
  }

  return '';
}

export function languageLabel(code: string, fallback = ''): string {
  const normalized = normalizeLanguageCode(code) || String(code || '').toLowerCase();
  return LANGUAGE_LABELS[normalized] || fallback || normalized.toUpperCase();
}

function dedupeOptions(options: SubtitleOption[]): SubtitleOption[] {
  const seen = new Set<string>();
  const result: SubtitleOption[] = [];

  for (const option of options) {
    const key = normalizeLanguageCode(option.code) || normalizeToken(option.label);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push({
      code: key,
      label: option.label || languageLabel(key),
      url: option.url,
    });
  }

  return result;
}

function parseJsonSpec(raw: string): SubtitleOption[] | null {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => {
          if (typeof entry === 'string') {
            const code = normalizeLanguageCode(entry);
            return { code, label: languageLabel(code, entry.trim()) };
          }
          if (entry && typeof entry === 'object') {
            const code = normalizeLanguageCode(
              String(entry.code || entry.lang || entry.language || entry.id || entry.slug || ''),
            );
            const label = String(entry.label || entry.title || entry.name || languageLabel(code, code)).trim();
            const url = String(entry.url || entry.href || entry.src || '').trim();
            return { code, label, url: url || undefined };
          }
          return null;
        })
        .filter(Boolean) as SubtitleOption[];
    }

    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).map(([key, value]) => {
        const code = normalizeLanguageCode(key);
        if (typeof value === 'string') {
          return { code, label: value.trim() || languageLabel(code, key) };
        }
        const objectValue = value as Record<string, string>;
        const label = String(objectValue.label || objectValue.title || objectValue.name || languageLabel(code, key)).trim();
        const url = String(objectValue.url || objectValue.href || objectValue.src || '').trim();
        return { code, label, url: url || undefined };
      });
    }
  } catch {
    return null;
  }

  return null;
}

export function parseSubtitleList(raw: string): SubtitleOption[] {
  if (!raw) {
    return [];
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const parsed = parseJsonSpec(trimmed);
    if (parsed) {
      return dedupeOptions(parsed);
    }
  }

  const options = trimmed
    .split(/\s*[,;|\n]+\s*/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
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
        const [left, ...rest] = working.split(/[=:]/);
        const right = rest.join(':');
        const leftCode = normalizeLanguageCode(left);
        const rightCode = normalizeLanguageCode(right);

        if (leftCode && !rightCode) {
          code = leftCode;
          label = right.trim();
        } else if (rightCode && !leftCode) {
          code = rightCode;
          label = left.trim();
        }
      }

      if (!code) {
        code = normalizeLanguageCode(working);
      }

      if (!label) {
        label = languageLabel(code, working);
      }

      return {
        code,
        label,
        url: url || undefined,
      };
    });

  return dedupeOptions(options);
}

function isSrtLike(text: string): boolean {
  const sample = String(text || '').trim();
  return !!sample && (sample.includes('-->') || (/^\d+\s*$/m.test(sample) && /\d{2}:\d{2}:\d{2}/.test(sample)));
}

export function convertSrtToPlainText(srt: string): string {
  const normalized = String(srt || '').replace(/\r\n?/g, '\n').trim();
  if (!normalized) {
    return '';
  }

  const chunks = normalized.split(/\n\n+/);
  const lines: string[] = [];

  for (const chunk of chunks) {
    const textLines = chunk
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line && !/^\d+$/.test(line) && !/\d{2}:\d{2}:\d{2}/.test(line));

    if (textLines.length) {
      lines.push(textLines.join(' '));
    }
  }

  return lines.join(' ').replace(/\s+/g, ' ').trim();
}

function normalizeTranscriptText(raw: string): string {
  const value = String(raw || '').trim();
  if (!value) {
    return '';
  }
  if (isSrtLike(value)) {
    return convertSrtToPlainText(value);
  }
  return value.replace(/\r\n?/g, '\n').trim();
}

export function extractTranslations(row: RawSheetRow, prefix: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    if (!value) {
      continue;
    }
    if (!key.startsWith(`${prefix}_`)) {
      continue;
    }
    const code = normalizeLanguageCode(key.slice(prefix.length + 1));
    if (!code) {
      continue;
    }
    const trimmed = String(value).trim();
    if (trimmed) {
      result[code] = trimmed;
    }
  }
  return result;
}

export function extractKeywordTranslations(row: RawSheetRow): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(row)) {
    if (!value || !key.startsWith('Keywords_')) {
      continue;
    }
    const code = normalizeLanguageCode(key.slice('Keywords_'.length));
    if (!code) {
      continue;
    }
    result[code] = String(value)
      .split(/[,;]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return result;
}

export function extractTranscripts(row: RawSheetRow): { transcripts: Record<string, string>; order: string[] } {
  const transcripts: Record<string, string> = {};
  const order: string[] = [];

  for (const [key, value] of Object.entries(row)) {
    if (!value) {
      continue;
    }

    const trimmedKey = String(key).trim();
    if (!trimmedKey.toLowerCase().startsWith('transcript')) {
      continue;
    }

    const text = normalizeTranscriptText(value);
    if (!text || /^https?:\/\//i.test(text)) {
      continue;
    }

    if (trimmedKey.toLowerCase() === 'transcript') {
      transcripts.default = text;
      order.push('default');
      continue;
    }

    const suffix = trimmedKey.slice('Transcript'.length).replace(/^[\s._:-]+/, '').trim();
    const code = normalizeLanguageCode(suffix) || normalizeToken(suffix);
    if (!code || transcripts[code]) {
      continue;
    }
    transcripts[code] = text;
    order.push(code);
  }

  return { transcripts, order };
}

export function transcriptInfoFromRecordLike(
  transcripts: Record<string, string>,
  order: string[],
  preferredLanguage: string,
): TranscriptInfo {
  const preferred = normalizeLanguageCode(preferredLanguage);
  if (preferred && transcripts[preferred]) {
    return { text: transcripts[preferred], lang: preferred, label: languageLabel(preferred) };
  }

  if (transcripts.default) {
    return { text: transcripts.default, lang: 'default', label: 'Default' };
  }

  for (const code of order) {
    if (transcripts[code]) {
      const normalized = normalizeLanguageCode(code) || code;
      return { text: transcripts[code], lang: normalized, label: languageLabel(normalized, normalized) };
    }
  }

  return { text: '', lang: null, label: '' };
}

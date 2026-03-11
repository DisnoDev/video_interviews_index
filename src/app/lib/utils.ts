import type { InterviewRecord } from '../types';

export function csvToRows(csv: string): string[][] {
  const normalized = csv.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let index = 0;
  let field = '';
  let inQuotes = false;

  while (index < normalized.length) {
    const char = normalized[index];

    if (inQuotes) {
      if (char === '"') {
        const next = normalized[index + 1];
        if (next === '"') {
          field += '"';
          index += 2;
          continue;
        }
        inQuotes = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      index += 1;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      index += 1;
      continue;
    }

    if (char === '\r') {
      index += 1;
      continue;
    }

    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      index += 1;
      continue;
    }

    field += char;
    index += 1;
  }

  row.push(field);
  if (row.length > 1 || row[0] !== '') {
    rows.push(row);
  }

  return rows;
}

export function durationFmt(seconds: number | string): string {
  const numeric = Number(seconds || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '';
  }

  const hours = Math.floor(numeric / 3600);
  const minutes = Math.floor((numeric % 3600) / 60);
  const remainder = Math.floor(numeric % 60);

  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function extractVimeoId(url: string): string {
  const match = String(url || '').match(/(?:player\.)?vimeo\.com\/(?:video\/|manage\/videos\/)?(\d{6,})(?:\b|\/|\?|#)/);
  return match?.[1] ?? '';
}

export function extractVimeoHash(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('h') || '';
  } catch {
    return '';
  }
}

export function vimeoThumbUrl(id: string): string {
  return id ? `https://vumbnail.com/${id}.jpg` : '';
}

export function computeLateStart(value: string): number {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return 0;
  }
  if (/^(1|true|yes)$/i.test(normalized)) {
    return 4;
  }
  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

export function normalizeText(value: string): string {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  try {
    return raw
      .normalize('NFD')
      .replace(/\p{M}+/gu, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return raw.toLowerCase().replace(/\s+/g, ' ').trim();
  }
}

export function slugify(value: string): string {
  const normalized = normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'video';
}

export function normalizeCollectionToken(value: string): string {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function buildSearchIndex(values: Array<string | string[]>): string {
  return normalizeText(
    values
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .filter(Boolean)
      .join(' '),
  );
}

export function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function dedupeSlug(records: InterviewRecord[], slug: string): string {
  if (!records.some((record) => record.slug === slug)) {
    return slug;
  }

  let index = 2;
  let candidate = `${slug}-${index}`;
  while (records.some((record) => record.slug === candidate)) {
    index += 1;
    candidate = `${slug}-${index}`;
  }
  return candidate;
}

export function formatTranscriptParagraphs(text: string): string[] {
  const normalized = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!normalized) {
    return [];
  }

  const parts = normalized.includes('\n\n')
    ? normalized.split(/\n\n+/)
    : normalized.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);

  return parts.map((part) => part.replace(/\n+/g, ' ').trim()).filter(Boolean);
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

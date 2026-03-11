import { COLLECTION_SLUG_OVERRIDES } from './config';
import { normalizeCollectionToken } from './utils';

export function getCollectionOptions(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function resolveCollectionLabelFromToken(token: string, options: string[]): string | null {
  const normalized = normalizeCollectionToken(token);
  if (!normalized || normalized === 'all') {
    return '';
  }

  const aliasMap = buildCollectionAliasMap(options);
  return aliasMap.get(normalized) ?? null;
}

export function readCollectionTokenFromSearch(search: string): string {
  const raw = String(search || '').replace(/^\?/, '');
  if (!raw) {
    return '';
  }
  const first = raw.split('&')[0] || '';
  const [key, value = ''] = first.split('=');
  return decodeURIComponent(value || key || '').trim();
}

export function buildCollectionSearch(label: string): string {
  if (!label) {
    return '';
  }
  const slug = COLLECTION_SLUG_OVERRIDES.get(label) || label.replace(/[^A-Za-z0-9]/g, '');
  return slug ? `?${slug}` : '';
}

function buildCollectionAliasMap(options: string[]): Map<string, string> {
  const aliasMap = new Map<string, string>();

  for (const label of options) {
    const normalized = normalizeCollectionToken(label);
    if (normalized) {
      aliasMap.set(normalized, label);
    }

    const compact = normalizeCollectionToken(label.replace(/[^A-Za-z0-9]/g, ''));
    if (compact && !aliasMap.has(compact)) {
      aliasMap.set(compact, label);
    }
  }

  const postGrowth = options.find((option) => normalizeCollectionToken(option) === normalizeCollectionToken('Post Growth Toolkit'));
  if (postGrowth) {
    aliasMap.set('pgtk', postGrowth);
  }

  const radical = options.find((option) => normalizeCollectionToken(option) === normalizeCollectionToken('Radical Ecological Shifts'));
  if (radical) {
    aliasMap.set('res', radical);
  }

  return aliasMap;
}

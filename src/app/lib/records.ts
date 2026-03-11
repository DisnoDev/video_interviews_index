import { CSV_URL, GID, SHEET_ID, USE_CSV_PUBLISH } from './config';
import {
  buildSearchIndex,
  computeLateStart,
  csvToRows,
  dedupeSlug,
  durationFmt,
  extractVimeoHash,
  extractVimeoId,
  normalizeText,
  slugify,
  uniqueStrings,
  vimeoThumbUrl,
} from './utils';
import {
  extractKeywordTranslations,
  extractSubtitlesFromRawRow,
  extractTranscripts,
  extractTranslations,
} from './recordLanguageHelpers';
import type { InterviewRecord, RawSheetRow } from '../types';

async function fetchWithRetry(url: string, maxRetries = 2): Promise<Response> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => window.setTimeout(resolve, 300 * (2 ** attempt)));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Could not fetch sheet');
}

export async function fetchSheetCsv(): Promise<string> {
  if (USE_CSV_PUBLISH && CSV_URL) {
    const response = await fetchWithRetry(CSV_URL);
    return response.text();
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv${GID ? `&gid=${GID}` : ''}`;
  const response = await fetchWithRetry(url);
  return response.text();
}

export function rowsToRecords(rows: string[][]): RawSheetRow[] {
  const headers = rows[0]?.map((header) => header.trim()) || [];
  return rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, String(row[index] || '').trim()])));
}

export function normalizeRecords(rawRows: RawSheetRow[]): InterviewRecord[] {
  const records: InterviewRecord[] = [];

  for (const row of rawRows) {
    const link = row.Link || '';
    const vimeoId = extractVimeoId(link);
    if (!vimeoId) {
      continue;
    }

    const notion = String(row.Notion || '').trim();
    const title = String(row.Title || '').trim();
    const author = String(row['Interviewee name'] || '').trim();
    const collection = String(row.Collection || '').trim();
    const keywords = String(row.Keywords || '')
      .split(/[,;]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    const notionTranslations = extractTranslations(row, 'Notion');
    const titleTranslations = extractTranslations(row, 'Title');
    const authorTranslations = extractTranslations(row, 'Interviewee name');
    const collectionTranslations = extractTranslations(row, 'Collection');
    const keywordsTranslations = extractKeywordTranslations(row);
    const subtitles = extractSubtitlesFromRawRow(row);
    const { transcripts, order } = extractTranscripts(row);

    const durationSeconds = Number(row['Duration (s)'] || 0);
    const slugBase = slugify([title, notion, author].filter(Boolean).join(' '));

    const record: InterviewRecord = {
      id: vimeoId,
      slug: dedupeSlug(records, slugBase),
      link,
      vimeoId,
      vimeoHash: extractVimeoHash(link),
      thumbnail: vimeoThumbUrl(vimeoId),
      startAt: computeLateStart(row.Late_4s || ''),
      notion,
      notionTranslations,
      title,
      titleTranslations,
      author,
      authorTranslations,
      collection,
      collectionTranslations,
      year: String(row.Year || '').trim(),
      durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
      durationLabel: durationFmt(durationSeconds),
      keywords,
      keywordsTranslations,
      subtitles,
      transcripts,
      transcriptOrder: order,
      availableTranscriptLanguages: uniqueStrings(Object.keys(transcripts).map((code) => code === 'default' ? '' : code)),
      raw: row,
      searchIndex: '',
    };

    record.searchIndex = buildSearchIndex([
      notion,
      title,
      author,
      collection,
      record.year,
      keywords,
      ...Object.values(notionTranslations),
      ...Object.values(titleTranslations),
      ...Object.values(authorTranslations),
      ...Object.values(collectionTranslations),
      ...Object.values(keywordsTranslations),
      ...Object.values(transcripts),
      ...record.subtitles.map((subtitle) => subtitle.label),
      ...record.subtitles.map((subtitle) => subtitle.code),
    ]);

    records.push(record);
  }

  return records;
}

export async function loadInterviewRecords(): Promise<InterviewRecord[]> {
  const csv = await fetchSheetCsv();
  const rows = csvToRows(csv);
  const rawRows = rowsToRecords(rows);
  return normalizeRecords(rawRows.filter((row) => String(row.Link || '').startsWith('http')));
}

export function getPreferredConcept(record: InterviewRecord, language: string): string {
  const normalized = normalizeText(language).replace(/[^a-z0-9]+/g, '');
  return record.notionTranslations[normalized] || record.notion;
}

export function getPreferredTitle(record: InterviewRecord, language: string): string {
  const normalized = normalizeText(language).replace(/[^a-z0-9]+/g, '');
  return record.titleTranslations[normalized] || record.title;
}

export function getPreferredAuthor(record: InterviewRecord, language: string): string {
  const normalized = normalizeText(language).replace(/[^a-z0-9]+/g, '');
  return record.authorTranslations[normalized] || record.author;
}

export function getPreferredCollection(record: InterviewRecord, language: string): string {
  const normalized = normalizeText(language).replace(/[^a-z0-9]+/g, '');
  return record.collectionTranslations[normalized] || record.collection;
}

export function getPreferredKeywords(record: InterviewRecord, language: string): string[] {
  const normalized = normalizeText(language).replace(/[^a-z0-9]+/g, '');
  return record.keywordsTranslations[normalized] || record.keywords;
}

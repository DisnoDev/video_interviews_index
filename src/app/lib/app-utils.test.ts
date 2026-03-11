import { describe, expect, it } from 'vitest';
import { buildCollectionSearch, readCollectionTokenFromSearch, resolveCollectionLabelFromToken } from './collections';
import { filterRecords } from './filtering';
import { normalizeRecords } from './records';
import { extractSubtitlesFromRawRow } from './recordLanguageHelpers';
import { transcriptInfoFromRecordLike } from './languages';
import { computeLateStart, csvToRows, extractVimeoId } from './utils';
import type { RawSheetRow } from '../types';

describe('sheet normalization', () => {
  it('parses CSV rows and normalizes records', () => {
    const rows = csvToRows('Link,Notion,Interviewee name,Collection,Duration (s)\nhttps://vimeo.com/123456789,Degrowth,Alice,Post Growth Toolkit,123');
    const rawRows = rows.slice(1).map((row) => ({
      Link: row[0],
      Notion: row[1],
      'Interviewee name': row[2],
      Collection: row[3],
      'Duration (s)': row[4],
    })) as RawSheetRow[];

    const records = normalizeRecords(rawRows);
    expect(records).toHaveLength(1);
    expect(records[0].vimeoId).toBe('123456789');
    expect(records[0].durationLabel).toBe('2:03');
  });

  it('parses subtitle formats and transcript language fallback', () => {
    const row: RawSheetRow = {
      Link: 'https://vimeo.com/123456789',
      Notion: 'Degrowth',
      'Interviewee name': 'Alice',
      Collection: 'Post Growth Toolkit',
      Subtitles: '["en", {"code":"fr", "label":"Francais"}]',
      Transcript: 'Default transcript',
      Transcript_fr: 'Transcription francaise',
    };

    const subtitles = extractSubtitlesFromRawRow(row);
    expect(subtitles.map((subtitle) => subtitle.code)).toEqual(['en', 'fr']);

    const record = normalizeRecords([row])[0];
    expect(transcriptInfoFromRecordLike(record.transcripts, record.transcriptOrder, 'fr').text).toBe('Transcription francaise');
    expect(transcriptInfoFromRecordLike(record.transcripts, record.transcriptOrder, 'de').text).toBe('Default transcript');
  });

  it('handles search normalization, collection aliases, and Vimeo helpers', () => {
    const row: RawSheetRow = {
      Link: 'https://player.vimeo.com/video/123456789?h=abc123',
      Notion: 'Decroissance',
      'Interviewee name': 'Alice',
      Collection: 'Post Growth Toolkit',
      Keywords: 'ecologie',
      Transcript: 'text',
    };

    const record = normalizeRecords([row])[0];
    expect(filterRecords([record], { query: 'decroissance ecol', collection: '', keyword: null, author: null })).toHaveLength(1);
    expect(extractVimeoId(row.Link)).toBe('123456789');
    expect(computeLateStart('yes')).toBe(4);
    expect(readCollectionTokenFromSearch('?PGTK')).toBe('PGTK');
    expect(resolveCollectionLabelFromToken('PGTK', ['Post Growth Toolkit', 'Radical Ecological Shifts'])).toBe('Post Growth Toolkit');
    expect(buildCollectionSearch('Radical Ecological Shifts')).toBe('?RES');
  });
});

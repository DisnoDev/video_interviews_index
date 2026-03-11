import type { RawSheetRow, SubtitleOption } from '../types';
import { extractKeywordTranslations, extractTranscripts, extractTranslations, parseSubtitleList } from './languages';

export { extractKeywordTranslations, extractTranscripts, extractTranslations };

export function extractSubtitlesFromRawRow(row: RawSheetRow): SubtitleOption[] {
  return parseSubtitleList(
    row.Subtitles
      || row.Subtitle
      || row['Subtitle languages']
      || row['Subtitles languages']
      || row.Captions
      || '',
  );
}

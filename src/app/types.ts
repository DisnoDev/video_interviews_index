export type RawSheetRow = Record<string, string>;

export interface SubtitleOption {
  code: string;
  label: string;
  url?: string;
}

export interface TranscriptInfo {
  text: string;
  lang: string | null;
  label: string;
}

export type CollectionFilterValue = string;

export type SortField = 'concept' | 'author' | 'year' | 'duration' | 'collection' | 'title';
export type SortDirection = 'asc' | 'desc';
export type LayoutMode = 'side' | 'stacked';

export interface InterviewRecord {
  id: string;
  slug: string;
  link: string;
  vimeoId: string;
  vimeoHash: string;
  thumbnail: string;
  startAt: number;
  notion: string;
  notionTranslations: Record<string, string>;
  title: string;
  titleTranslations: Record<string, string>;
  author: string;
  authorTranslations: Record<string, string>;
  collection: string;
  collectionTranslations: Record<string, string>;
  year: string;
  durationSeconds: number;
  durationLabel: string;
  keywords: string[];
  keywordsTranslations: Record<string, string[]>;
  subtitles: SubtitleOption[];
  transcripts: Record<string, string>;
  transcriptOrder: string[];
  availableTranscriptLanguages: string[];
  raw: RawSheetRow;
  searchIndex: string;
}

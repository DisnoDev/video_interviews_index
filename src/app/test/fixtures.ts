import { normalizeRecords } from '../lib/records';
import type { InterviewRecord, RawSheetRow } from '../types';

export function makeSampleRecords(): InterviewRecord[] {
  const rows: RawSheetRow[] = [
    {
      Link: 'https://vimeo.com/123456789',
      Notion: 'Degrowth',
      Notion_fr: 'Decroissance',
      Title: 'A Different Economy',
      'Interviewee name': 'Alice Martin',
      Collection: 'Post Growth Toolkit',
      Year: '2024',
      'Duration (s)': '305',
      Keywords: 'economy, ecology',
      Subtitles: 'en, fr',
      Transcript: 'Hello world. This is the default transcript.',
      Transcript_fr: 'Bonjour le monde. Ceci est la transcription francaise.',
      Late_4s: '4',
    },
    {
      Link: 'https://vimeo.com/987654321',
      Notion: 'Repair',
      Title: 'Broken World Thinking',
      'Interviewee name': 'Bob Stone',
      Collection: 'Radical Ecological Shifts',
      Year: '2023',
      'Duration (s)': '240',
      Keywords: 'maintenance, systems',
      Subtitles: 'en',
      Transcript: 'Repair and maintenance matter.',
      Late_4s: '0',
    },
  ];

  return normalizeRecords(rows);
}

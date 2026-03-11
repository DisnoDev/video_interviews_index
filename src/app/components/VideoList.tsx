import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import type { InterviewRecord, SortDirection, SortField } from '../types';
import { getPreferredAuthor, getPreferredCollection, getPreferredConcept, getPreferredKeywords, getPreferredTitle } from '../lib/records';

interface VideoListProps {
  records: InterviewRecord[];
  preferredLanguage: string;
  selectedRecordId?: string;
  selectedKeyword: string | null;
  selectedAuthor: string | null;
  showAuthor: boolean;
  showCollection: boolean;
  showKeywords: boolean;
  showTitleDetail: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onSelectVideo: (record: InterviewRecord) => void;
  onKeywordClick: (keyword: string) => void;
  onAuthorClick: (author: string) => void;
}

export function VideoList({
  records,
  preferredLanguage,
  selectedRecordId,
  selectedKeyword,
  selectedAuthor,
  showAuthor,
  showCollection,
  showKeywords,
  showTitleDetail,
  sortField,
  sortDirection,
  onSort,
  onSelectVideo,
  onKeywordClick,
  onAuthorClick,
}: VideoListProps) {
  const [hoveredRecord, setHoveredRecord] = useState<InterviewRecord | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const sortIcon = (field: SortField) => {
    if (sortField !== field) {
      return null;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <>
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4 border-b border-black/10 pb-3 text-xs uppercase tracking-[0.24em] text-black/50 dark:border-white/10 dark:text-white/50">
        <button type="button" onClick={() => onSort('concept')} className="flex items-center gap-2 text-left transition hover:text-black dark:hover:text-white">
          Concept {sortIcon('concept')}
        </button>
        <button type="button" onClick={() => onSort('author')} className={`flex items-center gap-2 text-left transition hover:text-black dark:hover:text-white ${showAuthor ? '' : 'opacity-30'}`}>
          Author {sortIcon('author')}
        </button>
        <button type="button" onClick={() => onSort('collection')} className={`flex items-center gap-2 text-left transition hover:text-black dark:hover:text-white ${showCollection ? '' : 'opacity-30'}`}>
          Collection {sortIcon('collection')}
        </button>
        <button type="button" onClick={() => onSort('duration')} className={`flex items-center gap-2 text-left transition hover:text-black dark:hover:text-white ${showKeywords ? '' : 'opacity-30'}`}>
          Keywords {sortIcon('duration')}
        </button>
      </div>

      <div className="divide-y divide-black/8 dark:divide-white/8">
        {records.map((record) => {
          const concept = getPreferredConcept(record, preferredLanguage);
          const title = getPreferredTitle(record, preferredLanguage);
          const author = getPreferredAuthor(record, preferredLanguage);
          const collection = getPreferredCollection(record, preferredLanguage);
          const keywords = getPreferredKeywords(record, preferredLanguage);
          const isSelected = selectedRecordId === record.id;
          const isAuthorSelected = selectedAuthor === record.author;

          return (
            <article key={record.slug} className={`grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4 py-4 ${isSelected ? 'bg-black/[0.035] dark:bg-white/[0.04]' : ''}`}>
              <button
                type="button"
                onMouseMove={(event) => {
                  setHoveredRecord(record);
                  setHoverPosition({ x: event.clientX + 24, y: event.clientY + 24 });
                }}
                onMouseLeave={() => setHoveredRecord(null)}
                onClick={() => onSelectVideo(record)}
                className="min-w-0 text-left"
              >
                <div className={`text-xl leading-tight text-black transition hover:opacity-70 dark:text-white ${isSelected ? 'font-semibold' : 'font-normal'}`}>
                  {concept}
                </div>
                {showTitleDetail && title && title !== concept && (
                  <div className="mt-1 text-sm text-black/55 dark:text-white/55">{title}</div>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-black/35 dark:text-white/35">
                  {record.year ? <span>{record.year}</span> : null}
                  {record.durationLabel ? <span>{record.durationLabel}</span> : null}
                </div>
              </button>

              <div className={`min-w-0 ${showAuthor ? '' : 'opacity-25'}`}>
                {showAuthor ? (
                  <button
                    type="button"
                    onClick={() => onAuthorClick(record.author)}
                    className={`text-left text-base leading-snug text-black transition hover:opacity-70 dark:text-white ${isAuthorSelected ? 'font-semibold' : ''}`}
                  >
                    {author}
                  </button>
                ) : (
                  <span className="text-sm text-black/30 dark:text-white/30">Hidden</span>
                )}
              </div>

              <div className={`min-w-0 text-sm leading-snug text-black/65 dark:text-white/65 ${showCollection ? '' : 'opacity-25'}`}>
                {showCollection ? collection : 'Hidden'}
              </div>

              <div className={`min-w-0 ${showKeywords ? '' : 'opacity-25'}`}>
                {showKeywords ? (
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword) => (
                      <button
                        key={`${record.id}-${keyword}`}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onKeywordClick(keyword);
                        }}
                        className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] transition ${selectedKeyword === keyword ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black' : 'border-black/15 text-black/60 hover:border-black/40 hover:text-black dark:border-white/15 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white'}`}
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-black/30 dark:text-white/30">Hidden</span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {hoveredRecord ? (
        <div className="pointer-events-none fixed z-50 hidden overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-black md:block" style={{ left: hoverPosition.x, top: hoverPosition.y, width: '28rem' }}>
          <img src={hoveredRecord.thumbnail} alt={getPreferredConcept(hoveredRecord, preferredLanguage)} className="aspect-video w-full object-cover" />
          <div className="px-4 py-3 text-sm text-black/75 dark:text-white/75">
            <div className="font-medium text-black dark:text-white">{getPreferredConcept(hoveredRecord, preferredLanguage)}</div>
            <div>{getPreferredAuthor(hoveredRecord, preferredLanguage)}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}

import { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { InterviewRecord, SortDirection, SortField } from '../types';
import { getPreferredAuthor, getPreferredCollection, getPreferredConcept, getPreferredKeywords } from '../lib/records';

interface VideoListProps {
  records: InterviewRecord[];
  preferredLanguage: string;
  onSelectVideo: (record: InterviewRecord) => void;
  selectedRecordId?: string;
  showKeywords: boolean;
  onKeywordClick: (keyword: string) => void;
  selectedKeyword: string | null;
  onSort: (column: SortField) => void;
  sortBy: SortField;
  sortOrder: SortDirection;
  showTitle: boolean;
  showAuthor: boolean;
  showTags: boolean;
  showCategory: boolean;
  onAuthorClick: (author: string) => void;
  selectedAuthor: string | null;
}

export function VideoList({
  records,
  preferredLanguage,
  onSelectVideo,
  selectedRecordId,
  showKeywords,
  onKeywordClick,
  selectedKeyword,
  onSort,
  sortBy,
  sortOrder,
  showTitle,
  showAuthor,
  showTags,
  showCategory,
  onAuthorClick,
  selectedAuthor,
}: VideoListProps) {
  const [hoveredRecord, setHoveredRecord] = useState<InterviewRecord | null>(null);
  const [thumbnailPosition, setThumbnailPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent, record: InterviewRecord) => {
    setHoveredRecord(record);
    setThumbnailPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredRecord(null);
  };

  const getSortIcon = (column: SortField) => {
    if (sortBy !== column) {
      return null;
    }
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const visibleColumns = [showTitle, showAuthor, showCategory, showTags].filter(Boolean).length;

  const getColumnWidth = (isShown: boolean) => {
    if (!isShown) return '';
    if (visibleColumns === 1) return 'w-full';
    if (visibleColumns === 2) return 'w-1/2';
    if (visibleColumns === 3) return 'w-1/3';
    return 'w-1/4';
  };

  const titleWidth = getColumnWidth(showTitle);
  const authorWidth = getColumnWidth(showAuthor);
  const categoryWidth = getColumnWidth(showCategory);
  const tagsWidth = getColumnWidth(showTags);

  return (
    <>
      {visibleColumns > 0 && (
        <div className="flex pb-2 mb-3 border-b border-neutral-300 dark:border-neutral-700 gap-4">
          {showTitle && (
            <button
              onClick={() => onSort('concept')}
              className={`flex items-center gap-2 ${titleWidth} pr-4 text-sm text-black dark:text-white hover:opacity-60 transition-opacity`}
              type="button"
            >
              <span className="uppercase tracking-wide">Title</span>
              {getSortIcon('concept')}
            </button>
          )}
          {showAuthor && (
            <button
              onClick={() => onSort('author')}
              className={`flex items-center gap-2 ${authorWidth} pr-4 text-sm text-black dark:text-white hover:opacity-60 transition-opacity`}
              type="button"
            >
              <span className="uppercase tracking-wide">Author</span>
              {getSortIcon('author')}
            </button>
          )}
          {showCategory && (
            <div className={`flex items-center gap-2 ${categoryWidth} pr-4 text-sm text-black dark:text-white`}>
              <span className="uppercase tracking-wide">Category</span>
            </div>
          )}
          {showTags && (
            <div className={`flex items-center gap-2 ${tagsWidth} text-sm text-black dark:text-white`}>
              <span className="uppercase tracking-wide">Tags</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-0">
        {records.map((record) => {
          const title = getPreferredConcept(record, preferredLanguage);
          const author = getPreferredAuthor(record, preferredLanguage);
          const category = getPreferredCollection(record, preferredLanguage);
          const keywords = getPreferredKeywords(record, preferredLanguage);

          return (
            <div
              key={record.id}
              className={`py-3 transition-opacity overflow-hidden ${selectedRecordId === record.id ? 'opacity-100' : 'opacity-100'}`}
            >
              <div className="flex gap-4 text-xl md:text-2xl leading-tight text-black dark:text-white">
                {showTitle && (
                  <span
                    onMouseMove={(event) => handleMouseMove(event, record)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => onSelectVideo(record)}
                    className={`${titleWidth} pr-4 cursor-pointer hover:opacity-50 transition-opacity ${selectedRecordId === record.id ? 'font-bold' : 'font-normal'}`}
                  >
                    {title}
                  </span>
                )}
                {showAuthor && (
                  <span
                    onClick={() => onAuthorClick(record.author)}
                    className={`${authorWidth} pr-4 cursor-pointer hover:opacity-50 transition-opacity ${selectedAuthor === record.author ? 'font-bold' : 'font-normal'}`}
                  >
                    {author}
                  </span>
                )}
                {showCategory && (
                  <span className={`${categoryWidth} pr-4 text-sm md:text-base opacity-70`}>
                    {category}
                  </span>
                )}
                {showTags && showKeywords && keywords.length > 0 && (
                  <div className={`${tagsWidth} flex flex-wrap gap-2 items-start`}>
                    {keywords.map((keyword) => (
                      <button
                        key={`${record.id}-${keyword}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onKeywordClick(keyword);
                        }}
                        className={`text-sm px-2 py-1 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer ${selectedKeyword === keyword ? 'bg-black text-white dark:bg-white dark:text-black' : ''}`}
                        type="button"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hoveredRecord && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: thumbnailPosition.x + 20,
            top: thumbnailPosition.y + 20,
          }}
        >
          <div className="w-[36rem] aspect-video bg-black overflow-hidden shadow-2xl">
            <img
              src={hoveredRecord.thumbnail}
              alt={getPreferredConcept(hoveredRecord, preferredLanguage)}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </>
  );
}

import { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface Video {
  id: string;
  slug: string;
  concept: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: string;
  language: string;
  subtitles: string[];
  description: string;
  videoUrl: string;
  keywords: string[];
}

interface VideoListProps {
  videos: Video[];
  onSelectVideo: (video: Video) => void;
  selectedVideoId?: string;
  showKeywords: boolean;
  onKeywordClick: (keyword: string) => void;
  selectedKeyword: string | null;
  onSort: (column: 'title' | 'author') => void;
  sortBy: 'title' | 'author' | null;
  sortOrder: 'asc' | 'desc';
  showTitle: boolean;
  showAuthor: boolean;
  showTags: boolean;
  showCategory: boolean;
  onAuthorClick: (author: string) => void;
  selectedAuthor: string | null;
}

export function VideoList({ 
  videos, 
  onSelectVideo, 
  selectedVideoId, 
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
  selectedAuthor
}: VideoListProps) {
  const [hoveredVideo, setHoveredVideo] = useState<Video | null>(null);
  const [thumbnailPosition, setThumbnailPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent, video: Video) => {
    setHoveredVideo(video);
    setThumbnailPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredVideo(null);
  };

  const getSortIcon = (column: 'title' | 'author') => {
    if (sortBy !== column) {
      return null;
    }
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Calculate column widths dynamically based on what's shown
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
      {/* Column Headers */}
      {visibleColumns > 0 && (
        <div className="flex pb-2 mb-3 border-b border-neutral-300 dark:border-neutral-700 gap-4">
          {showTitle && (
            <button
              onClick={() => onSort('title')}
              className={`flex items-center gap-2 ${titleWidth} pr-4 text-sm text-black dark:text-white hover:opacity-60 transition-opacity`}
            >
              <span className="uppercase tracking-wide">Title</span>
              {getSortIcon('title')}
            </button>
          )}
          {showAuthor && (
            <button
              onClick={() => onSort('author')}
              className={`flex items-center gap-2 ${authorWidth} pr-4 text-sm text-black dark:text-white hover:opacity-60 transition-opacity`}
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
        {videos.map((video) => (
          <div
            key={video.id}
            className={`py-3 transition-opacity overflow-hidden ${
              selectedVideoId === video.id
                ? 'opacity-100'
                : 'opacity-100'
            }`}
          >
            <div className="flex gap-4 text-xl md:text-2xl leading-tight text-black dark:text-white">
              {showTitle && (
                <span 
                  onMouseMove={(e) => handleMouseMove(e, video)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => onSelectVideo(video)}
                  className={`${titleWidth} pr-4 cursor-pointer hover:opacity-50 transition-opacity ${selectedVideoId === video.id ? 'font-bold' : 'font-normal'}`}
                >
                  {video.title}
                </span>
              )}
              {showAuthor && (
                <span
                  onClick={() => onAuthorClick(video.author)}
                  className={`${authorWidth} pr-4 cursor-pointer hover:opacity-50 transition-opacity ${selectedAuthor === video.author ? 'font-bold' : 'font-normal'}`}
                >
                  {video.author}
                </span>
              )}
              {showCategory && (
                <span className={`${categoryWidth} pr-4 text-sm md:text-base opacity-70`}>
                  {video.concept}
                </span>
              )}
              {showTags && showKeywords && video.keywords.length > 0 && (
                <div className={`${tagsWidth} flex flex-wrap gap-2 items-start`}>
                  {video.keywords.map((keyword) => (
                    <button
                      key={keyword}
                      onClick={(e) => {
                        e.stopPropagation();
                        onKeywordClick(keyword);
                      }}
                      className={`text-sm px-2 py-1 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer ${
                        selectedKeyword === keyword ? 'bg-black text-white dark:bg-white dark:text-black' : ''
                      }`}
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Thumbnail on Hover */}
      {hoveredVideo && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: thumbnailPosition.x + 20,
            top: thumbnailPosition.y + 20,
          }}
        >
          <div className="w-[36rem] aspect-video bg-black overflow-hidden shadow-2xl">
            <img
              src={hoveredVideo.thumbnail}
              alt={hoveredVideo.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </>
  );
}
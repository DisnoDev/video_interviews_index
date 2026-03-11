import { useState } from 'react';

interface Video {
  id: string;
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
  transcript?: string;
}

interface VideoPlayerProps {
  video: Video;
  layoutMode?: 'side' | 'stacked';
  onKeywordClick?: (keyword: string) => void;
}

export function VideoPlayer({ video, layoutMode = 'side', onKeywordClick }: VideoPlayerProps) {
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(
    video.subtitles.length > 0 ? video.subtitles[0] : null
  );

  return (
    <div className={`h-full flex ${layoutMode === 'side' ? 'flex-col' : 'flex-row'}`}>
      {/* Video Display - 16:9 aspect ratio */}
      <div className={`${layoutMode === 'side' ? 'w-full' : 'w-2/3'} flex items-center justify-center bg-black p-4 md:p-6`}>
        <div className="w-full aspect-video">
          <video
            src={video.videoUrl}
            className="w-full h-full"
            controls
            controlsList="nodownload"
          >
            <track kind="captions" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      {/* Metadata Panel */}
      <div className={`${layoutMode === 'side' ? 'w-full' : 'w-1/3'} p-4 md:p-6 overflow-y-auto`}>
        <div className="space-y-4">
          {/* Title & Author */}
          <div>
            <h2 className="text-2xl md:text-3xl mb-1 text-black dark:text-white">
              {video.title}
            </h2>
            <p className="text-base md:text-lg text-black dark:text-white opacity-70">
              {video.author}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="space-y-3 text-base">
            <div>
              <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 mb-1">
                Concept
              </div>
              <div className="text-black dark:text-white">
                {video.concept}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 mb-1">
                Duration
              </div>
              <div className="text-black dark:text-white">
                {video.duration}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 mb-1">
                Language
              </div>
              <div className="text-black dark:text-white">
                {video.language}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 mb-1">
                Subtitles
              </div>
              <div className="flex flex-wrap gap-2">
                {video.subtitles.map((subtitle) => (
                  <button
                    key={subtitle}
                    onClick={() => setSelectedSubtitle(subtitle)}
                    className={`text-sm px-2 py-1 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer ${
                      selectedSubtitle === subtitle ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-black dark:text-white'
                    }`}
                  >
                    {subtitle}
                  </button>
                ))}
              </div>
            </div>

            {video.keywords.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 mb-1">
                  Keywords
                </div>
                <div className="flex flex-wrap gap-2">
                  {video.keywords.map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => onKeywordClick?.(keyword)}
                      className="text-sm px-2 py-1 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer text-black dark:text-white"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {video.transcript && (
              <div>
                <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 mb-1">
                  Transcript
                </div>
                <div className="text-black dark:text-white">
                  {video.transcript}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 mb-2">
              Description
            </div>
            <p className="text-base text-black dark:text-white leading-relaxed">
              {video.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
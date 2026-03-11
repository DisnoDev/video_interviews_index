import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import {
  Search,
  Moon,
  Sun,
  Columns,
  Rows,
  Tag,
  AlignLeft,
  User,
  FolderOpen,
  Languages,
  FileDown,
  Headphones,
} from 'lucide-react';
import { VideoList } from './VideoList';
import { VideoPlayer } from './VideoPlayer';
import { DEFAULT_SORT_DIR, DEFAULT_SORT_KEY, UI_LANGUAGE_OPTIONS } from '../lib/config';
import { buildCollectionSearch, getCollectionOptions, readCollectionTokenFromSearch, resolveCollectionLabelFromToken } from '../lib/collections';
import { exportFilteredRecordsPdf } from '../lib/pdf';
import { filterRecords, sortRecords } from '../lib/filtering';
import { t } from '../lib/i18n';
import type { InterviewRecord, LayoutMode, SortDirection, SortField } from '../types';

interface VideoCollectionProps {
  records: InterviewRecord[];
  loading: boolean;
  error: string | null;
  retry: () => Promise<void>;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  preferredLanguage: string;
  setPreferredLanguage: (value: string) => void;
  audioMode: boolean;
  setAudioMode: (value: boolean) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (value: LayoutMode) => void;
}

export function VideoCollection({
  records,
  loading,
  error,
  retry,
  isDarkMode,
  setIsDarkMode,
  preferredLanguage,
  setPreferredLanguage,
  audioMode,
  setAudioMode,
  layoutMode,
  setLayoutMode,
}: VideoCollectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortField>(DEFAULT_SORT_KEY as SortField);
  const [sortOrder, setSortOrder] = useState<SortDirection>(DEFAULT_SORT_DIR as SortDirection);
  const [showTitle, setShowTitle] = useState(true);
  const [showAuthor, setShowAuthor] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showCategory, setShowCategory] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();

  const collectionOptions = useMemo(() => getCollectionOptions(records.map((record) => record.collection)), [records]);
  const collectionFromUrl = useMemo(
    () => resolveCollectionLabelFromToken(readCollectionTokenFromSearch(location.search), collectionOptions) ?? '',
    [location.search, collectionOptions],
  );

  const filteredRecords = useMemo(
    () => sortRecords(filterRecords(records, {
      query: searchQuery,
      collection: collectionFromUrl,
      keyword: selectedKeyword,
      author: selectedAuthor,
    }), sortBy, sortOrder, preferredLanguage),
    [records, searchQuery, collectionFromUrl, selectedKeyword, selectedAuthor, sortBy, sortOrder, preferredLanguage],
  );

  const selectedRecord = useMemo(
    () => records.find((record) => record.slug === slug) || null,
    [records, slug],
  );

  const handleSort = (column: SortField) => {
    if (sortBy === column) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortBy(DEFAULT_SORT_KEY as SortField);
        setSortOrder('asc');
      }
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const syncRoute = (nextSlug: string | null, nextCollection: string) => {
    navigate(
      {
        pathname: nextSlug ? `/${nextSlug}` : '/',
        search: buildCollectionSearch(nextCollection),
      },
      { replace: true },
    );
  };

  const handleVideoSelect = (record: InterviewRecord) => {
    syncRoute(record.slug, collectionFromUrl);
  };

  return (
    <div className={`flex ${layoutMode === 'side' ? 'flex-row h-screen' : 'flex-col'} overflow-hidden`}>
      {layoutMode === 'stacked' && (
        <div className="w-full h-1/2 fixed top-0 left-0 right-0 overflow-y-auto border-b border-black dark:border-white bg-white dark:bg-black z-10">
          {selectedRecord ? (
            <VideoPlayer
              record={selectedRecord}
              layoutMode={layoutMode}
              preferredLanguage={preferredLanguage}
              audioMode={audioMode}
              onAudioModeChange={setAudioMode}
              onKeywordClick={(keyword) => setSelectedKeyword(keyword)}
            />
          ) : (
            <EmptyState loading={loading} error={error} retry={retry} uiLanguage={preferredLanguage} />
          )}
        </div>
      )}

      <div className={`${layoutMode === 'side' ? 'w-2/5 h-screen border-r' : 'w-full h-1/2 mt-[50vh]'} overflow-y-auto border-black dark:border-white custom-scrollbar`}>
        <div className="p-6 md:p-8">
          <header className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl mb-2 tracking-tight text-black dark:text-white font-['Arial_Black','Arial_Bold',Gadget,sans-serif] font-black">DISNOVATION.ORG</h1>
              <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 max-w-xl">
                {t(preferredLanguage, 'intro')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLayoutMode(layoutMode === 'side' ? 'stacked' : 'side')}
                className="p-2 text-black dark:text-white hover:opacity-60 transition-opacity"
                aria-label="Toggle layout"
                type="button"
              >
                {layoutMode === 'side' ? <Rows className="w-5 h-5" /> : <Columns className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-black dark:text-white hover:opacity-60 transition-opacity"
                aria-label="Toggle dark mode"
                type="button"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </header>

          <div className="mb-10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder={t(preferredLanguage, 'searchPlaceholder')}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full pl-6 pr-3 py-2 bg-transparent text-black dark:text-white placeholder-neutral-400 focus:outline-none text-base border-b border-neutral-300 dark:border-neutral-700"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowTitle(!showTitle)}
                  className={`p-2 text-black dark:text-white hover:opacity-60 transition-opacity ${showTitle ? 'opacity-100' : 'opacity-30'}`}
                  aria-label="Toggle titles"
                  type="button"
                >
                  <AlignLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowAuthor(!showAuthor)}
                  className={`p-2 text-black dark:text-white hover:opacity-60 transition-opacity ${showAuthor ? 'opacity-100' : 'opacity-30'}`}
                  aria-label="Toggle authors"
                  type="button"
                >
                  <User className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowCategory(!showCategory)}
                  className={`p-2 text-black dark:text-white hover:opacity-60 transition-opacity ${showCategory ? 'opacity-100' : 'opacity-30'}`}
                  aria-label="Toggle category"
                  type="button"
                >
                  <FolderOpen className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    setShowTags(!showTags);
                  }}
                  className={`p-2 text-black dark:text-white hover:opacity-60 transition-opacity ${showTags ? 'opacity-100' : 'opacity-30'}`}
                  aria-label="Toggle tags"
                  type="button"
                >
                  <Tag className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <select
                value={collectionFromUrl}
                onChange={(event) => syncRoute(selectedRecord?.slug || null, event.target.value)}
                className="bg-transparent text-black dark:text-white border-b border-neutral-300 dark:border-neutral-700 py-2 pr-8 focus:outline-none"
              >
                <option value="">{t(preferredLanguage, 'collectionAll')}</option>
                {collectionOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>

              <label className="flex items-center gap-2 border-b border-neutral-300 dark:border-neutral-700 py-2">
                <Languages className="w-4 h-4 text-neutral-400" />
                <select
                  value={preferredLanguage}
                  onChange={(event) => setPreferredLanguage(event.target.value)}
                  className="bg-transparent text-black dark:text-white focus:outline-none"
                >
                  {UI_LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value || 'auto'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => exportFilteredRecordsPdf(filteredRecords, preferredLanguage)}
                className="flex items-center gap-2 py-2 text-black dark:text-white hover:opacity-60 transition-opacity"
              >
                <FileDown className="w-4 h-4" />
                <span>{t(preferredLanguage, 'exportPdf')}</span>
              </button>

              <button
                type="button"
                onClick={() => setAudioMode(!audioMode)}
                className={`flex items-center gap-2 py-2 text-black dark:text-white hover:opacity-60 transition-opacity ${audioMode ? 'font-bold' : ''}`}
              >
                <Headphones className="w-4 h-4" />
                <span>{t(preferredLanguage, 'audioMode')}</span>
              </button>
            </div>

            {selectedKeyword && (
              <div className="flex items-center justify-between py-2 border-b border-neutral-300 dark:border-neutral-700">
                <span className="text-base text-black dark:text-white">
                  Keyword: <span className="font-bold">{selectedKeyword}</span>
                </span>
                <button onClick={() => setSelectedKeyword(null)} className="text-sm text-black dark:text-white hover:opacity-60" type="button">
                  {t(preferredLanguage, 'clear')}
                </button>
              </div>
            )}

            {selectedAuthor && (
              <div className="flex items-center justify-between py-2 border-b border-neutral-300 dark:border-neutral-700">
                <span className="text-base text-black dark:text-white">
                  Author: <span className="font-bold">{selectedAuthor}</span>
                </span>
                <button onClick={() => setSelectedAuthor(null)} className="text-sm text-black dark:text-white hover:opacity-60" type="button">
                  {t(preferredLanguage, 'clear')}
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-sm text-neutral-400">{t(preferredLanguage, 'loading')}</div>
          ) : error ? (
            <div className="space-y-3 text-sm text-black dark:text-white">
              <p>{t(preferredLanguage, 'loadError')}</p>
              <p className="text-neutral-500 dark:text-neutral-400">{error}</p>
              <button type="button" onClick={() => void retry()} className="text-black dark:text-white underline underline-offset-4 hover:opacity-60">
                {t(preferredLanguage, 'retry')}
              </button>
            </div>
          ) : (
            <>
              <VideoList
                records={filteredRecords}
                preferredLanguage={preferredLanguage}
                selectedRecordId={selectedRecord?.id}
                showKeywords={showTags}
                onKeywordClick={(keyword) => setSelectedKeyword((current) => current === keyword ? null : keyword)}
                selectedKeyword={selectedKeyword}
                onSort={handleSort}
                sortBy={sortBy}
                sortOrder={sortOrder}
                showTitle={showTitle}
                showAuthor={showAuthor}
                showTags={showTags}
                showCategory={showCategory}
                onAuthorClick={(author) => setSelectedAuthor((current) => current === author ? null : author)}
                selectedAuthor={selectedAuthor}
                onSelectVideo={handleVideoSelect}
              />

              <div className="mt-6 text-xs text-neutral-400">
                {filteredRecords.length} / {records.length} videos
              </div>
            </>
          )}
        </div>
      </div>

      {layoutMode === 'side' && (
        <div className="w-3/5 h-screen overflow-hidden">
          {selectedRecord ? (
            <VideoPlayer
              record={selectedRecord}
              layoutMode={layoutMode}
              preferredLanguage={preferredLanguage}
              audioMode={audioMode}
              onAudioModeChange={setAudioMode}
              onKeywordClick={(keyword) => setSelectedKeyword(keyword)}
            />
          ) : (
            <EmptyState loading={loading} error={error} retry={retry} uiLanguage={preferredLanguage} />
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ loading, error, retry, uiLanguage }: { loading: boolean; error: string | null; retry: () => Promise<void>; uiLanguage: string }) {
  return (
    <div className="h-full flex items-center justify-center p-8 bg-white dark:bg-black">
      <div className="text-center max-w-md mx-auto">
        <p className="text-base text-black dark:text-white">
          {loading ? t(uiLanguage, 'loading') : error ? t(uiLanguage, 'loadError') : t(uiLanguage, 'selectVideo')}
        </p>
        {error ? (
          <button type="button" onClick={() => void retry()} className="mt-4 text-black dark:text-white underline underline-offset-4 hover:opacity-60">
            {t(uiLanguage, 'retry')}
          </button>
        ) : null}
      </div>
    </div>
  );
}

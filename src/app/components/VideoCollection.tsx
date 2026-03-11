import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { AlignLeft, Columns, FolderOpen, Moon, Rows, Search, Sun, Tag, User } from 'lucide-react';
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
  const [sortField, setSortField] = useState<SortField>(DEFAULT_SORT_KEY as SortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_SORT_DIR as SortDirection);
  const [showAuthor, setShowAuthor] = useState(true);
  const [showCollection, setShowCollection] = useState(true);
  const [showKeywords, setShowKeywords] = useState(true);
  const [showTitleDetail, setShowTitleDetail] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();

  const collectionOptions = useMemo(() => getCollectionOptions(records.map((record) => record.collection)), [records]);
  const collectionFromUrl = useMemo(() => resolveCollectionLabelFromToken(readCollectionTokenFromSearch(location.search), collectionOptions) ?? '', [location.search, collectionOptions]);

  const filteredRecords = useMemo(() => sortRecords(filterRecords(records, {
    query: searchQuery,
    collection: collectionFromUrl,
    keyword: selectedKeyword,
    author: selectedAuthor,
  }), sortField, sortDirection, preferredLanguage), [records, searchQuery, collectionFromUrl, selectedKeyword, selectedAuthor, sortField, sortDirection, preferredLanguage]);

  const selectedRecord = useMemo(() => records.find((record) => record.slug === slug) || null, [records, slug]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortField(field);
    setSortDirection('asc');
  };

  const syncRoute = (nextSlug: string | null, nextCollection: string) => {
    navigate({
      pathname: nextSlug ? `/${nextSlug}` : '/',
      search: buildCollectionSearch(nextCollection),
    }, { replace: true });
  };

  const handleCollectionChange = (value: string) => {
    syncRoute(selectedRecord?.slug || null, value);
  };

  const handleSelectVideo = (record: InterviewRecord) => {
    syncRoute(record.slug, collectionFromUrl);
  };

  return (
    <div className={`flex ${layoutMode === 'side' ? 'flex-col lg:flex-row' : 'flex-col'} min-h-screen overflow-hidden bg-[#f6f0e7] text-black dark:bg-[#080808] dark:text-white`}>
      {layoutMode === 'stacked' ? (
        <div className="fixed left-0 right-0 top-0 z-10 h-[46vh] border-b border-black/10 bg-[#efe4d4] dark:border-white/10 dark:bg-black lg:h-[50vh]">
          {selectedRecord ? (
            <VideoPlayer
              record={selectedRecord}
              preferredLanguage={preferredLanguage}
              uiLanguage={preferredLanguage}
              audioMode={audioMode}
              onAudioModeChange={setAudioMode}
              onKeywordClick={setSelectedKeyword}
            />
          ) : (
            <EmptyPlayerState loading={loading} error={error} retry={retry} uiLanguage={preferredLanguage} />
          )}
        </div>
      ) : null}

      <section className={`${layoutMode === 'side' ? 'w-full lg:w-[42%] lg:min-w-[32rem]' : 'w-full pt-[46vh] lg:pt-[50vh]'} custom-scrollbar h-screen overflow-y-auto border-r border-black/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.65),_transparent_35%),linear-gradient(180deg,#f6f0e7,#efe6d8)] px-5 py-6 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),_transparent_35%),linear-gradient(180deg,#0f0f10,#050505)] md:px-8`}>
        <header className="mb-8 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="text-xs uppercase tracking-[0.36em] text-black/45 dark:text-white/45">DISNOVATION.ORG</div>
              <h1 className="mt-3 text-4xl leading-none md:text-5xl">{t(preferredLanguage, 'headerTitle')}</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/65 dark:text-white/65">{t(preferredLanguage, 'intro')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setLayoutMode(layoutMode === 'side' ? 'stacked' : 'side')} className="rounded-full border border-black/10 p-3 text-black/70 transition hover:border-black/40 hover:text-black dark:border-white/10 dark:text-white/70 dark:hover:border-white/40 dark:hover:text-white">
                {layoutMode === 'side' ? <Rows className="h-5 w-5" /> : <Columns className="h-5 w-5" />}
              </button>
              <button type="button" onClick={() => setIsDarkMode(!isDarkMode)} className="rounded-full border border-black/10 p-3 text-black/70 transition hover:border-black/40 hover:text-black dark:border-white/10 dark:text-white/70 dark:hover:border-white/40 dark:hover:text-white">
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35 dark:text-white/35" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t(preferredLanguage, 'searchPlaceholder')} className="w-full rounded-full border border-black/10 bg-transparent py-3 pl-11 pr-4 text-sm outline-none transition focus:border-black/35 dark:border-white/10 dark:text-white dark:focus:border-white/35" />
              </label>

              <select value={collectionFromUrl} onChange={(event) => handleCollectionChange(event.target.value)} className="rounded-full border border-black/10 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-black/35 dark:border-white/10 dark:bg-black/20 dark:text-white dark:focus:border-white/35">
                <option value="">{t(preferredLanguage, 'collectionAll')}</option>
                {collectionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>

              <select value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)} className="rounded-full border border-black/10 bg-transparent px-4 py-3 text-sm outline-none transition focus:border-black/35 dark:border-white/10 dark:bg-black/20 dark:text-white dark:focus:border-white/35">
                {UI_LANGUAGE_OPTIONS.map((option) => <option key={option.value || 'auto'} value={option.value}>{option.label}</option>)}
              </select>

              <button type="button" onClick={() => exportFilteredRecordsPdf(filteredRecords, preferredLanguage)} className="rounded-full border border-black/10 px-4 py-3 text-sm transition hover:border-black/40 dark:border-white/10 dark:hover:border-white/40">
                {t(preferredLanguage, 'exportPdf')}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setShowTitleDetail((current) => !current)} className={`rounded-full border p-2 transition ${showTitleDetail ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black' : 'border-black/10 text-black/65 hover:border-black/40 dark:border-white/10 dark:text-white/65 dark:hover:border-white/40'}`}><AlignLeft className="h-4 w-4" /></button>
              <button type="button" onClick={() => setShowAuthor((current) => !current)} className={`rounded-full border p-2 transition ${showAuthor ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black' : 'border-black/10 text-black/65 hover:border-black/40 dark:border-white/10 dark:text-white/65 dark:hover:border-white/40'}`}><User className="h-4 w-4" /></button>
              <button type="button" onClick={() => setShowCollection((current) => !current)} className={`rounded-full border p-2 transition ${showCollection ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black' : 'border-black/10 text-black/65 hover:border-black/40 dark:border-white/10 dark:text-white/65 dark:hover:border-white/40'}`}><FolderOpen className="h-4 w-4" /></button>
              <button type="button" onClick={() => setShowKeywords((current) => !current)} className={`rounded-full border p-2 transition ${showKeywords ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black' : 'border-black/10 text-black/65 hover:border-black/40 dark:border-white/10 dark:text-white/65 dark:hover:border-white/40'}`}><Tag className="h-4 w-4" /></button>

              <div className="ml-auto flex items-center gap-2 rounded-full border border-black/10 px-2 py-1 dark:border-white/10">
                <span className="px-2 text-[11px] uppercase tracking-[0.24em] text-black/45 dark:text-white/45">{t(preferredLanguage, 'sortLabel')}</span>
                <select value={sortField} onChange={(event) => setSortField(event.target.value as SortField)} className="bg-transparent px-2 py-1 text-sm outline-none">
                  <option value="concept">{t(preferredLanguage, 'concept')}</option>
                  <option value="author">{t(preferredLanguage, 'author')}</option>
                  <option value="collection">{t(preferredLanguage, 'collection')}</option>
                  <option value="duration">{t(preferredLanguage, 'duration')}</option>
                  <option value="year">{t(preferredLanguage, 'year')}</option>
                  <option value="title">{t(preferredLanguage, 'title')}</option>
                </select>
                <button type="button" onClick={() => setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')} className="rounded-full border border-black/10 px-3 py-1 text-xs uppercase tracking-[0.18em] dark:border-white/10">
                  {sortDirection === 'asc' ? t(preferredLanguage, 'sortAsc') : t(preferredLanguage, 'sortDesc')}
                </button>
              </div>
            </div>
          </div>
        </header>

        {selectedKeyword ? (
          <ActiveFilter label={t(preferredLanguage, 'keywords')} value={selectedKeyword} onClear={() => setSelectedKeyword(null)} uiLanguage={preferredLanguage} />
        ) : null}
        {selectedAuthor ? (
          <ActiveFilter label={t(preferredLanguage, 'author')} value={selectedAuthor} onClear={() => setSelectedAuthor(null)} uiLanguage={preferredLanguage} />
        ) : null}

        {loading ? (
          <div className="rounded-[2rem] border border-black/10 bg-white/60 px-5 py-6 text-sm text-black/65 dark:border-white/10 dark:bg-white/5 dark:text-white/65">{t(preferredLanguage, 'loading')}</div>
        ) : error ? (
          <div className="rounded-[2rem] border border-red-500/30 bg-red-500/8 px-5 py-6 text-sm text-red-700 dark:text-red-300">
            <div>{t(preferredLanguage, 'loadError')}</div>
            <div className="mt-1 text-xs opacity-70">{error}</div>
            <button type="button" onClick={() => void retry()} className="mt-4 rounded-full border border-current px-3 py-1 text-xs uppercase tracking-[0.18em]">
              {t(preferredLanguage, 'retry')}
            </button>
          </div>
        ) : filteredRecords.length ? (
          <>
            <VideoList
              records={filteredRecords}
              preferredLanguage={preferredLanguage}
              selectedRecordId={selectedRecord?.id}
              selectedKeyword={selectedKeyword}
              selectedAuthor={selectedAuthor}
              showAuthor={showAuthor}
              showCollection={showCollection}
              showKeywords={showKeywords}
              showTitleDetail={showTitleDetail}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onSelectVideo={handleSelectVideo}
              onKeywordClick={(keyword) => setSelectedKeyword((current) => current === keyword ? null : keyword)}
              onAuthorClick={(author) => setSelectedAuthor((current) => current === author ? null : author)}
            />
            <div className="mt-6 text-xs uppercase tracking-[0.24em] text-black/45 dark:text-white/45">{filteredRecords.length} / {records.length} {t(preferredLanguage, 'itemsCount')}</div>
          </>
        ) : (
          <div className="rounded-[2rem] border border-black/10 bg-white/60 px-5 py-6 text-sm text-black/65 dark:border-white/10 dark:bg-white/5 dark:text-white/65">{t(preferredLanguage, 'noResults')}</div>
        )}
      </section>

      {layoutMode === 'side' ? (
        <section className="hidden h-screen flex-1 overflow-hidden bg-[#efe4d4] dark:bg-black lg:block">
          {selectedRecord ? (
            <VideoPlayer
              record={selectedRecord}
              preferredLanguage={preferredLanguage}
              uiLanguage={preferredLanguage}
              audioMode={audioMode}
              onAudioModeChange={setAudioMode}
              onKeywordClick={setSelectedKeyword}
            />
          ) : (
            <EmptyPlayerState loading={loading} error={error} retry={retry} uiLanguage={preferredLanguage} />
          )}
        </section>
      ) : null}
    </div>
  );
}

function EmptyPlayerState({ loading, error, retry, uiLanguage }: { loading: boolean; error: string | null; retry: () => Promise<void>; uiLanguage: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.08),_transparent_45%),linear-gradient(180deg,#efe4d4,#e1d4c0)] px-8 text-center dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_45%),linear-gradient(180deg,#111,#050505)]">
      <div className="max-w-xl rounded-[2rem] border border-black/10 bg-white/70 p-8 backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="text-sm uppercase tracking-[0.32em] text-black/45 dark:text-white/45">DISNOVATION.ORG</div>
        <p className="mt-4 text-lg leading-relaxed text-black/70 dark:text-white/70">{loading ? t(uiLanguage, 'loading') : error ? t(uiLanguage, 'loadError') : t(uiLanguage, 'selectVideo')}</p>
        {error ? (
          <button type="button" onClick={() => void retry()} className="mt-6 rounded-full border border-black/15 px-4 py-2 text-sm transition hover:border-black/40 dark:border-white/15 dark:hover:border-white/40">
            {t(uiLanguage, 'retry')}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ActiveFilter({ label, value, onClear, uiLanguage }: { label: string; value: string; onClear: () => void; uiLanguage: string }) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-full border border-black/10 bg-white/60 px-4 py-2 text-sm dark:border-white/10 dark:bg-white/5">
      <span>{label}: <strong>{value}</strong></span>
      <button type="button" onClick={onClear} className="text-xs uppercase tracking-[0.2em] text-black/55 transition hover:text-black dark:text-white/55 dark:hover:text-white">{t(uiLanguage, 'clear')}</button>
    </div>
  );
}

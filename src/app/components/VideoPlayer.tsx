import { Download, Expand, FileText, Headphones, Languages, LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TranscriptModal } from './TranscriptModal';
import { exportTranscriptPdf } from '../lib/pdf';
import { t } from '../lib/i18n';
import { languageLabel, normalizeLanguageCode, transcriptInfoFromRecordLike } from '../lib/languages';
import { getPreferredAuthor, getPreferredCollection, getPreferredConcept, getPreferredKeywords, getPreferredTitle } from '../lib/records';
import { downloadTextFile, formatTranscriptParagraphs } from '../lib/utils';
import type { InterviewRecord } from '../types';

declare global {
  interface Window {
    Vimeo?: {
      Player: new (element: HTMLElement, options: Record<string, unknown>) => VimeoPlayer;
    };
  }
}

interface VimeoTextTrack {
  language?: string;
  label?: string;
  kind?: string;
}

interface VimeoCueEvent {
  cues?: Array<{ text?: string }>;
  cue?: { text?: string };
  text?: string;
  language?: string;
  track?: { language?: string };
}

interface VimeoPlayer {
  on: (event: string, callback: (payload: VimeoCueEvent) => void) => void;
  off?: (event: string, callback: (payload: VimeoCueEvent) => void) => void;
  loadVideo: (options: number | { id: number; start?: number }) => Promise<unknown>;
  play: () => Promise<void>;
  unload: () => Promise<void>;
  getDuration: () => Promise<number>;
  getTextTracks: () => Promise<VimeoTextTrack[]>;
  enableTextTrack: (language: string, kind?: string) => Promise<unknown>;
}

interface TranscriptToken {
  text: string;
  isWord: boolean;
  canonical: string;
  wordIndex: number;
}

interface TranscriptChunk {
  text: string;
  canonical: string;
  words: string[];
  tokens: TranscriptToken[];
}

interface HighlightRange {
  chunkIndex: number;
  start: number;
  end: number;
}

interface VideoPlayerProps {
  record: InterviewRecord;
  preferredLanguage: string;
  uiLanguage: string;
  audioMode: boolean;
  onAudioModeChange: (value: boolean) => void;
  onKeywordClick: (keyword: string) => void;
}

const vimeoSdkPromise = new Promise<void>((resolve, reject) => {
  if (typeof window !== 'undefined' && window.Vimeo?.Player) {
    resolve();
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://player.vimeo.com/api/player.js';
  script.async = true;
  script.onload = () => resolve();
  script.onerror = () => reject(new Error('Could not load Vimeo SDK'));
  document.head.appendChild(script);
});

export function VideoPlayer({
  record,
  preferredLanguage,
  uiLanguage,
  audioMode,
  onAudioModeChange,
  onKeywordClick,
}: VideoPlayerProps) {
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerWrapperRef = useRef<HTMLDivElement | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<VimeoPlayer | null>(null);
  const paragraphRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const animationFrameRef = useRef<number | null>(null);

  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [subtitleOverride, setSubtitleOverride] = useState('');
  const [activeSubtitle, setActiveSubtitle] = useState('');
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [highlight, setHighlight] = useState<HighlightRange | null>(null);

  const concept = getPreferredConcept(record, preferredLanguage);
  const author = getPreferredAuthor(record, preferredLanguage);
  const collection = getPreferredCollection(record, preferredLanguage);
  const title = getPreferredTitle(record, preferredLanguage);
  const keywords = getPreferredKeywords(record, preferredLanguage);

  const transcriptInfo = useMemo(() => transcriptInfoFromRecordLike(record.transcripts, record.transcriptOrder, subtitleOverride || activeSubtitle || preferredLanguage), [record, preferredLanguage, subtitleOverride, activeSubtitle]);
  const transcriptChunks = useMemo(() => prepareTranscriptChunks(transcriptInfo.text), [transcriptInfo.text]);

  useEffect(() => {
    setHighlight(null);
    setSubtitleOverride('');
  }, [record.id]);

  useEffect(() => {
    let cancelled = false;

    const handleLoaded = async () => {
      if (!playerRef.current) {
        return;
      }
      try {
        await playerRef.current.play();
      } catch {
        // ignore autoplay failures
      }
      const appliedLanguage = await applyPreferredTrack(playerRef.current, subtitleOverride || preferredLanguage);
      if (!cancelled) {
        setActiveSubtitle(appliedLanguage);
        setPlayerReady(true);
      }
    };

    const handleTextTrackChange = async (payload: VimeoCueEvent) => {
      const nextLanguage = normalizeLanguageCode(payload.language || payload.track?.language || '');
      setActiveSubtitle(nextLanguage);
    };

    const handleCueChange = (payload: VimeoCueEvent) => {
      const cueText = extractCueText(payload);
      if (!cueText) {
        setHighlight(null);
        return;
      }
      setHighlight(findHighlightRange(transcriptChunks, cueText));
    };

    async function initPlayer() {
      if (!playerHostRef.current) {
        return;
      }

      try {
        await vimeoSdkPromise;
        if (cancelled || !playerHostRef.current) {
          return;
        }

        if (!playerRef.current) {
          playerRef.current = new window.Vimeo!.Player(playerHostRef.current, {
            id: Number(record.vimeoId),
            autoplay: true,
            autopause: 1,
            playsinline: 1,
            title: 0,
            byline: 0,
            portrait: 0,
          });
          playerRef.current.on('loaded', handleLoaded);
          playerRef.current.on('texttrackchange', handleTextTrackChange);
          playerRef.current.on('cuechange', handleCueChange);
        }

        await playerRef.current.loadVideo({ id: Number(record.vimeoId), start: record.startAt || 0 });
      } catch (error) {
        if (!cancelled) {
          setPlayerError(error instanceof Error ? error.message : 'Could not initialize Vimeo player');
        }
      }
    }

    setPlayerReady(false);
    setPlayerError(null);
    void initPlayer();

    return () => {
      cancelled = true;
    };
  }, [record.id, record.startAt, record.vimeoId, preferredLanguage, subtitleOverride, transcriptChunks]);

  useEffect(() => {
    if (!playerRef.current || !playerReady) {
      return;
    }

    void applyPreferredTrack(playerRef.current, subtitleOverride || preferredLanguage).then((appliedLanguage) => {
      setActiveSubtitle(appliedLanguage);
    });
  }, [playerReady, preferredLanguage, subtitleOverride]);

  useEffect(() => {
    if (!highlight || autoScroll || !paragraphRefs.current[highlight.chunkIndex]) {
      return;
    }

    paragraphRefs.current[highlight.chunkIndex]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [highlight, autoScroll]);

  useEffect(() => {
    if (!audioMode || !autoScroll || !transcriptScrollRef.current || !playerRef.current || !transcriptInfo.text) {
      cancelScrollAnimation(animationFrameRef.current);
      return;
    }

    let cancelled = false;
    void playerRef.current.getDuration().then((duration) => {
      if (cancelled || !transcriptScrollRef.current || !duration) {
        return;
      }

      const element = transcriptScrollRef.current;
      const scrollTarget = Math.max(0, element.scrollHeight - element.clientHeight);
      if (scrollTarget <= 0) {
        return;
      }

      cancelScrollAnimation(animationFrameRef.current);
      const totalDuration = (duration * 1000) / playbackRate;
      const startTime = performance.now();

      const step = (timestamp: number) => {
        if (!transcriptScrollRef.current) {
          return;
        }
        const progress = Math.min(1, (timestamp - startTime) / totalDuration);
        transcriptScrollRef.current.scrollTop = scrollTarget * progress;
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        }
      };

      animationFrameRef.current = requestAnimationFrame(step);
    });

    return () => {
      cancelled = true;
      cancelScrollAnimation(animationFrameRef.current);
    };
  }, [audioMode, autoScroll, playbackRate, record.id, transcriptInfo.text]);

  useEffect(() => () => {
    cancelScrollAnimation(animationFrameRef.current);
    void playerRef.current?.unload().catch(() => undefined);
  }, []);

  const downloadTranscript = () => {
    if (!transcriptInfo.text) {
      return;
    }
    downloadTextFile(`${concept} - disnovation.txt`, transcriptInfo.text);
  };

  return (
    <>
      <div className={`relative h-full ${audioMode ? 'bg-neutral-950 text-white' : 'bg-black text-white'}`}>
        <div className={`${audioMode ? 'absolute left-0 top-0 h-px w-px overflow-hidden opacity-0' : 'block'} h-full`}>
          <div ref={playerWrapperRef} className="h-full w-full">
            <div ref={playerHostRef} className="h-full w-full" />
          </div>
        </div>

        {!audioMode ? (
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
            <button type="button" onClick={() => onAudioModeChange(true)} className="rounded-full border border-white/15 bg-black/50 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/80 transition hover:border-white/40 hover:text-white">
              <Headphones className="mr-2 inline h-4 w-4" />{t(uiLanguage, 'audioMode')}
            </button>
            <button type="button" onClick={() => playerWrapperRef.current?.requestFullscreen?.()} className="rounded-full border border-white/15 bg-black/50 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/80 transition hover:border-white/40 hover:text-white">
              <Expand className="mr-2 inline h-4 w-4" />{t(uiLanguage, 'fullscreen')}
            </button>
          </div>
        ) : null}

        {audioMode ? (
          <div className="flex h-full flex-col bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_38%),linear-gradient(180deg,#111,#050505)] p-5 md:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-white/45">{collection}</div>
                <h2 className="mt-2 text-2xl font-medium leading-tight text-white">{concept}</h2>
                <p className="mt-1 text-sm text-white/65">{author}</p>
              </div>
              <button type="button" onClick={() => onAudioModeChange(false)} className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/75 transition hover:border-white/40 hover:text-white">
                {t(uiLanguage, 'play')}
              </button>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              <label className="flex items-center gap-2">
                <span>{t(uiLanguage, 'audioAutoScroll')}</span>
                <input type="checkbox" checked={autoScroll} onChange={(event) => setAutoScroll(event.target.checked)} />
              </label>
              <label className="flex items-center gap-3">
                <span>{t(uiLanguage, 'audioSpeed')}</span>
                <input type="range" min="0.5" max="2" step="0.1" value={playbackRate} onChange={(event) => setPlaybackRate(Number(event.target.value))} />
                <span>{playbackRate.toFixed(1)}x</span>
              </label>
            </div>
            <div ref={transcriptScrollRef} className="custom-scrollbar flex-1 overflow-y-auto rounded-[2rem] border border-white/10 bg-black/30 px-5 py-6">
              <TranscriptBody chunks={transcriptChunks} highlight={highlight} paragraphRefs={paragraphRefs} />
            </div>
          </div>
        ) : (
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-xs uppercase tracking-[0.24em] text-white/70">
            {!playerReady && !playerError ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {playerError ? playerError : (playerReady ? title || concept : 'Loading player')}
          </div>
        )}
      </div>

      <div className="h-full overflow-y-auto bg-white/70 p-5 backdrop-blur-sm dark:bg-black/20 md:p-6">
        <div className="space-y-5 text-black dark:text-white">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-black/45 dark:text-white/45">{collection}</div>
            <h2 className="mt-2 text-2xl leading-tight">{concept}</h2>
            <p className="mt-1 text-base text-black/65 dark:text-white/65">{author}</p>
            {title && title !== concept ? <p className="mt-2 text-sm text-black/55 dark:text-white/55">{title}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-[1.5rem] border border-black/10 bg-white/80 p-4 text-sm dark:border-white/10 dark:bg-white/5">
            <MetaItem label={t(uiLanguage, 'metaCollection')} value={collection} />
            <MetaItem label={t(uiLanguage, 'metaYear')} value={record.year || '-'} />
            <MetaItem label={t(uiLanguage, 'metaDuration')} value={record.durationLabel || '-'} />
            <MetaItem label={t(uiLanguage, 'language')} value={transcriptInfo.label || languageLabel(preferredLanguage || activeSubtitle || 'en', 'Auto')} />
          </div>

          <section>
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-black/45 dark:text-white/45">
              <Languages className="h-4 w-4" /> {t(uiLanguage, 'subtitles')}
            </div>
            <div className="flex flex-wrap gap-2">
              <SubtitleButton label={t(uiLanguage, 'auto')} active={!subtitleOverride} onClick={() => setSubtitleOverride('')} />
              {record.subtitles.map((subtitle) => {
                const code = normalizeLanguageCode(subtitle.code || subtitle.label);
                return (
                  <SubtitleButton
                    key={subtitle.code || subtitle.label}
                    label={subtitle.label || languageLabel(code, code)}
                    active={normalizeLanguageCode(subtitleOverride || activeSubtitle) === code}
                    onClick={() => setSubtitleOverride(code)}
                  />
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-2 text-xs uppercase tracking-[0.24em] text-black/45 dark:text-white/45">{t(uiLanguage, 'keywords')}</div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <button key={keyword} type="button" onClick={() => onKeywordClick(keyword)} className="rounded-full border border-black/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-black/70 transition hover:border-black/40 hover:text-black dark:border-white/10 dark:text-white/70 dark:hover:border-white/40 dark:hover:text-white">
                  {keyword}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setTranscriptModalOpen(true)} disabled={!transcriptInfo.text} className="rounded-full border border-black/10 px-3 py-2 text-sm text-black transition hover:border-black/40 dark:border-white/10 dark:text-white dark:hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40">
                <FileText className="mr-2 inline h-4 w-4" />{t(uiLanguage, 'viewTranscript')}
              </button>
              <button type="button" onClick={downloadTranscript} disabled={!transcriptInfo.text} className="rounded-full border border-black/10 px-3 py-2 text-sm text-black transition hover:border-black/40 dark:border-white/10 dark:text-white dark:hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40">
                <Download className="mr-2 inline h-4 w-4" />{t(uiLanguage, 'downloadTranscript')}
              </button>
              <button type="button" onClick={() => exportTranscriptPdf(record, transcriptInfo.text, transcriptInfo.label, preferredLanguage)} disabled={!transcriptInfo.text} className="rounded-full border border-black/10 px-3 py-2 text-sm text-black transition hover:border-black/40 dark:border-white/10 dark:text-white dark:hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40">
                {t(uiLanguage, 'downloadPdf')}
              </button>
            </div>
            {transcriptInfo.text ? (
              <div className="mt-4 line-clamp-4 text-sm leading-relaxed text-black/70 dark:text-white/70">{formatTranscriptParagraphs(transcriptInfo.text).slice(0, 2).join(' ')}</div>
            ) : null}
          </section>
        </div>
      </div>

      <TranscriptModal
        open={transcriptModalOpen}
        title={`${concept}${transcriptInfo.label ? ` (${transcriptInfo.label})` : ''}`}
        onClose={() => setTranscriptModalOpen(false)}
        actions={
          <>
            <button type="button" onClick={downloadTranscript} className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/80 transition hover:border-white/50 hover:text-white">
              {t(uiLanguage, 'downloadTranscript')}
            </button>
            <button type="button" onClick={() => exportTranscriptPdf(record, transcriptInfo.text, transcriptInfo.label, preferredLanguage)} className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/80 transition hover:border-white/50 hover:text-white">
              {t(uiLanguage, 'downloadPdf')}
            </button>
          </>
        }
      >
        <div className="space-y-5 text-base leading-relaxed text-white/85">
          {formatTranscriptParagraphs(transcriptInfo.text).map((paragraph) => (
            <p key={`${record.id}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
          ))}
        </div>
      </TranscriptModal>
    </>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.22em] text-black/40 dark:text-white/40">{label}</div>
      <div className="mt-1 text-sm text-black/75 dark:text-white/75">{value}</div>
    </div>
  );
}

function SubtitleButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition ${active ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black' : 'border-black/10 text-black/65 hover:border-black/40 hover:text-black dark:border-white/10 dark:text-white/65 dark:hover:border-white/40 dark:hover:text-white'}`}
    >
      {label}
    </button>
  );
}

function TranscriptBody({ chunks, highlight, paragraphRefs }: { chunks: TranscriptChunk[]; highlight: HighlightRange | null; paragraphRefs: React.MutableRefObject<Array<HTMLParagraphElement | null>> }) {
  if (!chunks.length) {
    return <p className="text-base leading-relaxed text-white/55">No transcript available.</p>;
  }

  return (
    <div className="space-y-4 text-base leading-relaxed text-white/80">
      {chunks.map((chunk, chunkIndex) => (
        <p key={`${chunkIndex}-${chunk.text.slice(0, 18)}`} ref={(node) => { paragraphRefs.current[chunkIndex] = node; }}>
          {chunk.tokens.map((token, tokenIndex) => {
            if (!token.isWord) {
              return <span key={`${chunkIndex}-${tokenIndex}`}>{token.text}</span>;
            }

            const isActive = highlight?.chunkIndex === chunkIndex && token.wordIndex >= highlight.start && token.wordIndex <= highlight.end;
            return (
              <span key={`${chunkIndex}-${tokenIndex}`} className={isActive ? 'rounded-sm bg-lime-300/80 px-0.5 text-black' : ''}>
                {token.text}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}

async function applyPreferredTrack(player: VimeoPlayer, requestedLanguage: string): Promise<string> {
  try {
    const tracks = await player.getTextTracks();
    if (!tracks?.length) {
      return '';
    }

    const preferred = normalizeLanguageCode(requestedLanguage);
    const normalizedTracks = tracks.map((track) => ({
      raw: track,
      code: normalizeLanguageCode(track.language || track.label || ''),
    }));

    const choice = normalizedTracks.find((track) => track.code === preferred)
      || normalizedTracks.find((track) => track.code === 'en')
      || normalizedTracks[0];

    if (!choice?.raw) {
      return '';
    }

    const language = choice.raw.language || choice.code || preferred || 'en';
    await player.enableTextTrack(language, choice.raw.kind || 'subtitles');
    return choice.code || normalizeLanguageCode(language) || '';
  } catch {
    return '';
  }
}

function extractCueText(payload: VimeoCueEvent): string {
  if (Array.isArray(payload.cues) && payload.cues.length) {
    return payload.cues.map((cue) => cue?.text || '').join(' ').trim();
  }
  if (payload.cue?.text) {
    return payload.cue.text;
  }
  return payload.text || '';
}

function cancelScrollAnimation(frameId: number | null): void {
  if (frameId !== null) {
    cancelAnimationFrame(frameId);
  }
}

function prepareTranscriptChunks(text: string): TranscriptChunk[] {
  return formatTranscriptParagraphs(text).map((paragraph) => {
    const tokens = tokenizeChunkText(paragraph);
    let wordIndex = 0;
    const normalizedTokens = tokens.map((token) => {
      if (!token.isWord) {
        return { ...token, wordIndex: -1 };
      }
      const nextToken = { ...token, wordIndex };
      wordIndex += 1;
      return nextToken;
    });

    return {
      text: paragraph,
      canonical: canonicalCueString(paragraph),
      words: normalizedTokens.filter((token) => token.isWord).map((token) => token.canonical),
      tokens: normalizedTokens,
    };
  });
}

function canonicalCueString(value: string): string {
  try {
    return String(value || '')
      .normalize('NFD')
      .replace(/\p{M}+/gu, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  } catch {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
}

function canonicalWord(value: string): string {
  return canonicalCueString(value).replace(/\s+/g, '');
}

function tokenizeChunkText(text: string): Array<Omit<TranscriptToken, 'wordIndex'>> {
  const tokens: Array<Omit<TranscriptToken, 'wordIndex'>> = [];
  const regex = /([\p{L}\p{N}'’]+|\s+|[^\s\p{L}\p{N}'’])/gu;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const isWord = /[\p{L}\p{N}'’]/u.test(raw) && !/^\s+$/.test(raw);
    tokens.push({
      text: raw,
      isWord,
      canonical: isWord ? canonicalWord(raw) : '',
    });
  }

  return tokens;
}

function findHighlightRange(chunks: TranscriptChunk[], cueText: string): HighlightRange | null {
  const canonicalCue = canonicalCueString(cueText);
  if (!canonicalCue) {
    return null;
  }

  const cueWords = canonicalCue.split(/\s+/).filter(Boolean);
  const cueWordSet = new Set(cueWords);
  let bestIndex = -1;
  let bestScore = 0;

  chunks.forEach((chunk, index) => {
    let score = 0;
    if (chunk.canonical === canonicalCue) {
      score = 1000;
    } else {
      if (chunk.canonical.includes(canonicalCue)) {
        score += 400;
      }
      if (canonicalCue.includes(chunk.canonical)) {
        score += 350;
      }
      if (cueWords.length && chunk.words.length) {
        let overlap = 0;
        chunk.words.forEach((word) => {
          if (cueWordSet.has(word)) {
            overlap += 1;
          }
        });
        if (overlap) {
          score += overlap * 25 + (overlap / cueWords.length) * 120 + (overlap / chunk.words.length) * 80;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  if (bestIndex === -1) {
    return null;
  }

  const range = determineWordRange(chunks[bestIndex], cueWords);
  if (!range) {
    return { chunkIndex: bestIndex, start: 0, end: Math.max(0, chunks[bestIndex].words.length - 1) };
  }

  return {
    chunkIndex: bestIndex,
    start: range.start,
    end: range.end,
  };
}

function determineWordRange(chunk: TranscriptChunk, cueWords: string[]): { start: number; end: number } | null {
  if (!chunk.words.length || !cueWords.length) {
    return null;
  }

  for (let start = 0; start <= chunk.words.length - cueWords.length; start += 1) {
    let matches = true;
    for (let offset = 0; offset < cueWords.length; offset += 1) {
      if (chunk.words[start + offset] !== cueWords[offset]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return { start, end: start + cueWords.length - 1 };
    }
  }

  let cueIndex = 0;
  let first = -1;
  let last = -1;
  for (let wordIndex = 0; wordIndex < chunk.words.length && cueIndex < cueWords.length; wordIndex += 1) {
    if (chunk.words[wordIndex] === cueWords[cueIndex]) {
      if (first === -1) {
        first = wordIndex;
      }
      last = wordIndex;
      cueIndex += 1;
    }
  }

  if (cueIndex > 0 && first !== -1) {
    return { start: first, end: last };
  }

  const cueWordSet = new Set(cueWords);
  let min = Infinity;
  let max = -1;
  chunk.words.forEach((word, index) => {
    if (cueWordSet.has(word)) {
      min = Math.min(min, index);
      max = Math.max(max, index);
    }
  });

  if (Number.isFinite(min) && max >= min) {
    return { start: min, end: max };
  }

  return null;
}

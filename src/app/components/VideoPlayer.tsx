import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileText, Headphones } from 'lucide-react';
import { TranscriptModal } from './TranscriptModal';
import { exportTranscriptPdf } from '../lib/pdf';
import { languageLabel, normalizeLanguageCode, transcriptInfoFromRecordLike } from '../lib/languages';
import { getPreferredAuthor, getPreferredCollection, getPreferredConcept, getPreferredKeywords } from '../lib/records';
import { downloadTextFile, formatTranscriptParagraphs } from '../lib/utils';
import type { InterviewRecord, LayoutMode } from '../types';

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
  loadVideo: (options: number | { id: number; start?: number }) => Promise<unknown>;
  play: () => Promise<void>;
  unload: () => Promise<void>;
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
  layoutMode?: LayoutMode;
  audioMode: boolean;
  onAudioModeChange: (value: boolean) => void;
  onKeywordClick?: (keyword: string) => void;
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

export function VideoPlayer({ record, preferredLanguage, layoutMode = 'side', audioMode, onAudioModeChange, onKeywordClick }: VideoPlayerProps) {
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<VimeoPlayer | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const paragraphRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const animationFrameRef = useRef<number | null>(null);

  const [subtitleOverride, setSubtitleOverride] = useState<string | null>(null);
  const [activeSubtitle, setActiveSubtitle] = useState('');
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [highlight, setHighlight] = useState<HighlightRange | null>(null);

  const concept = getPreferredConcept(record, preferredLanguage);
  const author = getPreferredAuthor(record, preferredLanguage);
  const collection = getPreferredCollection(record, preferredLanguage);
  const keywords = getPreferredKeywords(record, preferredLanguage);
  const transcriptInfo = useMemo(
    () => transcriptInfoFromRecordLike(record.transcripts, record.transcriptOrder, subtitleOverride || activeSubtitle || preferredLanguage),
    [record, preferredLanguage, subtitleOverride, activeSubtitle],
  );
  const transcriptChunks = useMemo(() => prepareTranscriptChunks(transcriptInfo.text), [transcriptInfo.text]);

  useEffect(() => {
    setSubtitleOverride(null);
    setHighlight(null);
  }, [record.id]);

  useEffect(() => {
    let cancelled = false;

    const handleLoaded = async () => {
      if (!playerRef.current) return;
      try {
        await playerRef.current.play();
      } catch {
        // ignore autoplay failures
      }
      const applied = await applyPreferredTrack(playerRef.current, subtitleOverride || preferredLanguage);
      if (!cancelled) setActiveSubtitle(applied);
    };

    const handleTextTrackChange = (payload: VimeoCueEvent) => {
      const nextLanguage = normalizeLanguageCode(payload.language || payload.track?.language || '');
      setActiveSubtitle(nextLanguage);
    };

    const handleCueChange = (payload: VimeoCueEvent) => {
      const cueText = extractCueText(payload);
      setHighlight(cueText ? findHighlightRange(transcriptChunks, cueText) : null);
    };

    async function initPlayer() {
      if (!playerHostRef.current) return;
      await vimeoSdkPromise;
      if (cancelled || !playerHostRef.current) return;

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
    }

    void initPlayer();

    return () => {
      cancelled = true;
    };
  }, [record.id, record.vimeoId, record.startAt, preferredLanguage, subtitleOverride, transcriptChunks]);

  useEffect(() => {
    if (!highlight || autoScroll || !paragraphRefs.current[highlight.chunkIndex]) return;
    paragraphRefs.current[highlight.chunkIndex]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [highlight, autoScroll]);

  useEffect(() => {
    if (!audioMode || !autoScroll || !transcriptScrollRef.current || !transcriptInfo.text) {
      cancelScrollAnimation(animationFrameRef.current);
      return;
    }

    const element = transcriptScrollRef.current;
    cancelScrollAnimation(animationFrameRef.current);
    const totalDistance = Math.max(0, element.scrollHeight - element.clientHeight);
    if (!totalDistance) return;

    const durationMs = Math.max(30000, formatTranscriptParagraphs(transcriptInfo.text).join(' ').split(/\s+/).length * 320) / playbackRate;
    const start = performance.now();

    const step = (time: number) => {
      if (!transcriptScrollRef.current) return;
      const progress = Math.min(1, (time - start) / durationMs);
      transcriptScrollRef.current.scrollTop = totalDistance * progress;
      if (progress < 1) animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => cancelScrollAnimation(animationFrameRef.current);
  }, [audioMode, autoScroll, playbackRate, transcriptInfo.text, record.id]);

  useEffect(() => () => {
    cancelScrollAnimation(animationFrameRef.current);
    void playerRef.current?.unload().catch(() => undefined);
  }, []);

  const downloadTranscript = () => {
    if (!transcriptInfo.text) return;
    downloadTextFile(`${concept} - disnovation.txt`, transcriptInfo.text);
  };

  return (
    <>
      <div className={`h-full flex ${layoutMode === 'side' ? 'flex-col' : 'flex-row'}`}>
        <div className={`${layoutMode === 'side' ? 'w-full' : 'w-2/3'} flex items-center justify-center bg-black p-4 md:p-6`}>
          {audioMode ? (
            <div className="w-full h-full border border-white/15 text-white p-4 md:p-6 flex flex-col">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl md:text-2xl mb-1">{concept}</h3>
                  <p className="text-sm text-white/70">{author}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onAudioModeChange(false)}
                  className="text-sm px-2 py-1 border border-white hover:bg-white hover:text-black transition-colors cursor-pointer"
                >
                  Back to video
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm mb-4 text-white/80">
                <label className="flex items-center gap-2">
                  <span>Auto-scroll</span>
                  <input type="checkbox" checked={autoScroll} onChange={(event) => setAutoScroll(event.target.checked)} />
                </label>
                <label className="flex items-center gap-3">
                  <span>Speed</span>
                  <input type="range" min="0.5" max="2" step="0.1" value={playbackRate} onChange={(event) => setPlaybackRate(Number(event.target.value))} />
                  <span>{playbackRate.toFixed(1)}x</span>
                </label>
              </div>
              <div ref={transcriptScrollRef} className="custom-scrollbar flex-1 overflow-y-auto text-sm md:text-base leading-relaxed">
                <TranscriptBody chunks={transcriptChunks} highlight={highlight} paragraphRefs={paragraphRefs} />
              </div>
            </div>
          ) : (
            <div className="w-full aspect-video">
              <div ref={playerHostRef} className="w-full h-full" />
            </div>
          )}
        </div>

        <div className={`${layoutMode === 'side' ? 'w-full' : 'w-1/3'} p-4 md:p-6 overflow-y-auto`}>
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl mb-1 text-black dark:text-white">{concept}</h2>
              <p className="text-base md:text-lg text-black dark:text-white opacity-70">{author}</p>
            </div>

            <div className="space-y-3 text-base">
              <div>
                <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 mb-1">Concept</div>
                <div className="text-black dark:text-white">{collection}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 mb-1">Duration</div>
                <div className="text-black dark:text-white">{record.durationLabel || '-'}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 mb-1">Language</div>
                <div className="text-black dark:text-white">{transcriptInfo.label || languageLabel(preferredLanguage || activeSubtitle || 'en', 'Auto')}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 mb-1">Subtitles</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSubtitleOverride(null)}
                    className={`text-sm px-2 py-1 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer ${!subtitleOverride ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-black dark:text-white'}`}
                  >
                    Auto
                  </button>
                  {record.subtitles.map((subtitle) => {
                    const code = normalizeLanguageCode(subtitle.code || subtitle.label);
                    const active = normalizeLanguageCode(subtitleOverride || activeSubtitle || '') === code;
                    return (
                      <button
                        key={subtitle.code || subtitle.label}
                        type="button"
                        onClick={() => setSubtitleOverride(code)}
                        className={`text-sm px-2 py-1 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer ${active ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-black dark:text-white'}`}
                      >
                        {subtitle.label || languageLabel(code, code)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {keywords.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 mb-1">Keywords</div>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword) => (
                      <button
                        key={keyword}
                        onClick={() => onKeywordClick?.(keyword)}
                        className="text-sm px-2 py-1 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer text-black dark:text-white"
                        type="button"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {transcriptInfo.text && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 mb-1">Transcript</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setTranscriptModalOpen(true)}
                      className="text-sm px-2 py-1 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer text-black dark:text-white"
                    >
                      <FileText className="inline w-4 h-4 mr-1" />Open
                    </button>
                    <button
                      type="button"
                      onClick={downloadTranscript}
                      className="text-sm px-2 py-1 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer text-black dark:text-white"
                    >
                      <Download className="inline w-4 h-4 mr-1" />TXT
                    </button>
                    <button
                      type="button"
                      onClick={() => exportTranscriptPdf(record, transcriptInfo.text, transcriptInfo.label, preferredLanguage)}
                      className="text-sm px-2 py-1 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer text-black dark:text-white"
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => onAudioModeChange(!audioMode)}
                      className={`text-sm px-2 py-1 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer ${audioMode ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-black dark:text-white'}`}
                    >
                      <Headphones className="inline w-4 h-4 mr-1" />Audio
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TranscriptModal
        open={transcriptModalOpen}
        title={`${concept}${transcriptInfo.label ? ` (${transcriptInfo.label})` : ''}`}
        onClose={() => setTranscriptModalOpen(false)}
        actions={
          <>
            <button type="button" onClick={downloadTranscript} className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/80 transition hover:border-white/50 hover:text-white">
              TXT
            </button>
            <button type="button" onClick={() => exportTranscriptPdf(record, transcriptInfo.text, transcriptInfo.label, preferredLanguage)} className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/80 transition hover:border-white/50 hover:text-white">
              PDF
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

function TranscriptBody({ chunks, highlight, paragraphRefs }: { chunks: TranscriptChunk[]; highlight: HighlightRange | null; paragraphRefs: React.MutableRefObject<Array<HTMLParagraphElement | null>> }) {
  if (!chunks.length) {
    return <p className="text-white/60">No transcript available.</p>;
  }

  return (
    <div className="space-y-4 text-white/85">
      {chunks.map((chunk, chunkIndex) => (
        <p key={`${chunkIndex}-${chunk.text.slice(0, 18)}`} ref={(node) => { paragraphRefs.current[chunkIndex] = node; }}>
          {chunk.tokens.map((token, tokenIndex) => {
            if (!token.isWord) {
              return <span key={`${chunkIndex}-${tokenIndex}`}>{token.text}</span>;
            }

            const isActive = highlight?.chunkIndex === chunkIndex && token.wordIndex >= highlight.start && token.wordIndex <= highlight.end;
            return (
              <span key={`${chunkIndex}-${tokenIndex}`} className={isActive ? 'bg-white text-black' : ''}>
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
    if (!tracks?.length) return '';

    const preferred = normalizeLanguageCode(requestedLanguage);
    const normalizedTracks = tracks.map((track) => ({
      raw: track,
      code: normalizeLanguageCode(track.language || track.label || ''),
    }));

    const choice = normalizedTracks.find((track) => track.code === preferred)
      || normalizedTracks.find((track) => track.code === 'en')
      || normalizedTracks[0];

    if (!choice?.raw) return '';
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
  if (payload.cue?.text) return payload.cue.text;
  return payload.text || '';
}

function cancelScrollAnimation(frameId: number | null): void {
  if (frameId !== null) cancelAnimationFrame(frameId);
}

function prepareTranscriptChunks(text: string): TranscriptChunk[] {
  return formatTranscriptParagraphs(text).map((paragraph) => {
    const tokens = tokenizeChunkText(paragraph);
    let wordIndex = 0;
    const normalizedTokens = tokens.map((token) => {
      if (!token.isWord) return { ...token, wordIndex: -1 };
      const next = { ...token, wordIndex };
      wordIndex += 1;
      return next;
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
    tokens.push({ text: raw, isWord, canonical: isWord ? canonicalWord(raw) : '' });
  }

  return tokens;
}

function findHighlightRange(chunks: TranscriptChunk[], cueText: string): HighlightRange | null {
  const canonicalCue = canonicalCueString(cueText);
  if (!canonicalCue) return null;

  const cueWords = canonicalCue.split(/\s+/).filter(Boolean);
  const cueWordSet = new Set(cueWords);
  let bestIndex = -1;
  let bestScore = 0;

  chunks.forEach((chunk, index) => {
    let score = 0;
    if (chunk.canonical === canonicalCue) {
      score = 1000;
    } else {
      if (chunk.canonical.includes(canonicalCue)) score += 400;
      if (canonicalCue.includes(chunk.canonical)) score += 350;
      if (cueWords.length && chunk.words.length) {
        let overlap = 0;
        chunk.words.forEach((word) => {
          if (cueWordSet.has(word)) overlap += 1;
        });
        if (overlap) score += overlap * 25 + (overlap / cueWords.length) * 120 + (overlap / chunk.words.length) * 80;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  if (bestIndex === -1) return null;

  const range = determineWordRange(chunks[bestIndex], cueWords);
  return range ? { chunkIndex: bestIndex, start: range.start, end: range.end } : { chunkIndex: bestIndex, start: 0, end: Math.max(0, chunks[bestIndex].words.length - 1) };
}

function determineWordRange(chunk: TranscriptChunk, cueWords: string[]): { start: number; end: number } | null {
  if (!chunk.words.length || !cueWords.length) return null;

  for (let start = 0; start <= chunk.words.length - cueWords.length; start += 1) {
    let matches = true;
    for (let offset = 0; offset < cueWords.length; offset += 1) {
      if (chunk.words[start + offset] !== cueWords[offset]) {
        matches = false;
        break;
      }
    }
    if (matches) return { start, end: start + cueWords.length - 1 };
  }

  let cueIndex = 0;
  let first = -1;
  let last = -1;
  for (let wordIndex = 0; wordIndex < chunk.words.length && cueIndex < cueWords.length; wordIndex += 1) {
    if (chunk.words[wordIndex] === cueWords[cueIndex]) {
      if (first === -1) first = wordIndex;
      last = wordIndex;
      cueIndex += 1;
    }
  }

  if (cueIndex > 0 && first !== -1) return { start: first, end: last };

  const cueWordSet = new Set(cueWords);
  let min = Infinity;
  let max = -1;
  chunk.words.forEach((word, index) => {
    if (cueWordSet.has(word)) {
      min = Math.min(min, index);
      max = Math.max(max, index);
    }
  });

  if (Number.isFinite(min) && max >= min) return { start: min, end: max };
  return null;
}

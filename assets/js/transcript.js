// assets/js/transcript.js
import { $, escapeHtml } from './utils.js';
import { exportSingleTranscriptPdf } from './pdf.js';

const tmodal    = $('#tmodal');
const tclose    = $('#tclose');
const tTitle    = $('#tTitle');
const tBody     = $('#tBody');
const tdownload = $('#tdownload');
const tdownloadPdf = $('#tdownloadPdf');

const DEFAULT_TITLE = 'Transcript';

let currentTranscript = {
  id: '',
  title: DEFAULT_TITLE,
  text: '',
  lang: '',
  label: ''
};

function formatTranscript(txt){
  if (!txt) return '<em style="color:var(--muted)">No transcript available.</em>';
  const norm = String(txt).replace(/\r\n/g,'\n').replace(/\r/g,'\n').trim();
  let parts = norm.includes('\n\n')
    ? norm.split(/\n\n+/)
    : norm.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Ý0-9])/);
  parts = parts.map(p => p.replace(/\n+/g,' ').trim()).filter(Boolean);
  return parts.map((p, idx) => `<p class="transcript-paragraph" data-transcript-chunk="${idx}"><span class="transcript-chunk" data-transcript-chunk="${idx}">${escapeHtml(p)}</span></p>`).join('');
}

function makeFileName(title){
  return String(title || 'Transcript').replace(/[\/:*?"<>|]+/g,'_').slice(0,120);
}

function transcriptDisplayTitle(){
  const base = currentTranscript.title || DEFAULT_TITLE;
  return currentTranscript.label ? `${base} (${currentTranscript.label})` : base;
}

function applyTranscriptToModal(){
  if (!tTitle || !tBody) return;
  tTitle.textContent = transcriptDisplayTitle();
  tBody.innerHTML = formatTranscript(currentTranscript.text);
  if (currentTranscript.lang) {
    tBody.setAttribute('data-lang', currentTranscript.lang);
  } else {
    tBody.removeAttribute('data-lang');
  }
}

function reflectDownloadAvailability(){
  const hasText = !!currentTranscript.text;
  if (tdownload) {
    tdownload.disabled = !hasText;
    tdownload.setAttribute('aria-disabled', hasText ? 'false' : 'true');
  }
  if (tdownloadPdf) {
    tdownloadPdf.disabled = !hasText;
    tdownloadPdf.setAttribute('aria-disabled', hasText ? 'false' : 'true');
  }
}

function updateTranscriptState(detail = {}) {
  const nextTitle = detail.title || currentTranscript.title || DEFAULT_TITLE;
  currentTranscript = {
    id: detail.id || currentTranscript.id || '',
    title: nextTitle,
    text: typeof detail.text === 'string' ? detail.text : '',
    lang: detail.lang || '',
    label: detail.label || ''
  };
  applyTranscriptToModal();
  reflectDownloadAvailability();
}

function downloadCurrentTranscript(){
  if (!currentTranscript.text) return;
  const title = transcriptDisplayTitle();
  const blob = new Blob([currentTranscript.text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = makeFileName(title) + ' — disnovation.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function bindTranscript(){
  if (!tmodal || !tclose || !tTitle || !tBody) {
    console.warn('[transcript] modal elements missing in DOM');
    return;
  }

  applyTranscriptToModal();
  reflectDownloadAvailability();

  document.addEventListener('transcript:updated', (e) => {
    updateTranscriptState(e?.detail || {});
  });

  document.addEventListener('transcript:open-request', () => {
    applyTranscriptToModal();
    tmodal.classList.add('open');
  });

  document.addEventListener('transcript:download-request', () => {
    downloadCurrentTranscript();
  });

  // Close
  tclose.addEventListener('click', () => tmodal.classList.remove('open'));
  tmodal.addEventListener('click', (e) => { if (e.target === tmodal) tmodal.classList.remove('open'); });

  // Download .txt
  if (tdownload) {
    tdownload.addEventListener('click', downloadCurrentTranscript);
  }

  // Download .pdf
  if (tdownloadPdf) {
    tdownloadPdf.addEventListener('click', ()=>{
      if (!currentTranscript.text) return;
      exportSingleTranscriptPdf({ title: transcriptDisplayTitle(), transcript: currentTranscript.text });
    });
  }
}

// ✅ Optional: allow other modules to close transcript modal
export function closeTranscriptModal(){
  const tmodal = document.getElementById('tmodal');
  if (tmodal) tmodal.classList.remove('open');
}

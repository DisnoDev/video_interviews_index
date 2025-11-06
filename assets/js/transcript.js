// assets/js/transcript.js
import { $, escapeHtml } from './utils.js';
import { FILTERED, indexOfIdInFiltered } from './table.js';
import { getTranscriptForRow, languageLabel, normalizeLanguageCode } from './lang.js';
import { exportSingleTranscriptPdf } from './pdf.js';

const tmodal    = $('#tmodal');
const tclose    = $('#tclose');
const tTitle    = $('#tTitle');
const tBody     = $('#tBody');
const tdownload = $('#tdownload');
const tdownloadPdf = $('#tdownloadPdf');

function formatTranscript(txt){
  if (!txt) return '<em style="color:var(--muted)">No transcript available.</em>';
  const norm = String(txt).replace(/\r\n/g,'\n').replace(/\r/g,'\n').trim();
  let parts = norm.includes('\n\n')
    ? norm.split(/\n\n+/)
    : norm.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Ý0-9])/);
  parts = parts.map(p => p.replace(/\n+/g,' ').trim()).filter(Boolean);
  return parts.map((p, idx) => `<p class="transcript-paragraph" data-transcript-chunk="${idx}"><span class="transcript-chunk" data-transcript-chunk="${idx}">${escapeHtml(p)}</span></p>`).join('');
}

function decodeHtml(html){
  const x = document.createElement('textarea');
  x.innerHTML = html;
  return x.value;
}

function makeFileName(title){
  return String(title || 'Transcript').replace(/[\/:*?"<>|]+/g,'_').slice(0,120);
}

function activeSubtitleLanguage(){
  const controls = document.getElementById('subtitleControls');
  if (controls) {
    const active = controls.getAttribute('data-active-lang');
    if (active) return active;
    const applied = controls.getAttribute('data-transcript-lang');
    if (applied) return applied;
  }
  try {
    return (localStorage.getItem('pg_pref_lang') || '').toLowerCase();
  } catch {
    return '';
  }
}

function resolveRowForButton(btn){
  if (!btn) return null;
  const tr = btn.closest('tr');
  if (!tr) return null;
  const id = tr.dataset.id || '';
  if (!id) return null;
  const idx = indexOfIdInFiltered(id);
  if (idx === -1) return null;
  return FILTERED[idx] || null;
}

function labelForLanguage(lang, fallback = '') {
  if (!lang) return fallback;
  const lower = String(lang).toLowerCase();
  if (lower === 'default') return fallback;
  const norm = normalizeLanguageCode(lang);
  return languageLabel(norm || lang, fallback);
}

export function bindTranscript(){
  if (!tmodal || !tclose || !tTitle || !tBody) {
    console.warn('[transcript] modal elements missing in DOM');
    return;
  }

  // Open: delegated click
  document.addEventListener('click', (e) => {
    const tbtn = e.target.closest('.tbtn');
    if (!tbtn) return;

    const title = tbtn.dataset.title || 'Transcript';
    const rawAttr = tbtn.dataset.text || '';
    const rawPlain = decodeHtml(rawAttr); // ✅ decode attribute value

    let transcriptText = rawPlain;
    let transcriptLang = tbtn.dataset.lang || '';
    let transcriptLabel = tbtn.dataset.langLabel || '';

    const row = resolveRowForButton(tbtn);
    if (row) {
      const preferredLang = activeSubtitleLanguage();
      const info = getTranscriptForRow(row, preferredLang);
      if (info?.text) {
        transcriptText = info.text;
        if (info.lang) {
          transcriptLang = info.lang;
          transcriptLabel = labelForLanguage(info.lang, transcriptLabel);
        }
      }
    }

    const displayLabel = transcriptLabel || labelForLanguage(transcriptLang);
    const displayTitle = displayLabel ? `${title} (${displayLabel})` : title;

    tTitle.textContent = displayTitle;
    tBody.innerHTML = formatTranscript(transcriptText);
    if (transcriptLang) {
      const norm = normalizeLanguageCode(transcriptLang);
      if (norm) {
        tBody.setAttribute('data-lang', norm);
      } else {
        tBody.removeAttribute('data-lang');
      }
    } else {
      tBody.removeAttribute('data-lang');
    }
    tmodal.classList.add('open');
  });

  // Close
  tclose.addEventListener('click', () => tmodal.classList.remove('open'));
  tmodal.addEventListener('click', (e) => { if (e.target === tmodal) tmodal.classList.remove('open'); });

  // Download .txt
  if (tdownload) {
    tdownload.addEventListener('click', ()=>{
      const title = tTitle.textContent || 'Transcript';
      const rawPlain = tBody.innerText || '';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([rawPlain], { type: 'text/plain;charset=utf-8' }));
      a.download = makeFileName(title) + ' — disnovation.txt';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
    });
  }

  // Download .pdf
  if (tdownloadPdf) {
    tdownloadPdf.addEventListener('click', ()=>{
      const title = tTitle.textContent || 'Transcript';
      const rawPlain = tBody.innerText || '';
      exportSingleTranscriptPdf({ title, transcript: rawPlain });
    });
  }
}

// ✅ Optional: allow other modules to close transcript modal
export function closeTranscriptModal(){
  const tmodal = document.getElementById('tmodal');
  if (tmodal) tmodal.classList.remove('open');
}

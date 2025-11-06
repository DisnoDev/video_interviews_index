// assets/js/transcript.js
import { $, escapeHtml } from './utils.js';
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

    tTitle.textContent = title;
    tBody.innerHTML = formatTranscript(rawPlain);
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

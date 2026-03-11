// assets/js/pdf.js
import { $, escapeHtml } from './utils.js';
import { getFiltered } from './table.js';

function vimeoThumbUrl(id){ return id ? `https://vumbnail.com/${id}.jpg` : ''; }

// Turn raw transcript text into paragraphs for print
function formatTranscript(txt) {
  if (!txt) return '';
  const norm = String(txt).replace(/\r\n/g,'\n').replace(/\r/g,'\n').trim();
  let parts = norm.includes('\n\n') ? norm.split(/\n\n+/) : norm.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Ý0-9])/);
  parts = parts.map(p => p.replace(/\n+/g,' ').trim()).filter(Boolean);
  return parts.map(p => `<p>${escapeHtml(p)}</p>`).join('');
}

export function bindPdfExport() {
  const btn = $('#exportPdfBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const includeTranscript = true; // always include transcripts in the PDF
    const rows = getFiltered();
    if (!rows || !rows.length) {
      alert('No items to export. Adjust your filters or search.');
      return;
    }

    // Build print document in a new window
    const w = window.open('', '_blank');
    if (!w) { alert('Pop-up blocked. Please allow pop-ups to export PDF.'); return; }

    const css = `
@page { size: A4; margin: 18mm; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans';
  color: #111; background: #fff; font-size: 11pt; line-height: 1.45;
}
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10mm; }
.header .left h1 { margin: 0 0 2mm 0; font-size: 16pt; }
.header .left .meta { color: #666; font-size: 10pt; }
.item { page-break-after: always; }
.item:last-child { page-break-after: auto; }
h2 { margin: 0 0 3mm 0; font-size: 14pt; }
.byline { color: #333; margin: 0 0 4mm 0; }
.grid { display: grid; grid-template-columns: 32mm 1fr; gap: 6mm; align-items: start; }
.thumb { width: 32mm; height: 18mm; object-fit: cover; border: 1px solid #ddd; border-radius: 2mm; }
.meta { margin: 4mm 0; font-size: 9.5pt; color: #333; }
.meta .lab { color: #666; }
.tags { margin: 2mm 0 0 0; display: flex; flex-wrap: wrap; gap: 2.5mm; }
.tag { font-size: 8pt; text-transform: uppercase; letter-spacing: .04em; border: 1px solid #ddd; border-radius: 999px; padding: 1mm 2.5mm; }
.transcript { margin-top: 4mm; font-size: 10.5pt; }
a { color: #0a66cc; text-decoration: none; }
hr { border: 0; border-top: 1px solid #e6e6e6; margin: 5mm 0; }
.footer { margin-top: 8mm; font-size: 9pt; color: #666; }
@media screen {
  body { padding: 16px; background: #f6f6f6; }
  .sheet { background: white; margin: 0 auto 16px auto; padding: 18mm; width: 210mm; min-height: 297mm; box-shadow: 0 3px 18px rgba(0,0,0,.12); }
}
`;

    const now = new Date();
    const printedOn = now.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

    const head = `
<!doctype html>
<html><head>
<meta charset="utf-8"/>
<title>DISNOVATION.ORG — Video Index (PDF Export)</title>
<style>${css}</style>
</head><body>
<div class="sheet">
  <div class="header">
    <div class="left">
      <h1>DISNOVATION.ORG — Video Index</h1>
      <div class="meta">Printed on ${escapeHtml(printedOn)}</div>
    </div>
    <div class="right">
      <img src="https://placehold.co/80x80/EEE/31343C?font=roboto&text=DISNOVATION.ORG" alt="Logo" style="width:18mm; height:18mm; object-fit:cover; border:1px solid #ddd; border-radius:3mm;">
    </div>
  </div>
`;

    // Build each item
    const itemsHtml = rows.map((r, i) => {
      const notion = r['Notion'] || '';
      const person = r['Interviewee name'] || '';
      const year = r['Year'] || '';
      const coll = r['Collection'] || '';
      const dur = r['Duration (s)'] || '';
      const link = r['Link'] || '';
      const kw = (r['Keywords'] || '').split(/[,;] */).filter(Boolean);
      const transcript = r['Transcript'] || '';
      const id = (link.match(/(\d{6,})/) || [])[1] || '';
      const thumb = vimeoThumbUrl(id);

      const durationFmt = (s) => {
        const n = Number(s || 0);
        const h = Math.floor(n/3600), m = Math.floor((n%3600)/60), sec = Math.floor(n%60);
        return n ? (h ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`) : '';
      };

      return `
<section class="item">
  <div class="grid">
    <img class="thumb" src="${thumb}" alt="Thumbnail">
    <div>
      <h2>${escapeHtml(notion)}</h2>
      <div class="byline">${escapeHtml(person)}</div>

      <div class="meta">
        <span class="lab">Link:</span> <a href="${escapeHtml(link)}">${escapeHtml(link)}</a><br/>
        ${year ? `<span class="lab">Year:</span> ${escapeHtml(year)} &nbsp; ` : ``}
        ${coll ? `<span class="lab">Collection:</span> ${escapeHtml(coll)} &nbsp; ` : ``}
        ${dur ? `<span class="lab">Duration:</span> ${escapeHtml(durationFmt(dur))}` : ``}
      </div>

      ${kw.length ? `<div class="tags">${kw.map(k=>`<span class="tag">${escapeHtml(k).toUpperCase()}</span>`).join('')}</div>` : ``}

      ${includeTranscript && transcript && !/^https?:\/\//i.test(transcript)
        ? `<div class="transcript"><hr>${formatTranscript(transcript)}</div>`
        : ``}
    </div>
  </div>
</section>
`;
    }).join('\n');

    const foot = `
  <div class="footer">
    Generated from the DISNOVATION.ORG video index. For details and updates, visit <a href="https://disnovation.org" target="_blank" rel="noopener">disnovation.org</a>.
  </div>
</div>
<script>
  // Auto-open print dialog after layout paints
  setTimeout(function(){ window.print(); }, 300);
</script>
</body></html>
`;

    w.document.open();
    w.document.write(head + itemsHtml + foot);
    w.document.close();
    w.focus();
  });
}



// ---- shared theme for all PDFs (edit to match your site aesthetics) ----
function pdfThemeCss(){
  return `
@page { size: A4; margin: 18mm; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
:root{
  --ink: #111; --muted:#666; --line:#e6e6e6; --accent:#0a66cc;
}
body {
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans';
  color: var(--ink); background: #fff; font-size: 11pt; line-height: 1.45;
}
a { color: var(--accent); text-decoration: none; }
hr { border: 0; border-top: 1px solid var(--line); margin: 5mm 0; }
.header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10mm; }
.header .left h1 { margin:0 0 2mm 0; font-size: 16pt; }
.header .left .meta { color: var(--muted); font-size: 10pt; }
.brand { width:18mm; height:18mm; object-fit:cover; border:1px solid var(--line); border-radius:3mm; }
.sheet { }
.h2 { font-size: 14pt; margin: 0 0 3mm 0; }
.byline { color:#333; margin: 0 0 4mm 0; }
.meta { margin: 4mm 0; font-size: 9.5pt; color: #333; }
.meta .lab { color: var(--muted); }
.transcript { margin-top: 4mm; font-size: 10.5pt; }
.transcript p { margin: 0 0 3.5mm 0; }
.footer { margin-top: 8mm; font-size: 9pt; color: var(--muted); }
@media screen {
  body { padding: 16px; background: #f6f6f6; }
  .sheet { background: white; margin: 0 auto 16px auto; padding: 18mm; width: 210mm; min-height: 297mm; box-shadow: 0 3px 18px rgba(0,0,0,.12); }
}
`;}

// ---- util: format transcript text into paragraphs ----
function formatTranscriptHtml(txt) {
  if (!txt) return '<em style="color:var(--muted)">No transcript available.</em>';
  const norm = String(txt).replace(/\r\n/g,'\n').replace(/\r/g,'\n').trim();
  let parts = norm.includes('\n\n') ? norm.split(/\n\n+/) : norm.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Ý0-9])/);
  parts = parts.map(p => p.replace(/\n+/g,' ').trim()).filter(Boolean);
  return parts.map(p => `<p>${escapeHtml(p)}</p>`).join('');
}

// ---- PUBLIC: export a single transcript as A4 PDF ----
export function exportSingleTranscriptPdf(opts){
  // opts: { title, transcript, subtitle?, link?, year?, collection?, duration? }
  const {
    title = 'Transcript',
    transcript = '',
    subtitle = '', // optional small description line if you want
    link = '',
    year = '',
    collection = '',
    duration = ''
  } = opts || {};

  const css = pdfThemeCss();
  const now = new Date();
  const printedOn = now.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const head = `
<!doctype html>
<html><head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)} — PDF</title>
<style>${css}</style>
</head><body>
<div class="sheet">
  <div class="header">
    <div class="left">
      <h1>DISNOVATION.ORG — Transcript</h1>
      <div class="meta">Printed on ${escapeHtml(printedOn)}</div>
    </div>
    <div class="right">
      <img class="brand" src="https://placehold.co/80x80/EEE/31343C?font=roboto&text=DISNOVATION.ORG">
    </div>
  </div>
`;

  const metaBlock = `
  <h2 class="h2">${escapeHtml(title)}</h2>
  ${subtitle ? `<div class="byline">${escapeHtml(subtitle)}</div>` : ``}
  ${(link || year || collection || duration) ? `
  <div class="meta">
    ${link ? `<span class="lab">Link:</span> <a href="${escapeHtml(link)}">${escapeHtml(link)}</a><br/>` : ``}
    ${year ? `<span class="lab">Year:</span> ${escapeHtml(year)} &nbsp; ` : ``}
    ${collection ? `<span class="lab">Collection:</span> ${escapeHtml(collection)} &nbsp; ` : ``}
    ${duration ? `<span class="lab">Duration:</span> ${escapeHtml(duration)} ` : ``}
  </div>
  ` : ``}
`;

  const body = `
  <div class="transcript">
    <hr/>
    ${formatTranscriptHtml(transcript)}
  </div>
`;

  const foot = `
  <div class="footer">
    Generated from the DISNOVATION.ORG video index. For details and updates, visit <a href="https://disnovation.org" target="_blank" rel="noopener">disnovation.org</a>.
  </div>
</div>
<script>
  setTimeout(function(){ window.print(); }, 200);
</script>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) { alert('Pop-up blocked. Please allow pop-ups to export PDF.'); return; }
  w.document.open();
  w.document.write(head + metaBlock + body + foot);
  w.document.close();
  w.focus();
}

import type { InterviewRecord } from '../types';
import { formatTranscriptParagraphs } from './utils';
import {
  getPreferredAuthor,
  getPreferredCollection,
  getPreferredConcept,
  getPreferredKeywords,
} from './records';
import { transcriptInfoFromRecordLike } from './languages';

function escapeHtml(value: string): string {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] || character));
}

function buildTranscriptHtml(text: string): string {
  return formatTranscriptParagraphs(text).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');
}

function openPrintWindow(html: string, title: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.alert('Pop-up blocked. Please allow pop-ups to export PDF.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.document.title = title;
  printWindow.focus();
}

function sharedCss(): string {
  return `
@page { size: A4; margin: 18mm; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
body { font-family: Georgia, 'Times New Roman', serif; color: #121212; background: #fff; font-size: 11pt; line-height: 1.45; }
a { color: #0b57d0; text-decoration: none; }
.sheet { max-width: 210mm; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: baseline; gap: 12mm; margin-bottom: 8mm; }
.header h1 { font-size: 18pt; margin: 0; }
.header p { margin: 0; color: #666; font-size: 9pt; }
.item { page-break-after: always; border-top: 1px solid #ddd; padding-top: 6mm; margin-top: 6mm; }
.item:first-of-type { border-top: 0; padding-top: 0; margin-top: 0; }
.meta { color: #555; font-size: 9.5pt; margin: 0 0 4mm; }
.thumb { width: 42mm; aspect-ratio: 16 / 9; object-fit: cover; border: 1px solid #ddd; margin-bottom: 4mm; }
.tags { display: flex; flex-wrap: wrap; gap: 2mm; margin: 3mm 0 0; }
.tag { border: 1px solid #ccc; padding: 1mm 2mm; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.04em; }
.transcript { margin-top: 4mm; }
.transcript p { margin: 0 0 3mm; }
@media screen {
  body { background: #efefef; padding: 16px; }
  .sheet { background: #fff; padding: 18mm; box-shadow: 0 6px 24px rgba(0,0,0,0.14); }
}
`;
}

export function exportFilteredRecordsPdf(records: InterviewRecord[], preferredLanguage: string): void {
  if (!records.length) {
    window.alert('No items to export.');
    return;
  }

  const printedOn = new Date().toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const itemsHtml = records.map((record) => {
    const transcript = transcriptInfoFromRecordLike(record.transcripts, record.transcriptOrder, preferredLanguage).text;
    return `
      <section class="item">
        <img class="thumb" src="${escapeHtml(record.thumbnail)}" alt="Thumbnail" />
        <h2>${escapeHtml(getPreferredConcept(record, preferredLanguage))}</h2>
        <div class="meta">${escapeHtml(getPreferredAuthor(record, preferredLanguage))}</div>
        <div class="meta">
          <div><strong>Collection:</strong> ${escapeHtml(getPreferredCollection(record, preferredLanguage))}</div>
          <div><strong>Year:</strong> ${escapeHtml(record.year)}</div>
          <div><strong>Duration:</strong> ${escapeHtml(record.durationLabel)}</div>
          <div><strong>Link:</strong> <a href="${escapeHtml(record.link)}">${escapeHtml(record.link)}</a></div>
        </div>
        ${getPreferredKeywords(record, preferredLanguage).length ? `<div class="tags">${getPreferredKeywords(record, preferredLanguage).map((keyword) => `<span class="tag">${escapeHtml(keyword)}</span>`).join('')}</div>` : ''}
        ${transcript ? `<div class="transcript">${buildTranscriptHtml(transcript)}</div>` : ''}
      </section>
    `;
  }).join('');

  openPrintWindow(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>DISNOVATION.ORG Export</title>
        <style>${sharedCss()}</style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div>
              <h1>DISNOVATION.ORG</h1>
              <p>Video index export</p>
            </div>
            <p>Printed on ${escapeHtml(printedOn)}</p>
          </div>
          ${itemsHtml}
        </div>
        <script>setTimeout(function(){ window.print(); }, 250);</script>
      </body>
    </html>
  `, 'DISNOVATION.ORG Export');
}

export function exportTranscriptPdf(record: InterviewRecord, transcript: string, label: string, preferredLanguage: string): void {
  openPrintWindow(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(getPreferredConcept(record, preferredLanguage))}</title>
        <style>${sharedCss()}</style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div>
              <h1>${escapeHtml(getPreferredConcept(record, preferredLanguage))}</h1>
              <p>${escapeHtml(getPreferredAuthor(record, preferredLanguage))}</p>
            </div>
            <p>${escapeHtml(label)}</p>
          </div>
          <div class="meta">
            <div><strong>Collection:</strong> ${escapeHtml(getPreferredCollection(record, preferredLanguage))}</div>
            <div><strong>Year:</strong> ${escapeHtml(record.year)}</div>
            <div><strong>Duration:</strong> ${escapeHtml(record.durationLabel)}</div>
          </div>
          <div class="transcript">${buildTranscriptHtml(transcript)}</div>
        </div>
        <script>setTimeout(function(){ window.print(); }, 250);</script>
      </body>
    </html>
  `, `${getPreferredConcept(record, preferredLanguage)} Transcript`);
}

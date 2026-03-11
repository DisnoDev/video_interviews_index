// Ensure the modal is closed when the page loads
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modal')?.classList.remove('open');
  setAudioMode(false); document.body.classList.remove('audio-mode');
});


import { loadRecords } from './assets/js/sheets.js';
import { $, $$ } from './assets/js/utils.js';
import { setAudioMode } from './assets/js/prefs.js';
import { DATA, FILTERED, setSort, bindSorting, renderTable, applyFilters, bindRowInteractions, rerenderCurrent } from './assets/js/table.js';
import { bindPlayer } from './assets/js/player-module.js';
import { bindTranscript } from './assets/js/transcript.js';
import { bindToolbar, refreshCollectionFilterOptions, applyCollectionFilterFromUrl } from './assets/js/toolbar.js';
import { bindPdfExport } from './assets/js/pdf.js';
import { initI18n } from './assets/js/i18n.js';
import { DEFAULT_SORT_KEY, DEFAULT_SORT_DIR } from './assets/js/config.js';




async function init(){
  try{
    bindToolbar();
    bindSorting();
    bindRowInteractions();
    bindPlayer();
    bindTranscript();
    bindPdfExport();
    initI18n();
    setSort(DEFAULT_SORT_KEY, DEFAULT_SORT_DIR);

    // 🔄 Re-render Concept column on language change
    document.addEventListener('subtitle:pref-changed', () => {
      try { rerenderCurrent(); } catch (err) { console.warn('subtitle:pref-changed re-render failed', err); }
    });


    const records = await loadRecords();
    DATA.splice(0, DATA.length, ...records);
    const loadingEl = document.getElementById('loadingIndicator');
    if (loadingEl) loadingEl.remove();
    refreshCollectionFilterOptions();
    const appliedFromUrl = applyCollectionFilterFromUrl();
    if (!appliedFromUrl) applyFilters();

  } catch (err){
    console.error(err);
    const loadingEl = document.getElementById('loadingIndicator');
    if (loadingEl) {
      loadingEl.innerHTML = `
        <p>Could not load data. <button id="retryLoad" class="pill" type="button">Retry</button></p>
        <p style="font-size:0.8em;color:var(--muted)">${err.message || 'Unknown error'}</p>
      `;
      document.getElementById('retryLoad')?.addEventListener('click', () => {
        loadingEl.textContent = 'Retrying...';
        init();
      });
    }
  }
}
init();

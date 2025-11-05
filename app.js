// Ensure the modal is closed when the page loads
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modal')?.classList.remove('open');
  try { localStorage.setItem('pg_audio_mode', '0'); document.body.classList.remove('audio-mode'); } catch {}
});


import { loadRecords } from './assets/js/sheets.js';
import { $, $$ } from './assets/js/utils.js';
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
      rerenderCurrent();
    });


    const records = await loadRecords();
    // set module-level DATA (mutable export in table.js)
    // eslint-disable-next-line no-import-assign
    // after: const records = await loadRecords();
    DATA.splice(0, DATA.length, ...records);
    refreshCollectionFilterOptions();
    const appliedFromUrl = applyCollectionFilterFromUrl();
    if (!appliedFromUrl) applyFilters();

  } catch (err){
    console.error(err);
    alert('Failed to load data from Google Sheets. Make sure the sheet is published or shared publicly.');
  }
}
init();

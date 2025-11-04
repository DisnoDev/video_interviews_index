import { $, $$, escapeHtml, escapeAttr, durationFmt, extractVimeoId, vimeoThumbUrl, cmp } from './utils.js';

export let DATA = [];
export let FILTERED = [];
export let sortKey, sortDir;

let collectionFilter = '';
let collectionFilterKey = '';

export function setSort(initialKey, initialDir){
  sortKey = initialKey; sortDir = initialDir;
  const th = $(`#videoTable thead th[data-key="${CSS.escape(sortKey)}"]`);
  if (th) th.setAttribute('data-sort-dir', sortDir);
}

export function bindSorting(){
  $$('#videoTable thead th.sortable').forEach(th=>{
    th.addEventListener('click',()=>{
      const key=th.dataset.key; if(!key) return;
      if (sortKey === key) sortDir = (sortDir === 'asc' ? 'desc' : 'asc'); else { sortKey = key; sortDir = 'asc'; }
      $$('#videoTable thead th.sortable').forEach(h=>h.removeAttribute('data-sort-dir'));
      th.setAttribute('data-sort-dir', sortDir);
      applyFilters();
    });
  });
}

export function rerenderCurrent() {
  renderTable(FILTERED);
}

export function setCollectionFilter(value) {
  collectionFilter = (value || '').trim();
  collectionFilterKey = normalizeCollectionToken(collectionFilter);
  applyFilters();
}

export function getCollectionFilter() {
  return collectionFilter;
}

export function getCollectionOptions() {
  const seen = new Map();
  DATA.forEach(row => {
    const label = (row['Collection'] || '').trim();
    if (!label) return;
    const key = normalizeCollectionToken(label);
    if (!key || seen.has(key)) return;
    seen.set(key, label);
  });
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

export function renderTable(rows){
  const tbody = $('#videoTable tbody'); tbody.innerHTML = '';
  rows.forEach(row=>{
    const tr=document.createElement('tr');
    const notion = preferredNotion(row);
    const person=row['Interviewee name']||'';
    const coll=row['Collection']||'';
    const year=row['Year']||'';
    const dur=durationFmt(row['Duration (s)']);
    const keywords=row['Keywords']||'';
    const link=row['Link']||'';
    const title=row['Title']||'';
    const transcript=row['Transcript']||'';
    const lateRaw=(row['Late_4s']||'').trim();
    let startAt = 0;
    if (lateRaw) {
      if (/^(1|true|yes)$/i.test(lateRaw)) startAt = 4;
      else {
        const lateNum = Number(lateRaw);
        if (Number.isFinite(lateNum) && lateNum > 0) startAt = lateNum;
      }
    }
    const vid = extractVimeoId(link);
    tr.dataset.id = vid; // ✅ store video id on the row
    tr.dataset.link = link;   // <-- add this so we can read the hash later
    tr.dataset.startAt = String(startAt);

    tr.innerHTML = `
      <td class="col-year">${escapeHtml(year)}</td>
      <td class="col-duration">${escapeHtml(dur)}</td>
 <td class="col-collection">${escapeHtml(coll)}</td>
  <td>${notionLabel(row)}</td>
  <td>${escapeHtml(person)}</td>
  <td class="col-transcript">${renderTranscriptCell(transcript, notion, person)}</td>
  <td class="col-keywords">${renderKeywords(keywords)}</td>    
  <td class="col-hidden">${escapeHtml(title)}</td>
  <td class="col-play"><button class="playBtn" data-id="${vid}" data-start-at="${startAt}" data-title="${escapeAttr(title||notion)}" title="Play">▶</button></td>
`;


// (keep hover preview events)
tr.addEventListener('mousemove', (e)=> showHover(e, vid, notion, person));
tr.addEventListener('mouseleave', hideHover);

tbody.appendChild(tr);
  });
  const countEl = $('#count');
  if (countEl) countEl.textContent = `${rows.length} items`;
}

function normalizeCollectionToken(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function renderKeywords(str){
  if(!str) return '<div class="kw-wrap"></div>';
  const chips = str
    .split(/[,;] */)
    .filter(Boolean)
    .map(k=>`<button class="kbtn" data-keyword="${escapeAttr(k)}" title="Filter by ${escapeAttr(k)}">${escapeHtml(k)}</button>`)
    .join('');
  return `<div class="kw-wrap">${chips}</div>`;
}

function renderTranscriptCell(val, notion, person){
  if(!val) return '<span style="color:var(--muted)">—</span>';
  const safe=escapeAttr(val);
  if(/^https?:\/\//i.test(val)) return `<a href="${safe}" target="_blank" rel="noopener" title="Open transcript in new tab">Open ↗</a>`;
  return `<button class="tbtn" data-title="${escapeAttr(notion + (person? ' — ' + person:''))}" data-text="${safe}">&#x21E9; </button>`;
}


function preferredNotion(row) {
  const pref = (localStorage.getItem('pg_pref_lang') || '').toLowerCase();
  if (pref) {
    const key = `Notion_${pref}`;
    if (row[key] && row[key].trim()) return row[key].trim();
  }
  // fallback to original
  return (row['Notion'] || '').trim();
}

function notionLabel(row) {
  const orig = (row['Notion'] || '').trim();
  const pref = (localStorage.getItem('pg_pref_lang') || '').toLowerCase();
  const key = pref ? `Notion_${pref}` : '';
  const txt = preferredNotion(row);
  const translated = key && row[key] && row[key].trim() && row[key].trim() !== orig;
  return translated
    ? `${txt} <span class="xlate-hint" title="Auto-translated">•</span>`
    : txt;
}



/* Hover preview (module-local) */
const hoverCard = $('#hoverCard'); const hoverImg = $('#hoverImg'); const hoverMeta = $('#hoverMeta');
let hoverId='';
function showHover(e, vid, notion, person){
  if(!vid) return hideHover();
  if(hoverId!==vid){ hoverId=vid; hoverImg.src = vimeoThumbUrl(vid); hoverMeta.textContent = `${notion}${person?' — '+person:''}`; }
  hoverCard.style.display='block';
  const pad=16;
  const x=Math.min(window.innerWidth-hoverCard.offsetWidth-pad, e.clientX+24);
  const y=Math.min(window.innerHeight-hoverCard.offsetHeight-pad, e.clientY+24);
  hoverCard.style.left=x+'px'; hoverCard.style.top=y+'px';
}
function hideHover(){ hoverCard.style.display='none'; }

export function applyFilters(){
  const q = ($('#search').value || '').trim().toLowerCase();
  const hasQuery = !!q;
  FILTERED = DATA.filter(r=>{
    if (collectionFilterKey) {
      const rowKey = normalizeCollectionToken(r['Collection'] || '');
      if (rowKey !== collectionFilterKey) return false;
    }
    if (!hasQuery) return true;
    const hay=[r['Notion'], r['Interviewee name'], r['Title'], r['Keywords'], r['Collection'], r['Year']].join(' ').toLowerCase();
    return hay.includes(q);
  });



  FILTERED.sort((a,b)=>{
    // numeric-friendly for Duration (s) and Year if possible
    const aVal = a[sortKey]; const bVal = b[sortKey];
    const aNum = Number(aVal); const bNum = Number(bVal);
    const bothNum = !isNaN(aNum) && !isNaN(bNum);
    let res = bothNum ? (aNum - bNum) : String(aVal ?? '').localeCompare(String(bVal ?? ''), undefined, {sensitivity:'base'});
    return sortDir === 'asc' ? res : -res;
  });

  renderTable(FILTERED);
}

/* Event wiring for search, chips, play, transcript */
// === PATCH table.js: bindRowInteractions (delegated click) ===
export function bindRowInteractions() {
  document.addEventListener('click', (e) => {
    // 1) Keyword chip → filter
    const chip = e.target.closest('.kbtn');
    if (chip) {
      $('#search').value = chip.dataset.keyword;
      applyFilters();
      return;
    }

    // 2) Explicit play button
    const pb = e.target.closest('.playBtn');
    if (pb) {
      const startAt = Number(pb.dataset.startAt || 0);
      document.dispatchEvent(new CustomEvent('row:play', { detail: { id: pb.dataset.id, startAt } }));
      return;
    }

    // 3) Row click → play (ignore interactive elements)
    const tr = e.target.closest('#videoTable tbody tr');
    if (!tr) return;
    if (e.target.closest('a,button,.kbtn,.tbtn')) return;

    const id = tr.dataset.id;
    const startAt = Number(tr.dataset.startAt || 0);
    if (id) {
      document.dispatchEvent(new CustomEvent('row:play', { detail: { id, startAt } }));
    }
  });

  // Keep your existing search handler (don’t remove it)
  $('#search').addEventListener('input', applyFilters);
}



// ✅ Add only this — no duplicate extractVimeoId declaration!
export function indexOfIdInFiltered(id) {
  if (!id) return -1;
  for (let i = 0; i < FILTERED.length; i++) {
    const vid = extractVimeoId(FILTERED[i]['Link'] || '');
    if (vid === id) return i;
  }
  return -1;
}

export function nextPlayableIdFromFiltered(currentIndex) {
  for (let i = currentIndex + 1; i < FILTERED.length; i++) {
    const vid = extractVimeoId(FILTERED[i]['Link'] || '');
    if (vid) return { id: vid, index: i };
  }
  return null; // end reached
}

// assets/js/table.js
export function getFiltered() {
  return FILTERED;
}
export const $  = (sel, el=document) => el.querySelector(sel);
export const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];

export function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }
export function escapeAttr(s){ return escapeHtml(s).replace(/"/g,'&quot;'); }

export function csvToRows(csv){
  const rows = []; let row = []; let i = 0, field = '', inQuotes = false;
  while (i < csv.length) {
    const c = csv[i];
    if (inQuotes) {
      if (c === '"') {
        const next = csv[i+1];
        if (next === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      } else { field += c; i++; continue; }
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  row.push(field); if (row.length > 1 || (row.length === 1 && row[0] !== '')) rows.push(row);
  return rows;
}

export function durationFmt(sec){
  if(!sec) return '';
  const s=Number(sec); const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), r=Math.floor(s%60);
  return h?`${h}:${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`:`${m}:${String(r).padStart(2,'0')}`;
}

// utils.js
export function extractVimeoId(url){
  // supports vimeo.com/ID, vimeo.com/video/ID, player.vimeo.com/video/ID, vimeo.com/manage/videos/ID (+ query/hash)
  const m = String(url || '').match(
    /(?:player\.)?vimeo\.com\/(?:video\/|manage\/videos\/)?(\d{6,})(?:\b|\/|\?|#)/
  );
  return m ? m[1] : '';
}


export const vimeoThumbUrl = id => id?`https://vumbnail.com/${id}.jpg`:'';
export const vimeoEmbedUrl = (id, autoplay=true) => `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0${autoplay?'&autoplay=1':''}`;

export function cmp(a,b,dir){
  const na=Number(a), nb=Number(b);
  const isNum=!isNaN(na)&&!isNaN(nb);
  let res= isNum ? (na-nb) : String(a||'').localeCompare(String(b||''), undefined, {sensitivity:'base'});
  return dir==='asc'?res:-res;
}

// utils.js
export function extractVimeoHash(url){
  try {
    const u = new URL(url);
    return u.searchParams.get('h') || '';
  } catch { return ''; }
}

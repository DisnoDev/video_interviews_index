import { SHEET_ID, GID, USE_CSV_PUBLISH, CSV_URL } from './config.js';
import { csvToRows } from './utils.js';

async function fetchWithRetry(url, opts, maxRetries = 2) {
  let lastErr;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return res;
    } catch (err) {
      lastErr = err;
      if (i < maxRetries) await new Promise(r => setTimeout(r, 300 * (2 ** i)));
    }
  }
  throw lastErr;
}

export async function fetchSheetCsv(){
  if(USE_CSV_PUBLISH && CSV_URL){
    const r = await fetchWithRetry(CSV_URL, {cache:'no-store'});
    return await r.text();
  }
  const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv${GID?`&gid=${GID}`:''}`;
  const res = await fetchWithRetry(url, {cache:'no-store'});
  return await res.text();
}

export function toRecords(rows){
  const headers = rows[0].map(h=>h.trim());
  return rows.slice(1).map(r => Object.fromEntries(headers.map((h,i)=>[h,(r[i]||'').trim()])));
}

export async function loadRecords(){
  const csv = await fetchSheetCsv();
  const rows = csvToRows(csv);
  const recs = toRecords(rows);
  return recs.filter(r => (r['Link']||'').startsWith('http'));
}

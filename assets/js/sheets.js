import { SHEET_ID, GID, USE_CSV_PUBLISH, CSV_URL } from './config.js';
import { csvToRows } from './utils.js';

export async function fetchSheetCsv(){
  if(USE_CSV_PUBLISH && CSV_URL){
    const r=await fetch(CSV_URL,{cache:'no-store'});
    return await r.text();
  }
  const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv${GID?`&gid=${GID}`:''}`;
  const res=await fetch(url,{cache:'no-store'});
  if(!res.ok) throw new Error('Could not fetch CSV from Google Sheets');
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

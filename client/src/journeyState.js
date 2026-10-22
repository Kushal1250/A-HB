export const progressKey = 'october-garden-progress-v2';
export function cleanProgress(raw, chapters, photoIds=[]) {
  const ids=chapters.map(c=>c.id);
  const base={v:2,unlocked:[],active:ids[0]||'',wish:'',seen:[]};
  if(!raw || raw.v!==2)return base;
  return {...base,unlocked:[...new Set((Array.isArray(raw.unlocked)?raw.unlocked:[]).filter(id=>ids.includes(id)))],active:ids.includes(raw.active)?raw.active:base.active,
    wish:typeof raw.wish==='string'?raw.wish.slice(0,300):'',seen:[...new Set((Array.isArray(raw.seen)?raw.seen:[]).filter(id=>photoIds.includes(id)))]};
}
export function readProgress(chapters, photoIds) {
  try{return cleanProgress(JSON.parse(localStorage.getItem(progressKey)),chapters,photoIds);}catch{return cleanProgress(null,chapters,photoIds);}
}
export function writeProgress(progress) {try{localStorage.setItem(progressKey,JSON.stringify(progress));return true;}catch{return false;}}
export function canUnlock(id,chapters,unlocked) {const index=chapters.findIndex(c=>c.id===id);return ((id==='wishes'||id==='memories')&&index>=0)||index===0||index>0&&unlocked.includes(chapters[index-1].id);}

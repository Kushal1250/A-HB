import {birthdaySongPlan} from '../../shared/song-plan.js';
import recordings from '../../shared/assets/journey/manifest.json';
import {normaliseJourney,unlockKinds,newLetter} from '../../shared/journey.js';
export default function JourneyEditor({value,media,onChange,onLetter,onUploadSong,uploadBusy=false,uploadProgress=null}) {
  const j=normaliseJourney(value);const update=(key,v)=>onChange({...j,[key]:v});
  const chapter=(id,key,v)=>update('chapters',j.chapters.map(c=>c.id===id?{...c,[key]:v}:c));
  const selectTrack=(id,trackId)=>{const original=recordings.find(m=>m.id===trackId),uploaded=media.find(m=>m.mediaId===trackId);update('chapters',j.chapters.map(c=>c.id!==id?c:{...c,trackId:trackId||null,trackTitle:original?.title||uploaded?.originalName||'',artist:original?'Original synthesised composition':'',source:original?'scripts/compose-journey.py':trackId?'Local uploaded recording':'',license:original?'Original project recording, included for use with this birthday website.':trackId?'User-supplied recording; rights not independently verified.':'',provenance:original?'original':'supplied',duration:original?.duration||0}));};
  const move=(i,d)=>{const cs=[...j.chapters];[cs[i],cs[i+d]]=[cs[i+d],cs[i]];update('chapters',cs);};
  return <section className="editor-panel"><h2>The keys to your new year</h2><p>Nine chapters, nine local soundtracks. The visitor starts on a brown background and can switch to green.</p><p>Your requested nine-song plan is listed in each chapter below. The commercial recordings are not included: upload your MP3/WAV files to assign them. Existing music remains selected until replaced. Save and publish after uploading.</p>
    <label className="checkbox-label"><input type="checkbox" checked={j.enabled} onChange={e=>update('enabled',e.target.checked)}/>Use the keyed birthday journey</label>
    <label className="checkbox-label"><input type="checkbox" checked={j.autoplay} onChange={e=>update('autoplay',e.target.checked)}/>Attempt music playback on arrival (browsers may require a click)</label>
    <label>Default music volume<input type="range" min="0" max="1" step="0.01" value={j.volume} onChange={e=>update('volume',Number(e.target.value))}/><span>{Math.round(j.volume*100)}%</span></label>
    <label>Motion intensity<select value={j.intensity} onChange={e=>update('intensity',e.target.value)}><option value="gentle">Gentle</option><option value="full">Full</option><option value="none">No decorative motion</option></select></label>
    <label>Central birthday wish<textarea rows="10" maxLength="3000" value={j.centralWish||''} onChange={e=>update('centralWish',e.target.value)}/></label>
    <label>Scratch reveal threshold<select value={j.scratchThreshold} onChange={e=>update('scratchThreshold',Number(e.target.value))}>{[.2,.3,.4,.5,.6,.7].map(v=><option key={v} value={v}>{Math.round(v*100)}% cleared</option>)}</select></label>
    <label>Lantern shake sensitivity<select value={j.shakeSensitivity} onChange={e=>update('shakeSensitivity',Number(e.target.value))}>{[8,14,20,30].map(v=><option key={v} value={v}>{v} px deliberate movement</option>)}</select></label>
    <details><summary>Use the new birthday letter</summary><p>This replaces only the letter in your current unsaved draft. You can review it before saving.</p><button type="button" onClick={()=>onLetter(newLetter)}>Put the new letter in my draft</button></details>
    {j.chapters.map((c,i)=><div className="j-editor-chapter" key={c.id} style={{borderTop:'1px solid #d9cebb',paddingTop:20,marginTop:25}}><h3 style={{fontSize:21,marginBottom:18}}>{i+1}. {c.title}</h3>
      <label className="checkbox-label"><input type="checkbox" checked={c.visible} onChange={e=>chapter(c.id,'visible',e.target.checked)}/>Show this chapter</label>
      <div className="editor-fields">{[['title','Chapter title',100],['key','Key name',80],['label','Unlock action label',100],['instruction','Unlock helper text',500]].map(([key,label,max])=><label key={key}>{label}<input value={c[key]} required maxLength={max} onChange={e=>chapter(c.id,key,e.target.value)}/></label>)}</div>
      <label>Unlock interaction<select value={c.unlock} onChange={e=>chapter(c.id,'unlock',e.target.value)}>{unlockKinds.map(k=><option key={k} value={k}>{k}</option>)}</select></label>
      {birthdaySongPlan.filter(p=>p.id===c.id).map(plan=><div className="j-song-plan" key={plan.id}>
        <h4>Requested song: {plan.song}</h4><p>{plan.from} · {plan.mood}</p>
        <p>Currently selected: {media.find(m=>m.mediaId===c.trackId)?.originalName||c.trackTitle||'No recording selected'}</p>
        <label>Upload {plan.song} for {c.title}<input type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" disabled={!onUploadSong||uploadBusy} onChange={e=>{const file=e.target.files[0];if(file)onUploadSong?.(file,c.id);e.target.value='';}}/></label>
        {uploadProgress!==null&&uploadBusy&&<p role="status">Uploading audio: {uploadProgress}%</p>}
        <small>Use a recording you have permission to use, up to 15 MB. This assigns the uploaded file only to this chapter. You can also select an existing recording below.</small>
      </div>)}
      <label>Music for {c.title}<select value={c.trackId||''} onChange={e=>selectTrack(c.id,e.target.value)}><option value="">No music for this chapter</option>{media.filter(m=>m.kind==='audio').map(m=><option key={m.mediaId} value={m.mediaId}>{m.originalName}</option>)}</select></label>
      <details><summary>Track credits and source information</summary><div className="editor-fields">{[['trackTitle','Track display title',160],['artist','Artist or composer',160],['source','Recording source',500],['license','Licence or rights notes',500]].map(([key,label,max])=><label key={key}>{label}<input value={c[key]||''} maxLength={max} onChange={e=>chapter(c.id,key,e.target.value)}/></label>)}</div><label>Recording provenance<select value={c.provenance||'original'} onChange={e=>chapter(c.id,'provenance',e.target.value)}><option value="original">Original</option><option value="supplied">User supplied</option><option value="licensed">Licensed recording</option></select></label><label>Duration in seconds<input type="number" min="0" max="86400" step="0.01" value={c.duration||0} onChange={e=>chapter(c.id,'duration',Number(e.target.value))}/></label></details>
      <div className="button-row"><button type="button" disabled={i===0} onClick={()=>move(i,-1)} aria-label={`Move ${c.id} chapter up`}>Move up</button><button type="button" disabled={i===j.chapters.length-1} onClick={()=>move(i,1)} aria-label={`Move ${c.id} chapter down`}>Move down</button></div>
    </div>)}
    <p><small>Hidden chapters are omitted from the visitor map. The Memories and Letter switches in Colours & chapters, and the Divine Blessings switch, also apply. Upload replacement music in Photos & music, then select it for a chapter here. Preview does not autoplay.</small></p>
  </section>;
}

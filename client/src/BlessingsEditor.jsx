import { revealKinds, withStepDefaults } from '../../shared/journey.js';
import { normaliseBlessings } from '../../shared/blessings.js';

export default function BlessingsEditor({value, media, onChange, onUpload, progress}) {
  const b = normaliseBlessings(value);
  const update = (key, v) => onChange({...b,[key]:v});
  const changePhoto = (id,key,v) => {
    const photos=b.photos.map(p=>p.id===id?{...p,[key]:v}:p);
    onChange({...b,photos,featuredId:key==='visible' && !v && b.featuredId===id ? null : b.featuredId});
  };
  const move = (i, delta) => { const photos=[...b.photos];[photos[i],photos[i+delta]]=[photos[i+delta],photos[i]];update('photos',photos); };
  const detach = id => onChange({...b,photos:b.photos.filter(p=>p.id!==id),featuredId:b.featuredId===id?null:b.featuredId});
  const available=media.filter(m=>m.kind==='image'&&!b.photos.some(p=>p.mediaId===m.mediaId));
  const assets=new Map(media.map(m=>[m.mediaId,m]));
  return <section className="editor-panel" aria-labelledby="blessings-editor-title">
    <h2 id="blessings-editor-title">Divine Blessings</h2>
    <p>A separate courtyard for devotional photographs. These images do not appear as personal memories.</p>
    <label className="checkbox-label"><input type="checkbox" checked={b.enabled} onChange={e=>update('enabled',e.target.checked)} />Show the blessings chapter</label>
    <div className="editor-fields">
      {[
        ['title','Chapter heading',120],['intro','Introduction',1500],['prayer','Main birthday blessing',3000],['closing','Final blessing message',1000],
      ].map(([key,label,max])=><label className="full-width" key={key}>{label}{key==='title'?<input value={b[key]} maxLength={max} required onChange={e=>update(key,e.target.value)} />:<textarea value={b[key]} rows={key==='prayer'?6:3} maxLength={max} required onChange={e=>update(key,e.target.value)} />}</label>)}
    </div>
    <p><small>Use {'{shortName}'}, {'{name}'} or {'{sender}'} to personalise these messages.</small></p>
    <div className="dev-editor-settings">{Object.entries(b.interactions).map(([key,checked])=><label className="checkbox-label" key={key}><input type="checkbox" checked={checked} onChange={e=>update('interactions',{...b.interactions,[key]:e.target.checked})} />{{lamp:'Symbolic lamp',flowers:'Flower offering',wishes:'Blessing choices',gratitude:'Gratitude reflection'}[key]}</label>)}</div>
    <label>Featured devotional image<select value={b.featuredId||''} onChange={e=>update('featuredId',e.target.value||null)}><option value="">First visible image</option>{b.photos.filter(p=>p.visible).map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
    <div className="dev-editor-gallery"><h3>Devotional gallery ({b.photos.length} / 40)</h3>
      {b.photos.map((raw,i)=>{const p=withStepDefaults(raw,i);return <div className="memory-editor" key={p.id}>
        {assets.get(p.mediaId)?.thumbnail && <img className="dev-editor-image" src={assets.get(p.mediaId).thumbnail} alt={p.alt} width="100" height="120" loading="lazy" />}
        <div className="memory-fields">
          <label>Devotional image {i+1} title<input value={p.title} required maxLength="120" onChange={e=>changePhoto(p.id,'title',e.target.value)} /></label>
          <label>Devotional image {i+1} caption<textarea value={p.caption} maxLength="500" rows="2" onChange={e=>changePhoto(p.id,'caption',e.target.value)} /></label>
          <label>Devotional image {i+1} description<input value={p.alt} required maxLength="250" onChange={e=>changePhoto(p.id,'alt',e.target.value)} /></label>
          <label>Blessing {i+1} theme<input value={p.theme} required maxLength="100" onChange={e=>changePhoto(p.id,'theme',e.target.value)} /></label>
          <label>Blessing {i+1} message<textarea value={p.blessing} maxLength="1500" rows="3" onChange={e=>changePhoto(p.id,'blessing',e.target.value)} /></label>
          <label>Blessing {i+1} reveal style<select value={p.reveal} onChange={e=>changePhoto(p.id,'reveal',e.target.value)}>{revealKinds.map(k=><option key={k} value={k}>{k}</option>)}</select></label>
          <label className="checkbox-label"><input type="checkbox" checked={p.visible} onChange={e=>changePhoto(p.id,'visible',e.target.checked)} />Visible in the gallery</label>
          <div className="button-row"><button type="button" disabled={i===0} aria-label={`Move devotional image ${i+1} up`} onClick={()=>move(i,-1)}>↑</button><button type="button" disabled={i===b.photos.length-1} aria-label={`Move devotional image ${i+1} down`} onClick={()=>move(i,1)}>↓</button><button type="button" onClick={()=>detach(p.id)}>Remove devotional image {i+1} from draft</button></div>
        </div>
      </div>})}
      <label>Add an existing devotional image<select value="" disabled={b.photos.length>=40} onChange={e=>{if(e.target.value)update('photos',[...b.photos,{id:crypto.randomUUID(),mediaId:e.target.value,title:'A devotional moment',caption:'',alt:'Describe this devotional photograph',visible:true}]);}}><option value="">Choose an uploaded image</option>{available.map(m=><option key={m.mediaId} value={m.mediaId}>{m.originalName}</option>)}</select></label>
    </div>
    <div className="dev-editor-upload"><label>Add a devotional image or MP4 video<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" disabled={b.photos.length>=40} onChange={e=>{const f=e.target.files[0];if(f)onUpload(f);e.target.value='';}} /></label><small>Images: up to 8 MB. MP4 video: up to 15 MB. Uploads are kept on this computer.</small>
      {progress!==null && <p role="status">Uploading devotional media: {progress}%</p>}
    </div>
    <label>Devotional video<select value={b.videoId||''} onChange={e=>update('videoId',e.target.value||null)}><option value="">No video</option>{media.filter(m=>m.kind==='video').map(m=><option key={m.mediaId} value={m.mediaId}>{m.originalName}</option>)}</select></label>
    <label>Video title<input value={b.videoTitle} required maxLength="120" onChange={e=>update('videoTitle',e.target.value)} /></label>
    <label>Video description<textarea value={b.videoDescription} rows="2" required maxLength="1000" onChange={e=>update('videoDescription',e.target.value)} /></label>
    <p><small>Save draft → Preview saved draft → Publish saved draft. Removing an image here keeps its file. Saved draft and published references protect files from deletion.</small></p>
  </section>;
}

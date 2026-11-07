(()=>{'use strict';
const DATA_URL=new URL('./official-updates.json',document.currentScript.src);
const labels={'results':'Results','admit-cards':'Admit Card','answer-keys':'Answer Key'};
const dateFmt=new Intl.DateTimeFormat('hi-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'});
function safeDate(v){const d=new Date(v+'T00:00:00+05:30');return Number.isNaN(d.getTime())?'':dateFmt.format(d)}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
function render(group,items,note){
 const root=document.querySelector('[data-official-updates="'+group+'"]');if(!root)return;
 root.replaceChildren();
 const heading=el('h3','updates-heading','हाल के आधिकारिक अपडेट');root.append(heading);
 const list=el('div','updates-grid');
 const selected=items.filter(x=>x.category===group).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
 if(!selected.length){list.append(el('p','empty-state','अभी इस श्रेणी में सत्यापित नया अपडेट उपलब्ध नहीं है।'));root.append(list);return}
 selected.forEach(item=>{
  const card=el('article','update-card');
  const meta=el('div','update-meta');
  meta.append(el('span','tag '+(item.status==='published'?'open':'status-review'),item.status==='published'?'PUBLISHED':'NOTICE'));
  meta.append(el('span','update-date','जारी: '+safeDate(item.publishedAt)));
  card.append(meta,el('h4','',item.title),el('p','update-org',item.organization),el('p','',item.summary));
  const link=document.createElement('a');link.href=item.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent=item.sourceLabel+' ↗';card.append(link);
  list.append(card);
 });
 root.append(list,el('p','updates-note',note||'लिंक संबंधित संस्था के आधिकारिक स्रोत पर जाता है; यह आवश्यक नहीं कि सीधे PDF या candidate login खोले।'));
}
fetch(DATA_URL).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(data=>{
 Object.keys(labels).forEach(group=>render(group,data.items||[],data.note));
}).catch(()=>Object.keys(labels).forEach(group=>{const root=document.querySelector('[data-official-updates="'+group+'"]');if(root)root.textContent='अपडेट सूची अभी लोड नहीं हो सकी। आधिकारिक पोर्टल पर जाँचें।'}));
})();
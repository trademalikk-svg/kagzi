(()=>{'use strict';
const groups=['results','admit-cards','answer-keys','exam-calendar'];
const labels={'results':'Results','admit-cards':'Admit Card','answer-keys':'Answer Key','exam-calendar':'Exam Calendar'};
const regionFilter=document.querySelector('[data-region-filter]');
const DATA_URL=new URL('../data/official-updates.json',document.currentScript.src);
const dateFmt=new Intl.DateTimeFormat('hi-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'});
function dateLabel(value){const d=new Date(value+'T00:00:00+05:30');return Number.isNaN(d.getTime())?'':dateFmt.format(d)}
function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}
let records=[],note='';
function render(){
 const selected=regionFilter?.value||'all';
 groups.forEach(group=>{
  const root=document.querySelector('[data-official-updates="'+group+'"]');if(!root)return;
  root.replaceChildren();
  const matches=records.filter(x=>x.category===group&&(selected==='all'||x.regionSlug==='all-india'||x.regionSlug===selected)).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
  if(!matches.length){root.append(el('p','empty-state','इस राज्य के लिए अभी सत्यापित '+labels[group]+' अपडेट दर्ज नहीं है।'));return}
  matches.forEach(item=>{
   const card=el('div','update-card');
   const meta=el('div','update-meta');
   meta.append(el('span','tag '+(item.status==='published'?'open':'status-review'),item.status==='published'?'PUBLISHED':'NOTICE'));
   meta.append(el('span','update-date',dateLabel(item.publishedAt)));
   card.append(meta,el('h4','',item.title),el('p','update-org',item.organization),el('p','',item.summary));
   const a=document.createElement('a');a.href=item.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent=(item.sourceLabel||'Official Source')+' ↗';card.append(a);
   root.append(card);
  });
  root.append(el('p','updates-note',note));
 });
}
fetch(DATA_URL).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(data=>{records=Array.isArray(data.items)?data.items:[];note=data.note||'';render();regionFilter?.addEventListener('change',render)}).catch(()=>groups.forEach(group=>{const root=document.querySelector('[data-official-updates="'+group+'"]');if(root)root.textContent='अपडेट सूची अभी लोड नहीं हो सकी। आधिकारिक पोर्टल पर जाँचें।'}));
})();
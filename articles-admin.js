(() => {
'use strict';
const $ = (id) => document.getElementById(id);
const cfg = window.KAGZI_CONFIG || {};
let client = null, currentUser = null, selectedArticle = null, articles = [];
const setStatus = (id, message, type='') => { const el=$(id); el.textContent=message; el.className='status'+(type?' '+type:''); el.classList.remove('hidden'); };
const hideStatus = (id) => $(id).classList.add('hidden');
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const dateText = value => value ? new Date(value).toLocaleString() : '—';
function formData() {
 const urls=$('sourceUrls').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 for (const url of urls) { const parsed=new URL(url); if (!['http:','https:'].includes(parsed.protocol)) throw new Error('Source URL must use HTTP or HTTPS.'); }
 return {title:$('title').value.trim(),slug:$('slug').value.trim(),excerpt:$('excerpt').value.trim(),content_markdown:$('content').value.trim(),language:$('language').value,region:$('region').value,category:$('category').value,trend_query:$('trendQuery').value.trim(),trend_source:$('trendSource').value.trim(),trend_score:Number($('trendScore').value||0),source_urls:urls,seo_title:$('seoTitle').value.trim(),meta_description:$('metaDescription').value.trim()};
}
function resetForm() { $('articleForm').reset(); $('articleId').value=''; $('trendScore').value='0'; $('formHeading').textContent='नया Article Draft'; $('saveDraft').textContent='Save Draft'; hideStatus('formStatus'); }
function fillForm(a) {
 $('articleId').value=a.id; for(const key of ['title','slug','excerpt','language','region','category','trend_score','content_markdown','seo_title','meta_description','trend_query','trend_source']) { const id=key==='trend_score'?'trendScore':key==='content_markdown'?'content':key==='seo_title'?'seoTitle':key==='meta_description'?'metaDescription':key==='trend_query'?'trendQuery':key==='trend_source'?'trendSource':key; if($(id)) $(id).value=a[key]??''; }
 $('sourceUrls').value=(a.source_urls||[]).join('\n'); $('formHeading').textContent='Edit Article Draft'; $('saveDraft').textContent='Update Draft'; window.scrollTo({top:0,behavior:'smooth'});
}
async function loadArticles() {
 $('articleList').innerHTML='<div class="empty">Loading…</div>';
 let query=client.from('kagzi_articles').select('*').order('created_at',{ascending:false}).limit(200);
 const status=$('statusFilter').value, region=$('regionFilter').value;
 if(status!=='all') query=query.eq('status',status);
 if(region!=='all') query=query.eq('region',region);
 const {data,error}=await query;
 if(error) throw error;
 articles=data||[];
 if(!articles.length){$('articleList').innerHTML='<div class="empty">No articles in this filter yet.</div>';return;}
 $('articleList').innerHTML=articles.map(a=>'<article class="article"><h3>'+escapeHtml(a.title)+'</h3><div class="meta"><span class="pill">'+escapeHtml(a.status)+'</span><span>'+escapeHtml(a.region)+'</span><span>'+escapeHtml(a.language)+'</span><span>'+escapeHtml(a.category)+'</span></div><p class="muted">'+escapeHtml(a.excerpt||'No summary')+'</p><div class="actions"><button type="button" data-review="'+escapeHtml(a.id)+'" class="secondary">Preview / Review</button><button type="button" data-edit="'+escapeHtml(a.id)+'" class="secondary">Edit</button></div></article>').join('');
}
async function ensureAdmin() {
 if(!window.supabase||!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY) throw new Error('Supabase client configuration unavailable.');
 client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user) throw new Error('Please sign in using your KAGZI account.');
 currentUser=user;
 const {data:admin,error:adminError}=await client.from('kagzi_library_admins').select('user_id').eq('user_id',user.id).maybeSingle();
 if(adminError) throw adminError;
 if(!admin) throw new Error('This account is not authorized as a KAGZI admin. Ask the existing administrator to grant access.');
 $('workspace').classList.remove('hidden'); setStatus('accessStatus','Admin access verified. Drafts are private until publication.','ok');
 await loadArticles();
}
async function save(status) {
 const payload=formData(), id=$('articleId').value;
 payload.status=status==='pending_review'?'pending_review':'draft';
 if(!payload.content_markdown) throw new Error('Full article content is required.');
 if(status==='pending_review') payload.status='pending_review';
 if(id) {
  if(status==='pending_review') payload.status='pending_review';
  const {error}=await client.from('kagzi_articles').update(payload).eq('id',id);
  if(error) throw error;
 } else {
  payload.created_by=currentUser.id; payload.status=status==='pending_review'?'pending_review':'draft';
  const {error}=await client.from('kagzi_articles').insert(payload);
  if(error) throw error;
 }
 resetForm(); await loadArticles(); setStatus('formStatus',status==='pending_review'?'Article submitted for review.':'Draft saved successfully.','ok');
}
function openReview(a) {
 selectedArticle=a; $('reviewTitle').textContent=a.title; $('reviewMeta').textContent=[a.language,a.region,a.category,a.status,'Trend score: '+a.trend_score,'Created: '+dateText(a.created_at)].join(' · ');
 $('reviewExcerpt').textContent=a.excerpt||''; $('reviewContent').textContent=a.content_markdown||'';
 $('reviewPanel').classList.remove('hidden'); $('approveArticle').disabled=a.status==='published'||a.status==='approved'; $('publishArticle').disabled=a.status!=='approved'; $('rejectArticle').disabled=a.status==='published'; $('reviewStatus').classList.add('hidden'); $('reviewPanel').scrollIntoView({behavior:'smooth'});
}
async function setArticleStatus(status) {
 if(!selectedArticle) return;
 const payload={status,updated_at:new Date().toISOString()};
 if(status==='approved'){payload.approved_by=currentUser.id;payload.approved_at=new Date().toISOString();}
 if(status==='published'){payload.published_at=new Date().toISOString();}
 const {error}=await client.from('kagzi_articles').update(payload).eq('id',selectedArticle.id);
 if(error) throw error;
 selectedArticle={...selectedArticle,...payload}; openReview(selectedArticle); await loadArticles();
 setStatus('reviewStatus','Status updated: '+status,'ok');
}
document.addEventListener('DOMContentLoaded',async()=>{
 try{await ensureAdmin();}catch(error){setStatus('accessStatus',error.message||'Admin access check failed.','error');}
 $('articleForm').addEventListener('submit',async e=>{e.preventDefault();try{await save('draft');}catch(error){setStatus('formStatus',error.message||'Unable to save draft.','error');}});
 $('submitReview').addEventListener('click',async()=>{try{await save('pending_review');}catch(error){setStatus('formStatus',error.message||'Unable to submit article.','error');}});
 $('resetForm').addEventListener('click',resetForm); $('refresh').addEventListener('click',()=>loadArticles().catch(e=>setStatus('listStatus',e.message,'error')));
 $('statusFilter').addEventListener('change',()=>loadArticles().catch(e=>setStatus('listStatus',e.message,'error')));
 $('regionFilter').addEventListener('change',()=>loadArticles().catch(e=>setStatus('listStatus',e.message,'error')));
 $('articleList').addEventListener('click',e=>{const review=e.target.closest('[data-review]'),edit=e.target.closest('[data-edit]');if(review){const a=articles.find(x=>x.id===review.dataset.review);if(a)openReview(a);}if(edit){const a=articles.find(x=>x.id===edit.dataset.edit);if(a){fillForm(a);window.scrollTo({top:0,behavior:'smooth'});}}});
 $('approveArticle').addEventListener('click',()=>setArticleStatus('approved').catch(e=>setStatus('reviewStatus',e.message,'error')));
 $('publishArticle').addEventListener('click',()=>{if(!confirm('Publish this approved article record?'))return;setArticleStatus('published').catch(e=>setStatus('reviewStatus',e.message,'error'));});
 $('rejectArticle').addEventListener('click',()=>{if(!confirm('Reject this article draft?'))return;setArticleStatus('rejected').catch(e=>setStatus('reviewStatus',e.message,'error'));});
 $('closeReview').addEventListener('click',()=>$('reviewPanel').classList.add('hidden'));
 $('slug').addEventListener('input',()=>{$('slug').value=$('slug').value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');});
 $('title').addEventListener('input',()=>{if(!$('slug').dataset.manual){$('slug').value=$('title').value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}});
 $('slug').addEventListener('change',()=>$('slug').dataset.manual='true');
});
})();
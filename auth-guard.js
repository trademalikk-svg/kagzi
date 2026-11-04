(function(){
 const cfg=window.KAGZI_CONFIG||{};
 let client=null;
 try{
  if(window.supabase&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY){
   client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  }
 }catch(e){console.error('KAGZI auth guard setup failed',e);}
 async function hasSession(){
  if(!client)return false;
  const {data,error}=await client.auth.getSession();
  return !error&&!!data.session;
 }
 function loginUrl(){
  const next=location.pathname+location.search+location.hash;
  return 'auth.html?mode=login&redirect='+encodeURIComponent(next);
 }
 if(document.body.dataset.kagziProtected==='true'){
  hasSession().then(ok=>{if(!ok)location.replace(loginUrl());});
 }
 document.addEventListener('click',async function(event){
  const target=event.target instanceof Element?event.target:null;
  if(!target)return;
  const link=target.closest('a[href]');
  const protectedLink=link&&(link.matches('a[href="document-library.html"],a[href="office.html"],a[href="gov-documents.html"],a[href^="modules.html"]')||link.hash==='#pdfWorkbench'||link.hash==='#scanner'||link.hash==='#photoStudio');
  const protectedCard=target.closest('.module-card, [data-requires-auth]');
  if(!protectedLink&&!protectedCard)return;
  if(await hasSession())return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  location.href=loginUrl();
 },true);
 window.KAGZI_AUTH_GUARD={hasSession};
})();
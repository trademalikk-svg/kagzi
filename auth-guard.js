(function(){
  const cfg=window.KAGZI_CONFIG||{};
  let client=null;
  try{
    if(window.supabase&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY){
      client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    }
  }catch(e){console.error('KAGZI auth guard setup failed',e);}
  function loginUrl(){
    const next=location.pathname+location.search+location.hash;
    return 'auth.html?mode=login&redirect='+encodeURIComponent(next);
  }
  async function hasSession(){
    if(!client)return false;
    const {data,error}=await client.auth.getSession();
    return !error&&!!data.session;
  }
  async function requireLogin(event){
    if(await hasSession())return;
    if(event){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();}
    location.href=loginUrl();
  }
  if(document.body.dataset.kagziProtected==='true'){
    hasSession().then(ok=>{if(!ok)location.replace(loginUrl());});
  }
  let replaying=false;\n  document.addEventListener('click',function(event){
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;
    const tool=target.closest('.module-card, .tool-card, #pdfWorkbench, #scanner, #photoStudio, #recent, .office-tool, [data-requires-auth]');
    const toolNav=target.closest('a[href*="#pdfWorkbench"],a[href*="#scanner"],a[href*="#photoStudio"],a[href="document-library.html"],a[href="office.html"],a[href="gov-documents.html"],a[href^="modules.html"]');
    if((tool||toolNav)&&!replaying){\n      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();\n      hasSession().then(ok=>{if(ok){replaying=true;target.closest('.module-card, .tool-card, #pdfWorkbench, #scanner, #photoStudio, #recent, .office-tool, [data-requires-auth], a[href*=\"#pdfWorkbench\"],a[href*=\"#scanner\"],a[href*=\"#photoStudio\"],a[href=\"document-library.html\"],a[href=\"office.html\"],a[href=\"gov-documents.html\"],a[href^=\"modules.html\"]')?.click();replaying=false;}else location.href=loginUrl();});\n    }
  },true);
  window.KAGZI_AUTH_GUARD={hasSession,requireLogin};
})();
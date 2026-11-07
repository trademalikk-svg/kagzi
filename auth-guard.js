(function(){
 'use strict';
 const cfg=window.KAGZI_CONFIG||{};
 let client=null;
 try{
  if(window.supabase&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY){
   client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  }
 }catch(error){console.error('KAGZI auth guard setup failed',error);}
 const authPath='/auth.html';
 function loginUrl(){
  const next=location.pathname+location.search+location.hash;
  return authPath+'?mode=login&redirect='+encodeURIComponent(next);
 }
 async function hasSession(){
  if(!client)return false;
  try{const {data,error}=await client.auth.getSession();return !error&&!!(data&&data.session);}
  catch(_){return false;}
 }
 async function enforcePageGate(){
  if(!document.body||document.body.dataset.kagziProtected!=='true')return;
  if(!await hasSession())location.replace(loginUrl());
 }
 function protectFeatureLinks(){
  document.addEventListener('click',async function(event){
   const target=event.target instanceof Element?event.target:null;if(!target)return;
   const link=target.closest('a[href]'),card=target.closest('.module-card,[data-requires-auth]');
   if(!link&&!card)return;
   const href=link?link.getAttribute('href')||'':'';
   if(!card&&!/^(?:\/?(?:document-library|office|gov-documents|modules|jan-seva|pdf-tools|photo-tools|education|study-material|current-affairs)(?:\.html|\/|#|\?))/.test(href))return;
   if(await hasSession())return;
   event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();location.assign(loginUrl());
  },true);
 }
 window.KAGZI_AUTH_GUARD={hasSession,loginUrl};
 protectFeatureLinks();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enforcePageGate,{once:true});else enforcePageGate();
})();
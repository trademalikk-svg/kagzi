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
 const protectedExact=new Set([
  '/education','/education-pdfs','/education-pdfs-en',
  '/study-material','/study-notes','/study-practice',
  '/reader','/ebook-creator','/paid-library',
  '/current-affairs','/current-affairs-book','/current-affairs-book-source',
  '/competitive-polity-book-01','/competitive-polity-complete',
  '/economy-book','/environment-book','/geography-book',
  '/hindi-book','/history-book','/math-reasoning-book',
  '/mcq-pyq-book','/science-book','/up-gk-book',
  '/pdf-editor','/image-text-editor','/document-studio',
  '/document-editing','/document-editing-en','/document-converter',
  '/office','/jpg-to-pdf','/pdf-tools','/pdf-compress',
  '/photo-tools','/passport-size-photo-maker','/resume-cv-maker'
 ]);
 function isProtectedPath(){
  const path=(location.pathname.replace(/\/+$/,'')||'/').replace(/\.html$/,'');
  return protectedExact.has(path)||path.startsWith('/current-affairs/')||path.startsWith('/study-material/')||path.startsWith('/board-updates/');
 }
 function loginUrl(){
  const next=location.pathname+location.search+location.hash;
  return authPath+'?mode=signup&redirect='+encodeURIComponent(next);
 }
 async function hasSession(){
  if(!client)return false;
  try{const {data,error}=await client.auth.getSession();return !error&&!!(data&&data.session);}
  catch(_){return false;}
 }
 async function enforcePageGate(){
  if(!document.body)return;
  if(document.body.dataset.kagziProtected!=='true'&&!isProtectedPath())return;
  if(!await hasSession())location.replace(loginUrl());
 }
 function protectPaidItems(){
  document.addEventListener('click',async function(event){
   const target=event.target instanceof Element?event.target:null;
   if(!target)return;
   const paidItem=target.closest('[data-paid-item]');
   if(!paidItem)return;
   if(await hasSession())return;
   event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
   location.assign(loginUrl());
  },true);
 }
 window.KAGZI_AUTH_GUARD={hasSession,loginUrl,isProtectedPath};
 protectPaidItems();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enforcePageGate,{once:true});
 else enforcePageGate();
})();
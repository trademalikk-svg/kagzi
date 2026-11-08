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
  '/education','/education.html','/education-pdfs.html','/education-pdfs-en.html',
  '/study-material.html','/study-notes.html','/study-practice.html',
  '/reader.html','/ebook-creator.html','/paid-library.html',
  '/current-affairs.html','/current-affairs-book.html','/current-affairs-book-source.html',
  '/competitive-polity-book-01.html','/competitive-polity-complete.html',
  '/economy-book.html','/environment-book.html','/geography-book.html',
  '/hindi-book.html','/history-book.html','/math-reasoning-book.html',
  '/mcq-pyq-book.html','/science-book.html','/up-gk-book.html',
  '/pdf-editor','/pdf-editor.html','/image-text-editor.html','/document-studio.html',
  '/document-editing.html','/document-editing-en.html','/document-converter.html',
  '/office.html','/jpg-to-pdf.html','/pdf-tools.html','/pdf-compress.html',
  '/photo-tools.html','/passport-size-photo-maker.html','/resume-cv-maker.html'
 ]);
 function isProtectedPath(){
  const path=location.pathname.replace(/\\/+$/,'')||'/';
  return protectedExact.has(path)||path.startsWith('/current-affairs/')||path.startsWith('/study-material/');
 }
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
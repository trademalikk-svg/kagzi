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
  if(!document.body||document.body.dataset.kagziAuthScope!=='membership')return;
  if(!await hasSession())location.replace(loginUrl());
 }
 function protectPaidItems(){
  document.addEventListener('click',async function(event){
   const target=event.target instanceof Element?event.target:null;
   if(!target)return;
   const paidItem=target.closest('[data-paid-item]');
   if(!paidItem)return;
   if(await hasSession())return;
   event.preventDefault();
   event.stopPropagation();
   event.stopImmediatePropagation();
   location.assign(loginUrl());
  },true);
 }
 window.KAGZI_AUTH_GUARD={hasSession,loginUrl};
 protectPaidItems();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enforcePageGate,{once:true});
 else enforcePageGate();
})();
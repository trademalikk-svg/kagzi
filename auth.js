(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const params=new URLSearchParams(location.search);
 let mode=params.get('mode')==='signup'?'signup':'login';
 let client=null;
 const requestedRedirect=params.get('redirect')||'index.html';
 let safeRedirect='index.html';
 try{
  const candidate=new URL(requestedRedirect,location.origin);
  if(candidate.origin===location.origin && !candidate.pathname.endsWith('/auth.html')) safeRedirect=candidate.pathname+candidate.search+candidate.hash;
 }catch(_){}
 const message=$('authMessage'),form=$('authForm'),submit=$('authSubmit'),resend=$('authResend');
 let resendTimer=null;
 function setMessage(text){message.textContent=text;}
 function showResend(show){if(resend)resend.style.display=show?'block':'none';}
 function render(){
  const signup=mode==='signup';
  $('loginTab').classList.toggle('active',!signup);
  $('signupTab').classList.toggle('active',signup);
  $('authTitle').textContent=signup?'Create your account':'Welcome back';
  $('authIntro').textContent=signup?'Sign up to start using your KAGZI account.':'Log in to your KAGZI account.';
  submit.textContent=signup?'Create account':'Log in';
  $('authPassword').autocomplete=signup?'new-password':'current-password';
 }
 function emailRedirect(){
  return location.origin+'/auth.html?mode=login&redirect='+encodeURIComponent(safeRedirect);
 }
 function friendlyError(error){
  const code=error&&error.code||'';
  const msg=String(error&&error.message||'');
  if(code==='email_not_confirmed'||/email not confirmed/i.test(msg)){
   showResend(true);
   return 'आपका account बन चुका है, लेकिन email verify नहीं हुआ है। Inbox/Spam में KAGZI confirmation email खोलें या नीचे Resend बटन दबाएँ।';
  }
  if(code==='over_email_send_rate_limit'||/after \d+ seconds|rate limit/i.test(msg)){
   showResend(true);
   return 'Confirmation email बार-बार भेजने की सीमा लगी है। कृपया 40 सेकंड रुककर फिर कोशिश करें।';
  }
  if(code==='user_already_exists'||/user already registered/i.test(msg)){
   showResend(true);
   return 'इस email से account पहले से मौजूद है। पहले Login करें; यदि email verify नहीं हुआ तो Resend confirmation दबाएँ।';
  }
  if(/signup is disabled|signups not allowed/i.test(msg))return 'नए account बनाना Supabase में बंद है। Project के Authentication settings में Allow new users चालू करना होगा।';
  if(/password should be at least|weak password/i.test(msg))return 'Password कम से कम 8 characters का रखें और मजबूत password चुनें।';
  return msg||'Account request पूरी नहीं हो सकी। कृपया थोड़ी देर बाद दोबारा प्रयास करें।';
 }
 function cooldown(seconds){
  if(resendTimer)clearInterval(resendTimer);
  let remaining=seconds;
  resend.disabled=true;
  resend.textContent='फिर भेजें ('+remaining+'s)';
  resendTimer=setInterval(()=>{
   remaining--;
   if(remaining<=0){
    clearInterval(resendTimer);resendTimer=null;
    resend.disabled=false;resend.textContent='Resend confirmation email';
   }else resend.textContent='फिर भेजें ('+remaining+'s)';
  },1000);
 }
 $('loginTab').addEventListener('click',()=>{mode='login';showResend(false);render();setMessage('अपने registered email और password से Login करें।');});
 $('signupTab').addEventListener('click',()=>{mode='signup';showResend(false);render();setMessage('Email से नया account बनाएँ। Confirmation email verify करना जरूरी है।');});
 const cfg=window.KAGZI_CONFIG||{};
 if(window.supabase&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY){
  try{
   client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
   setMessage('KAGZI account service connected. Email से Login या Sign up करें।');
  }catch(e){setMessage('Supabase configuration में समस्या है। Project URL और publishable key जाँचें।');}
 }else setMessage('Supabase setup अधूरा है। config.js जाँचें और page refresh करें।');
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!client){setMessage('Account service से connection नहीं हुआ। Page refresh करके फिर प्रयास करें।');return;}
  const email=$('authEmail').value.trim().toLowerCase(),password=$('authPassword').value;
  if(!email){setMessage('अपना email address दर्ज करें।');return;}
  if(password.length<8&&mode==='signup'){setMessage('Password कम से कम 8 characters का होना चाहिए।');return;}
  showResend(false);
  submit.disabled=true;submit.textContent='Please wait…';
  try{
   const result=mode==='signup'
    ?await client.auth.signUp({email,password,options:{emailRedirectTo:emailRedirect()}})
    :await client.auth.signInWithPassword({email,password});
   if(result.error)throw result.error;
   if(mode==='signup'&&!result.data.session){
    showResend(true);
    setMessage('Account request सफल रही। अपने email के Inbox और Spam folder में KAGZI confirmation email देखें। Link खोलने के बाद Login करें। जरूरत हो तो नीचे confirmation दोबारा भेजें।');
    cooldown(40);
   }else{
    setMessage('Login successful. KAGZI खोल रहे हैं…');
    location.replace(safeRedirect);
   }
  }catch(error){
   setMessage(friendlyError(error));
  }finally{
   submit.disabled=false;submit.textContent=mode==='signup'?'Create account':'Log in';
  }
 });
 resend.addEventListener('click',async()=>{
  if(!client){setMessage('Account service से connection नहीं हुआ।');return;}
  const email=$('authEmail').value.trim().toLowerCase();
  if(!email){setMessage('पहले ऊपर वही email दर्ज करें जिससे account बनाया था।');$('authEmail').focus();return;}
  resend.disabled=true;
  try{
   const {error}=await client.auth.resend({type:'signup',email,options:{emailRedirectTo:emailRedirect()}});
   if(error)throw error;
   setMessage('Confirmation email भेजने का अनुरोध सफल रहा। Inbox, Spam और Promotions folder जाँचें।');
   cooldown(40);
  }catch(error){
   setMessage(friendlyError(error));
   if(/rate limit|after \d+ seconds/i.test(String(error.message||'')))cooldown(40);
   else resend.disabled=false;
  }
 });
 render();
})();

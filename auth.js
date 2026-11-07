(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const params=new URLSearchParams(location.search);
 let mode=params.get('mode')==='signup'?'signup':'login';
 let client=null, pendingEmail='';
 const requestedRedirect=params.get('redirect')||'index.html';
 let safeRedirect='index.html';
 try{const candidate=new URL(requestedRedirect,location.origin);if(candidate.origin===location.origin&&!candidate.pathname.endsWith('/auth.html'))safeRedirect=candidate.pathname+candidate.search+candidate.hash;}catch(_){}
 const message=$('authMessage'),form=$('authForm'),otpForm=$('otpForm'),submit=$('authSubmit'),otpSubmit=$('otpSubmit'),resend=$('authResend'),googleButton=$('googleSignIn');
 let resendTimer=null;
 function setMessage(text){message.textContent=text;}
 function showResend(show){resend.style.display=show?'block':'none';}
 function showOtp(show){otpForm.style.display=show?'block':'none';form.style.display=show?'none':'block';}
 function render(){
  const signup=mode==='signup';
  $('loginTab').classList.toggle('active',!signup);$('signupTab').classList.toggle('active',signup);
  $('authTitle').textContent=signup?'Create your account':'Welcome back';
  $('authIntro').textContent=signup?'Sign up with your email and verify using a 6-digit OTP.':'Log in to your KAGZI account.';
  submit.textContent=signup?'Create account':'Log in';
  $('authPassword').autocomplete=signup?'new-password':'current-password';
 }
 function friendlyError(error){
  const code=error&&error.code||'',msg=String(error&&error.message||'');
  if(code==='email_not_confirmed'||/email not confirmed/i.test(msg)){showResend(true);return 'यह email अभी verify नहीं हुआ है। ऊपर वही email दर्ज करके Resend OTP दबाएँ।';}
  if(code==='over_email_send_rate_limit'||/rate limit|after \d+ seconds/i.test(msg)){showResend(true);return 'OTP भेजने की सीमा लगी है। कुछ समय बाद फिर प्रयास करें।';}
  if(code==='user_already_exists'||/user already registered/i.test(msg)){showResend(true);return 'इस email से account पहले से मौजूद है। Login करें या Resend OTP दबाकर verify करें।';}
  if(/signup is disabled|signups not allowed/i.test(msg))return 'नए account बनाना Supabase में बंद है। Authentication settings में Allow new users चालू करें।';
  if(/password should be at least|weak password/i.test(msg))return 'Password कम से कम 8 characters का रखें।';
  return msg||'Request पूरी नहीं हो सकी। कृपया दोबारा प्रयास करें।';
 }
 function cooldown(seconds){
  if(resendTimer)clearInterval(resendTimer);
  let remaining=seconds;resend.disabled=true;resend.textContent='फिर भेजें ('+remaining+'s)';
  resendTimer=setInterval(()=>{remaining--;if(remaining<=0){clearInterval(resendTimer);resendTimer=null;resend.disabled=false;resend.textContent='Resend OTP';}else resend.textContent='फिर भेजें ('+remaining+'s)';},1000);
 }
 $('loginTab').addEventListener('click',()=>{mode='login';showOtp(false);showResend(false);render();setMessage('अपने email और password से Login करें।');});
 $('signupTab').addEventListener('click',()=>{mode='signup';showOtp(false);showResend(false);render();setMessage('Email से account बनाएँ। फिर email पर आया 6-digit OTP दर्ज करें।');});
 const cfg=window.KAGZI_CONFIG||{};
 if(window.supabase&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY){
  try{client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});setMessage('KAGZI account service connected.');
   client.auth.onAuthStateChange((event,session)=>{
    if(event==='SIGNED_IN'&&session&&location.hash.includes('access_token')){setMessage('Google login successful. KAGZI खोल रहे हैं…');location.replace(safeRedirect);}
   });}
  catch(e){setMessage('Supabase configuration में समस्या है। Project URL और publishable key जाँचें।');}
 }else setMessage('Supabase setup अधूरा है। config.js जाँचें।');
 googleButton.addEventListener('click',async()=>{
  if(!client){setMessage('Account service से connection नहीं हुआ। Page refresh करें।');return;}
  googleButton.disabled=true;googleButton.textContent='Google से connect हो रहा है…';
  try{
   const redirectTo=location.origin+location.pathname+'?redirect='+encodeURIComponent(safeRedirect);
   const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo}});
   if(error)throw error;
  }catch(error){
   setMessage('Google Login शुरू नहीं हो सका: '+(error.message||'कृपया Supabase Google Provider सेटिंग जाँचें।'));
   googleButton.disabled=false;googleButton.textContent='Continue with Google';
  }
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!client){setMessage('Account service से connection नहीं हुआ। Page refresh करें।');return;}
  const email=$('authEmail').value.trim().toLowerCase(),password=$('authPassword').value;
  if(!email){setMessage('अपना email दर्ज करें।');return;}
  if(mode==='signup'&&password.length<8){setMessage('Password कम से कम 8 characters का होना चाहिए।');return;}
  showResend(false);submit.disabled=true;submit.textContent='Please wait…';
  try{
   if(mode==='signup'){
    const {data,error}=await client.auth.signUp({email,password,options:{data:{}}});
    if(error)throw error;
    if(data.session){setMessage('Account बन गया और verify हो गया। KAGZI खोल रहे हैं…');location.replace(safeRedirect);return;}
    pendingEmail=email;showOtp(true);showResend(true);$('authOtp').focus();
    setMessage('आपके email पर 6-digit OTP भेजा गया है। Email template में OTP delivery चालू होने पर code यहाँ दर्ज करके Verify OTP दबाएँ।');
    cooldown(40);
   }else{
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error)throw error;
    if(data.session){setMessage('Login successful. KAGZI खोल रहे हैं…');location.replace(safeRedirect);}
   }
  }catch(error){setMessage(friendlyError(error));}
  finally{submit.disabled=false;submit.textContent=mode==='signup'?'Create account':'Log in';}
 });
 otpForm.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!client)return;
  const token=$('authOtp').value.replace(/\D/g,'').slice(0,6),email=pendingEmail||$('authEmail').value.trim().toLowerCase();
  if(!/^\d{6}$/.test(token)){setMessage('6 अंकों का सही OTP दर्ज करें।');return;}
  otpSubmit.disabled=true;otpSubmit.textContent='Verifying…';
  try{
   const {data,error}=await client.auth.verifyOtp({email,token,type:'signup'});
   if(error)throw error;
   if(data.session){setMessage('Email OTP verified. KAGZI खोल रहे हैं…');location.replace(safeRedirect);}
   else setMessage('OTP verify हो गया। अब Login करें।');
  }catch(error){setMessage(friendlyError(error));}
  finally{otpSubmit.disabled=false;otpSubmit.textContent='Verify OTP';}
 });
 resend.addEventListener('click',async()=>{
  if(!client)return;
  const email=pendingEmail||$('authEmail').value.trim().toLowerCase();
  if(!email){setMessage('पहले अपना registered email दर्ज करें।');$('authEmail').focus();return;}
  resend.disabled=true;
  try{
   const {error}=await client.auth.resend({type:'signup',email});
   if(error)throw error;
   pendingEmail=email;showOtp(true);setMessage('नया OTP भेजने का अनुरोध सफल रहा। Inbox/Spam जाँचें।');cooldown(40);
  }catch(error){setMessage(friendlyError(error));resend.disabled=false;}
 });
 render();
})();
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
  if(candidate.origin===location.origin&&!candidate.pathname.endsWith('/auth.html'))safeRedirect=candidate.pathname+candidate.search+candidate.hash;
 }catch(_){}
 const message=$('authMessage'),form=$('authForm'),submit=$('authSubmit'),resend=$('authResend'),emailField=$('authEmail'),passwordField=$('authPassword');
 function setMessage(text){message.textContent=text;}
 function showResend(show){if(resend)resend.style.display=show?'block':'none';}
 function confirmationRedirect(){
  const u=new URL('/auth.html',location.origin);
  u.searchParams.set('mode','login');
  u.searchParams.set('redirect',safeRedirect);
  return u.href;
 }
 function render(){
  const signup=mode==='signup';
  $('loginTab').classList.toggle('active',!signup);
  $('signupTab').classList.toggle('active',signup);
  $('authTitle').textContent=signup?'Create your account':'Welcome back';
  $('authIntro').textContent=signup?'Sign up to start using your KAGZI account.':'Log in to your KAGZI account.';
  submit.textContent=signup?'Create account':'Log in';
  passwordField.autocomplete=signup?'new-password':'current-password';
 }
 function explainError(error){
  const code=error&&error.code||'';
  const msg=(error&&error.message||'').toLowerCase();
  if(code==='over_email_send_rate_limit'||msg.includes('after 35 seconds')||msg.includes('rate limit'))
   return 'Confirmation email अभी-अभी भेजा गया है। कृपया कम-से-कम 40 सेकंड प्रतीक्षा करें, फिर Resend confirmation email दबाएँ। Inbox और Spam/Junk फ़ोल्डर भी देखें।';
  if(code==='email_not_confirmed'||msg.includes('email not confirmed')){
   showResend(true);
   return 'इस Email की पुष्टि अभी बाकी है। Inbox/Spam में KAGZI का confirmation email खोलें। ईमेल नहीं मिला तो नीचे Resend confirmation email दबाएँ।';
  }
  if(code==='signup_disabled'||msg.includes('signups not allowed')||msg.includes('signup is disabled'))
   return 'अभी नए अकाउंट बनाने की अनुमति Supabase में बंद है। KAGZI Admin को Authentication में Allow new users चालू करना होगा।';
  if(code==='email_address_invalid'||msg.includes('invalid email'))
   return 'कृपया सही Email address दर्ज करें।';
  if(code==='weak_password'||msg.includes('password'))
   return error.message||'Password कम-से-कम 8 अक्षरों का रखें।';
  if(code==='user_already_exists'||msg.includes('already registered'))
   return 'इस Email से अकाउंट पहले से मौजूद हो सकता है। Log in करें या confirmation email दोबारा भेजें।';
  return error&&error.message?error.message:'अभी अकाउंट नहीं बन पाया। कुछ देर बाद दोबारा प्रयास करें।';
 }
 $('loginTab').addEventListener('click',()=>{mode='login';showResend(false);render();setMessage('अपने registered Email और Password से Login करें।');});
 $('signupTab').addEventListener('click',()=>{mode='signup';showResend(false);render();setMessage('नया अकाउंट बनाने के लिए Email और कम-से-कम 8 अक्षर का Password दर्ज करें।');});
 const cfg=window.KAGZI_CONFIG||{};
 if(window.supabase&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY){
  try{
   client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
   setMessage('Supabase connected. Log in or create your account.');
  }catch(e){setMessage('Supabase configuration invalid है। KAGZI Admin को config.js जाँचना होगा।');}
 }else setMessage('Supabase setup incomplete है। config.js जाँचकर पेज refresh करें।');
 async function resendConfirmation(){
  if(!client){setMessage('Supabase connection उपलब्ध नहीं है।');return;}
  const email=emailField.value.trim();
  if(!email){setMessage('पहले अपना Email address दर्ज करें।');emailField.focus();return;}
  resend.disabled=true;resend.textContent='Sending…';
  try{
   const {error}=await client.auth.resend({type:'signup',email,options:{emailRedirectTo:confirmationRedirect()}});
   if(error)throw error;
   setMessage('Confirmation email दोबारा भेज दिया गया है। Inbox और Spam/Junk फ़ोल्डर देखें। बार-बार Resend न दबाएँ।');
  }catch(error){setMessage(explainError(error));}
  finally{resend.disabled=false;resend.textContent='Resend confirmation email';}
 }
 if(resend)resend.addEventListener('click',resendConfirmation);
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!client){setMessage('Supabase connected नहीं है। कृपया पेज refresh करें।');return;}
  const email=emailField.value.trim(),password=passwordField.value;
  if(!email){setMessage('Email address दर्ज करें।');return;}
  if(password.length<8){setMessage('Password कम-से-कम 8 अक्षरों का होना चाहिए।');return;}
  submit.disabled=true;submit.textContent='Please wait…';showResend(false);
  try{
   const result=mode==='signup'
    ?await client.auth.signUp({email,password,options:{emailRedirectTo:confirmationRedirect()}})
    :await client.auth.signInWithPassword({email,password});
   if(result.error)throw result.error;
   if(mode==='signup'&&result.data&&!result.data.session){
    showResend(true);
    setMessage('Signup request मिल गया है। अब Email के Inbox/Spam में confirmation link खोलें। पुष्टि होने के बाद Login करें। यदि email पहले से registered है, तो Log in विकल्प चुनें।');
   }else{
    setMessage('Login successful. Opening your KAGZI workspace…');
    location.replace(safeRedirect);
   }
  }catch(error){
   setMessage(explainError(error));
   if(mode==='login'&&error&&(error.code==='email_not_confirmed'||String(error.message||'').toLowerCase().includes('email not confirmed')))showResend(true);
   if(mode==='signup'&&error&&error.code==='over_email_send_rate_limit')showResend(true);
  }finally{submit.disabled=false;submit.textContent=mode==='signup'?'Create account':'Log in';}
 });
 render();
})();
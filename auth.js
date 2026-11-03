(function(){
 const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
 let mode=params.get('mode')==='signup'?'signup':'login',client=null;
 const message=$('authMessage'),form=$('authForm');
 function render(){
  const signup=mode==='signup';
  $('loginTab').classList.toggle('active',!signup);$('signupTab').classList.toggle('active',signup);
  $('authTitle').textContent=signup?'Create your account':'Welcome back';
  $('authIntro').textContent=signup?'Sign up to start using your KAGZI account.':'Log in to your KAGZI account.';
  $('authSubmit').textContent=signup?'Create account':'Log in';
  $('authPassword').autocomplete=signup?'new-password':'current-password';
 }
 function setMessage(text){message.textContent=text;}
 $('loginTab').addEventListener('click',()=>{mode='login';render();setMessage('Log in with your registered email and password.');});
 $('signupTab').addEventListener('click',()=>{mode='signup';render();setMessage('Create an account with your email and a unique password.');});
 const cfg=window.KAGZI_CONFIG||{};
 if(window.supabase&&cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY){
  try{client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});}
  catch(e){setMessage('Supabase configuration is invalid. Check the Project URL and public anon/publishable key.');}
 }else{
  setMessage('Setup required: add the Supabase Project URL and public anon/publishable key to config.js. Do not use a service_role or secret key.');
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!client){setMessage('Accounts are not connected yet. Configure the public Supabase credentials in config.js first.');return;}
  const email=$('authEmail').value.trim(),password=$('authPassword').value;
  if(password.length<8){setMessage('Use a password with at least 8 characters.');return;}
  const button=$('authSubmit');button.disabled=true;button.textContent='Please wait…';
  try{
   const result=mode==='signup'?await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/auth.html?mode=login'}}):await client.auth.signInWithPassword({email,password});
   if(result.error)throw result.error;
   if(mode==='signup'&&!result.data.session)setMessage('Account request created. Check your email for the confirmation link, then log in.');
   else{setMessage('Login successful. Opening your KAGZI workspace…');location.href='index.html';}
  }catch(error){setMessage(error.message||'Authentication could not be completed.');}
  finally{button.disabled=false;button.textContent=mode==='signup'?'Create account':'Log in';}
 });
 render();
})();
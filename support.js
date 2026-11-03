(function(){
  const roots=document.querySelectorAll('.kagzi-assistant');
  roots.forEach(root=>{
    const form=root.querySelector('.assistant-form');
    const messages=root.querySelector('.assistant-messages');
    const input=root.querySelector('.assistant-input');
    const send=root.querySelector('.assistant-send');
    if(!form||!messages||!input||!send)return;
    const history=[];
    function addBubble(text,kind){
      const bubble=document.createElement('div');
      bubble.className='assistant-bubble '+(kind==='user'?'assistant-user':'assistant-reply');
      bubble.textContent=text;
      messages.appendChild(bubble);
      messages.scrollTop=messages.scrollHeight;
    }
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const message=input.value.trim();
      if(!message||send.disabled)return;
      addBubble(message,'user');
      history.push({role:'user',content:message});
      input.value='';
      send.disabled=true;
      send.textContent='…';
      try{
        const response=await fetch('/api/assistant',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({messages:history.slice(-10)})
        });
        const data=await response.json().catch(()=>({}));
        if(!response.ok){
          if(data.code==='AI_NOT_CONFIGURED')throw new Error('KAGZI AI is not configured yet. The site owner needs to add the Workers AI binding named AI in Cloudflare Pages Settings → Bindings, then redeploy. For help, email hello@kagzi.in.');
          throw new Error(data.error||'The assistant is temporarily unavailable. Please try again later.');
        }
        const reply=String(data.reply||'I could not prepare a reply. Please try again.');
        addBubble(reply,'reply');
        history.push({role:'assistant',content:reply});
      }catch(error){addBubble(error.message||'Connection problem. Please try again.','reply');}
      finally{send.disabled=false;send.textContent='Send';input.focus();}
    });
  });
  const toggle=document.querySelector('.chat-toggle');
  const panel=document.querySelector('.chat-panel');
  const close=document.querySelector('.chat-close');
  if(toggle&&panel){
    toggle.addEventListener('click',()=>{
      const open=panel.hidden;
      panel.hidden=!open;
      toggle.setAttribute('aria-expanded',String(open));
    });
    if(close)close.addEventListener('click',()=>{panel.hidden=true;toggle.setAttribute('aria-expanded','false');});
  }
})();
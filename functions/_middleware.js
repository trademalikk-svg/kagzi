export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  const match = url.pathname.match(/^\/government-schemes\/([a-z0-9-]+)\/?$/);
  if (!match || match[1] === "uttar-pradesh" || !response.headers.get("content-type")?.includes("text/html")) return response;

  const stateSlug = match[1];
  const stateName = stateSlug.split("-").map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(" ");
  const widget = `
<section id="kagzi-state-ai" aria-labelledby="kagzi-state-ai-title" style="margin:22px 0;padding:18px;background:#fff;border:1px solid #dce4ef;border-radius:14px;box-shadow:0 5px 18px rgba(15,35,65,.06)">
  <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span aria-hidden="true" style="font-size:25px">✦</span><h2 id="kagzi-state-ai-title" style="margin:0;color:#102b52;font-size:21px">सरकारी योजनाओं के बारे में KAGZI AI से पूछें</h2></div>
  <p style="color:#52627a;line-height:1.6;margin:9px 0">राज्य: <b>${stateName}</b> · हिन्दी में लाभ, पात्रता, दस्तावेज़ और आवेदन प्रक्रिया पूछें।</p>
  <label for="kagzi-state-ai-question" style="display:block;font-weight:700;margin:10px 0 6px">आपका सवाल</label>
  <textarea id="kagzi-state-ai-question" rows="3" maxlength="1200" placeholder="उदाहरण: इस राज्य में विद्यार्थियों के लिए कौन-सी सरकारी योजनाएँ हैं?" style="width:100%;box-sizing:border-box;padding:12px;border:1px solid #cbd5e1;border-radius:10px;font:inherit;resize:vertical"></textarea>
  <button id="kagzi-state-ai-ask" type="button" style="margin-top:9px;padding:11px 16px;border:0;border-radius:9px;background:#e9bd5c;color:#17243a;font-weight:800;cursor:pointer">AI से जवाब लें</button>
  <p id="kagzi-state-ai-status" role="status" aria-live="polite" style="color:#52627a"></p>
  <div id="kagzi-state-ai-answer" aria-live="polite" style="white-space:pre-wrap;line-height:1.7;color:#17243a"></div>
  <p style="font-size:12px;color:#65748a;line-height:1.6">ध्यान दें: KAGZI का सत्यापित AI योजना डेटासेट अभी उत्तर प्रदेश के सीमित बैच तक है। अन्य राज्यों के लिए यह सहायक अभी डेटा उपलब्ध न होने की बात बताएगा; अपुष्ट जानकारी नहीं बनाएगा। Aadhaar, OTP, PIN या पासवर्ड न लिखें।</p>
</section>
<script>
(()=>{const q=document.getElementById("kagzi-state-ai-question"),b=document.getElementById("kagzi-state-ai-ask"),s=document.getElementById("kagzi-state-ai-status"),a=document.getElementById("kagzi-state-ai-answer");if(!q||!b)return;async function send(){const question=q.value.trim();if(!question)return;s.textContent="जवाब तैयार हो रहा है…";a.textContent="";b.disabled=true;try{const r=await fetch("https://kagzi-scheme-ai.trademalikk.workers.dev/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question,state:"${stateSlug}"})});const d=await r.json();if(!r.ok)throw new Error(d.error||"AI सेवा उपलब्ध नहीं है।");a.textContent=d.answer+(d.disclaimer?"\n\n"+d.disclaimer:"");}catch(e){a.textContent=e.message+" कृपया थोड़ी देर बाद फिर प्रयास करें।";}finally{b.disabled=false;s.textContent="";}}b.addEventListener("click",send);q.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}});})();
</script>`;
  return new HTMLRewriter().on("main", { element(element) { element.append(widget, { html: true }); } }).transform(response);
}
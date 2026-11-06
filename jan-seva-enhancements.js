(()=>{"use strict";
const $=id=>document.getElementById(id);
const grid=$("serviceGrid"), finder=$("smartFinderInput"), status=$("finderStatus");
if(!grid)return;
const FAV_KEY="kagziJanSevaFavouritesV1", CHECK_KEY="kagziJanSevaChecklistV1";
const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||"null")??fallback}catch{return fallback}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
let favourites=safeRead(FAV_KEY,[]), favouriteOnly=false;
const synonyms=[
[/pension|वृद्ध|विधवा|दिव्यांग|बुढ़|बुजुर्ग/,"पेंशन"],
[/farmer|किसान|खेती|सम्मान निधि|pm.?kisan/,"PM-KISAN"],
[/caste|जाति|ओबीसी|अनुसूचित/,"जाति प्रमाणपत्र"],
[/income|आय प्रमाण|कमाई/,"आय प्रमाणपत्र"],
[/residen|निवास|डोमिसाइल|मूल निवास/,"निवास प्रमाणपत्र"],
[/ration|राशन|खाद्य|अनाज/,"राशन कार्ड"],
[/birth|जन्म|बर्थ/,"जन्म प्रमाणपत्र"],
[/death|मृत्यु|डेथ/,"मृत्यु प्रमाणपत्र"],
[/scholar|छात्रवृत्ति|स्कॉलर|पढ़ाई|शिक्षा सहायता/,"छात्रवृत्ति आवेदन"],
[/land|खतौनी|भूलेख|जमीन|भूमि/,"खतौनी"],
[/job|रोजगार|नौकरी|काम चाहिए|बेरोजगार/,"रोजगार पंजीकरण"],
[/voter|मतदाता|वोटर|चुनाव कार्ड/,"वोटर ID"],
[/licen[cs]e|ड्राइविंग|डीएल|गाड़ी लाइसेंस/,"Driving Licence"],
[/passport|पासपोर्ट/,"पासपोर्ट आवेदन"],
[/pan card|पैन कार्ड/,"PAN कार्ड"],
[/aadhaar|आधार/,"आधार सेवाएँ"]
];
function cards(){return [...grid.querySelectorAll(".service-card")]}
function updateFavCount(){$("favouriteCount").textContent=favourites.length+" पसंदीदा"}
function renderFilter(){let n=0;cards().forEach(card=>{const name=card.querySelector("h3")?.textContent||"";const show=!favouriteOnly||favourites.includes(name);card.hidden=!show;if(show)n++});updateFavCount();if(favouriteOnly)status.textContent=n+" पसंदीदा सेवाएँ दिखाई जा रही हैं।";}
function openChecklist(card){const name=card.querySelector("h3")?.textContent||"सेवा";const details=[...card.querySelectorAll(".service-guide-section")];const doc=details.find(x=>x.querySelector("strong")?.textContent.includes("दस्तावेज़"));const raw=(doc?.querySelector("p")?.textContent||"आधिकारिक पोर्टल पर आवश्यक दस्तावेज़ों की सूची देखें।");let items=raw.split(/[,;\n]|\s+और\s+/).map(x=>x.replace(/^\s*[-•\d.]+\s*/,"").trim()).filter(x=>x.length>2);items=[...new Set(items)].slice(0,12);if(!items.length)items=["आधिकारिक पोर्टल पर दस्तावेज़ सूची जाँचें"];const store=safeRead(CHECK_KEY,{});const checked=store[name]||[];$("checklistTitle").textContent=name+" — दस्तावेज़ चेकलिस्ट";const box=$("checklistItems");box.replaceChildren();items.forEach((item,i)=>{const label=document.createElement("label"),input=document.createElement("input"),span=document.createElement("span");input.type="checkbox";input.checked=checked.includes(item);span.textContent=item;input.addEventListener("change",()=>{const current=safeRead(CHECK_KEY,{});const set=new Set(current[name]||[]);input.checked?set.add(item):set.delete(item);current[name]=[...set];save(CHECK_KEY,current);progress(items,name)});label.append(input,span);box.append(label)});$("documentChecklist").hidden=false;progress(items,name);$("documentChecklist").scrollIntoView({behavior:"smooth",block:"start"});}
function progress(items,name){const saved=safeRead(CHECK_KEY,{}),done=saved[name]||[];$("checklistProgress").textContent=done.length+" / "+items.length+" पूरे · आपकी सूची इसी डिवाइस के ब्राउज़र में सेव होती है।";}
function shareService(card){const name=card.querySelector("h3")?.textContent||"सरकारी सेवा";const officialLink=card.querySelector("a[href^='http']")?.href||"";const pageUrl=new URL(location.href);pageUrl.search="";pageUrl.hash=card.id;const pageLink=pageUrl.href;const message="KAGZI पर "+name+" की जानकारी:\nKAGZI पेज: "+pageLink+(officialLink?"\nआधिकारिक सरकारी पोर्टल: "+officialLink:"");if(navigator.share){navigator.share({title:"KAGZI Jan Seva — "+name,text:message,url:pageLink}).catch(()=>{});}else{const url="https://wa.me/?text="+encodeURIComponent(message);window.open(url,"_blank","noopener,noreferrer");}}
function enhance(){cards().forEach(card=>{if(card.dataset.toolsReady)return;card.dataset.toolsReady="1";const name=card.querySelector("h3")?.textContent||"";if(!card.id)card.id="service-"+Array.from(name).map(ch=>ch.codePointAt(0).toString(16)).join("-");const actions=document.createElement("div");actions.className="service-tool-actions";const fav=document.createElement("button");fav.type="button";fav.className="service-tool-btn";fav.textContent=favourites.includes(name)?"★ पसंदीदा":"☆ पसंद में जोड़ें";if(favourites.includes(name))fav.classList.add("is-saved");fav.addEventListener("click",()=>{favourites=favourites.includes(name)?favourites.filter(x=>x!==name):[...favourites,name];save(FAV_KEY,favourites);fav.textContent=favourites.includes(name)?"★ पसंदीदा":"☆ पसंद में जोड़ें";fav.classList.toggle("is-saved",favourites.includes(name));renderFilter()});const check=document.createElement("button");check.type="button";check.className="service-tool-btn";check.textContent="☑ दस्तावेज़ चेकलिस्ट";check.addEventListener("click",()=>openChecklist(card));const share=document.createElement("button");share.type="button";share.className="service-tool-btn";share.textContent="WhatsApp पर शेयर";share.addEventListener("click",()=>shareService(card));actions.append(fav,check,share);card.append(actions)});renderFilter();}
const observer=new MutationObserver(enhance);observer.observe(grid,{childList:true});enhance();
function find(){const q=(finder.value||"").trim().toLocaleLowerCase();favouriteOnly=false;let matched="";synonyms.forEach(([re,target])=>{if(!matched&&re.test(q))matched=target});$("showFavourites").setAttribute("aria-pressed","false");const search=$("serviceSearch");search.value=matched||q;search.dispatchEvent(new Event("input",{bubbles:true}));status.textContent=q?"आपकी जरूरत से मेल खाने वाली सेवाएँ दिखाई गई हैं। नीचे सेवा कार्ड में चेकलिस्ट, पसंद और WhatsApp शेयर उपलब्ध हैं।":"अपनी जरूरत लिखें, जैसे राशन कार्ड, पेंशन या छात्रवृत्ति।";renderFilter();}
$("smartFinderButton").addEventListener("click",find);finder.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();find()}});
$("showAllServices").addEventListener("click",()=>{favouriteOnly=false;$("serviceSearch").value="";$("serviceSearch").dispatchEvent(new Event("input",{bubbles:true}));status.textContent="सभी उपलब्ध सेवाएँ दिखाई जा रही हैं।"});
$("showFavourites").addEventListener("click",()=>{favouriteOnly=true;$("serviceSearch").value="";$("serviceSearch").dispatchEvent(new Event("input",{bubbles:true}));renderFilter();});
$("closeChecklist").addEventListener("click",()=>{$("documentChecklist").hidden=true});
$("serviceFeedbackForm").addEventListener("submit",async e=>{e.preventDefault();const report="KAGZI Jan Seva Feedback\nसेवा: "+$("feedbackService").value.trim()+"\nसमस्या: "+$("feedbackType").value+"\nविवरण: "+$("feedbackDetails").value.trim();try{await navigator.clipboard.writeText(report);$("feedbackStatus").textContent="रिपोर्ट कॉपी हो गई। अब Contact पेज खोलकर इसे संदेश में पेस्ट करें।";}catch{$("feedbackStatus").textContent="रिपोर्ट तैयार है। नीचे दिए संदेश को कॉपी करके Contact पेज पर भेजें: "+report;}const link=document.createElement("a");link.href="contact.html";link.textContent="Contact पेज खोलें";link.className="service-tool-btn";link.target="_blank";link.rel="noopener noreferrer";$("feedbackStatus").append(" ",link);});
updateFavCount();
})();
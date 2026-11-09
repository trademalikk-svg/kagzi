(() => {
  const featureByPath = {
    "legal-document-generator": "legal",
    "public-complaints": "complaint",
    "gram-panchayat": "panchayat"
  };
  const pageName = location.pathname.split("/").pop().replace(/\.html?$/i, "");
  const feature = featureByPath[pageName];
  if (!feature || document.getElementById("kagzi-civic-ai")) return;

  const labels = {
    legal: ["KAGZI AI Document Assistant", "दस्तावेज़ का प्रकार और जरूरी बातें लिखें। AI आपके लिए editable प्रारूप तैयार करेगा।", "जैसे: पानी की समस्या के लिए नगर पंचायत को हिंदी में आवेदन लिखें।"],
    complaint: ["KAGZI AI Complaint Assistant", "समस्या के तथ्य लिखें। AI शिकायत को स्पष्ट और व्यवस्थित भाषा में तैयार करेगा।", "जैसे: स्ट्रीट लाइट 10 दिनों से खराब है, शिकायत का ड्राफ्ट बनाएं।"],
    panchayat: ["KAGZI AI Panchayat Guide", "पंचायत रिकॉर्ड और सरकारी पोर्टल समझने में मदद लें। यह live सरकारी database नहीं है।", "जैसे: eGramSwaraj पर ग्राम पंचायत के विकास कार्य कहाँ देखें?"]
  }[feature];

  const style = document.createElement("style");
  style.textContent = ".kagzi-ai{background:#fff;border:1px solid #dce5f2;border-radius:16px;padding:20px;margin:16px 0;box-shadow:0 5px 18px #10234a0b}.kagzi-ai h2{margin:0 0 8px;color:#0c2c61}.kagzi-ai p{color:#5e6c83;margin:0 0 12px}.kagzi-ai textarea{width:100%;min-height:110px;padding:12px;border:1px solid #cbd6e7;border-radius:9px;font:inherit;resize:vertical}.kagzi-ai button{border:0;border-radius:9px;padding:11px 16px;background:#f2c65e;color:#15223b;font-weight:800;cursor:pointer;margin:10px 8px 0 0}.kagzi-ai button:disabled{opacity:.6;cursor:wait}.kagzi-ai .ai-output{white-space:pre-wrap;overflow-wrap:anywhere;background:#f8faff;border:1px dashed #9aacc7;border-radius:10px;padding:14px;margin-top:12px;min-height:40px}.kagzi-ai .ai-note{font-size:12px}";
  document.head.append(style);

  const section = document.createElement("section");
  section.className = "kagzi-ai";
  section.id = "kagzi-civic-ai";
  const heading = document.createElement("h2");
  heading.textContent = labels[0];
  const intro = document.createElement("p");
  intro.textContent = labels[1];
  const input = document.createElement("textarea");
  input.maxLength = 2500;
  input.setAttribute("aria-label", "AI के लिए निर्देश");
  input.placeholder = labels[2];
  const submit = document.createElement("button");
  submit.type = "button";
  submit.textContent = "AI से तैयार करें";
  const copy = document.createElement("button");
  copy.type = "button";
  copy.textContent = "जवाब कॉपी करें";
  copy.hidden = true;
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const output = document.createElement("div");
  output.className = "ai-output";
  output.hidden = true;
  const note = document.createElement("p");
  note.className = "ai-note";
  note.textContent = "गोपनीय जानकारी, OTP, पासवर्ड, बैंक विवरण या पूरा पहचान नंबर न लिखें। AI का उत्तर जाँचकर ही उपयोग करें। KAGZI सरकारी विभाग नहीं है।";
  section.append(heading, intro, input, submit, copy, status, output, note);

  const hero = document.querySelector(".hero");
  if (hero?.parentNode) hero.parentNode.insertBefore(section, hero.nextSibling);
  else document.querySelector("main")?.prepend(section);

  submit.addEventListener("click", async () => {
    const prompt = input.value.trim();
    if (!prompt) { status.textContent = "पहले अपना निर्देश लिखें।"; input.focus(); return; }
    submit.disabled = true;
    copy.hidden = true;
    output.hidden = true;
    status.textContent = "AI जवाब तैयार कर रहा है…";
    try {
      const response = await fetch("/api/civic-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, prompt })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "AI अनुरोध पूरा नहीं हुआ।");
      output.textContent = data.reply || "कोई जवाब नहीं मिला।";
      output.hidden = false;
      copy.hidden = false;
      status.textContent = "जवाब तैयार है। उपयोग से पहले जानकारी जाँच लें।";
    } catch (error) {
      status.textContent = error.message || "AI सेवा अभी उपलब्ध नहीं है।";
    } finally {
      submit.disabled = false;
    }
  });
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(output.textContent);
      status.textContent = "जवाब कॉपी हो गया।";
    } catch {
      status.textContent = "कॉपी नहीं हुआ। जवाब चुनकर कॉपी करें।";
    }
  });
})(); 

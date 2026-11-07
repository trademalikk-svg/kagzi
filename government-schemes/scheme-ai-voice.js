(() => {
  "use strict";

  const MAX_CONTEXT = 650;
  const MAX_QUESTION = 350;
  const state = { selectedContext: "", recognition: null, listening: false, lastReply: "" };

  const text = (node) => (node?.textContent || "").replace(/\s+/g, " ").trim();
  const cardContext = (card) => {
    const title = text(card.querySelector("h3"));
    const tag = text(card.querySelector(".tag"));
    const parts = [...card.querySelectorAll("p, details summary, details li")]
      .map(text).filter(Boolean);
    const link = card.querySelector('a[href^="https://"]');
    const official = link ? "आधिकारिक लिंक: " + link.href : "";
    return [title, tag, ...parts, official].filter(Boolean).join(" | ").slice(0, MAX_CONTEXT);
  };

  function addStyles() {
    if (document.getElementById("scheme-ai-voice-styles")) return;
    const style = document.createElement("style");
    style.id = "scheme-ai-voice-styles";
    style.textContent = `
      .scheme-ai-tools{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      .scheme-ai-button{border:1px solid #cbd5e1;border-radius:9px;background:#eef3fa;color:#17375f;padding:9px 12px;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
      .scheme-ai-button:focus-visible{outline:3px solid #e9bd5c;outline-offset:2px}
      .scheme-ai-voice-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0}
      .scheme-ai-voice-controls select{padding:8px;border:1px solid #cbd5e1;border-radius:8px;background:#fff}
      .scheme-ai-status{font-size:13px;color:#53647a;min-height:1.4em}
      #schemeAiPanel{background:#fff;border:2px solid #c9d8ed;border-radius:14px;padding:16px;margin:20px 0}
      #schemeAiPanel textarea{display:block;width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:10px;font:inherit;margin:8px 0;min-height:82px}
      #schemeAiPanel .scheme-ai-answer{white-space:pre-wrap;line-height:1.65;background:#f4f7fb;border-radius:10px;padding:12px;margin:10px 0}
      @media(max-width:600px){.scheme-ai-button{flex:1 1 140px}}
    `;
    document.head.append(style);
  }

  function makeButton(label, action, className = "scheme-ai-button") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", action);
    return button;
  }

  function speak(value, status) {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      if (status) status.textContent = "इस ब्राउज़र में आवाज़ उपलब्ध नहीं है। Chrome में कोशिश करें।";
      return;
    }
    const content = String(value || "").replace(/\s+/g, " ").trim();
    if (!content) {
      if (status) status.textContent = "सुनाने के लिए जानकारी उपलब्ध नहीं है।";
      return;
    }
    const language = document.getElementById("schemeVoiceLanguage")?.value || "hi-IN";
    const synth = window.speechSynthesis;
    synth.cancel();
    synth.resume();
    const chunks = [];
    let rest = content;
    while (rest.length) {
      if (rest.length <= 170) { chunks.push(rest); break; }
      let cut = rest.lastIndexOf(" ", 170);
      if (cut < 70) cut = 170;
      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    let index = 0;
    const next = () => {
      if (index >= chunks.length) {
        if (status) status.textContent = "आवाज़ पूरी हुई।";
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[index++]);
      utterance.lang = language;
      utterance.rate = 0.92;
      utterance.onstart = () => { if (status) status.textContent = "योजना की जानकारी सुनाई जा रही है…"; };
      utterance.onend = next;
      utterance.onerror = (event) => {
        if (status) status.textContent = "आवाज़ नहीं चल पाई (" + (event.error || "unknown") + ")। फोन की Text-to-Speech भाषा जाँचें।";
      };
      synth.speak(utterance);
    };
    next();
  }

  function preparePrompt(question) {
    const q = String(question || "").trim().slice(0, MAX_QUESTION);
    const context = state.selectedContext.slice(0, MAX_CONTEXT);
    return ("योजना का उपलब्ध विवरण: " + context +
      "\nउपयोगकर्ता का सवाल: " + q +
      "\nकेवल दिए गए विवरण के आधार पर समझाएँ। जो जानकारी उपलब्ध नहीं है उसे स्पष्ट रूप से अनुपलब्ध बताएँ। पात्रता, राशि, अंतिम तारीख या आवेदन की स्वीकृति की गारंटी न दें। आधिकारिक लिंक पर अंतिम नियम जाँचने को कहें।").slice(0, 1490);
  }

  function createPanel() {
    const existingInput = document.getElementById("aiQuestion");
    if (existingInput) {
      const panel = document.getElementById("kagziAi");
      const ask = document.getElementById("aiAsk");
      const messages = document.getElementById("aiMessages");
      const status = document.getElementById("aiStatus");
      return { input: existingInput, ask, messages, status, panel, existing: true };
    }

    const panel = document.createElement("section");
    panel.id = "schemeAiPanel";
    panel.innerHTML = `
      <span class="tag">KAGZI AI · SCHEME ASSISTANT</span>
      <h2>योजना के बारे में AI से पूछें</h2>
      <p>किसी योजना की पात्रता, लाभ, दस्तावेज़ और आवेदन प्रक्रिया को सरल हिंदी या English में समझें। जवाब उपलब्ध योजना विवरण तक सीमित रहेगा।</p>
      <div class="scheme-ai-answer" id="schemeAiAnswer" aria-live="polite">नमस्ते! किसी योजना पर “AI से पूछें” दबाएँ या अपना सवाल लिखें।</div>
      <label for="schemeAiQuestion"><b>आपका सवाल</b></label>
      <textarea id="schemeAiQuestion" maxlength="520" placeholder="उदाहरण: इस योजना में कौन आवेदन कर सकता है?"></textarea>
      <div class="scheme-ai-voice-controls">
        <select id="schemeVoiceLanguage" aria-label="आवाज़ की भाषा"><option value="hi-IN">हिंदी आवाज़</option><option value="en-IN">English voice</option></select>
        <button type="button" class="scheme-ai-button" id="schemeVoiceInput">🎙 बोलकर पूछें</button>
        <button type="button" class="scheme-ai-button" id="schemeVoiceAnswer" disabled>🔊 जवाब सुनें</button>
        <button type="button" class="scheme-ai-button" id="schemeVoiceStop">⏹ रोकें</button>
        <button type="button" class="scheme-ai-button" id="schemeAiSend">AI से जवाब लें</button>
      </div>
      <p class="scheme-ai-status" id="schemeAiStatus" role="status">आवाज़ की सुविधा आपके ब्राउज़र और फोन की भाषा सेटिंग पर निर्भर है।</p>
      <p class="muted">KAGZI सरकारी विभाग नहीं है। AI की जानकारी सामान्य मार्गदर्शन है; अंतिम पात्रता और आवेदन विभाग तय करता है।</p>
    `;
    const anchor = document.getElementById("upSchemeCards") || document.getElementById("schemeCards") || document.querySelector("main");
    if (anchor) anchor.insertAdjacentElement("afterend", panel);
    return {
      input: panel.querySelector("#schemeAiQuestion"),
      ask: panel.querySelector("#schemeAiSend"),
      messages: panel.querySelector("#schemeAiAnswer"),
      status: panel.querySelector("#schemeAiStatus"),
      panel,
      existing: false
    };
  }

  function initVoice(panel) {
    const controls = panel.panel || document;
    const language = controls.querySelector("#schemeVoiceLanguage") ||
      document.getElementById("schemeVoiceLanguage");
    const inputButton = controls.querySelector("#schemeVoiceInput") ||
      document.getElementById("schemeVoiceInput");
    const answerButton = controls.querySelector("#schemeVoiceAnswer") ||
      document.getElementById("schemeVoiceAnswer");
    const stopButton = controls.querySelector("#schemeVoiceStop") ||
      document.getElementById("schemeVoiceStop");
    if (!language || !inputButton || !answerButton || !stopButton) return;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Recognition) {
      state.recognition = new Recognition();
      state.recognition.interimResults = false;
      state.recognition.maxAlternatives = 1;
      state.recognition.onstart = () => {
        state.listening = true;
        inputButton.textContent = "⏹ सुनना बंद करें";
        if (panel.status) panel.status.textContent = "बोलिए… आपकी आवाज़ को टेक्स्ट में बदला जा रहा है।";
      };
      state.recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || "";
        panel.input.value = (panel.input.value ? panel.input.value + " " : "") + transcript;
        panel.input.focus();
        if (panel.status) panel.status.textContent = "आवाज़ टेक्स्ट में आ गई है। भेजने से पहले जाँच लें।";
      };
      state.recognition.onerror = (event) => {
        if (panel.status) panel.status.textContent = event.error === "not-allowed"
          ? "माइक की अनुमति दें, फिर दोबारा कोशिश करें।"
          : "आवाज़ पहचान उपलब्ध नहीं हुई। आप सवाल टाइप कर सकते हैं।";
      };
      state.recognition.onend = () => {
        state.listening = false;
        inputButton.textContent = "🎙 बोलकर पूछें";
      };
      inputButton.addEventListener("click", () => {
        if (state.listening) { state.recognition.stop(); return; }
        state.recognition.lang = language.value || "hi-IN";
        try { state.recognition.start(); }
        catch { if (panel.status) panel.status.textContent = "माइक शुरू नहीं हुआ। थोड़ी देर बाद फिर कोशिश करें।"; }
      });
    } else {
      inputButton.disabled = true;
      if (panel.status) panel.status.textContent = "इस ब्राउज़र में आवाज़ से सवाल लिखने की सुविधा नहीं है। आप टाइप कर सकते हैं।";
    }

    answerButton.addEventListener("click", () => speak(state.lastReply, panel.status));
    stopButton.addEventListener("click", () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      if (state.recognition && state.listening) state.recognition.stop();
      if (panel.status) panel.status.textContent = "आवाज़ रोक दी गई।";
    });
  }

  function attachCards(panel) {
    const cards = document.querySelectorAll(
      "#schemeCards .scheme, #upSchemeCards .scheme, #cards .card, .wrap > .grid .card"
    );
    cards.forEach((card) => {
      if (card.dataset.schemeAiAttached === "true" || !card.querySelector("h3")) return;
      card.dataset.schemeAiAttached = "true";
      const tools = document.createElement("div");
      tools.className = "scheme-ai-tools";
      const label = text(card.querySelector("h3")) || "योजना";
      tools.append(
        makeButton("🔊 जानकारी सुनें", () => speak(cardContext(card), panel.status)),
        makeButton("AI से पूछें", () => {
          state.selectedContext = cardContext(card);
          panel.input.value = "इस योजना की पात्रता, लाभ, दस्तावेज़ और आवेदन प्रक्रिया विस्तार से समझाइए।";
          panel.panel.scrollIntoView({ behavior: "smooth", block: "start" });
          panel.input.focus();
          if (panel.status) panel.status.textContent = label + " चुनी गई है। अब सवाल भेजें।";
        })
      );
      card.append(tools);
    });
  }

  function initExistingAssistant(panel) {
    const voiceControls = document.createElement("div");
    voiceControls.className = "scheme-ai-voice-controls";
    voiceControls.innerHTML = `
      <select id="schemeVoiceLanguage" aria-label="आवाज़ की भाषा"><option value="hi-IN">हिंदी आवाज़</option><option value="en-IN">English voice</option></select>
      <button type="button" class="scheme-ai-button" id="schemeVoiceInput">🎙 बोलकर पूछें</button>
      <button type="button" class="scheme-ai-button" id="schemeVoiceAnswer" disabled>🔊 जवाब सुनें</button>
      <button type="button" class="scheme-ai-button" id="schemeVoiceStop">⏹ रोकें</button>
    `;
    panel.input.insertAdjacentElement("afterend", voiceControls);
    panel.status.classList.add("scheme-ai-status");
    const voicePanel = { ...panel, panel: panel.panel };
    initVoice(voicePanel);

    panel.ask.addEventListener("click", () => {
      if (!state.selectedContext) return;
      const original = panel.input.value.trim();
      if (!original || original.startsWith("योजना का उपलब्ध विवरण:")) return;
      panel.input.value = preparePrompt(original);
    }, true);

    const observer = new MutationObserver(() => {
      const paragraphs = [...panel.messages.querySelectorAll("p")];
      const last = paragraphs.at(-1);
      if (last && text(last).startsWith("KAGZI AI:")) {
        state.lastReply = text(last).replace(/^KAGZI AI:\s*/, "");
        const voiceAnswer = document.getElementById("schemeVoiceAnswer");
        if (voiceAnswer) voiceAnswer.disabled = !state.lastReply;
      }
    });
    observer.observe(panel.messages, { childList: true, subtree: true });
  }

  async function sendNewAssistant(panel) {
    const question = panel.input.value.trim();
    if (!question || panel.ask.disabled) return;
    const prompt = preparePrompt(question);
    panel.ask.disabled = true;
    panel.status.textContent = "AI जवाब तैयार कर रहा है…";
    panel.messages.textContent = "आपका सवाल भेजा जा रहा है…";
    try {
      const response = await fetch("/api/jan-seva-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt, history: [] })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "AI सेवा अभी उपलब्ध नहीं है।");
      state.lastReply = String(data.reply || "");
      panel.messages.textContent = state.lastReply || "अभी जवाब उपलब्ध नहीं है।";
      panel.status.textContent = "उत्तर सामान्य मार्गदर्शन है। अंतिम नियम आधिकारिक पोर्टल पर जाँचें।";
      const answerButton = document.getElementById("schemeVoiceAnswer");
      if (answerButton) answerButton.disabled = !state.lastReply;
    } catch (error) {
      panel.messages.textContent = error.message || "AI सेवा अभी उपलब्ध नहीं है।";
      panel.status.textContent = "आधिकारिक योजना लिंक से जानकारी जाँचें।";
    } finally {
      panel.ask.disabled = false;
    }
  }

  function init() {
    addStyles();
    const panel = createPanel();
    if (!panel.input || !panel.ask || !panel.messages || !panel.status) return;
    if (panel.existing) initExistingAssistant(panel);
    else {
      initVoice(panel);
      panel.ask.addEventListener("click", () => sendNewAssistant(panel));
      panel.input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendNewAssistant(panel);
        }
      });
    }
    attachCards(panel);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();

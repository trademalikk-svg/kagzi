// KAGZI public Supabase client configuration.
// This publishable key is safe for browser use when RLS policies are enabled.
// NEVER put a service_role or secret key in this file.
window.KAGZI_CONFIG = {
  SUPABASE_URL: "https://gamsxgjaskejyiqazrpo.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_7CV7DUqwnzbFwUV2sQilLw_7W2FyydY"
};

// Privacy-first Google Analytics 4. Analytics starts only after visitor consent.
(function () {
  "use strict";
  var measurementId = "G-B825M6CQ5X";
  if (window.__KAGZI_GA4_BOOTSTRAPPED__) return;
  window.__KAGZI_GA4_BOOTSTRAPPED__ = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500
  });

  var tag = document.createElement("script");
  tag.async = true;
  tag.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
  document.head.appendChild(tag);

  var configured = false;
  function allowAnalytics() {
    window.gtag("consent", "update", { analytics_storage: "granted" });
    if (!configured) {
      window.gtag("config", measurementId, { send_page_view: true });
      configured = true;
    }
  }

  var savedChoice = null;
  try { savedChoice = window.localStorage.getItem("kagzi_analytics_consent"); } catch (e) {}
  if (savedChoice === "granted") {
    allowAnalytics();
    return;
  }
  if (savedChoice === "denied") return;

  function showConsent() {
    if (!document.body || document.getElementById("kagzi-analytics-consent")) return;
    var style = document.createElement("style");
    style.textContent = "#kagzi-analytics-consent{position:fixed;z-index:2147483000;left:16px;right:16px;bottom:16px;max-width:680px;margin:auto;padding:16px;background:#071a3b;color:#fff;border:1px solid #d7b65c;border-radius:14px;box-shadow:0 8px 30px #0004;font:14px/1.5 system-ui,sans-serif}#kagzi-analytics-consent p{margin:0 0 12px}#kagzi-analytics-consent .kagzi-consent-actions{display:flex;gap:9px;flex-wrap:wrap}#kagzi-analytics-consent button{border:1px solid #e7c76d;border-radius:22px;padding:9px 16px;font-weight:700;cursor:pointer}#kagzi-analytics-accept{background:#f3cf69;color:#102044}#kagzi-analytics-reject{background:transparent;color:#fff}";
    document.head.appendChild(style);
    var panel = document.createElement("aside");
    panel.id = "kagzi-analytics-consent";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Analytics preferences");
    var message = document.createElement("p");
    message.textContent = "KAGZI can use Google Analytics to understand page views, device/browser type and approximate region so we can improve the website. Analytics starts only if you choose Allow. Your document files and document contents are not sent to Google Analytics by this tag.";
    var actions = document.createElement("div");
    actions.className = "kagzi-consent-actions";
    var accept = document.createElement("button");
    accept.id = "kagzi-analytics-accept";
    accept.type = "button";
    accept.textContent = "Allow analytics";
    var reject = document.createElement("button");
    reject.id = "kagzi-analytics-reject";
    reject.type = "button";
    reject.textContent = "Reject";
    function saveChoice(choice) {
      try { window.localStorage.setItem("kagzi_analytics_consent", choice); } catch (e) {}
      panel.remove();
      if (choice === "granted") allowAnalytics();
    }
    accept.addEventListener("click", function () { saveChoice("granted"); });
    reject.addEventListener("click", function () { saveChoice("denied"); });
    actions.appendChild(accept);
    actions.appendChild(reject);
    panel.appendChild(message);
    panel.appendChild(actions);
    document.body.appendChild(panel);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showConsent, { once: true });
  } else {
    showConsent();
  }
})();
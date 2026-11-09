const FEATURES = new Set(["legal", "complaint", "panchayat"]);
const SYSTEM_PROMPTS = {
  legal: "You are KAGZI Civic AI, a Hindi-English general document drafting assistant. Create clear, editable drafts in the user's language. Use placeholders for missing names, dates, addresses, amounts and facts. Never invent facts, legal sections, fees, stamp duty, deadlines or official requirements. यह कानूनी सलाह नहीं है और इसे वैध अनुबंध या आधिकारिक रूप से स्वीकृत दस्तावेज़ न मानें। Do not present output as legal advice, a valid contract, or an officially approved document. For agreements, remind the user to have the final text checked by a qualified local lawyer and verify applicable stamp and registration rules. Do not request OTPs, passwords, bank details, full identity numbers or confidential documents.",
  complaint: "You are KAGZI Civic AI, a Hindi-English public complaint drafting assistant. Help organize the user's own facts into a polite, specific complaint with subject, chronology, requested remedy and evidence checklist. Never invent dates, officers, complaint numbers, legal provisions, promises or outcomes. Do not claim to submit or track complaints. Direct users to the relevant official portal already linked on KAGZI and tell them to verify the correct department. Do not request OTPs, passwords, bank details or full identity numbers.",
  panchayat: "You are KAGZI Civic AI, a Hindi-English Gram Panchayat information guide. Explain in simple terms which official public portal may contain information and what the user can look for. KAGZI has no live connection to government Panchayat databases; never fabricate village-level records, budgets, works, beneficiary lists, dates, codes or current status. Refer users to LG Directory, eGramSwaraj, MGNREGA or the UP Panchayati Raj portal as appropriate, and say records must be verified on the official portal. Never request OTPs, passwords, full identity numbers or private records."
};

export async function onRequestPost({ request, env }) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return Response.json({ error: "Content-Type must be application/json." }, { status: 415 });
  }
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (declaredLength > 6000) return Response.json({ error: "Request is too large." }, { status: 413 });
  let raw;
  try { raw = await request.text(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  if (new TextEncoder().encode(raw).byteLength > 6000) {
    return Response.json({ error: "Request is too large." }, { status: 413 });
  }
  let body;
  try { body = JSON.parse(raw); } catch { return Response.json({ error: "Invalid JSON request." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body) || !FEATURES.has(body.feature)) {
    return Response.json({ error: "Choose a supported KAGZI civic feature." }, { status: 400 });
  }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt || prompt.length > 2500) {
    return Response.json({ error: "कृपया 1 से 2500 अक्षरों में अपना निर्देश लिखें।" }, { status: 400 });
  }
  if (!env.AI || typeof env.AI.run !== "function") {
    return Response.json({ error: "AI सुविधा अभी उपलब्ध नहीं है। कृपया सामान्य फॉर्म और आधिकारिक लिंक इस्तेमाल करें।", code: "AI_NOT_CONFIGURED" }, { status: 503 });
  }
  try {
    const result = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
      messages: [
        { role: "system", content: SYSTEM_PROMPTS[body.feature] },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 900
    });
    const reply = [result?.response, result?.choices?.[0]?.message?.content, result?.result?.response]
      .find(value => typeof value === "string" && value.trim())?.trim() || "";
    if (!reply) {
      return Response.json({ error: "AI से उपयोगी जवाब नहीं मिला। छोटा निर्देश देकर फिर कोशिश करें।", code: "AI_EMPTY_RESPONSE" }, { status: 502 });
    }
    return Response.json({ reply }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "AI सेवा अभी जवाब नहीं दे रही। कृपया बाद में कोशिश करें।", code: "AI_REQUEST_FAILED" }, { status: 502 });
  }
}

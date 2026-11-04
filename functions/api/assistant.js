export async function onRequestPost({ request, env }) {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (declaredLength > 50000) return Response.json({ error: "Request is too large." }, { status: 413 });
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Content-Type must be application/json." }, { status: 415 });
  }
  if (!env.AI || typeof env.AI.run !== "function") {
    return Response.json({ error: "AI support is not configured yet.", code: "AI_NOT_CONFIGURED" }, { status: 503 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON request." }, { status: 400 }); }

  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 10) {
    return Response.json({ error: "Send between 1 and 10 messages." }, { status: 400 });
  }

  const messages = [];
  for (const item of body.messages) {
    if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string" || !item.content.trim() || item.content.length > 4000) {
      return Response.json({ error: "A message is invalid or too long." }, { status: 400 });
    }
    messages.push({ role: item.role, content: item.content.trim() });
  }

  const system = `You are KAGZI's customer-support AI assistant. Reply in the language the user uses (Hindi, English, or a natural mix). Be concise, polite, practical, and focused on KAGZI's document workspace. Current browser tools: PDF merge, images-to-PDF, split PDF into groups, remove pages, rotate pages, reorder pages, extract pages, image-based PDF compression, PDF-to-PNG export, image OCR in English/Hindi, photo resize/format conversion, and the KAGZI Office Tools workspace. Office Tools supports local Word text editing with DOCX import/export, spreadsheet editing with XLSX/CSV import/export, slide text editing with PPTX text import and PPTX export, and AI-assisted content generation through this endpoint when the Cloudflare AI binding is configured. DOCX import/export does not preserve all advanced formatting; PPTX import extracts slide text and does not preserve original design, media, or animations. Other areas such as cloud locker, persistent storage, paid plans, and automatic support-ticket tracking are not confirmed as live. Never claim a planned feature is working, never claim a complaint has been registered, and never invent a ticket number or resolution. If a user reports a complaint, help troubleshoot and explain that the current fallback is hello@kagzi.in unless a verified ticket workflow is explicitly available. Do not ask for passwords, OTPs, payment PINs, full identity numbers, or confidential document contents. Do not give legal or official government determinations. If unsure, say so and suggest verifying the information.`;

  try {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [{ role: "system", content: system }, ...messages],
      temperature: 0.3,
      max_tokens: 500
    });
    const reply = typeof result?.response === "string" ? result.response.trim() : "";
    if (!reply) return Response.json({ error: "The AI returned an empty response." }, { status: 502 });
    return Response.json({ reply }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Could not reach Cloudflare Workers AI. Check the AI binding and account usage." }, { status: 502 });
  }
}

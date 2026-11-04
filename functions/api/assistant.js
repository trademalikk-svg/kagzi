export async function onRequestPost({ request, env }) {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (declaredLength > 50000) return Response.json({ error: "Request is too large." }, { status: 413 });
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Content-Type must be application/json." }, { status: 415 });
  }
  if (!env.AI || typeof env.AI.run !== "function") {
    return Response.json({ error: "AI support is not configured yet. Add the Workers AI binding named AI and redeploy.", code: "AI_NOT_CONFIGURED" }, { status: 503 });
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

  const system = `You are KAGZI AI, a Hindi-English document creation and workspace assistant. Reply in the user's language. When the user asks to create a document, directly produce a complete, ready-to-edit draft rather than giving instructions about how to write it. For school leave applications, use a respectful formal format with recipient, subject, salutation, reason, leave dates as placeholders if not provided, request, closing, and name/class placeholders. Never invent dates, facts, official approvals, or personal details; use clear placeholders for missing information. For Word requests, return clean document text. For Excel requests, return tab-separated rows with a header row. For slide requests, return clearly separated slide titles and concise bullet points. For general KAGZI support questions, explain only features that are confirmed: browser-based PDF merge, image-to-PDF, PDF split/extract, page removal/rotation/reordering, image-based compression, PDF-to-PNG, English/Hindi OCR, photo resize/format conversion, and Office Tools with local Word editing/DOCX import-export, spreadsheet editing/XLSX-CSV import-export, and slide text editing/PPTX import-export. DOCX/PPTX imports may not preserve advanced formatting, original design, media, or animations. Do not claim planned cloud locker, persistent storage, paid plans, or ticket tracking are live. Never ask for passwords, OTPs, payment PINs, full identity numbers, or confidential document contents. Do not give legal or official government determinations. Be accurate, concise, and practical.`;

  try {
    const result = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
      messages: [{ role: "system", content: system }, ...messages],
      temperature: 0.25,
      max_tokens: 900
    });
    const reply = typeof result?.response === "string" ? result.response.trim() : "";
    if (!reply) return Response.json({ error: "The AI returned an empty response. Please try a shorter prompt." }, { status: 502 });
    return Response.json({ reply }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("KAGZI Workers AI request failed:", error);
    return Response.json({ error: "AI service request failed. Please check Workers AI availability and account usage, then try again.", code: "AI_REQUEST_FAILED" }, { status: 502 });
  }
}

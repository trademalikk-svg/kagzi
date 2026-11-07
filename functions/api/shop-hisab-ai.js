export async function onRequestPost({ request, env }) {
  if (!env.AI) return Response.json({ error: "AI service is not configured for this deployment." }, { status: 503 });
  let payload;
  try { payload = await request.json(); } catch { return Response.json({ error: "Invalid JSON request." }, { status: 400 }); }
  const summary = payload && typeof payload === "object" ? payload.summary : null;
  if (!summary || typeof summary !== "object") return Response.json({ error: "Missing shop summary." }, { status: 400 });
  const allowed = ["date", "sales", "purchases", "expenses", "cashIn", "cashOut", "customerDue", "supplierDue", "cashBalance", "transactionCount"];
  const safe = {};
  for (const key of allowed) {
    const value = summary[key];
    if (typeof value === "number" && Number.isFinite(value)) safe[key] = Math.round(value * 100) / 100;
    else if (key === "date" && typeof value === "string") safe.date = value.slice(0, 20);
  }
  if (typeof safe.sales !== "number" || typeof safe.purchases !== "number" || typeof safe.expenses !== "number") {
    return Response.json({ error: "Summary totals are incomplete." }, { status: 400 });
  }
  const prompt = "You are a practical small-shop bookkeeping assistant for India. Explain this shop-day summary in simple Hindi. Use only supplied figures. Clearly distinguish sales from profit and cash balance. Do not claim tax compliance or audited profit. Give: (1) short summary, (2) money in/out and dues, (3) up to three practical checks for tomorrow. If a value is missing, say it is unavailable. Never invent numbers.\n\nDATA:\n" + JSON.stringify(safe);
  try {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: "You are a careful bookkeeping explainer. Do not give legal, tax-filing, or investment advice." },
        { role: "user", content: prompt }
      ],
      max_tokens: 450
    });
    const answer = result?.response || result?.output_text || "";
    if (!answer) return Response.json({ error: "AI returned an empty response." }, { status: 502 });
    return Response.json({ answer: String(answer).slice(0, 7000) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "AI summary could not be generated. Your saved shop records are unchanged." }, { status: 502 });
  }
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED = {
  "pdf-docx": { from: "pdf", to: "docx", inputExt: "pdf", outputExts: ["docx"] },
  "pdf-jpg": { from: "pdf", to: "jpg", inputExt: "pdf", outputExts: ["jpg"] },
  "docx-pdf": { from: "docx", to: "pdf", inputExt: "docx", outputExts: ["pdf"] }
};

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function safeName(value, fallback) {
  const base = String(value || fallback).split(/[\\/]/).pop().replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  return base || fallback;
}

function hasValidSignature(bytes, extension) {
  if (extension === "pdf") return bytes.length >= 5 && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (extension === "docx") return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && [0x03, 0x05, 0x07].includes(bytes[2]) && [0x04, 0x06, 0x08].includes(bytes[3]);
  return false;
}

export async function handleRequest({ request, env }, fetchImpl = fetch) {
  if (request.method !== "POST") return json({ error: "केवल POST request स्वीकार है।" }, 405);
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Cross-origin request स्वीकार नहीं है।" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().includes("multipart/form-data")) {
    return json({ error: "कृपया फ़ाइल multipart form के रूप में भेजें।" }, 415);
  }
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_FILE_BYTES + 256 * 1024) return json({ error: "फ़ाइल 10 MB से छोटी होनी चाहिए।" }, 413);
  if (!env.CONVERTAPI_TOKEN) return json({ error: "Converter अभी configure नहीं है। Secret सेट करके Preview deployment दोबारा चलाएँ।", code: "CONVERTER_NOT_CONFIGURED" }, 503);

  let form;
  try { form = await request.formData(); }
  catch { return json({ error: "फ़ाइल request पढ़ी नहीं जा सकी।" }, 400); }

  if (form.get("consent") !== "yes") return json({ error: "फ़ाइल भेजने से पहले आपकी सहमति आवश्यक है।" }, 400);
  const target = ALLOWED[String(form.get("target") || "")];
  if (!target) return json({ error: "यह conversion विकल्प उपलब्ध नहीं है।" }, 400);
  const file = form.get("file");
  if (!file || typeof file.arrayBuffer !== "function" || typeof file.name !== "string") {
    return json({ error: "कृपया एक PDF या DOCX फ़ाइल चुनें।" }, 400);
  }
  if (file.size < 1 || file.size > MAX_FILE_BYTES) return json({ error: "फ़ाइल 1 byte से 10 MB के बीच होनी चाहिए।" }, 413);
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension !== target.inputExt) return json({ error: "चुने गए conversion के लिए सही फ़ाइल format चुनें।" }, 415);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidSignature(bytes, extension)) return json({ error: "फ़ाइल का वास्तविक format मान्य नहीं है।" }, 415);

  const upstreamForm = new FormData();
  upstreamForm.append("File", new Blob([bytes], { type: extension === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), safeName(file.name, "document." + extension));
  upstreamForm.append("StoreFile", "true");

  let upstream;
  try {
    upstream = await fetchImpl("https://v2.convertapi.com/convert/" + target.from + "/to/" + target.to, {
      method: "POST",
      headers: { Authorization: "Bearer " + env.CONVERTAPI_TOKEN },
      body: upstreamForm,
      signal: AbortSignal.timeout(120000)
    });
  } catch {
    return json({ error: "Conversion सेवा से संपर्क नहीं हो पाया। कृपया बाद में कोशिश करें।", code: "CONVERTAPI_UNAVAILABLE" }, 502);
  }

  if (!upstream.ok) {
    let message = "फ़ाइल convert नहीं हो सकी।";
    try {
      const details = await upstream.json();
      if (upstream.status === 401) message = "Converter credentials स्वीकार नहीं हुए। Admin को Secret जाँचना होगा।";
      else if (upstream.status === 403) message = "Trial conversion limit पूरी हो गई है या account अनुमति उपलब्ध नहीं है।";
      else if (upstream.status === 400) message = "यह फ़ाइल ConvertAPI द्वारा स्वीकार नहीं हुई। फ़ाइल जाँचकर फिर कोशिश करें।";
      else if (details?.Message) message = "Conversion असफल रही। कृपया दूसरी फ़ाइल से कोशिश करें।";
    } catch {}
    return json({ error: message, code: "CONVERSION_FAILED" }, upstream.status === 401 ? 502 : 502);
  }

  let result;
  try { result = await upstream.json(); }
  catch { return json({ error: "Conversion सेवा से मान्य परिणाम नहीं मिला।", code: "INVALID_CONVERSION_RESPONSE" }, 502); }
  const files = Array.isArray(result?.Files) ? result.Files : [];
  const outputs = files.filter(item =>
    typeof item?.Url === "string" &&
    (() => { try { const url = new URL(item.Url); return url.protocol === "https:" && url.hostname === "v2.convertapi.com"; } catch { return false; } })()
  ).map(item => ({
    name: safeName(item.FileName, "converted." + target.outputExts[0]),
    url: item.Url
  }));
  if (!outputs.length) return json({ error: "Conversion पूरी नहीं हुई या download link नहीं मिला।", code: "NO_OUTPUT_FILES" }, 502);
  return json({ files: outputs, expiresInHours: 3, message: "Conversion पूरी हुई। Download link अधिकतम 3 घंटे उपलब्ध रहेगा।" });
}

export async function onRequestPost(context) {
  return handleRequest(context);
}

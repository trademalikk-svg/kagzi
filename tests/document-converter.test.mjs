import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "../functions/api/document-converter.js";

const pdfBytes = new TextEncoder().encode("%PDF-1.7\nmock pdf");
const docxBytes = new Uint8Array([0x50,0x4b,0x03,0x04,1,2,3,4]);
const run = (request, env, fetchImpl = fetch) => handleRequest({ request, env }, fetchImpl);

function makeRequest({ bytes = pdfBytes, name = "sample.pdf", target = "pdf-docx", consent = "yes", origin = "https://kagzi.test" } = {}) {
  const form = new FormData();
  form.append("file", new Blob([bytes]), name);
  form.append("target", target);
  form.append("consent", consent);
  return new Request("https://kagzi.test/api/document-converter", {
    method: "POST",
    headers: origin ? { Origin: origin } : {},
    body: form
  });
}

test("requires consent before forwarding the document", async () => {
  let called = false;
  const response = await run(makeRequest({ consent: "no" }), { CONVERTAPI_TOKEN: "test" }, async () => { called = true; });
  assert.equal(response.status, 400);
  assert.equal(called, false);
});

test("rejects missing server token", async () => {
  const response = await run(makeRequest(), {});
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "CONVERTER_NOT_CONFIGURED");
});

test("rejects cross-origin requests", async () => {
  const response = await run(makeRequest({ origin: "https://evil.test" }), { CONVERTAPI_TOKEN: "test" });
  assert.equal(response.status, 403);
});

test("rejects unsupported conversion and mismatched file signatures", async () => {
  const env = { CONVERTAPI_TOKEN: "test" };
  const unsupported = await run(makeRequest({ target: "pdf-zip" }), env);
  const badSignature = await run(makeRequest({ bytes: new TextEncoder().encode("not a pdf") }), env);
  assert.equal(unsupported.status, 400);
  assert.equal(badSignature.status, 415);
});

test("rejects a DOCX request with a non-ZIP signature", async () => {
  const response = await run(makeRequest({ bytes: pdfBytes, name: "bad.docx", target: "docx-pdf" }), { CONVERTAPI_TOKEN: "test" });
  assert.equal(response.status, 415);
});

test("calls ConvertAPI with bearer auth and returns only trusted temporary links", async () => {
  let captured;
  const response = await run(makeRequest(), { CONVERTAPI_TOKEN: "private-test-token" }, async (url, options) => {
    captured = { url, options };
    return Response.json({ Files: [{ FileName: "sample.docx", Url: "https://v2.convertapi.com/d/abc/sample.docx" }] });
  });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(captured.url, "https://v2.convertapi.com/convert/pdf/to/docx");
  assert.equal(captured.options.headers.Authorization, "Bearer private-test-token");
  assert.equal(captured.options.body.get("StoreFile"), "true");
  assert.deepEqual(data.files, [{ name: "sample.docx", url: "https://v2.convertapi.com/d/abc/sample.docx" }]);
  assert.equal(data.expiresInHours, 3);
});

test("does not return untrusted output URLs", async () => {
  const response = await run(makeRequest(), { CONVERTAPI_TOKEN: "test" }, async () =>
    Response.json({ Files: [{ FileName: "bad.docx", Url: "https://evil.test/file" }] })
  );
  assert.equal(response.status, 502);
  assert.equal((await response.json()).code, "NO_OUTPUT_FILES");
});

test("supports PDF to JPG and DOCX to PDF file signatures", async () => {
  for (const options of [
    { bytes: pdfBytes, name: "pages.pdf", target: "pdf-jpg" },
    { bytes: docxBytes, name: "letter.docx", target: "docx-pdf" }
  ]) {
    const response = await run(makeRequest(options), { CONVERTAPI_TOKEN: "test" }, async () =>
      Response.json({ Files: [{ FileName: "converted.out", Url: "https://v2.convertapi.com/d/abc/converted.out" }] })
    );
    assert.equal(response.status, 200);
  }
});

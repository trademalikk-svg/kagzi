import { json, required, authenticatedUser, adminRequest, fetchResource } from "./_shared.js";

export async function onRequestPost({ request, env }) {
  try {
    if (!required(env, ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"])) {
      return json({ error: "Secure download is not configured." }, 503);
    }
    const user = await authenticatedUser(request, env);
    if (!user) return json({ error: "पहले Login करें।" }, 401);

    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
    const resourceId = String(body?.resource_id || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(resourceId)) {
      return json({ error: "PDF चयन मान्य नहीं है।" }, 400);
    }

    const entitlementQuery = new URLSearchParams({
      select: "id,status,expires_at",
      user_id: "eq." + user.id,
      resource_id: "eq." + resourceId,
      status: "eq.active",
      limit: "1"
    });
    const entitlementResponse = await adminRequest(env, "/rest/v1/kagzi_paid_entitlements?" + entitlementQuery);
    if (!entitlementResponse.ok) return json({ error: "Access जाँच नहीं हो पाई।" }, 502);
    const entitlements = await entitlementResponse.json();
    const entitlement = entitlements[0];
    if (!entitlement || (entitlement.expires_at && new Date(entitlement.expires_at).getTime() <= Date.now())) {
      return json({ error: "इस PDF का Paid Access आपके अकाउंट में नहीं है।" }, 403);
    }

    const resource = await fetchResource(env, resourceId);
    if (!resource || !resource.is_active || !resource.storage_path) return json({ error: "PDF अभी उपलब्ध नहीं है।" }, 404);
    const objectPath = resource.storage_path.split("/").map(encodeURIComponent).join("/");
    const signedResponse = await fetch(
      String(env.SUPABASE_URL).replace(/\/$/, "") + "/storage/v1/object/sign/kagzi-paid-pdfs/" + objectPath,
      {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
          "content-type": "application/json"
        },
        body: JSON.stringify({ expiresIn: 60, download: true })
      }
    );
    const signed = await signedResponse.json().catch(() => ({}));
    if (!signedResponse.ok || !signed.signedURL) return json({ error: "Secure PDF link नहीं बन पाया।" }, 502);
    const supabaseBase = String(env.SUPABASE_URL).replace(/\/$/, "");
    const url = /^https?:\/\//i.test(signed.signedURL)
      ? signed.signedURL
      : supabaseBase + (signed.signedURL.startsWith("/storage/v1/") ? signed.signedURL : "/storage/v1" + (signed.signedURL.startsWith("/") ? signed.signedURL : "/" + signed.signedURL));
    return json({ signed_url: url, expires_in: 60 });
  } catch (error) {
    return json({ error: error.message || "Secure download अभी उपलब्ध नहीं है।" }, 500);
  }
}

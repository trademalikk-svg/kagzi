import { json, required, authenticatedUser, fetchResource, adminRequest, razorpayAuth } from "./_shared.js";

export async function onRequestPost({ request, env }) {
  try {
    if (!required(env, ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"])) {
      return json({ error: "Payment setup is incomplete. No payment was started." }, 503);
    }
    const user = await authenticatedUser(request, env);
    if (!user) return json({ error: "पहले KAGZI अकाउंट में Login करें।" }, 401);

    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
    const resourceId = String(body?.resource_id || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(resourceId)) {
      return json({ error: "मान्य PDF चयन करें।" }, 400);
    }

    const resource = await fetchResource(env, resourceId);
    if (!resource || !resource.is_active || !Number.isInteger(resource.price_inr) || resource.price_inr <= 0) {
      return json({ error: "यह Paid PDF अभी खरीदने के लिए उपलब्ध नहीं है।" }, 404);
    }

    const amount = resource.price_inr * 100;
    if (!Number.isSafeInteger(amount)) return json({ error: "PDF की कीमत मान्य नहीं है।" }, 400);
    const receipt = "kagzi_" + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
    const gatewayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { authorization: razorpayAuth(env), "content-type": "application/json" },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt,
        notes: { kagzi_user_id: user.id, kagzi_resource_id: resource.id }
      })
    });
    const gatewayOrder = await gatewayResponse.json().catch(() => ({}));
    if (!gatewayResponse.ok || !gatewayOrder.id || gatewayOrder.amount !== amount || gatewayOrder.currency !== "INR") {
      return json({ error: "Payment gateway से order नहीं बन पाया। कृपया बाद में कोशिश करें।" }, 502);
    }

    const saved = await adminRequest(env, "/rest/v1/kagzi_payment_orders", {
      method: "POST",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: user.id,
        resource_id: resource.id,
        gateway: "razorpay",
        razorpay_order_id: gatewayOrder.id,
        amount_inr: resource.price_inr,
        currency: "INR",
        status: "pending"
      })
    });
    if (!saved.ok) return json({ error: "Payment order सुरक्षित नहीं हो पाया। कोई checkout शुरू नहीं किया गया।" }, 502);

    return json({
      key_id: env.RAZORPAY_KEY_ID,
      order_id: gatewayOrder.id,
      amount: gatewayOrder.amount,
      currency: gatewayOrder.currency,
      name: "KAGZI",
      description: resource.title
    });
  } catch (error) {
    return json({ error: error.message || "Checkout अभी उपलब्ध नहीं है।" }, 500);
  }
}

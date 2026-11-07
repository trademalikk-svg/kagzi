const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

const required = (env, names) => names.every(name => typeof env[name] === "string" && env[name].length > 0);

function serviceHeaders(env, extra = {}) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
    "content-type": "application/json",
    ...extra
  };
}

async function adminRequest(env, path, init = {}) {
  const base = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  if (!base || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Server payment configuration is incomplete.");
  return fetch(base + path, {
    ...init,
    headers: serviceHeaders(env, init.headers || {})
  });
}

async function authenticatedUser(request, env) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return null;
  const base = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const response = await fetch(base + "/auth/v1/user", {
    headers: { apikey: env.SUPABASE_ANON_KEY, authorization }
  });
  if (!response.ok) return null;
  const user = await response.json();
  return user && typeof user.id === "string" ? user : null;
}

async function fetchResource(env, resourceId) {
  const query = new URLSearchParams({
    select: "id,title,description,storage_path,price_inr,is_active",
    id: "eq." + resourceId,
    limit: "1"
  });
  const response = await adminRequest(env, "/rest/v1/kagzi_paid_resources?" + query);
  if (!response.ok) throw new Error("Paid PDF details could not be loaded.");
  const rows = await response.json();
  return rows[0] || null;
}

async function fetchPaymentOrder(env, orderId, userId) {
  const query = new URLSearchParams({
    select: "id,user_id,resource_id,razorpay_order_id,razorpay_payment_id,amount_inr,currency,status",
    razorpay_order_id: "eq." + orderId,
    user_id: "eq." + userId,
    limit: "1"
  });
  const response = await adminRequest(env, "/rest/v1/kagzi_payment_orders?" + query);
  if (!response.ok) throw new Error("Payment order could not be checked.");
  const rows = await response.json();
  return rows[0] || null;
}

async function settlePaidOrder(env, order, paymentId) {
  const now = new Date().toISOString();
  const patch = await adminRequest(
    env,
    "/rest/v1/kagzi_payment_orders?id=eq." + encodeURIComponent(order.id),
    {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({
        status: "paid",
        razorpay_payment_id: paymentId,
        payment_verified_at: now,
        updated_at: now
      })
    }
  );
  if (!patch.ok) throw new Error("Payment was captured but the order record could not be updated. Please contact support.");

  const grant = await adminRequest(env, "/rest/v1/kagzi_paid_entitlements?on_conflict=user_id,resource_id", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      user_id: order.user_id,
      resource_id: order.resource_id,
      status: "active",
      granted_at: now,
      expires_at: null,
      granted_by: null
    })
  });
  if (!grant.ok) throw new Error("Payment verified. Library access is being reconciled; refresh My Paid Library shortly.");
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeHexEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

async function verifyHmacHex(secret, message, supplied) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(supplied || "")) return false;
  const expected = await hmacHex(secret, message);
  return constantTimeHexEqual(expected.toLowerCase(), supplied.toLowerCase());
}

function capturedPaymentMatches(payment, order) {
  return !!payment &&
    payment.status === "captured" &&
    payment.order_id === order.razorpay_order_id &&
    payment.currency === order.currency &&
    Number.isInteger(payment.amount) &&
    payment.amount === order.amount_inr * 100;
}

function razorpayAuth(env) {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) throw new Error("Payment gateway is not configured.");
  return "Basic " + btoa(env.RAZORPAY_KEY_ID + ":" + env.RAZORPAY_KEY_SECRET);
}

export {
  json, required, adminRequest, authenticatedUser, fetchResource, fetchPaymentOrder,
  settlePaidOrder, hmacHex, verifyHmacHex, capturedPaymentMatches, razorpayAuth
};

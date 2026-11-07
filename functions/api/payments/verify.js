import {
  json, required, authenticatedUser, fetchPaymentOrder, capturedPaymentMatches,
  settlePaidOrder, verifyHmacHex, razorpayAuth
} from "./_shared.js";

export async function onRequestPost({ request, env }) {
  try {
    if (!required(env, ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"])) {
      return json({ error: "Payment verification is not configured." }, 503);
    }
    const user = await authenticatedUser(request, env);
    if (!user) return json({ error: "Login session समाप्त हो गया। दोबारा Login करें।" }, 401);

    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid payment response." }, 400); }
    const orderId = String(body?.razorpay_order_id || "");
    const paymentId = String(body?.razorpay_payment_id || "");
    const signature = String(body?.razorpay_signature || "");
    if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) {
      return json({ error: "Payment response is incomplete." }, 400);
    }

    const order = await fetchPaymentOrder(env, orderId, user.id);
    if (!order) return json({ error: "यह payment order आपके अकाउंट से मेल नहीं खाता।" }, 404);
    if (order.status === "paid") {
      await settlePaidOrder(env, order, order.razorpay_payment_id || paymentId);
      return json({ verified: true, message: "Payment पहले ही verify हो चुका है।" });
    }

    const validSignature = await verifyHmacHex(env.RAZORPAY_KEY_SECRET, orderId + "|" + paymentId, signature);
    if (!validSignature) return json({ error: "Payment signature verify नहीं हुआ। PDF access नहीं दिया गया।" }, 400);

    const gatewayResponse = await fetch("https://api.razorpay.com/v1/payments/" + encodeURIComponent(paymentId), {
      headers: { authorization: razorpayAuth(env) }
    });
    const payment = await gatewayResponse.json().catch(() => ({}));
    if (!gatewayResponse.ok || !capturedPaymentMatches(payment, order)) {
      return json({ error: "Payment अभी captured/verified नहीं है। PDF access नहीं दिया गया।" }, 402);
    }

    await settlePaidOrder(env, order, paymentId);
    return json({ verified: true, message: "Payment verify हो गया। आपकी PDF My Paid Library में उपलब्ध है।" });
  } catch (error) {
    return json({ error: error.message || "Payment verify नहीं हो पाया।" }, 500);
  }
}

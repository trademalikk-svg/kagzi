import {
  json, adminRequest, fetchPaymentOrder, settlePaidOrder, verifyHmacHex
} from "./_shared.js";

export async function onRequestPost({ request, env }) {
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.RAZORPAY_WEBHOOK_SECRET) {
      return json({ error: "Webhook is not configured." }, 503);
    }
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";
    if (!await verifyHmacHex(env.RAZORPAY_WEBHOOK_SECRET, rawBody, signature)) {
      return json({ error: "Invalid webhook signature." }, 400);
    }

    let event;
    try { event = JSON.parse(rawBody); } catch { return json({ error: "Invalid webhook payload." }, 400); }
    if (event.event !== "payment.captured") return json({ received: true, ignored: true });

    const payment = event.payload?.payment?.entity;
    const orderId = String(payment?.order_id || "");
    const paymentId = String(payment?.id || "");
    if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId) || payment?.status !== "captured") {
      return json({ error: "Captured payment details are incomplete." }, 400);
    }

    const lookup = await adminRequest(env, "/rest/v1/kagzi_payment_orders?" + new URLSearchParams({
      select: "id,user_id,resource_id,razorpay_order_id,razorpay_payment_id,amount_inr,currency,status",
      razorpay_order_id: "eq." + orderId,
      limit: "1"
    }));
    if (!lookup.ok) return json({ error: "KAGZI order lookup failed." }, 502);
    const rows = await lookup.json();
    const order = rows[0];
    if (!order) return json({ error: "KAGZI order not found." }, 404);
    if (payment.currency !== order.currency || payment.amount !== order.amount_inr * 100) {
      return json({ error: "Captured amount does not match the KAGZI order." }, 400);
    }

    await settlePaidOrder(env, order, paymentId);
    return json({ received: true, verified: true });
  } catch (error) {
    return json({ error: error.message || "Webhook processing failed." }, 500);
  }
}

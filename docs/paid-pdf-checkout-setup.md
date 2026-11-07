# KAGZI Paid PDF Checkout — deployment checklist

The checkout sequence is **Login → Razorpay payment → server-side verification → private PDF access**.

## What this implementation does

- The paid catalogue is public, but checkout requires a signed-in Supabase user.
- The server creates the Razorpay order using the price stored in the database; the browser cannot choose the amount.
- The browser receives no private PDF object path.
- A successful checkout callback is not trusted by itself. The server verifies the Razorpay HMAC signature and retrieves the payment from Razorpay, requiring captured status, matching order ID, currency and exact amount.
- The signed webhook endpoint reconciles captured payments if the customer closes the browser before the callback completes.
- Only after verification does the server mark the order paid and upsert the user's entitlement.
- PDF downloads go through a server endpoint that checks the authenticated user's active entitlement, then returns a 60-second signed URL from the private Supabase bucket.

## Required Supabase migration

Apply `supabase/migrations/20261108_paid_pdf_checkout.sql` in the KAGZI Supabase project's SQL Editor after the existing paid-PDF library migration has been applied.

The migration adds `kagzi_payment_orders`, restricts public resource reads to catalogue-safe columns, and leaves the existing private bucket and admin upload policies in place.

## Cloudflare Pages environment variables

Set these for the KAGZI Pages project. Use encrypted **Secrets** for all credentials:

| Variable | Type |
|---|---|
| `SUPABASE_URL` | Variable |
| `SUPABASE_ANON_KEY` | Variable |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret — never expose in browser code |
| `RAZORPAY_KEY_ID` | Secret |
| `RAZORPAY_KEY_SECRET` | Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Secret |

Use the same Supabase project that contains `kagzi_paid_resources`, `kagzi_paid_entitlements`, and the private `kagzi-paid-pdfs` bucket. Never commit real keys to Git.

## Razorpay webhook

Configure the webhook URL:

`https://kagzi-8cy.pages.dev/api/payments/webhook`

Subscribe to the `payment.captured` event and use the same webhook secret configured in Cloudflare as `RAZORPAY_WEBHOOK_SECRET`.

## Before accepting live payments

1. Apply the migration.
2. Add the Cloudflare variables/secrets.
3. Configure the Razorpay webhook.
4. Test with Razorpay test-mode credentials and a test payment.
5. Confirm that failed, cancelled, wrong-amount, wrong-order and invalid-signature attempts do not create entitlements.
6. Confirm a captured test payment creates one entitlement and the PDF can be downloaded from My Paid Library.
7. Only then consider live-mode activation. Merchant onboarding and gateway account ownership must comply with Razorpay's eligibility and local requirements.

Until the secrets and migration are configured, the checkout endpoint deliberately returns a setup error and does not initiate a payment.

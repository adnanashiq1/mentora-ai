import { NextResponse } from "next/server";
import Stripe from "stripe";
import { upsertSubscription } from "@/lib/db";

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // Always verify the signature against the RAW body - never trust an
    // unsigned webhook payload, since anyone could otherwise POST fake
    // "subscription active" events and get free Pro access.
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.userId;
      if (userId) {
        await upsertSubscription({
          userId,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
          stripeSubscriptionId:
            typeof session.subscription === "string" ? session.subscription : undefined,
          status: "active",
        });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : undefined;

      if (customerId) {
        const { getSubscriptionByStripeCustomerId } = await import("@/lib/db");
        const existing = await getSubscriptionByStripeCustomerId(customerId);
        if (existing) {
          let status: "active" | "canceled" | "past_due" = "active";
          if (event.type === "customer.subscription.deleted" || subscription.status === "canceled") {
            status = "canceled";
          } else if (subscription.status === "past_due") {
            status = "past_due";
          } else if (subscription.status === "active" || subscription.status === "trialing") {
            status = "active";
          }
          await upsertSubscription({
            userId: existing.user_id as string,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            status,
          });
        }
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

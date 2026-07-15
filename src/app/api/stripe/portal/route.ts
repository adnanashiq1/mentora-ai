import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeCustomerIdForUser } from "@/lib/db";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payments aren't configured yet." }, { status: 500 });
  }

  // Look up the Stripe customer via our own DB, keyed to the signed-in
  // user - never trust a client-supplied customer ID here, or anyone could
  // request access to someone else's billing portal.
  const customerId = await getStripeCustomerIdForUser(userId);
  if (!customerId) {
    return NextResponse.json({ error: "No subscription found for this account." }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = new URL(req.url).origin;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}

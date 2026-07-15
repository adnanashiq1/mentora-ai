import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getMonetizationEnabled, getUserSubscriptionStatus } from "@/lib/db";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const enabled = await getMonetizationEnabled();
  if (!enabled) {
    return NextResponse.json({ error: "Upgrades aren't available right now." }, { status: 403 });
  }

  const status = await getUserSubscriptionStatus(userId);
  if (status === "active") {
    return NextResponse.json({ error: "You're already on Pro." }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
    return NextResponse.json({ error: "Payments aren't configured yet." }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const user = await currentUser();
  const origin = new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    customer_email: user?.emailAddresses[0]?.emailAddress,
    client_reference_id: userId,
    success_url: `${origin}/pricing?upgraded=true`,
    cancel_url: `${origin}/pricing`,
    metadata: { userId },
  });

  return NextResponse.json({ url: session.url });
}

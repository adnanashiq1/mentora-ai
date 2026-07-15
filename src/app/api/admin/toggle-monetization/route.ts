import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getMonetizationEnabled, setMonetizationEnabled } from "@/lib/db";

async function requireAdmin() {
  const user = await currentUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  const isAdmin =
    !!user && !!adminEmail && user.emailAddresses.some((e) => e.emailAddress === adminEmail);
  return isAdmin;
}

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const current = await getMonetizationEnabled();
  await setMonetizationEnabled(!current);

  return NextResponse.json({ monetizationEnabled: !current });
}

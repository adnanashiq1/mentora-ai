import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require the user to be signed in.
// Add more protected routes here as we build them (e.g. "/chapters(.*)").
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/chat(.*)",
  "/onboarding(.*)",
  "/chapters(.*)",
  "/leaderboard(.*)",
  "/progress(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

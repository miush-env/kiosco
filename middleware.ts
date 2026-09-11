import { clerkMiddleware } from "@clerk/nextjs/server";

// El control de acceso real vive en cada layout/page (app/panel/layout.tsx,
// app/panel/carta/page.tsx) siguiendo la recomendación actual de Clerk de
// hacer "resource-based auth checks" en vez de path-matching en middleware.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};

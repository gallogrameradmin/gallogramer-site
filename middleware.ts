import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CORS для /api/admin/* — позволяет админ-странице (на www.gallogramer.com,
 * куда фронт грузится через YC CDN) звать API напрямую в vercel.app,
 * минуя CDN с его POST-блоком.
 */
const ALLOWED_ORIGINS = new Set([
  "https://www.gallogramer.com",
  "https://gallogramer.com",
  "https://gallogramer-site.vercel.app",
  "http://localhost:3000",
]);

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin || "https://www.gallogramer.com",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      },
    });
  }

  const res = NextResponse.next();
  if (allowOrigin) {
    res.headers.set("Access-Control-Allow-Origin", allowOrigin);
    res.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.headers.set("Vary", "Origin");
  }
  return res;
}

export const config = {
  matcher: ["/api/admin/:path*", "/api/contact"],
};

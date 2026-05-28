/**
 * Простая аутентификация админ-роутов: shared secret в Authorization header.
 * Токен задаётся через env var ADMIN_TOKEN на Vercel.
 */
import { NextResponse } from "next/server";

const TOKEN = process.env.ADMIN_TOKEN ?? "";

export function checkAuth(req: Request): NextResponse | null {
  if (!TOKEN) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN не задан на сервере" },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m || m[1] !== TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

import { NextRequest, NextResponse } from "next/server";

// Datum, kdy se web automaticky odemkne (UTC)
const UNLOCK_AT_UTC = Date.UTC(2025, 11, 8, 0, 0, 0); // 8. 12. 2025 (měsíc 0-based → 11)

const ALLOWED_PATHS: Array<(p: string) => boolean> = [
  (p) => p === "/lock" || p.startsWith("/lock"),
  (p) => p.startsWith("/api/lock/"),
  (p) => p.startsWith("/api/"), // necháme API přístupné
  (p) => p.startsWith("/_next/"),
  (p) => p.startsWith("/media/"),
  (p) => p === "/favicon.ico" || p.startsWith("/apple-touch-icon"),
];

export function middleware(req: NextRequest) {
  // Pokud datum již proběhl → bez zámku
  if (Date.now() >= UNLOCK_AT_UTC) {
    return NextResponse.next();
  }
  const { pathname } = req.nextUrl;
  // povolené cesty
  if (ALLOWED_PATHS.some((fn) => fn(pathname))) {
    return NextResponse.next();
  }
  // cookie pro odemknutí
  const unlocked = req.cookies.get("site_unlocked")?.value === "1";
  if (unlocked) {
    return NextResponse.next();
  }
  // jinak přesměruj na /lock
  const url = req.nextUrl.clone();
  url.pathname = "/lock";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!.*\\.).*)"], // všechny "stránky" (ignoruje soubory s tečkou)
};



import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
const ADMIN_UID = process.env.ADMIN_UID;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function POST(req: Request) {
  try {
    const { username, password } = (await req.json()) as { username?: string; password?: string };
    // 1) ENV user/pass
    if (ADMIN_USER && ADMIN_PASS && username === ADMIN_USER && password === ADMIN_PASS) {
      const res = NextResponse.json({ ok: true, mode: "env" });
      res.cookies.set("site_unlocked", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 den
      });
      return res;
    }
    // 2) Firebase email+heslo + whitelist UID/e‑mail
    if (username && password && (ADMIN_UID || ADMIN_EMAIL)) {
      try {
        const FIREBASE_API_KEY = "AIzaSyCSu74EcShP98yuYfBhsnoMXqSH5SyxW_o";
        const resp = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: username, password, returnSecureToken: true }),
          }
        );
        const data = await resp.json();
        if (resp.ok) {
          const uid = data?.localId as string | undefined;
          const email = data?.email as string | undefined;
          const uidOk = ADMIN_UID ? uid === ADMIN_UID : true;
          const emailOk = ADMIN_EMAIL ? email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() : true;
          if (uidOk && emailOk) {
            const res = NextResponse.json({ ok: true, mode: "firebase" });
            res.cookies.set("site_unlocked", "1", {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 24,
            });
            return res;
          }
        }
      } catch {
        // fallthrough
      }
    }
    return NextResponse.json({ ok: false }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}



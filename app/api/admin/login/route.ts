import { NextResponse } from "next/server";
import { createHmac } from "crypto";

export const runtime = "nodejs";

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
const ADMIN_UID = process.env.ADMIN_UID;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function POST(request: Request) {
	try {
		const { username, password } = (await request.json()) as {
			username?: string;
			password?: string;
		};

		// 1) ENV admin (přímé porovnání)
		if (ADMIN_USER && ADMIN_PASS && username === ADMIN_USER && password === ADMIN_PASS) {
			const res = NextResponse.json({ ok: true, mode: "env" });
			const token = "ok";
			const secret = process.env.ADMIN_SIGNING_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "";
			const sig = createHmac("sha256", secret).update(token).digest("hex");
			res.cookies.set("extro_admin", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
				maxAge: 60 * 60 * 4
			});
			res.cookies.set("extro_admin_sig", sig, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
				maxAge: 60 * 60 * 4
			});
			return res;
		}

		// 2) Firebase e‑mail/heslo + whitelist UID/e‑mail (fallback, pokud je k dispozici UID/e‑mail)
		if (username && password && (ADMIN_UID || ADMIN_EMAIL)) {
			try {
				// Použijeme veřejný Firebase Web API klíč z klientské konfigurace.
				const FIREBASE_API_KEY = "AIzaSyCSu74EcShP98yuYfBhsnoMXqSH5SyxW_o";
				const resp = await fetch(
					`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ email: username, password, returnSecureToken: true })
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
						const token = "ok";
						const secret = process.env.ADMIN_SIGNING_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "";
						const sig = createHmac("sha256", secret).update(token).digest("hex");
						res.cookies.set("extro_admin", token, {
							httpOnly: true,
							secure: process.env.NODE_ENV === "production",
							sameSite: "lax",
							path: "/",
							maxAge: 60 * 60 * 4
						});
						res.cookies.set("extro_admin_sig", sig, {
							httpOnly: true,
							secure: process.env.NODE_ENV === "production",
							sameSite: "lax",
							path: "/",
							maxAge: 60 * 60 * 4
						});
						return res;
					}
				}
			} catch {
				// fallthrough to 401
			}
		}

		// Pokud nic nevyšlo, vrať 401
		return NextResponse.json({ ok: false }, { status: 401 });
	} catch {
		return NextResponse.json({ ok: false }, { status: 400 });
	}
}


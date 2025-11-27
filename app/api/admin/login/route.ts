import { NextResponse } from "next/server";

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

export async function POST(request: Request) {
	try {
		if (!ADMIN_USER || !ADMIN_PASS) {
			return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });
		}
		const { username, password } = await request.json();
		if (username === ADMIN_USER && password === ADMIN_PASS) {
			const res = NextResponse.json({ ok: true });
			res.cookies.set("extro_admin", "1", {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
				maxAge: 60 * 60 * 4
			});
			return res;
		}
		return NextResponse.json({ ok: false }, { status: 401 });
	} catch {
		return NextResponse.json({ ok: false }, { status: 400 });
	}
}


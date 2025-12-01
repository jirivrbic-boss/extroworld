import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const { code, percent }: { code?: string; percent?: number } = await req.json();
		if (!process.env.STRIPE_SECRET_KEY) {
			return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
		}
		if (!code || typeof code !== "string" || !code.trim()) {
			return NextResponse.json({ error: "Zadej název kódu." }, { status: 400 });
		}
		const pct = Math.round(Number(percent || 0));
		if (!(pct >= 1 && pct <= 100)) {
			return NextResponse.json({ error: "Sleva musí být 1–100 %." }, { status: 400 });
		}
		const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
		// Create coupon (percent off)
		const coupon = await stripe.coupons.create({
			percent_off: pct,
			duration: "once"
		});
		// Create promotion code (přímý HTTP call kvůli rozdílům v typových definicích)
		const form = new URLSearchParams();
		form.set("coupon", coupon.id);
		form.set("code", code.trim().toUpperCase());
		form.set("active", "true");
		const resp = await fetch("https://api.stripe.com/v1/promotion_codes", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: form
		});
		const promo = await resp.json();
		if (!resp.ok) {
			throw new Error(promo?.error?.message || "Stripe promotion code create failed");
		}
		return NextResponse.json({
			ok: true,
			couponId: coupon.id,
			promotionCodeId: promo.id,
			code: promo.code,
			percent: pct
		});
	} catch (e: any) {
		return NextResponse.json({ error: e?.message ?? "Chyba při vytváření kódu." }, { status: 400 });
	}
}



import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const { code }: { code?: string } = await req.json();
		if (!process.env.STRIPE_SECRET_KEY) {
			return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
		}
		if (!code || !code.trim()) {
			return NextResponse.json({ error: "Chybí kód." }, { status: 400 });
		}
		// Speciální master kód: 100% na celou objednávku (vč. dopravy)
		if (code.trim().toUpperCase() === "EXTRO100WORLD") {
			return NextResponse.json({ ok: true, found: true, percent: 100, special: true });
		}
		const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
		const list = await stripe.promotionCodes.list({
			code: code.trim(),
			active: true,
			limit: 1,
			expand: ["data.coupon"]
		});
		const promo = list.data?.[0] ?? null;
		// Typy Stripe v některých verzích nemají 'coupon' v PromotionCode – použijeme safe cast
		let coupon: any = (promo as any)?.coupon;
		if (!promo) {
			return NextResponse.json({ ok: false, found: false }, { status: 404 });
		}
		// Pokud promotion code vrací jen ID kuponu, načti detail
		if (typeof coupon === "string") {
			try {
				coupon = await stripe.coupons.retrieve(coupon);
			} catch {
				coupon = null;
			}
		}
		const pct = coupon && typeof coupon === "object" ? (coupon.percent_off ?? null) : null;
		if (!pct || pct <= 0) {
			return NextResponse.json({ ok: false, found: true, percent: 0 }, { status: 404 });
		}
		return NextResponse.json({ ok: true, found: true, percent: Math.round(pct) });
	} catch (e: any) {
		return NextResponse.json({ error: e?.message ?? "Chyba validace." }, { status: 400 });
	}
}



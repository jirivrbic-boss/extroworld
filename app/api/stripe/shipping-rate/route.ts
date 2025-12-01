import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
	try {
		if (!process.env.STRIPE_SECRET_KEY) {
			return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
		}
		const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
		const envRateId = process.env.STRIPE_ZASILKOVNA_RATE_ID;
		if (envRateId) {
			const rate = await stripe.shippingRates.retrieve(envRateId);
			const amt = (rate as any)?.fixed_amount?.amount;
			const curr = (rate as any)?.fixed_amount?.currency;
			if (typeof amt === "number" && curr === "czk") {
				return NextResponse.json({ amountHaler: amt, amountCzk: Math.round(amt / 100), id: rate.id });
			}
		}
		const rates = await stripe.shippingRates.list({ active: true, limit: 25 });
		const found =
			rates.data.find(
				(r: any) => (r.display_name || r.description || "").toLowerCase().includes("zasil")
			) || rates.data.find((r: any) => (r as any)?.fixed_amount?.currency === "czk");
		if (!found) return NextResponse.json({ amountHaler: 0, amountCzk: 0, id: null });
		const amt = (found as any)?.fixed_amount?.amount;
		const curr = (found as any)?.fixed_amount?.currency;
		return NextResponse.json({
			amountHaler: typeof amt === "number" ? amt : 0,
			amountCzk: typeof amt === "number" ? Math.round(amt / 100) : 0,
			id: found.id
		});
	} catch (e: any) {
		return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 400 });
	}
}



import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
	try {
		const secret = process.env.STRIPE_SECRET_KEY;
		if (!secret) {
			return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
		}
		const stripe = new Stripe(secret);

		// Fetch active products and expand default_price
		const products = await stripe.products.list({
			active: true,
			limit: 100,
			expand: ["data.default_price"]
		});

		const items = await Promise.all(
			(products.data || []).map(async (p) => {
				let priceObj = (p.default_price as Stripe.Price | null) || null;
				// Fallback: when default_price is not set, grab the first active price
				if (!priceObj) {
					const priceList = await stripe.prices.list({
						product: p.id,
						active: true,
						limit: 1
					});
					priceObj = priceList.data?.[0] ?? null;
				}
				const unit = typeof priceObj?.unit_amount === "number" ? Math.round(priceObj.unit_amount / 100) : 0;
				// Force stock to 50 everywhere as requested
				const stock = 50;
				const category = p.metadata?.category;
				let sizes: string[] | undefined = undefined;
				const rawSizes = (p.metadata as any)?.sizes as string | undefined;
				if (rawSizes) {
					sizes = String(rawSizes)
						.split(",")
						.map((s) => s.trim())
						.filter(Boolean);
				}
				return {
					id: p.id,
					name: p.name,
					price: unit,
					priceId: priceObj?.id || null,
					images: p.images && p.images.length ? p.images : undefined,
					description: p.description || undefined,
					category,
					stock,
					sizes
				};
			})
		);

		return NextResponse.json({ items });
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || "Failed to load products" }, { status: 500 });
	}
}



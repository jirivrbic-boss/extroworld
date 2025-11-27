import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as { items: any[] };
		const { items } = body;
		const secret = process.env.STRIPE_SECRET_KEY;
		if (!secret) {
			return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
		}
		const stripe = new Stripe(secret);

		const results: Array<{ productId: string; ok: boolean; message?: string; priceId?: string }> = [];

		for (const item of items ?? []) {
			try {
				const productId: string = item.productId;
				if (!productId) {
					results.push({ productId: "", ok: false, message: "Missing productId" });
					continue;
				}
				let metadata: Record<string, string> = {};
				if (item.metadata && typeof item.metadata === "object") {
					for (const [k, v] of Object.entries(item.metadata)) {
						if (v !== undefined && v !== null) metadata[k] = String(v);
					}
				}
				if (item.metadata?.sizes) {
					metadata["sizes"] = String(item.metadata.sizes);
				}

				await stripe.products.update(productId, { metadata, name: item.name, description: item.description, images: item.images });

				let priceId: string | undefined;
				if (typeof item.priceCzk === "number") {
					const price = await stripe.prices.create({ product: productId, currency: "czk", unit_amount: item.priceCzk });
					priceId = price.id;
					await stripe.products.update(productId, { default_price: price.id });
				}

				results.push({ productId, ok: true, ...(priceId ? { priceId } : {}) });
			} catch (err: any) {
				results.push({ productId: item?.productId ?? "", ok: false, message: err?.message || "Update failed" });
			}
		}

		return NextResponse.json({ results });
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
	}
}



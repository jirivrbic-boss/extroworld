import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const secret = process.env.STRIPE_SECRET_KEY;
		if (!secret) {
			return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
		}
		const stripe = new Stripe(secret);

		const { id } = await params;
		const product = await stripe.products.retrieve(id, {
			expand: ["default_price"]
		});
		let priceObj = (product.default_price as Stripe.Price | null) || null;
		// Fallback: when default_price is not set, grab the first active price
		if (!priceObj) {
			const priceList = await stripe.prices.list({
				product: product.id,
				active: true,
				limit: 1
			});
			priceObj = priceList.data?.[0] ?? null;
		}
		const unit = typeof priceObj?.unit_amount === "number" ? Math.round(priceObj.unit_amount / 100) : 0;

		// Optional: parse sizes from metadata.sizes (comma-separated)
		let sizes: string[] | undefined = undefined;
		const rawSizes = product.metadata?.sizes;
		if (rawSizes) {
			sizes = rawSizes
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
		}
		// Force stock to 50 everywhere as requested
		const stock = 50;
		const category = product.metadata?.category;

		return NextResponse.json({
			id: product.id,
			name: product.name,
			price: unit,
			priceId: priceObj?.id || null,
			images: product.images && product.images.length ? product.images : undefined,
			description: product.description || undefined,
			category,
			sizes,
			stock
		});
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || "Not found" }, { status: 404 });
	}
}



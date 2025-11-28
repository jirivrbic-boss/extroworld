import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const sig = (req.headers as any).get("stripe-signature");
		const secret = process.env.STRIPE_WEBHOOK_SECRET;
		const body = await req.text();
		try {
			const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
			const event = stripe.webhooks.constructEvent(body, sig as any, String(secret));
			// Basic handling for payment_intent events
			switch (event.type) {
				case "payment_intent.succeeded":
					// TODO: persist order as paid
					break;
				case "payment_intent.payment_failed":
					// TODO: handle failure scenario
					break;
				default:
					break;
			}
			return NextResponse.json({ received: true });
		} catch (err: any) {
			return NextResponse.json({ error: `Webhook Error: ${err?.message || "invalid signature"}` }, { status: 400 });
		}
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
	}
}



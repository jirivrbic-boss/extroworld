import { NextResponse } from "next/server";
import Stripe from "stripe";

type ItemInput = { priceId: string; quantity: number };

type Packeta = { id?: string; name?: string; street?: string; city?: string; zip?: string } | null;
type Address = { street?: string; city?: string; zip?: string; country?: string } | null;
type Customer = { firstName?: string; lastName?: string; email?: string; phone?: string } | null;

export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		const { items, discountPercent = 0, userId, shippingMethod, packeta, customer, billingAddress, shippingAddress } =
			(await req.json()) as {
			items: ItemInput[];
			browser_timezone?: string;
			discountPercent?: number;
			userId?: string;
			shippingMethod?: string;
			packeta?: Packeta;
			customer?: Customer;
			billingAddress?: Address;
			shippingAddress?: Address;
		};

		if (!process.env.STRIPE_SECRET_KEY) {
			return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
		}

		const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

		// Compute amount server-side from Stripe Prices (avoid trusting client prices)
		let amount = 0;
		for (const it of items ?? []) {
			if (!it.priceId) continue;
			const price = await stripe.prices.retrieve(it.priceId);
			if (!price.active || price.currency !== "czk" || typeof price.unit_amount !== "number") {
				continue;
			}
			const qty = Math.max(1, Number(it.quantity) || 1);
			amount += price.unit_amount * qty;
		}
		if (discountPercent && discountPercent > 0) {
			amount = Math.max(0, Math.round((amount * (100 - discountPercent)) / 100));
		}

		// Add shipping fee automatically from Stripe Shipping Rates (e.g., Zásilkovna)
		let shippingAmount = 0;
		let shippingRateId: string | undefined;
		if (shippingMethod === "zasilkovna") {
			try {
				// Prefer explicit env with Shipping Rate ID to be deterministic
				const envRateId = process.env.STRIPE_ZASILKOVNA_RATE_ID;
				if (envRateId) {
					const rate = await stripe.shippingRates.retrieve(envRateId);
					const amt = (rate as any)?.fixed_amount?.amount;
					const curr = (rate as any)?.fixed_amount?.currency;
					if (typeof amt === "number" && curr === "czk") {
						shippingAmount = amt;
						shippingRateId = rate.id;
					}
				} else {
					// Fallback – find first active CZK rate containing "zasil" in name/description
					const rates = await stripe.shippingRates.list({ active: true, limit: 25 });
					const found =
						rates.data.find(
							(r: any) =>
								(r.display_name || r.description || "")
									.toLowerCase()
									.includes("zasil")
						) || rates.data.find((r: any) => (r as any)?.fixed_amount?.currency === "czk");
					if (found) {
						const amt = (found as any)?.fixed_amount?.amount;
						const curr = (found as any)?.fixed_amount?.currency;
						if (typeof amt === "number" && curr === "czk") {
							shippingAmount = amt;
							shippingRateId = found.id;
						}
					}
				}
			} catch {
				// ignore, shipping stays zero
			}
		}
		amount += shippingAmount;

		// Enforce Stripe minimum charge for CZK (10 CZK = 1000 haléřů)
		if (amount > 0 && amount < 1000) {
			return NextResponse.json(
				{ error: "Minimální částka pro online platbu je 10 Kč. Zvyšte hodnotu objednávky nebo použijte 100% slevu." },
				{ status: 400 }
			);
		}
		if (amount === 0) {
			// Client by měl řešit 100% slevu bez PI, jen pojistka:
			return NextResponse.json(
				{ error: "Částka je 0 Kč. Dokonči objednávku bez platby (100% sleva)." },
				{ status: 400 }
			);
		}

		// Create PaymentIntent with automatic payment methods (uses Payment Element)
		const pi = await stripe.paymentIntents.create({
			amount,
			currency: "czk",
			automatic_payment_methods: { enabled: true },
			metadata: {
				userId: userId || "",
				shippingMethod: shippingMethod || "",
				shippingRateId: shippingRateId || "",
				shippingAmountHaler: String(shippingAmount || 0),
				packetaId: packeta?.id || "",
				packetaName: packeta?.name || "",
				packetaStreet: packeta?.street || "",
				packetaCity: packeta?.city || "",
				packetaZip: packeta?.zip || "",
				c_firstName: customer?.firstName || "",
				c_lastName: customer?.lastName || "",
				c_email: customer?.email || "",
				c_phone: customer?.phone || "",
				b_street: billingAddress?.street || "",
				b_city: billingAddress?.city || "",
				b_zip: billingAddress?.zip || "",
				b_country: billingAddress?.country || "",
				s_street: shippingAddress?.street || "",
				s_city: shippingAddress?.city || "",
				s_zip: shippingAddress?.zip || "",
				s_country: shippingAddress?.country || ""
			}
		});

		return NextResponse.json({ clientSecret: pi.client_secret });
	} catch (e: any) {
		return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
	}
}



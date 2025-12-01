import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		// jednoduchá ochrana – vyžaduj admin cookie
		const cookie = (req.headers as any).get("cookie") || "";
		if (!cookie.includes("extro_admin=1")) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const body = (await req.json().catch(() => ({}))) as {
			uid?: string;
			priceTotal?: number;
			name?: string;
		};
		const uid =
			body.uid ||
			process.env.ADMIN_UID ||
			null;
		if (!uid) {
			return NextResponse.json({ error: "Missing uid (or set ADMIN_UID)" }, { status: 400 });
		}

		const price = Math.max(1, Math.round(body.priceTotal ?? 149));
		const name = body.name ?? "Test objednávka";

		const docRef = await addDoc(collection(db, "orders"), {
			userId: uid,
			items: [
				{
					productId: "test_product",
					name,
					quantity: 1,
					price
				}
			],
			shippingMethod: "zasilkovna",
			shipping: {
				method: "zasilkovna",
				packeta: { id: "TEST123", name: "Test výdejní místo", city: "Praha", zip: "11000" }
			},
			priceTotal: price,
			stripePaymentId: null,
			status: "paid",
			createdAt: serverTimestamp(),
			customer: { firstName: "Admin", lastName: "Test", email: "admin@extroworld.com", phone: "+420000000000" }
		});

		return NextResponse.json({ ok: true, orderId: docRef.id });
	} catch (e: any) {
		return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
	}
}



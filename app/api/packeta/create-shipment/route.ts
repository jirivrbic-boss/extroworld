import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Recipient = {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	company?: string | null;
};

type CreateShipmentBody = {
	orderNumber: string;
	pickupPointId: string;
	recipient: Recipient;
	valueCZK: number;
	weightKg: number;
	codCZK?: number | null;
	note?: string | null;
};

function toForm(body: CreateShipmentBody, apiPassword: string) {
	const params = new URLSearchParams();
	params.set("apiPassword", apiPassword);
	params.set("packetAttributes[number]", body.orderNumber);
	params.set("packetAttributes[name]", body.recipient.firstName);
	params.set("packetAttributes[surname]", body.recipient.lastName);
	if (body.recipient.company) params.set("packetAttributes[company]", body.recipient.company);
	params.set("packetAttributes[email]", body.recipient.email);
	params.set("packetAttributes[phone]", body.recipient.phone);
	// Výdejní místo Zásilkovny
	params.set("packetAttributes[addressId]", body.pickupPointId);
	// Hodnota zásilky (pojištění)
	params.set("packetAttributes[value]", String(Math.max(0, Math.round(body.valueCZK)))));
	// Hmotnost v gramech (většina integrací Packety očekává g)
	const weightGrams = Math.max(1, Math.round(body.weightKg * 1000));
	params.set("packetAttributes[weight]", String(weightGrams));
	// Dobírka (pokud je)
	if (body.codCZK && body.codCZK > 0) {
		params.set("packetAttributes[cod]", String(Math.round(body.codCZK)));
	}
	// Poznámka
	if (body.note) params.set("packetAttributes[note]", body.note);
	return params;
}

async function tryCreatePacket(form: URLSearchParams) {
	// Zkusíme několik verzí .json endpointu (některé účty mají povolené různé verze)
	const candidates = [
		"https://www.zasilkovna.cz/api/v6/createPacket.json",
		"https://www.zasilkovna.cz/api/v5/createPacket.json",
		"https://www.zasilkovna.cz/api/v4/createPacket.json"
	];
	let lastError: any = null;
	for (const url of candidates) {
		try {
			const res = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
				},
				body: form.toString()
			});
			const text = await res.text();
			// pokus o JSON parse; některé verze vrací čistý JSON, jiné JSON string
			let data: any;
			try {
				data = JSON.parse(text);
			} catch {
				data = { raw: text };
			}
			if (!res.ok) {
				lastError = new Error(typeof data?.error === "string" ? data.error : `HTTP ${res.status}`);
				continue;
			}
			return { data, url };
		} catch (e) {
			lastError = e;
		}
	}
	throw lastError ?? new Error("Nepodařilo se vytvořit zásilku u Packety.");
}

export async function POST(req: Request) {
	try {
		const apiPassword = process.env.PACKETA_API_PASSWORD;
		if (!apiPassword) {
			return NextResponse.json(
				{ error: "Chybí PACKETA_API_PASSWORD v prostředí serveru." },
				{ status: 500 }
			);
		}
		const body = (await req.json()) as Partial<CreateShipmentBody>;
		if (
			!body?.orderNumber ||
			!body?.pickupPointId ||
			!body?.recipient?.firstName ||
			!body?.recipient?.lastName ||
			!body?.recipient?.email ||
			!body?.recipient?.phone ||
			typeof body.valueCZK !== "number" ||
			typeof body.weightKg !== "number"
		) {
			return NextResponse.json(
				{
					error:
						"Chybí povinné údaje: orderNumber, pickupPointId, recipient{firstName,lastName,email,phone}, valueCZK, weightKg."
				},
				{ status: 400 }
			);
		}

		const form = toForm(body as CreateShipmentBody, apiPassword);
		const { data, url } = await tryCreatePacket(form);

		// Pokus o vytažení identifikátoru zásilky z různých možných struktur
		const shipmentId =
			data?.result?.id ??
			data?.packetId ??
			data?.id ??
			data?.number ??
			null;

		return NextResponse.json(
			{
				ok: true,
				endpointUsed: url,
				shipmentId,
				response: data
			},
			{ status: 200 }
		);
	} catch (e: any) {
		return NextResponse.json(
			{ error: e?.message ?? "Chyba při vytváření zásilky." },
			{ status: 500 }
		);
	}
}



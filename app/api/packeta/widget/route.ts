import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function getRemoteScript(url: string) {
	try {
		const res = await fetch(url, { cache: "no-store" });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return await res.text();
	} catch (e) {
		return null;
	}
}

export async function GET(req: Request) {
	// Vyzkoušíme několik známých cest (Packeta čas od času mění název souboru)
	const candidates = [
		"https://widget.packeta.com/v6/www/js/packetaWidget.js",
		"https://widget.packeta.com/v7/www/js/packetaWidget.js",
		"https://widget.packeta.com/v7/www/js/library.js",
		"https://widget.packeta.com/v6/www/js/library.js"
	];
	let code: string | null = null;
	for (const u of candidates) {
		code = await getRemoteScript(u);
		if (code) break;
	}
	code = code ?? "console.error('Packeta widget could not be loaded.');";

	return new NextResponse(code, {
		status: 200,
		headers: {
			"content-type": "application/javascript; charset=utf-8",
			"cache-control": "public, max-age=86400"
		}
	});
}


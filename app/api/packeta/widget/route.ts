import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function getRemoteScript(url: string) {
	try {
		const res = await fetch(url, {
			cache: "no-store",
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
				Accept: "*/*",
				Referer: "https://localhost/"
			}
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return await res.text();
	} catch (e) {
		return null;
	}
}

export async function GET(req: Request) {
	// Try v6 first, then v7 as fallback
	const v6 = await getRemoteScript("https://widget.packeta.com/v6/www/js/packetaWidget.js");
	const code =
		v6 ??
		(await getRemoteScript("https://widget.packeta.com/v7/www/js/packetaWidget.js")) ??
		"console.error('Packeta widget could not be loaded.');";

	return new NextResponse(code, {
		status: 200,
		headers: {
			"content-type": "application/javascript; charset=utf-8",
			"cache-control": "public, max-age=86400"
		}
	});
}



'use client';

import { useState } from "react";

export default function StripeSyncPage() {
	const [jsonText, setJsonText] = useState<string>(
		`[
  {
    "productId": "prod_XXXXXXXXXXXX",
    "name": "Full Zip Mikina ExtroWorld X Spajkk",
    "priceCzk": 1290,
    "metadata": { "category": "mikina", "sizes": "S,M,L,XL,XXL", "stock": 15 }
  },
  {
    "productId": "prod_YYYYYYYYYYYY",
    "name": "Kšiltovka ExtroWorld X Spajkk",
    "priceCzk": 490,
    "metadata": { "category": "kšiltovka", "sizes": "UNI", "stock": 50 }
  }
]`
	);
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);

	const onSubmit = async () => {
		setError(null);
		setResult(null);
		let payload: any;
		try {
			payload = JSON.parse(jsonText);
			if (!Array.isArray(payload)) {
				// allow both raw array or {items:[...]}
				if (payload && Array.isArray(payload.items)) {
					payload = payload.items;
				} else {
					throw new Error("Očekávám pole položek nebo objekt s klíčem \"items\".");
				}
			}
		} catch (e: any) {
			setError(`Chyba parsování JSON: ${e?.message || e}`);
			return;
		}
		setSubmitting(true);
		try {
			const res = await fetch("/api/stripe/sync-products", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ items: payload })
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data?.error || "Chyba při aktualizaci.");
			}
			setResult(data);
		} catch (e: any) {
			setError(e?.message || "Neznámá chyba");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="mx-auto max-w-4xl">
			<h1 className="mb-4 text-2xl font-semibold text-white">Stripe Sync — Produkty</h1>
			<p className="mb-4 text-sm text-zinc-400">
				Vlož JSON se seznamem produktů k úpravě ve Stripe. Podporované klíče: <code>productId</code>,{" "}
				<code>name</code>, <code>description</code>, <code>images</code>, <code>metadata</code> (např. category/sizes/stock),{" "}
				<code>priceCzk</code> (vytvoří novou výchozí cenu v CZK).
			</p>
			<textarea
				value={jsonText}
				onChange={(e) => setJsonText(e.target.value)}
				className="h-80 w-full resize-vertical rounded border border-white/15 bg-black p-3 font-mono text-sm text-zinc-200"
				placeholder='[{"productId":"prod_...","priceCzk":1290,"metadata":{"category":"mikina","sizes":"S,M,L","stock":10}}]'
			/>
			<button
				onClick={onSubmit}
				disabled={submitting}
				className="mt-4 rounded bg-white px 4 py 2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
			>
				{ submitting ? "Aktualizuji…" : "Odeslat do Stripe" }
			</button>
			{error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
			{result ? (
				<div className="mt-6 rounded border border-white/10 bg-zinc-900 p-4">
					<h2 className="mb-2 text-lg font-semibold text-white">Výsledek</h2>
					<pre className="whitespace-pre-wrap break-all text-xs text-zinc-300">{JSON.stringify(result, null, 2)}</pre>
				</div>
			) : null}
		</div>
	);
}



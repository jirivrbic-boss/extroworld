"use client";

import { useState } from "react";

export default function AdminStripeCouponsPage() {
	const [code, setCode] = useState("");
	const [percent, setPercent] = useState<number>(10);
	const [busy, setBusy] = useState(false);
	const [msg, setMsg] = useState<string | null>(null);
	const [last, setLast] = useState<any>(null);

	const submit = async () => {
		setMsg(null);
		setLast(null);
		if (!code.trim()) {
			setMsg("Zadej název kódu.");
			return;
		}
		if (!(percent >= 1 && percent <= 100)) {
			setMsg("Sleva musí být 1–100 %.");
			return;
		}
		setBusy(true);
		try {
			const r = await fetch("/api/stripe/promo/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code: code.trim().toUpperCase(), percent })
			});
			const d = await r.json();
			if (!r.ok) throw new Error(d?.error || "Chyba při vytváření kódu.");
			setLast(d);
			setMsg(`Vytvořeno: ${d.code} (${d.percent} %)`);
		} catch (e: any) {
			setMsg(e?.message || "Chyba.");
		} finally {
			setBusy(false);
		}
	};

	return (
		<div>
			<h1 className="mb-4 text-xl font-semibold text-white">Stripe kupony (procenta)</h1>
			<div className="rounded border border-white/10 bg-zinc-900 p-4">
				<div className="grid gap-3 sm:grid-cols-2">
					<input
						placeholder="Název kódu (např. EXTRO10)"
						className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
						value={code}
						onChange={(e) => setCode(e.target.value)}
					/>
					<input
						type="number"
						min={1}
						max={100}
						placeholder="Sleva %"
						className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
						value={percent}
						onChange={(e) => setPercent(Number(e.target.value))}
					/>
				</div>
				<button
					onClick={submit}
					disabled={busy}
					className="mt-3 rounded bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
				>
					Vytvořit kód
				</button>
				{msg ? <p className="mt-3 text-sm text-zinc-300">{msg}</p> : null}
				{last ? (
					<div className="mt-3 rounded border border-white/10 bg-black p-3 text-xs text-zinc-300">
						<pre className="whitespace-pre-wrap break-all">{JSON.stringify(last, null, 2)}</pre>
					</div>
				) : null}
			</div>
			<p className="mt-4 text-xs text-zinc-400">
				Pozn.: Kód se uplatní v checkoutu v poli „Slevový kód“. Validace probíhá přes Stripe a
				sleva se promítne do částky před vytvořením Payment Intentu.
			</p>
		</div>
	);
}



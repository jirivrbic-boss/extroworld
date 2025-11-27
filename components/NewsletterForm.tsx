"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

function isEmail(str: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

export default function NewsletterForm() {
	const [email, setEmail] = useState("");
	const [women, setWomen] = useState(false);
	const [men, setMen] = useState(false);
	const [kids, setKids] = useState(false);
	const [consentMarketing, setConsentMarketing] = useState(false);
	const [consentProfiling, setConsentProfiling] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setMessage(null);

		if (!isEmail(email)) {
			setMessage("Zadej platný e‑mail.");
			return;
		}
		if (!consentMarketing || !consentProfiling) {
			setMessage("Musíš potvrdit obě souhlasy.");
			return;
		}
		if (!(women || men || kids)) {
			setMessage("Vyber aspoň jednu kategorii (Ženy, Muži, Děti).");
			return;
		}

		setSubmitting(true);
		try {
			await addDoc(collection(db, "newsletter"), {
				email: email.toLowerCase(),
				segments: [
					...(women ? ["women"] : []),
					...(men ? ["men"] : []),
					...(kids ? ["kids"] : [])
				],
				consentMarketing: true,
				consentProfiling: true,
				createdAt: serverTimestamp()
			});
			setEmail("");
			setWomen(false);
			setMen(false);
			setKids(false);
			setConsentMarketing(false);
			setConsentProfiling(false);
			setMessage("Díky! Potvrď přihlášení v e‑mailu, pokud dorazí.");
		} catch (e: any) {
			setMessage(e?.message ?? "Nepodařilo se uložit. Zkus to znovu.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form onSubmit={onSubmit} className="grid gap-4">
			<h3 className="text-2xl font-bold leading-tight text-white md:text-3xl">
				PŘIDEJ SE K EXTROWORLD KOMUNITĚ
			</h3>
			<p className="max-w-xl text-sm text-zinc-300">
				Přihlaš se k newsletteru a zůstaň v obraze o nových dropch, akcích a eventech.
			</p>
			<div className="relative max-w-lg">
				<input
					type="email"
					placeholder="Tvůj e‑mail"
					className="w-full border-b border-white/40 bg-transparent px-0 py-3 text-base text-white placeholder:text-zinc-500 focus:outline-none"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
				<button
					type="submit"
					disabled={submitting}
					className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full border border-white/20 px-3 py-1 text-sm text-white hover:bg-white/10 disabled:opacity-60"
					aria-label="Přihlásit"
				>
					→
				</button>
			</div>
			<div className="flex flex-wrap gap-6 text-white">
				<label className="flex items-center gap-2 text-sm">
					<input type="checkbox" checked={women} onChange={(e) => setWomen(e.target.checked)} />
					<span>Ženy</span>
				</label>
				<label className="flex items-center gap-2 text-sm">
					<input type="checkbox" checked={men} onChange={(e) => setMen(e.target.checked)} />
					<span>Muži</span>
				</label>
				<label className="flex items-center gap-2 text-sm">
					<input type="checkbox" checked={kids} onChange={(e) => setKids(e.target.checked)} />
					<span>Děti</span>
				</label>
			</div>
			<div className="grid gap-3">
				<label className="flex items-start gap-2 text-sm text-zinc-300">
					<input
						type="checkbox"
						checked={consentMarketing}
						onChange={(e) => setConsentMarketing(e.target.checked)}
					/>
					<span>
						Četl(a) jsem{" "}
						<Link href="/legal/privacy" className="underline hover:text-white">
							Zásady ochrany osobních údajů
						</Link>{" "}
						a souhlasím se zpracováním osobních údajů pro marketingové účely (newslettery, novinky a promo).
					</span>
				</label>
				<label className="flex items-start gap-2 text-sm text-zinc-300">
					<input
						type="checkbox"
						checked={consentProfiling}
						onChange={(e) => setConsentProfiling(e.target.checked)}
					/>
					<span>
						Souhlasím se shromažďováním a zpracováním osobních údajů pro účely profilování.
					</span>
				</label>
			</div>
			{message ? <p className="text-sm text-zinc-400">{message}</p> : null}
		</form>
	);
}



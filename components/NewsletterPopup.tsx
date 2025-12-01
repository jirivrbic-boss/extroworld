"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

function isEmail(str: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

export default function NewsletterPopup() {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const dismissed = localStorage.getItem("extro_news_popup_dismissed") === "1";
		const subscribed = localStorage.getItem("extro_news_subscribed") === "1";
		if (!dismissed && !subscribed) {
			const id = setTimeout(() => setOpen(true), 1200);
			return () => clearTimeout(id);
		}
	}, []);

	const close = () => {
		setOpen(false);
		try {
			localStorage.setItem("extro_news_popup_dismissed", "1");
		} catch {}
	};

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setMessage(null);
		if (!isEmail(email)) {
			setMessage("Zadej platný e‑mail.");
			return;
		}
		setSubmitting(true);
		try {
			await addDoc(collection(db, "newsletter"), {
				email: email.toLowerCase(),
				name: name || null,
				source: "popup",
				consentMarketing: true,
				consentProfiling: false,
				createdAt: serverTimestamp()
			});
			setMessage("Díky! Jsi přihlášen(a).");
			try {
				localStorage.setItem("extro_news_subscribed", "1");
			} catch {}
			setTimeout(() => setOpen(false), 1200);
		} catch (e: any) {
			setMessage(e?.message ?? "Nepodařilo se uložit. Zkus to znovu.");
		} finally {
			setSubmitting(false);
		}
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
			<div className="grid w-full max-w-3xl grid-cols-1 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-xl md:grid-cols-2">
				<div className="relative hidden md:block">
					<img
						src="/media/komunita/IMG_1082-scaled.jpg"
						alt="Extroworld"
						className="h-full w-full object-cover"
					/>
				</div>
				<div className="p-6">
					<div className="flex items-start justify-between">
						<h3 className="text-xl font-semibold text-white">Unlock free gift</h3>
						<button onClick={close} className="rounded px-2 py-1 text-sm text-zinc-400 hover:bg-white/10">✕</button>
					</div>
					<p className="mt-1 text-sm text-zinc-400">Získej dárek k první objednávce. Přihlas se k newsletteru.</p>
					<form onSubmit={submit} className="mt-4 grid gap-3">
						<input
							placeholder="Tvoje jméno (volitelné)"
							className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
						<input
							type="email"
							placeholder="Tvůj e‑mail"
							className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<button
							type="submit"
							disabled={submitting}
							className="mt-1 rounded bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
						>
							Přihlásit se
						</button>
						{message ? <p className="text-xs text-zinc-400">{message}</p> : null}
						<p className="mt-2 text-[11px] leading-snug text-zinc-500">
							Přihlášením souhlasíš se zasíláním obchodních sdělení. Více v{" "}
							<a href="/legal/privacy" className="underline hover:text-white">Zásadách ochrany soukromí</a>.
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}



'use client';
import Link from "next/link";
import Dock from "@/components/Dock";
import { useState } from "react";

export default function ContactPage() {
	const [tab, setTab] = useState<"phone" | "email" | "form">("phone");
	const items = [
		{ icon: <span>📞</span>, label: "Telefon", onClick: () => setTab("phone") },
		{ icon: <span>✉️</span>, label: "E-mail", onClick: () => setTab("email") },
		{ icon: <span>📝</span>, label: "Formulář", onClick: () => setTab("form") }
	];

	return (
		<div className="relative mx-auto max-w-5xl px-4 py-10">
			<h1 className="mb-6 text-2xl font-semibold text-white">Kontakt</h1>
			{/* Vždy zobraz pouze jedno pole podle výběru v docku */}
			<div className="mb-8 min-h-[360px]">
				{tab === "phone" && (
					<div className="rounded-lg border border-white/30 bg-zinc-900 p-6">
						<p className="mb-2 text-sm text-zinc-400">Telefon</p>
						<p className="text-3xl font-semibold text-white">+420 606 020 284</p>
					</div>
				)}
				{tab === "email" && (
					<div className="rounded-lg border border-white/30 bg-zinc-900 p-6">
						<p className="mb-2 text-sm text-zinc-400">E‑mail</p>
						<p className="text-2xl font-semibold text-white">STORE@EXTROWORLD.COM</p>
						<Link className="mt-3 inline-block rounded border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10" href="mailto:store@extroworld.com">
							Napsat e‑mail
						</Link>
					</div>
				)}
				{tab === "form" && (
					<div className="rounded-lg border border-white/30 bg-zinc-900 p-6">
						<p className="mb-3 text-sm text-zinc-400">Kontaktní formulář</p>
						<form
							className="grid gap-2"
							onSubmit={(e) => {
								e.preventDefault();
								alert("Díky! Odešleme později na support.");
							}}
						>
							<input className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500" placeholder="Tvé jméno" />
							<input className="rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500" placeholder="Tvůj e‑mail" type="email" />
							<textarea className="min-h-[120px] rounded border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-500" placeholder="Zpráva" />
							<button className="mt-2 rounded bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">Odeslat</button>
						</form>
					</div>
				)}
			</div>
			{/* Dock uprostřed – přepíná kolonky */}
			<div className="mt-4 flex justify-center">
				<Dock items={items} panelHeight={68} baseItemSize={50} magnification={70} useFixedPosition={false} />
			</div>
		</div>
	);
}



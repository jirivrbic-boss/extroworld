"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type StripeProduct = {
	id: string;
	name: string;
	price: number;
	priceId: string | null;
	category?: string;
	stock?: number;
	images?: string[];
};

export default function AdminProductsPage() {
	const [list, setList] = useState<StripeProduct[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch("/api/stripe/products", { cache: "no-store" });
				const data = await res.json();
				if (!res.ok) throw new Error(data?.error || "Nelze načíst produkty ze Stripe.");
				setList(data.items || []);
			} catch (e: any) {
				setError(e?.message || "Chyba při načítání produktů.");
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	return (
		<div>
			<h1 className="mb-4 text-xl font-semibold text-white">Produkty (Stripe)</h1>
			<p className="mb-4 text-sm text-zinc-400">
				Správa probíhá přes Stripe. Pro hromadné úpravy použij{" "}
				<Link href="/admin/stripe-sync" className="underline hover:text-white">
					Stripe Sync
				</Link>
				.
			</p>
			{loading ? (
				<p className="text-sm text-zinc-400">Načítám…</p>
			) : error ? (
				<p className="text-sm text-red-400">{error}</p>
			) : list.length === 0 ? (
				<p className="text-sm text-zinc-400">Žádné produkty.</p>
			) : (
				<ul className="divide-y divide-white/10 rounded border border-white/10 bg-zinc-900">
					{list.map((p) => (
						<li key={p.id} className="flex items-center justify-between gap-3 p-3">
							<div className="min-w-0">
								<div className="truncate text-sm font-medium text-white">{p.name}</div>
								<div className="text-xs text-zinc-400">
									ID: {p.id} {p.priceId ? `• price: ${p.priceId}` : ""} • {p.price} Kč{" "}
									{typeof p.stock === "number" ? `• skladem: ${p.stock}` : ""}
									{p.category ? ` • kategorie: ${p.category}` : ""}
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Link href={`/product/${p.id}`} className="text-xs text-zinc-300 hover:text-white">
									Zobrazit
								</Link>
								<Link href="/admin/stripe-sync" className="text-xs text-zinc-300 hover:text-white">
									Editovat (Sync)
								</Link>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}



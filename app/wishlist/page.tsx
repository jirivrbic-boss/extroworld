'use client';

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import ProductCard, { type Product } from "@/components/ProductCard";
import Link from "next/link";
import { getWishlistProductIds } from "@/lib/wishlist";
import TrueFocus from "@/components/TrueFocus";

export default function WishlistPage() {
	const [uid, setUid] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [products, setProducts] = useState<Product[]>([]);

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, async (u) => {
			setUid(u?.uid ?? null);
		});
		return () => unsub();
	}, []);

	useEffect(() => {
		const load = async () => {
			if (!uid) {
				setProducts([]);
				setLoading(false);
				return;
			}
			setLoading(true);
			try {
				const ids = await getWishlistProductIds(uid);
				const list: Product[] = [];
				// Načti detaily produktů ze Stripe API (ne z Firestore)
				for (const id of ids) {
					try {
						const res = await fetch(`/api/stripe/products/${id}`, { cache: "no-store" });
						if (!res.ok) continue;
						const d = await res.json();
						list.push({
							id: d.id,
							name: d.name,
							price: d.price,
							images: d.images,
							stock: d.stock,
							category: d.category,
							priceId: d.priceId
						});
					} catch {
						// ignore bad id
					}
				}
				setProducts(list);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [uid]);

	return (
		<div className="mx-auto max-w-7xl px-4 py-10 text-center">
			<div className="mb-8 flex justify-center">
				<div className="text-black">
					<TrueFocus
						sentence="Wishlist"
						manualMode={false}
						blurAmount={5}
						borderColor="red"
						glowColor="rgba(255,0,0,0.6)"
						animationDuration={2}
						pauseBetweenAnimations={1}
					/>
				</div>
			</div>

			{!uid ? (
				<div className="mx-auto max-w-3xl">
					<p className="text-zinc-300">Pro zobrazení oblíbených se přihlas.</p>
					<Link href="/account" className="mt-4 inline-block text-sm text-zinc-300 underline hover:text-white">
						Přejít na účet
					</Link>
				</div>
			) : loading ? (
				<p className="text-zinc-400">Načítám…</p>
			) : products.length === 0 ? (
				<p className="text-zinc-400">Žádné položky ve wishlistu.</p>
			) : (
				<div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-4">
					{products.map((p) => (
						<ProductCard key={p.id} product={p} />
					))}
				</div>
			)}
		</div>
	);
}



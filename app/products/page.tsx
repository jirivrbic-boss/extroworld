'use client';

import { useEffect, useMemo, useState } from "react";
import ProductCard, { type Product } from "@/components/ProductCard";

type Category = { id: string; name: string; slug: string };

export default function ProductsPage() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [active, setActive] = useState<string | "all">("all");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			try {
				const res = await fetch(`/api/stripe/products`);
				const data = await res.json();
				const items: Product[] = (data?.items || []).map((p: any) => ({
					id: p.id,
					name: p.name,
					price: p.price,
					images: p.images,
					stock: p.stock,
					category: p.category
				}));
				setProducts(items);

				// derive categories from product metadata.category
				const unique = Array.from(new Set(items.map((p) => p.category).filter(Boolean))) as string[];
				setCategories(unique.map((c, idx) => ({ id: String(idx), name: c, slug: c })));
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	const filtered = useMemo(() => {
		if (active === "all") return products;
		return products.filter((p) => p.category === active);
	}, [active, products]);

	return (
		<div className="mx-auto max-w-7xl px-4 py-10">
			<h1
				className="mb-6 text-2xl font-semibold text-[#8b0000]"
				style={{ textShadow: "0 0 10px rgba(139,0,0,0.55)" }}
			>
				Produkty
			</h1>
			<div className="mb-6 flex flex-wrap gap-2">
				<button
					onClick={() => setActive("all")}
					className={`rounded border px-3 py-1 text-sm ${active === "all" ? "border-white bg-white text-black" : "border-white/20 text-white hover:bg-white/10"}`}
				>
					Vše
				</button>
				{categories.map((c) => (
					<button
						key={c.id}
						onClick={() => setActive(c.slug)}
						className={`rounded border px-3 py-1 text-sm ${active === c.slug ? "border-white bg-white text-black" : "border-white/20 text-white hover:bg-white/10"}`}
					>
						{c.name}
					</button>
				))}
			</div>
			{loading ? (
				<div className="py-10 text-center text-zinc-400">Načítám…</div>
			) : filtered.length === 0 ? (
				<div className="py-10 text-center text-zinc-400">Nic zde není.</div>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
					{filtered.map((p) => (
						<ProductCard key={p.id} product={p} />
					))}
				</div>
			)}
		</div>
	);
}



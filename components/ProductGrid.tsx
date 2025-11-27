'use client';

import { useEffect, useState } from "react";
import ProductCard, { type Product } from "./ProductCard";

export default function ProductGrid({ take = 8 }: { take?: number }) {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			try {
				const res = await fetch(`/api/stripe/products`);
				const data = await res.json();
				const items: Product[] = (data?.items || [])
					.slice(0, take)
					.map((p: any) => ({
						id: p.id,
						name: p.name,
						price: p.price,
						images: p.images,
						priceId: p.priceId,
						stock: p.stock,
						category: p.category,
						sizes: p.sizes
					}));
				setProducts(items);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [take]);

	if (loading) {
		return <div className="py-10 text-center text-zinc-400">Načítám produkty…</div>;
	}

	if (products.length === 0) {
		return <div className="py-10 text-center text-zinc-400">Zatím žádné produkty.</div>;
	}

	return (
		<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
			{products.map((p) => (
				<ProductCard key={p.id} product={p} />
			))}
		</div>
	);
}



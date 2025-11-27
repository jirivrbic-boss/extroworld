"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import WishlistButton from "./WishlistButton";

export type Product = {
	id: string;
	name: string;
	price: number;
	images?: string[];
	stock?: number;
	category?: string;
	priceId?: string | null;
	sizes?: string[];
};

export default function ProductCard({ product }: { product: Product }) {
	const addItem = useCartStore((s) => s.addItem);
	const [showPicker, setShowPicker] = useState(false);
	const [size, setSize] = useState<string | undefined>(undefined);
	const [showAdded, setShowAdded] = useState(false);
	const router = useRouter();
	const hasS = (product.sizes?.length ?? 0) > 0;

	const onAdd = () => {
		if (hasS && !size) return;
		addItem({
			productId: product.id,
			name: product.name,
			price: product.price,
			priceId: product.priceId ?? undefined,
			image: product.images?.[0],
			size,
			quantity: 1,
			inStock: (product.stock ?? 0) > 0
		});
		setShowPicker(false);
		setShowAdded(true);
	};

	const pickerInner = hasS ? (
		<div>
			<p className="mb-2 text-xs text-zinc-700 font-semibold">Vyber velikost</p>
			<div className="mb-2 flex flex-wrap gap-1">
				{(product.sizes || []).map((s) => (
					<button
						key={s}
						onClick={(e) => {
							e.preventDefault();
							setSize(s);
						}}
						className={`rounded border px-2 py-1 text-xs ${s === size ? "bg-black text-white" : "border-zinc-300 text-black"}`}
					>
						{s}
					</button>
				))}
			</div>
			<button
				onClick={onAdd}
				disabled={!size}
				className="mt-1 w-full rounded bg-white px-2 py-1 text-xs font-semibold text-black ring-1 ring-zinc-300 hover:bg-zinc-100 disabled:opacity-60"
			>
				Přidat do košíku
			</button>
		</div>
	) : (
		<button onClick={onAdd} className="w-full rounded bg-white px-2 py-1 text-xs font-semibold text-black ring-zinc-300 ring-1 hover:bg-zinc-100">
			Přidat do košíku
		</button>
	);

	return (
		<div className="relative">
			{/* Image with top badges */}
			<div className="relative">
				<Link href={`/product/${product.id}`} className="block">
					<div className="aspect-square w-full overflow-hidden rounded-lg bg-black">
						<img
							src={product.images?.[0] ?? "/media/komunita/IMG_1082-scaled.jpg"}
							alt={product.name}
							className="h-full w-full object-cover"
						/>
				</div>
				</Link>
				{/* Top-left cart quick add */}
				<button
					className="absolute left-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-white/90 text-zinc-700 hover:bg-zinc-100"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						setShowPicker((v) => !v);
					}}
					aria-label="Přidat do košíku"
				>
					<span className="text-lg">🛒</span>
				</button>
				{/* Top-right wishlist icon */}
				<div className="absolute right-2 top-2 z-20">
					<WishlistButton productId={product.id} size="sm" />
				</div>
				{/* Size picker popover */}
				{showPicker ? (
					<div className="absolute left-2 top-12 z-30 w-40 rounded-lg border border-zinc-200 bg-white p-3 shadow-xl">{pickerInner}</div>
				) : null}
			</div>

			{/* Title & price */}
			<div className="mt-2 text-center">
				<h3
					className="text-sm font-semibold text-red-500"
					style={{
						textShadow:
							"0 0 6px rgba(255,0,0,0.7), 0 0 12px rgba(255,0,0,0.5), 0 0 18px rgba(255,0,0,0.35)"
					}}
				>
					{product.name}
				</h3>
				<div
					className="text-sm font-semibold text-red-500"
					style={{
						textShadow:
							"0 0 6px rgba(255,0,0,0.7), 0 0 12px rgba(255,0,0,0.5), 0 0 18px rgba(255,0,0,0.35)"
					}}
				>
					{product.price} Kč
				</div>
			</div>
			{/* Added-to-cart modal */}
			{showAdded ? (
				<div className="fixed inset-0 z-[2000] flex items-center justify-center">
					<div
						className="absolute inset-0 bg-black/60"
						onClick={() => setShowAdded(false)}
						aria-hidden
					/>
					<div className="relative z-[2001] w-[90%] max-w-sm rounded-lg border border-white/15 bg-zinc-900 p-5 shadow-2xl">
						<p className="mb-2 text-base font-semibold text-white">Přidáno do košíku</p>
						<p className="mb-4 text-sm text-zinc-300">{product.name}{size ? ` — ${size}` : ""}</p>
						<div className="flex items-center justify-end gap-2">
							<button
								className="rounded border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10"
								onClick={() => setShowAdded(false)}
							>
								Pokračovat v nákupu
							</button>
							<button
								className="rounded bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
								onClick={() => {
									setShowAdded(false);
									router.push("/checkout");
								}}
							>
								Přejít do košíku
							</button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}



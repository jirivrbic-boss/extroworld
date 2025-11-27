'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SizeChartModal from "@/components/SizeChartModal";
import { useCartStore } from "@/store/cart";
import WishlistButton from "@/components/WishlistButton";
import ProductCard from "@/components/ProductCard";
import Dock from "@/components/Dock";

type Product = {
	id: string;
	name: string;
	price: number;
	description?: string;
	category?: string;
	sizes?: string[];
	images?: string[];
	stock?: number;
	priceId?: string | null;
};

export default function ProductDetailPage() {
	const params = useParams<{ id: string }>();
	const [product, setProduct] = useState<Product | null>(null);
	const [loading, setLoading] = useState(true);
	const [size, setSize] = useState<string | undefined>(undefined);
	const [showAdded, setShowAdded] = useState(false);
	const [openChart, setOpenChart] = useState(false);
	const addItem = useCartStore((s) => s.addItem);
	const [related, setRelated] = useState<Array<{ id: string; name: string; price: number; images?: string[]; stock?: number; category?: string }>>([]);
	const [loadingRelated, setLoadingRelated] = useState(false);
	const [infoTab, setInfoTab] = useState<"shipping" | "washing">("shipping");

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			try {
				const res = await fetch(`/api/stripe/products/${params.id}`);
				if (!res.ok) {
					setProduct(null);
					return;
				}
				const d = await res.json();
				setProduct({
					id: d.id,
					name: d.name,
					price: d.price,
					description: d.description,
					category: d.category,
					sizes: d.sizes,
					images: d.images,
					stock: d.stock,
					priceId: d.priceId
				});
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [params.id]);

	// Load related products (same category if available, otherwise first few others)
	useEffect(() => {
		const loadRelated = async () => {
			if (!product) return;
			setLoadingRelated(true);
			try {
				const r = await fetch("/api/stripe/products", { cache: "no-store" });
				const dj = await r.json();
				const items: Array<{ id: string; name: string; price: number; images?: string[]; stock?: number; category?: string }> =
					(dj?.items || []).filter((p: any) => p.id !== product.id);
				const filtered =
					product.category
						? items.filter((p) => p.category === product.category)
						: items;
				setRelated((filtered.length ? filtered : items).slice(0, 4));
			} finally {
				setLoadingRelated(false);
			}
		};
		void loadRelated();
	}, [product?.id, product?.category]);

	if (loading) {
		return <div className="mx-auto max-w-5xl px-4 py-10 text-zinc-400">Načítám…</div>;
	}
	if (!product) {
		return <div className="mx-auto max-w-5xl px-4 py-10 text-zinc-400">Produkt nenalezen.</div>;
	}

	const soldOut = (product.stock ?? 0) <= 0;

	return (
		<div className="mx-auto max-w-5xl px-4 py-10">
			<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
				<div className="space-y-3">
					<img
						src={product.images?.[0] ?? "/media/pusa.png"}
						alt={product.name}
						className="aspect-square w-full rounded-lg object-cover"
					/>
					<div className="grid grid-cols-4 gap-2">
						{product.images?.slice(1).map((img, idx) => (
							<img
								key={idx}
								src={img}
								alt={`${product.name} ${idx + 2}`}
								className="aspect-square w-full rounded object-cover"
							/>
						))}
					</div>
				</div>
				<div>
					<h1 className="mb-2 text-2xl font-semibold text-black">{product.name}</h1>
					<p className="mb-4">
						<span className="inline-block rounded-full bg-white px-3 py-1 text-sm font-semibold text-black shadow">
							{product.price} Kč
						</span>
					</p>
					{/* dostupnost / doprava indikátor */}
					<div className="mb-4 flex items-center gap-2 text-sm text-zinc-800">
						<span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
						<span>Dostupné — odeslání do 3–10 pracovních dní</span>
					</div>
					{soldOut ? (
						<div className="mb-4 inline-block rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">
							SOLD OUT
						</div>
					) : null}
					{product.sizes?.length ? (
						<div className="mb-6">
							<div className="mb-2 flex items-center justify-between">
								<p className="text-sm text-zinc-800">Velikost</p>
								<button
									onClick={() => setOpenChart(true)}
									className="text-xs text-zinc-600 underline hover:text-zinc-800"
								>
									Velikostní tabulka
								</button>
							</div>
							<div className="flex flex-wrap gap-2">
								{["S", "M", "L", "XL", "XXL"].map((s) => (
									<button
										key={s}
										onClick={() => setSize(s)}
										className={`rounded border px-3 py-1 text-sm ${size === s ? "border-black bg-black text-white" : "border-black/20 text-black hover:bg-black/5"}`}
									>
										{s}
									</button>
								))}
							</div>
						</div>
					) : null}
					<div className="mb-4 flex items-center gap-2">
						<button
							disabled={soldOut || (!!product.sizes?.length && !size)}
							onClick={() =>
								addItem({
									productId: product.id,
									name: product.name,
									price: product.price,
									priceId: product.priceId ?? undefined,
									image: product.images?.[0],
									size,
									quantity: 1,
									inStock: !soldOut
								}) as any
						}
						className={`rounded px-4 py-2 text-sm font-semibold ${
							soldOut || (!!product.sizes?.length && !size)
								? "cursor-not-allowed bg-zinc-300 text-zinc-500"
								: "bg-red-600 text-white hover:bg-red-500"
						}`}
						onMouseUp={() => {
							if (!soldOut && (!product.sizes?.length || !!size)) {
								setShowAdded(true);
							}
						}}
					>
						{soldOut ? "Vyprodáno" : "Přidat do košíku"}
					</button>
					<WishlistButton productId={product.id} variant="button" label="Přidat do wishlistu" />
					</div>
					<p className="mb-6 text-sm text-zinc-700">{product.description}</p>

					<div className="mb-0 rounded border border-black/10 bg-white p-4">
						{infoTab === "shipping" ? (
							<>
								<p className="mb-2 text-sm font-medium text-black">Doprava</p>
								<ul className="list-inside list-disc text-sm text-zinc-800">
									<li>Zásilkovna — výdejní místa i doručení na adresu</li>
									<li>Online tracking a notifikace o doručení</li>
								</ul>
							</>
						) : (
							<>
								<p className="mb-2 text-sm font-medium text-black">Praní</p>
								<ul className="list-inside list-disc text-sm text-zinc-800">
									<li>Perte na 30 °C, naruby a s podobnými barvami</li>
									<li>Jemné cykly pomáhají zachovat tvar a strukturu</li>
									<li>Nebělit, nesušit v sušičce, žehlit naruby</li>
								</ul>
							</>
						)}
					</div>
					{/* Dock (Doprava / Praní) — pod textovou sekcí */}
					<div className="mt-0 mb-4">
						<Dock
							useFixedPosition={false}
							panelHeight={60}
							items={[
								{
									icon: (
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6">
											<path fill="currentColor" d="M3 7h11v7h-1.5a2.5 2.5 0 1 0 0 1H17a2 2 0 0 0 2-2v-3h1.5l1.5 2v3h-1a2.5 2.5 0 1 0 0 1H21a3 3 0 0 0 3-3v-2l-2.2-3.3A2 2 0 0 0 20.2 7H17V6a3 3 0 0 0-3-3H3zM7.5 17a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3m12 0a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3" />
										</svg>
									),
									label: "Doprava",
									onClick: () => setInfoTab("shipping")
								},
								{
									icon: (
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6">
											<path fill="currentColor" d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m0 4h12V5H6zm6 2a5 5 0 1 0 0 10a5 5 0 0 0 0-10m0 2a3 3 0 1 1 0 6a3 3 0 0 1 0-6" />
										</svg>
									),
									label: "Praní",
									onClick: () => setInfoTab("washing")
								}
							]}
						/>
					</div>

					<button
						disabled
						className="hidden"
					>
						noop
					</button>
					{/* Hidden priceId for cart (used on server to compute amount from Stripe) */}
					<input type="hidden" value={product.priceId ?? ''} readOnly aria-hidden />
				</div>
			</div>
			<SizeChartModal open={openChart} onClose={() => setOpenChart(false)} />

			{/* Added-to-cart modal */}
			{showAdded ? (
				<div className="fixed inset-0 z-[2000] flex items-center justify-center">
					<div className="absolute inset-0 bg-black/60" onClick={() => setShowAdded(false)} aria-hidden />
					<div className="relative z-[2001] w-[90%] max-w-sm rounded-lg border border-white/15 bg-zinc-900 p-5 shadow-2xl">
						<p className="mb-2 text-base font-semibold text-white">Přidáno do košíku</p>
						<p className="mb-4 text-sm text-zinc-300">
							{product.name}{size ? ` — ${size}` : ""}
						</p>
						<div className="flex items-center justify-end gap-2">
							<button
								className="rounded border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/10"
								onClick={() => setShowAdded(false)}
							>
								Pokračovat v nákupu
							</button>
							<a
								href="/checkout"
								className="rounded bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
								onClick={() => setShowAdded(false)}
							>
								Přejít do košíku
							</a>
						</div>
					</div>
				</div>
			) : null}

			{/* Podobné produkty */}
			<div className="mt-12">
				<h2 className="mb-4 text-lg font-semibold text-black">Podobné produkty</h2>
				{loadingRelated ? (
					<div className="text-sm text-zinc-400">Načítám…</div>
				) : related.length === 0 ? (
					<div className="text-sm text-zinc-400">Nic zde není.</div>
				) : (
					<div className="grid grid-cols-3 gap-4">
						{related.slice(0, 3).map((p) => (
							<ProductCard key={p.id} product={p} />
						))}
					</div>
				)}
			</div>

			{/* Komunita */}
			<div className="mt-12">
				<h2 className="mb-4 text-center text-lg font-semibold text-black">Komunita</h2>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
					{[
						"/media/komunita/IMG_1082-scaled.jpg",
						"/media/komunita/img_4721-scaled.jpeg",
						"/media/komunita/IMG_6884-scaled.jpg",
						"/media/komunita/img_9050-scaled.jpeg",
						"/media/komunita/img_4836-scaled.jpeg",
						"/media/komunita/IMG_7920-scaled.jpg"
					].map((src, i) => (
						<img key={i} src={src} alt={`komunita-${i + 1}`} className="aspect-square w-full rounded object-cover" />
					))}
				</div>
			</div>
		</div>
	);
}



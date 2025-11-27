"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useCartStore } from "@/store/cart";
import BubbleMenu from "@/components/BubbleMenu";

export default function Navbar() {
	const [open, setOpen] = useState(false);
	const bubbleToggleRef = useRef<(() => void) | null>(null);
	const itemsCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
	return (
		<header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black">
			{/* Horní pruh: vlevo menu + hledání, uprostřed logo, vpravo kontakty + wishlist + účet + košík */}
			<div className="mx-auto grid max-w-7xl grid-cols-3 items-center px-4 py-3">
				<div className="flex items-center gap-3">
					<button
						onClick={() => bubbleToggleRef.current?.()}
						className="rounded border border-white/15 px-3 py-1 text-sm text-white hover:bg-white/10"
					>
						Menu
					</button>
				</div>
				<div className="flex items-center justify-center">
					<Link href="/" className="block">
						<img src="/media/logo extroworld 3d.gif" alt="EXTROWORLD" className="h-10 w-auto" />
					</Link>
				</div>
				<div className="flex items-center justify-end gap-3">
					<Link href="/wishlist" className="text-sm text-zinc-200 hover:text-white">
						Wishlist
					</Link>
					<Link href="/account" className="text-sm text-zinc-200 hover:text-white">
						Účet
					</Link>
					<button
						onClick={() => setOpen(true)}
						className="rounded-full border border-white/15 px-3 py-1 text-sm text-white hover:bg-white/10"
					>
						Košík ({itemsCount})
					</button>
				</div>
			</div>
			{/* Bubble menu overlay (ovládané tlačítkem Menu) */}
			<BubbleMenu
				hideHeader
				externalToggleRef={bubbleToggleRef}
				items={[
					{ label: "shop", href: "/products", ariaLabel: "Shop", rotation: -8, hoverStyles: { bgColor: "#111111", textColor: "#ffffff" } },
					{ label: "about", href: "/about", ariaLabel: "About", rotation: 8, hoverStyles: { bgColor: "#111111", textColor: "#ffffff" } },
					{ label: "komunita", href: "/komunita", ariaLabel: "Komunita", rotation: 8, hoverStyles: { bgColor: "#111111", textColor: "#ffffff" } },
					{ label: "kontakt", href: "/contact", ariaLabel: "Contact", rotation: 8, hoverStyles: { bgColor: "#111111", textColor: "#ffffff" } },
					{ label: "účet", href: "/account", ariaLabel: "Account", rotation: 8, hoverStyles: { bgColor: "#111111", textColor: "#ffffff" } },
					{ label: "wishlist", href: "/wishlist", ariaLabel: "Wishlist", rotation: -8, hoverStyles: { bgColor: "#111111", textColor: "#ffffff" } }
				]}
				menuBg="#000000"
				menuContentColor="#ffffff"
				useFixedPosition={false}
				animationEase="back.out(1.5)"
				animationDuration={0.5}
				staggerDelay={0.12}
			/>
			{/* Lazy import drawer to avoid SSR issues */}
			{open ? (
				<div className="fixed inset-0 z-50">
					{/* Overlay */}
					<div
						className="absolute inset-0 bg-black/60"
						onClick={() => setOpen(false)}
						aria-hidden
					/>
					<div className="absolute right-0 top-0 h-full w-full max-w-md bg-black p-4 shadow-xl">
						<button
							onClick={() => setOpen(false)}
							className="mb-4 rounded border border-white/15 px-3 py-1 text-sm text-white hover:bg-white/10"
						>
							Zavřít
						</button>
						{/* Inline simple cart to avoid circular imports for now */}
						<CartInline />
					</div>
				</div>
			) : null}
		</header>
	);
}

function CartInline() {
	const { items, removeItem, total } = useCartStore();
	return (
		<div className="space-y-4">
			<h3 className="text-lg font-medium text-white">Košík</h3>
			{items.length === 0 ? (
				<p className="text-sm text-zinc-400">Košík je prázdný.</p>
			) : (
				<div className="space-y-3">
					{items.map((i) => (
						<div key={`${i.productId}-${i.size ?? "nosize"}`} className="flex items-center justify-between border-b border-white/10 pb-3">
							<div>
								<p className="text-white">{i.name}</p>
								<p className="text-xs text-zinc-400">
									{i.size ? `Velikost: ${i.size}` : null} × {i.quantity}
								</p>
							</div>
							<div className="flex items-center gap-3">
								<span className="text-sm text-white">{i.price * i.quantity} Kč</span>
								<button
									onClick={() => removeItem(i.productId, i.size)}
									className="text-xs text-red-400 hover:text-red-300"
								>
									Odstranit
								</button>
							</div>
						</div>
					))}
					<div className="flex items-center justify-between pt-2">
						<span className="text-sm text-zinc-300">Celkem</span>
						<span className="text-base font-semibold text-white">{total()} Kč</span>
					</div>
					<Link
						href="/checkout"
						className="block rounded bg-white px-4 py-2 text-center text-sm font-semibold text-black hover:bg-zinc-200"
					>
						Pokračovat k platbě
					</Link>
				</div>
			)}
		</div>
	);
}



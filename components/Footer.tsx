import Link from "next/link";
import NewsletterForm from "./NewsletterForm";

export default function Footer() {
	return (
		<footer className="border-t border-white/10 bg-black">
			<div className="mx-auto max-w-7xl px-4 py-10">
				<div className="mb-12">
					<NewsletterForm />
				</div>
				<div className="grid grid-cols-1 gap-8 md:grid-cols-4">
					<div className="space-y-2">
						<p className="text-sm font-semibold text-white">EXTROWORLD</p>
						<p className="text-sm text-zinc-400">
							Dosáhni svých snů s Extroworld.
						</p>
					</div>
					<div className="space-y-2">
						<p className="text-sm font-semibold text-white">Kontakt</p>
						<p className="text-sm text-zinc-400">+420 606 020 284</p>
						<p className="text-sm text-zinc-400">STORE@EXTROWORLD.COM</p>
					</div>
					<div className="space-y-2">
						<p className="text-sm font-semibold text-white">Shop</p>
						<Link href="/products" className="block text-sm text-zinc-400 hover:text-white">
							Produkty
						</Link>
						<Link href="/about" className="block text-sm text-zinc-400 hover:text-white">
							O značce
						</Link>
						<Link href="/contact" className="block text-sm text-zinc-400 hover:text-white">
							Kontakt
						</Link>
					</div>
					<div className="space-y-2">
						<p className="text-sm font-semibold text-white">Právní dodatky</p>
						<Link href="/legal/terms" className="block text-sm text-zinc-400 hover:text-white">
							Podmínky používání
						</Link>
						<Link href="/legal/privacy" className="block text-sm text-zinc-400 hover:text-white">
							Zásady ochrany osobních údajů
						</Link>
						<Link href="/legal/returns" className="block text-sm text-zinc-400 hover:text-white">
							Vrácení zboží
						</Link>
						<Link href="/legal/shipping" className="block text-sm text-zinc-400 hover:text-white">
							Doprava a dodání
						</Link>
						<Link href="/legal/claims" className="block text-sm text-zinc-400 hover:text-white">
							Reklamační řád
						</Link>
						<Link href="/admin" className="block text-sm text-zinc-500 hover:text-white">
							Admin
						</Link>
					</div>
				</div>
				<div className="mt-8 border-t border-white/10 pt-6 text-xs text-zinc-500">
					© {new Date().getFullYear()} Extroworld. Všechna práva vyhrazena.
				</div>
			</div>
		</footer>
	);
}



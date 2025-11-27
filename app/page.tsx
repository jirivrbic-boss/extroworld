import HeroVideo from "@/components/HeroVideo";
import ProductGrid from "@/components/ProductGrid";
import Link from "next/link";

export default function Home() {
  return (
		<div className="bg-black">
			<HeroVideo />
			<section className="mx-auto max-w-7xl px-4 py-12">
				<div className="mb-6 flex items-center justify-between">
					<h2 className="text-xl font-semibold text-white">Nejnovější drop</h2>
					<Link href="/products" className="text-sm text-zinc-300 hover:text-white">
						Zobrazit vše
					</Link>
				</div>
				<ProductGrid take={8} />
			</section>
			<section className="mx-auto max-w-7xl px-4 pb-16">
				<div className="rounded-lg border border-white/10 bg-zinc-900 p-6 text-zinc-300">
					<p className="mb-4 text-lg font-medium text-white">Kdo jsme</p>
					<p className="text-sm">
						Jsme ta nejvíce unikátní a kontroverzní značka oblečení, kterou můžeš v Česku najít.
						Našim cílem není jen prodávat oblečení, ale vybudovat komunitu lidí, která se vymyká současným konvencím.
					</p>
					<Link
						href="/about"
						className="mt-4 inline-block rounded bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
					>
						Více o nás
					</Link>
        </div>
			</section>
    </div>
  );
}

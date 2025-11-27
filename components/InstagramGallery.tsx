"use client";

type Item = {
	src: string;
	href: string;
	label?: string;
	alt?: string;
};

export default function InstagramGallery({ items }: { items: Item[] }) {
	return (
		<div className="mx-auto max-w-7xl px-6 py-12">
			<h2 className="mb-6 text-xl font-semibold text-white">Sleduj nás</h2>
			<div className="overflow-x-auto">
				<div className="flex snap-x snap-mandatory gap-6 pb-6">
					{items.map((it) => (
						<a
							key={it.src}
							href={it.href}
							target="_blank"
							rel="noopener noreferrer"
							className="group relative inline-block min-w-[280px] snap-center overflow-hidden rounded-xl border border-white/10 bg-black shadow-xl transition-transform hover:-translate-y-1 sm:min-w-[360px] md:min-w-[420px]"
							aria-label="Otevřít příspěvek na Instagramu"
						>
							<div className="aspect-[3/4] w-full bg-zinc-900">
								<img
									src={it.src}
									alt={it.alt ?? "Instagram post"}
									className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
							</div>
							{(it.label ?? "@extroworld_") && (
								<div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-white/95 px-4 py-1 text-xs font-semibold text-black shadow">
									{it.label ?? "@extroworld_"}
								</div>
							)}
						</a>
					))}
				</div>
			</div>
		</div>
	);
}



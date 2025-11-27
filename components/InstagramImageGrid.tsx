"use client";

export type InstagramImage = {
	src: string;
	alt?: string;
};

export default function InstagramImageGrid({
	images,
	profileUrl = "https://www.instagram.com/extroworld_"
}: {
	images: InstagramImage[];
	profileUrl?: string;
}) {
	return (
		<div className="mx-auto max-w-7xl px-6 py-12">
			<h2 className="mb-6 text-xl font-semibold text-white">Sleduj nás</h2>
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
				{images.map((img) => (
					<div key={img.src} className="rounded-xl overflow-hidden border border-white/10 bg-black">
						<a href={profileUrl} target="_blank" rel="noopener noreferrer" aria-label="Otevřít Instagram profil">
							<div className="aspect-square w-full bg-zinc-900">
								<img src={img.src} alt={img.alt ?? "Instagram post"} className="h-full w-full object-cover" />
							</div>
							<div className="border-t border-white/10 bg-zinc-950/80 p-3">
								<p className="text-sm text-white">@extroworld_</p>
								<div className="mt-2 flex gap-1">
									<span className="text-red-500">♥</span>
									<span className="text-red-500">♥</span>
									<span className="text-red-500">♥</span>
								</div>
							</div>
						</a>
					</div>
				))}
			</div>
		</div>
	);
}



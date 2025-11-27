"use client";

function getShortcode(url: string): string | null {
	try {
		const m = url.match(/\/p\/([^/?#]+)/);
		return m ? m[1] : null;
	} catch {
		return null;
	}
}

function getImageUrl(url: string): string | null {
	const code = getShortcode(url);
	if (!code) return null;
	// Instagram legacy media endpoint (works for public posts). Fallback handled by onError.
	return `https://www.instagram.com/p/${code}/media/?size=l`;
}

export default function InstagramGrid({
	postUrls,
	profileUrl = "https://www.instagram.com/extroworld_"
}: {
	postUrls: string[];
	profileUrl?: string;
}) {
	return (
		<div className="mx-auto max-w-7xl px-6 py-12">
			<h2 className="mb-6 text-xl font-semibold text-white">Sleduj nás</h2>
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
				{postUrls.map((u) => {
					const img = getImageUrl(u);
					return (
						<div key={u} className="rounded-xl overflow-hidden border border-white/10 bg-black">
							<a href={profileUrl} target="_blank" rel="noopener noreferrer" aria-label="Otevřít Instagram profil">
								<div className="aspect-square w-full bg-zinc-900">
									{img ? (
										<img
											src={img}
											alt="Instagram post"
											className="h-full w-full object-cover"
											onError={(e) => {
												// graceful fallback
												(e.currentTarget as HTMLImageElement).style.display = "none";
											}}
										/>
									) : null}
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
					);
				})}
			</div>
		</div>
	);
}



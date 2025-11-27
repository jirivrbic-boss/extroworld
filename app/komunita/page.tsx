// Masonry verze bez 3D galerie

const images = [
	"/media/komunita/4.png",
	"/media/komunita/Bez-nazvu-1.png",
	"/media/komunita/Bez-nazvu-12.png",
	"/media/komunita/Bez-nazvu-13.png",
	"/media/komunita/Bez-nazvu-14.png",
	"/media/komunita/image00001.png",
	"/media/komunita/image00002.png",
	"/media/komunita/image00003.png",
	"/media/komunita/IMG_0059.jpg",
	"/media/komunita/IMG_1082-scaled.jpg",
	"/media/komunita/IMG_1143.png",
	"/media/komunita/img_4721-scaled.jpeg",
	"/media/komunita/img_4741-scaled.jpeg",
	"/media/komunita/img_4801-scaled.jpeg",
	"/media/komunita/img_4836-scaled.jpeg",
	"/media/komunita/img_4882-scaled.jpeg",
	"/media/komunita/img_4902-scaled.jpeg",
	"/media/komunita/IMG_6884-scaled.jpg",
	"/media/komunita/IMG_7920-scaled.jpg",
	"/media/komunita/img_9050-scaled.jpeg",
	"/media/komunita/img_9209-scaled.jpeg",
	"/media/komunita/Novy-projekt-1.png",
	"/media/komunita/Novy-projekt-2.png",
	"/media/komunita/Novy-projekt-3.png",
	"/media/komunita/Novy-projekt-4.png",
	"/media/komunita/Novy-projekt-5.png",
	"/media/komunita/Novy-projekt-6.png",
	"/media/komunita/Novy-projekt-7.png",
	"/media/komunita/Novy-projekt.png"
].map((src) => ({ src }));

export default function KomunitaPage() {
	return (
		<div className="min-h-[80vh] bg-black">
			<div className="mx-auto max-w-7xl px-4 py-6">
				<h1 className="mb-4 text-2xl font-semibold text-white">Komunita</h1>
				<p className="mb-6 text-sm text-zinc-400">Fotky komunity Extroworld.</p>
			</div>
			<section className="mx-auto max-w-7xl px-4 pb-16">
				<div className="columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4">
					{images.map(({ src }) => (
						<figure key={src} className="mb-4 break-inside-avoid">
							<img
								src={src}
								alt="Komunita"
								className="w-full rounded-2xl border border-white/10 object-cover grayscale"
							/>
						</figure>
					))}
				</div>
			</section>
		</div>
	);
}



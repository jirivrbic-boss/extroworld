import InstagramShowcase from "@/components/InstagramShowcase";

export default function AboutPage() {
	return (
		<>
			<div className="relative min-h-[80vh] bg-black">
				<video
					className="absolute inset-0 h-full w-full object-cover"
					autoPlay
					muted
					loop
					playsInline
					src="/media/video.mp4"
				/>
				<div className="absolute inset-0 bg-black/70" />
				<div className="relative z-10 mx-auto max-w-3xl px-6 py-16">
					<h1 className="mb-6 text-3xl font-bold tracking-tight text-white">Kdo jsme</h1>
					<div className="space-y-4 text-zinc-200">
						<p>
							Jsme ta nejvíce unikátní a kontroverzní značka oblečení, kterou můžeš v Česku najít.
						</p>
						<p>
							Našim cílem není jen prodávat oblečení, ale vybudovat komunitu lidí, která se vymyká současným konvencím. Chceme dodat světu to, co mu chybí: Lidi, kteří se nebojí vyčnívat z davu a být kontroverzní, kteří se neřídí podle názorů ostatních a ví, že jsou schopni si nastavit “nemožné” cíle a překonat je.
						</p>
						<p>
							Směřujeme k tomu, aby naše komunita byla interaktivní a mohla mezi sebou sdílet individuální hodnoty.
						</p>
						<p>
							S naší značkou můžeš pyšně chodit po světě s vědomím, že patříš mezi komunitu jedinců, kteří berou život vážně.
						</p>
						<p className="font-semibold text-white">Dosáhni svých snů s Extroworld.</p>
					</div>
				</div>
			</div>
			<InstagramShowcase
				items={[
					{ src: "/media/ig/post1.png", href: "https://www.instagram.com/extroworld_", label: "@extroworld_" },
					{ src: "/media/ig/post2.png", href: "https://www.instagram.com/extroworld_", label: "@extroworld_" },
					{ src: "/media/ig/post3.png", href: "https://www.instagram.com/extroworld_", label: "@extroworld_" },
					{ src: "/media/ig/post4.png", href: "https://www.instagram.com/extroworld_", label: "@extroworld_" },
					{ src: "/media/ig/post5.png", href: "https://www.instagram.com/extroworld_", label: "@extroworld_" },
					{ src: "/media/ig/post6.png", href: "https://www.instagram.com/extroworld_", label: "@extroworld_" },
					{ src: "/media/ig/post7.png", href: "https://www.instagram.com/extroworld_", label: "@extroworld_" }
				]}
			/>
		</>
	);
}


